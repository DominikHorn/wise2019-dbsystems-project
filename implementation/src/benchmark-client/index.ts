import "babel-polyfill";
import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloClient } from "apollo-client";
import { ApolloLink } from "apollo-link";
import { setContext } from "apollo-link-context";
import { createUploadLink } from "apollo-upload-client";
// @ts-ignore This works though typescript doesn't accept that fact
import config from "../../config.client.json";
import { readToken } from "../client-graphql/token";

// Inject token into headers
const link = setContext((_: any, { headers }) => ({
  headers: {
    ...headers,
    authorization: readToken()
  }
}));

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

console.log("Started up successfully :)");
