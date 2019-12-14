import { ApolloServer, makeExecutableSchema } from "apollo-server-express";
import * as cors from "cors";
import * as express from "express";
import * as http from "http";
import * as config from "../../../config.server.json";
import { resolvers } from "./resolvers";
import schemaFile from "./schema.graphql";

export function startServer() {
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
    playground: true
  });

  // Setup express
  const app = express();
  app.use(cors());
  apollo.applyMiddleware({ app });
  const server = http.createServer(app);

  // Start apollo server
  server.listen(
    {
      port: config.benchmarkServerConfig.port,
      hostname: config.benchmarkServerConfig.hostname
    },
    () => {
      console.log(
        `🚀  Server ready at http://${config.benchmarkServerConfig.hostname}:${config.benchmarkServerConfig.port}`
      );
    }
  );
}
