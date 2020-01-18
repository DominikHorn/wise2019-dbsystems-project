import * as fs from "fs";
import * as http from "http";
import * as https from "https";
import * as config from "../../config.server.json";
import { application } from "./app";

// Create and start actual server
let server: http.Server | https.Server;
if (config.applicationServerConfig.ssl) {
  server = https.createServer(
    {
      key: fs.readFileSync(config.applicationServerConfig.sslKeypath),
      cert: fs.readFileSync(config.applicationServerConfig.sslCertpath)
    },
    application
  );
} else {
  server = http.createServer(application);
}

// Set timeout to 10 * 60 seconds * 1000 ms = 20 minutes
// To be able to support long running import wahl csv query
server.setTimeout(20 * 60 * 1000);

// Start apollo server
server.listen(
  {
    port: config.applicationServerConfig.port,
    hostname: config.applicationServerConfig.hostname
  },
  () => {
    console.log(
      `🚀  Server ready at http${
        config.applicationServerConfig.ssl ? "s" : ""
      }://${config.applicationServerConfig.hostname}:${
        config.applicationServerConfig.port
      }`
    );
  }
);

let currentApp = application;
// @ts-ignore this is actually not correct as hot is injected by webpack
if (module.hot) {
  // @ts-ignore this is actually not correct as hot is injected by webpack
  module.hot.accept(["./app"], () => {
    server.removeListener("request", currentApp);
    server.on("request", application);
    currentApp = application;
  });

  // @ts-ignore this is actually not correct as hot is injected by webpack
  module.hot.dispose(() => console.log("Module disposed"));
}
