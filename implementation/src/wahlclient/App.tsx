import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloClient } from "apollo-client";
import { ApolloLink } from "apollo-link";
import { setContext } from "apollo-link-context";
import { createUploadLink } from "apollo-upload-client";
import * as React from "react";
import { ApolloProvider } from "react-apollo";
import { hot } from "react-hot-loader";
import { BrowserRouter, Route } from "react-router-dom";
// @ts-ignore This works though typescript doesn't accept that fact
import config from "../../config.client.json";
import { isDevelopmentEnv } from "../shared/util";
import { PageComponent } from "./ui/PageComponent";
import { readToken } from "../client-graphql/token.js";

// Connection to ApolloServer
const uploadLink = createUploadLink({
  uri: `${config.applicationGraphqlServer.protocol}://${config.applicationGraphqlServer.host}:${config.applicationGraphqlServer.port}/graphql`
});

// Inject token into headers
const authLink = setContext((_: any, { headers }) => ({
  headers: {
    ...headers,
    authorization: readToken()
  }
}));

const link = ApolloLink.from([
  // onError(({ graphQLErrors, networkError }) => {
  //   if (graphQLErrors)
  //     graphQLErrors.map(({ message, locations, path }) =>
  //       console.error(
  //         `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
  //       )
  //     );
  //   if (networkError) console.error(`[Network error]: ${networkError}`);
  // }),
  authLink,
  uploadLink
]);

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
  <BrowserRouter>
    <ApolloProvider client={client}>
      <Route
        render={props => (
          <PageComponent
            title={"E-Voting-System"}
            subtitle={"Bayrische Landtagswahlen"}
            client={client}
            routeProps={props}
          />
        )}
      />
    </ApolloProvider>
  </BrowserRouter>
);

export const App = isDevelopmentEnv() ? hot(module)(AppClass) : AppClass;
