import { runBenchmark } from "./worker";
import ApolloClient, { QueryOptions } from "apollo-client";
import { sleep } from "../shared/util";
import { WorkerMessages } from "./messages";
import {
  query_q1,
  getAllWahlenQuery,
  query_q2,
  query_q3,
  query_q4,
  query_q5,
  query_q6
} from "./queries";
import { Worker, isMainThread, workerData } from "worker_threads";
import { createHttpLink } from "apollo-link-http";
// @ts-ignore this works though tsc can't know that
import clientConfig from "../../config.client.json";
import { InMemoryCache } from "apollo-cache-inmemory";
import { IWahl } from "../shared/sharedTypes";
import { startServer } from "./graphql/server";

type WorkloadMix = {
  opts: QueryOptions<any>;
  id: string;
  frequency: number;
};

const SLEEP_BASE = 1000;
let WORK_NUM = 0;
function spawnWorker(
  baseWorkloadMix: WorkloadMix[],
  exitCallback: (workerID: string, code: number) => void = (_, code) => {
    if (code !== 0) throw new Error(`Worker stopped with exit code ${code}`);
    console.log("Worker", workerID, "exited cleanly");
  },
  messageCallback: (workerID: string, message: any) => void = (_, m) =>
    console.log("MSG:", m),
  errorCallback: (workerID: string, error: any) => void = (_, e) =>
    console.error("ERROR:", e)
) {
  const workerID = `${WORK_NUM++}`;
  // Interval [0.8 t, 1.2 t]
  const sleepTime = (Math.random() / 2.5 + 0.8) * SLEEP_BASE;

  const worker = new Worker(__filename, {
    workerData: {
      workerID,
      sleepTime,
      workloadMix: baseWorkloadMix
    }
  });
  worker.on("message", m => messageCallback(workerID, m));
  worker.on("error", e => errorCallback(workerID, e));
  worker.on("exit", c => exitCallback(workerID, c));
  return { worker, id: workerID };
}

function calculateWorkloadMix(allWahlen: IWahl[]): WorkloadMix[] {
  return allWahlen
    .flatMap((wahl: IWahl) => [
      {
        opts: {
          query: query_q1,
          variables: {
            wahlid: wahl.id
          }
        },
        frequency: 0.25 / allWahlen.length,
        id: "Q1"
      },
      {
        opts: {
          query: query_q2,
          variables: {
            wahlid: wahl.id
          }
        },
        frequency: 0.1 / allWahlen.length,
        id: "Q2"
      },
      {
        opts: {
          query: query_q3,
          variables: {
            wahlid: wahl.id
          }
        },
        frequency: 0.25 / allWahlen.length,
        id: "Q3"
      },
      {
        opts: {
          query: query_q4,
          variables: {
            wahlid: wahl.id,
            erststimmen: false
          }
        },
        frequency: 0.05 / allWahlen.length,
        id: "Q4 - erststimmen = false"
      },
      {
        opts: {
          query: query_q4,
          variables: {
            wahlid: wahl.id,
            erststimmen: true
          }
        },
        frequency: 0.05 / allWahlen.length,
        id: "Q4 - erststimmen = true"
      },
      {
        opts: {
          query: query_q5,
          variables: {
            wahlid: wahl.id
          }
        },
        frequency: 0.1 / allWahlen.length,
        id: "Q5"
      },
      {
        opts: {
          query: query_q6,
          variables: {
            wahlid: wahl.id,
            amountPerPartei: 10
          }
        },
        frequency: 0.2 / allWahlen.length,
        id: "Q6"
      }
    ])
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

if (isMainThread) {
  const client = new ApolloClient({
    link: createHttpLink({
      uri: `${clientConfig.applicationGraphqlServer.protocol}://${clientConfig.applicationGraphqlServer.host}:${clientConfig.applicationGraphqlServer.port}/graphql`
    }),
    cache: new InMemoryCache()
  });

  let workers: {
    [workerID: string]: {
      worker: Worker;
      queryStats: {
        [queryID: string]: {
          timestamp: [number, number];
          delta: [number, number];
        }[];
      };
    };
  } = {};
  console.log("Scheduler successfully started up");
  client
    .query({
      query: getAllWahlenQuery
    })
    .then(
      res => {
        const allWahlen = res.data.allWahlen;
        if (allWahlen.length < 1) {
          console.error(
            "ERROR: Cannot benchmark when no data is present in DB"
          );
          return;
        }

        const baseWorkloadMix: WorkloadMix[] = calculateWorkloadMix(allWahlen);

        startServer({
          Query: {
            getBenchmarkResults: () => {
              return Object.keys(workers).map((workerID: string) => ({
                workerID,
                queryResults: Object.keys(workers[workerID].queryStats).map(
                  queryID => ({
                    queryID,
                    results: workers[workerID].queryStats[queryID].map(val => ({
                      timestamp: {
                        hrfirst: val.timestamp[0],
                        hrsecond: val.timestamp[1]
                      },
                      delta: {
                        hrfirst: val.delta[0],
                        hrsecond: val.delta[1]
                      }
                    }))
                  })
                )
              }));
            }
          },
          Mutation: {
            stopWorkers: (_: any, args: { workerIDs: number[] }) =>
              args.workerIDs.map(workerID => {
                const w = workers[workerID];
                if (w) {
                  w.worker.postMessage(WorkerMessages.TERMINATE);
                  return true;
                }
                return false;
              }),
            startWorkers: (_: any, args: { amount: number }) => {
              for (let i = 0; i < args.amount; i++) {
                const w = spawnWorker(
                  baseWorkloadMix,
                  (workerID, code) => {
                    if (code !== 0)
                      throw new Error(`Worker stopped with exit code ${code}`);
                    console.log("Worker", workerID, "exited cleanly");
                    // Don't delete old workers -> keep data forever
                    // delete workers[workerID];
                  },
                  (workerId, message) => {
                    workers[workerId].queryStats[message.queryID] = (
                      workers[workerId].queryStats[message.queryID] || []
                    ).concat({
                      timestamp: process.hrtime(),
                      delta: message.hrtime
                    });
                  }
                );
                workers[w.id] = { worker: w.worker, queryStats: {} };
              }
              return true;
            }
          }
        });
      },
      err => console.error("ERROR:", err)
    );
} else {
  const { workerID, workloadMix, sleepTime } = workerData;
  console.log(`Worker thread (${workerID}) started up!`);
  try {
    runBenchmark(workerID, workloadMix, sleepTime);
  } catch (e) {
    console.error("Running benchmark failed:", e);
  }
}
