const environment = process.env.NODE_ENV;
// Setup logging depending on environment
// if (environment !== "development") {
//   console.log = function() {};
// }

import { ApolloServer, makeExecutableSchema } from "apollo-server-express";
import * as cors from "cors";
import * as express from "express";
import * as fallback from "express-history-api-fallback";
import * as fs from "fs";
import * as http from "http";
import * as https from "https";
import * as config from "../../config.server.json";
import { adapters, gracefullyShutdownAdapters } from "./adapters/adapterUtil";
import { resolvers } from "./graphql/resolvers";
import schemaFile from "./graphql/schema.graphql";

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
  console.log("Initial server setup complete. Booting apollo server");

  // Setup schema
  const typeDefs = schemaFile.loc.source.body;
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers
  });

  // Setup apollo server
  const apollo = new ApolloServer({
    schema,
    // Always add current user to context for access/permission purposes
    context: async ({ req }) => ({
      userIp: req.ip,
      userId: await adapters.authentication.getUserIdForToken(
        req.headers.authorization
      ),
      authToken: req.headers.authorization
    }),
    playground: environment === "development"
  });

  // Setup express
  const app = express();
  app.use(cors());
  apollo.applyMiddleware({ app });
  if (environment === "production") {
    const root = `dist/client`;
    // Redirect server in case user's browser accesses port 80
    http
      .createServer((req, res) => {
        res.writeHead(301, {
          Location: `https://${req.headers.host}${req.url}`
        });
        res.end();
      })
      .listen(80);
    app.use(express.static(root));
    app.use(fallback("index.html", { root }));
  }

  // Create and start actual server
  let server;
  if (config.serverConfig.ssl) {
    server = https.createServer(
      {
        key: fs.readFileSync(config.serverConfig.sslKeypath),
        cert: fs.readFileSync(config.serverConfig.sslCertpath)
      },
      app
    );
  } else {
    server = http.createServer(app);
  }

  // Start apollo server
  server.listen(
    {
      port: config.serverConfig.port,
      hostname: config.serverConfig.hostname
    },
    () => {
      console.log(
        `🚀  Server ready at http${config.serverConfig.ssl ? "s" : ""}://${
          config.serverConfig.hostname
        }:${config.serverConfig.port}`
      );
    }
  );
});
