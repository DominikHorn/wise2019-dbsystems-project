import "babel-polyfill";
import { runBenchmark } from "./client";
const {
  Worker,
  isMainThread,
  parentPort,
  workerData
} = require("worker_threads");

let WORK_NUM = 0;
function spawnWorker() {
  WORK_NUM++;
  return new Promise((resolve, reject) => {
    const worker = new Worker(__filename, {
      workerData: WORK_NUM
    });
    worker.on("message", resolve);
    worker.on("error", reject);
    worker.on("exit", (code: number) => {
      if (code !== 0)
        reject(new Error(`Worker stopped with exit code ${code}`));
    });
  });
}

if (isMainThread) {
  console.log("Scheduler successfully started up");
  for (let i = 0; i < 2; i++) {
    spawnWorker();
  }
} else {
  const workerNumber = workerData;
  console.log(`Worker thread (${workerNumber}) started up!`);
  runBenchmark(`wrk ${workerNumber}`);
}
