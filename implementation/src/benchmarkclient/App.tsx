import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloClient } from "apollo-client";
import { ApolloLink } from "apollo-link";
import { setContext } from "apollo-link-context";
import { createUploadLink } from "apollo-upload-client";
import * as React from "react";
import { ApolloProvider } from "react-apollo";
import { hot } from "react-hot-loader";
// @ts-ignore This works though typescript doesn't accept that fact
import config from "../../config.client.json";
import { isDevelopmentEnv } from "../shared/util";
import "../../node_modules/react-grid-layout/css/styles.css";
import "../../node_modules/react-resizable/css/styles.css";

// Connection to ApolloServer
const uploadLink = createUploadLink({
  uri: `${config.benchmarkGraphqlServer.protocol}://${config.benchmarkGraphqlServer.host}:${config.benchmarkGraphqlServer.port}/graphql`
});

// Inject token into headers
const authLink = setContext((_: any, { headers }) => ({
  headers
}));
const link = ApolloLink.from([authLink, uploadLink]);

const client = new ApolloClient({
  link,
  cache: new InMemoryCache(),
  // NOTE: we must keep all three defaultOptions (query, mutate, watchQuery)
  // set or else defaultOptions wont apply to any of them
  defaultOptions: {
    query: {
      errorPolicy: "all",
      fetchPolicy: "cache-and-network"
    },
    mutate: {
      errorPolicy: "none"
    },
    watchQuery: {
      errorPolicy: "all",
      fetchPolicy: "cache-and-network"
    }
  }
});

const AppClass = () => (
  <ApolloProvider client={client}>
    Hier koennte Ihre Werbung stehen
  </ApolloProvider>
);

export const App = isDevelopmentEnv() ? hot(module)(AppClass) : AppClass;
