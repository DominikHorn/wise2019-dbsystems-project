import "babel-polyfill";
import { runBenchmark } from "./client";
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
import config from "../../config.client.json";
import { InMemoryCache } from "apollo-cache-inmemory";
import { exists } from "fs";
import { IWahl } from "../shared/sharedTypes";

type WorkloadMix = {
  opts: QueryOptions<any>;
  id: string;
  frequency: number;
};

const SLEEP_BASE = 1000;
let WORK_NUM = 0;
function spawnWorker(baseWorkloadMix: WorkloadMix[]) {
  WORK_NUM++;
  // Interval [0.8 t, 1.2 t]
  const sleepTime = (Math.random() / 2.5 + 0.8) * SLEEP_BASE;

  const worker = new Worker(__filename, {
    workerData: {
      workerID: WORK_NUM,
      sleepTime,
      workloadMix: baseWorkloadMix
    }
  });
  worker.on("message", (m: any) => console.log("MSG:", m));
  worker.on("error", (e: any) => console.error("ERROR:", e));
  worker.on("exit", (code: number) => {
    if (code !== 0) throw new Error(`Worker stopped with exit code ${code}`);
  });
  return worker;
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

// TODO: dynamically spawn workers on graphql request
const WORKER_AMOUNT = 2;

if (isMainThread) {
  const client = new ApolloClient({
    link: createHttpLink({
      uri: `${config.graphqlServer.protocol}://${config.graphqlServer.host}:${config.graphqlServer.port}/graphql`
    }),
    cache: new InMemoryCache()
  });

  const workers: Worker[] = [];
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
        console.log("Base Workload mix:", baseWorkloadMix);
        for (let i = 0; i < WORKER_AMOUNT; i++) {
          workers.push(spawnWorker(baseWorkloadMix));
        }

        // TODO: remove and terminate on qraphql request
        sleep(5000).then(() =>
          workers.forEach(w => w.postMessage(WorkerMessages.TERMINATE))
        );
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
