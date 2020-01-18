const environment = process.env.NODE_ENV;
import {
  ApolloServer,
  makeExecutableSchema,
  IResolvers
} from "apollo-server-express";
import * as cors from "cors";
import * as express from "express";
import * as fallback from "express-history-api-fallback";
import * as fs from "fs";
import * as http from "http";
import * as https from "https";
import * as config from "../../config.server.json";
import { resolvers } from "./graphql/resolvers";
import schemaFile from "./graphql/schema.graphql";
import { adapters } from "./adapters/adapterUtil";

export function setupApollo() {
  console.log("Initial server setup complete. Booting apollo server");

  // Setup schema
  const typeDefs = schemaFile.loc.source.body;
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers: resolvers as IResolvers<any, any>
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
  if (config.applicationServerConfig.ssl) {
    server = https.createServer(
      {
        key: fs.readFileSync(config.applicationServerConfig.sslKeypath),
        cert: fs.readFileSync(config.applicationServerConfig.sslCertpath)
      },
      app
    );
  } else {
    server = http.createServer(app);
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
}

// @ts-ignore this is actually not correct as hot is injected by webpack
if (module.hot) {
  // @ts-ignore this is actually not correct as hot is injected by webpack
  module.hot.accept();
  // @ts-ignore this is actually not correct as hot is injected by webpack
  module.hot.dispose(() => console.log("Module disposed"));
}
