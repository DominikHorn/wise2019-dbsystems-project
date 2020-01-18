const environment = process.env.NODE_ENV;
import {
  ApolloServer,
  makeExecutableSchema,
  IResolvers
} from "apollo-server-express";
import * as http from "http";
import * as cors from "cors";
import * as express from "express";
import * as fallback from "express-history-api-fallback";
import { resolvers } from "./graphql/resolvers";
import schemaFile from "./graphql/schema.graphql";
import { adapters } from "./adapters/adapterUtil";

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
apollo.applyMiddleware({ app });

export const application = app;
