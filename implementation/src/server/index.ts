import { adapters, gracefullyShutdownAdapters } from "./adapters/adapterUtil";

// List of all exit signals that we intercept
const exitSignals: NodeJS.Signals[] = [
  "SIGHUP",
  "SIGINT",
  "SIGQUIT",
  "SIGILL",
  "SIGTRAP",
  "SIGABRT",
  "SIGBUS",
  "SIGFPE",
  "SIGUSR1",
  "SIGSEGV",
  "SIGUSR2",
  "SIGTERM"
];
// Setup all exit signals to trigger adapter shutdown
exitSignals.forEach(sig => {
  process.on(sig, async () => {
    console.log(`Received signal: ${sig}`);
    await gracefullyShutdownAdapters().then(() => {
      console.log("Gracefully shutdown every adapter.");
      process.exit(1);
    });
  });
});
process.on("exit", async () => {
  await gracefullyShutdownAdapters();
});

// Wait for all adapters to be initialized
const awaitAdapters = Promise.all(
  Object.keys(adapters).map(async adapterKey =>
    adapters[adapterKey].initialize().then(res => {
      console.log(`Initialized ${adapterKey} adapter`);
      if (!res) {
        throw new Error(`Could not initialize ${adapterKey}`);
      }
    })
  )
);
awaitAdapters.then(() => {
  require("./apollo");
});
