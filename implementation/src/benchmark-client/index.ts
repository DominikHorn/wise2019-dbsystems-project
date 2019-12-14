import "babel-polyfill";
import { runBenchmark } from "./client";
import { QueryOptions } from "apollo-client";
import { sleep } from "../shared/util";
import { WorkerMessages } from "./messages";
import { query_q1 } from "./queries/q1";
import {
  Worker,
  isMainThread,
  workerData,
  MessageChannel,
  MessagePort
} from "worker_threads";

let WORK_NUM = 0;
// TODO: read from graphql mutation requests
const WORKLOAD_MIX: {
  opts: QueryOptions<any>;
  id: string;
  frequency: number;
}[] = [
  {
    opts: {
      query: query_q1,
      variables: {
        wahlid: 1
      }
    },
    frequency: 1,
    id: "Q1"
  }
];
const SLEEP_BASE = 1000;
const WORKER_AMOUNT = 2;

function spawnWorker() {
  WORK_NUM++;
  // Interval [0.8 t, 1.2 t]
  const SLEEP_TIME = (Math.random() / 2.5 + 0.8) * SLEEP_BASE;
  // return new Promise((resolve, reject) => {

  // const { port1, port2 } = new MessageChannel();
  const worker = new Worker(__filename, {
    workerData: {
      workerID: WORK_NUM,
      workloadMix: WORKLOAD_MIX,
      sleepTime: SLEEP_TIME
    }
  });
  worker.on("message", (m: any) => console.log("MSG:", m));
  worker.on("error", (e: any) => console.error("ERROR:", e));
  worker.on("exit", (code: number) => {
    if (code !== 0) throw new Error(`Worker stopped with exit code ${code}`);
  });
  // });
  return worker;
}

if (isMainThread) {
  console.log("Scheduler successfully started up");
  const workers: Worker[] = [];
  for (let i = 0; i < WORKER_AMOUNT; i++) {
    workers.push(spawnWorker());
  }
  sleep(5000).then(() =>
    workers.forEach(w => w.postMessage(WorkerMessages.TERMINATE))
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
