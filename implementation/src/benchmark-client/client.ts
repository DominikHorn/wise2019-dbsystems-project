import "cross-fetch/polyfill";
import { QueryOptions } from "apollo-client";
import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloClient } from "apollo-client";
import { createHttpLink } from "apollo-link-http";
// @ts-ignore this is actually fine though tsc can not know it
import config from "../../config.client.json";
import { parentPort } from "worker_threads";
import { sleep } from "../shared/util";
import { WorkerMessages } from "./messages";
import { exists } from "fs";

export async function runBenchmark(
  workerID: number,
  workloadMix: { opts: QueryOptions<any>; id: string; frequency: number }[],
  sleepTime: number
) {
  const client = new ApolloClient({
    link: createHttpLink({
      uri: `${config.applicationGraphqlServer.protocol}://${config.applicationGraphqlServer.host}:${config.applicationGraphqlServer.port}/graphql`
    }),
    cache: new InMemoryCache()
  });

  let terminate = false;
  parentPort.on("message", (msg: any) => {
    console.log(`Worker ${workerID} received message ${msg}`);
    if (msg === WorkerMessages.TERMINATE) {
      terminate = true;
    }
  });

  async function timeQuery(
    queryOptions: QueryOptions<any>
  ): Promise<[number, number]> {
    const start = process.hrtime();
    return client.query(queryOptions).then(() => process.hrtime(start));
  }

  while (!terminate) {
    await sleep(sleepTime);
    const rand = Math.random();
    const query = workloadMix.reduce(
      (prev, curr) =>
        prev.acc + curr.frequency > rand
          ? { acc: -1, res: curr }
          : { acc: prev.acc + curr.frequency, res: prev.res },
      { acc: 0, res: null }
    ).res;
    await timeQuery({
      ...query.opts,
      fetchPolicy: "network-only"
    }).then(hrtime =>
      parentPort.postMessage({
        workerID,
        queryID: query.id,
        hrtime
      })
    );
  }
  process.exit(0);
}
