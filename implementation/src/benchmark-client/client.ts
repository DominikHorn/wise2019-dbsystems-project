import "cross-fetch/polyfill";
import { QueryOptions } from "apollo-client";
import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloClient } from "apollo-client";
import { createHttpLink } from "apollo-link-http";
// @ts-ignore this is actually fine though tsc can not know it
import config from "../../config.client.json";
import { query_q1 } from "./queries/q1";

export async function runBenchmark(log_ident: string) {
  const client = new ApolloClient({
    link: createHttpLink({
      uri: `${config.graphqlServer.protocol}://${config.graphqlServer.host}:${config.graphqlServer.port}/graphql`
    }),
    cache: new InMemoryCache(),
    // NOTE: we must keep all three defaultOptions (query, mutate, watchQuery)
    // set or else defaultOptions wont apply to any of them
    defaultOptions: {
      query: {
        errorPolicy: "all",
        fetchPolicy: "no-cache"
      },
      mutate: {
        errorPolicy: "none"
      },
      watchQuery: {
        errorPolicy: "all",
        fetchPolicy: "no-cache"
      }
    }
  });

  async function timeQuery(
    queryOptions: QueryOptions<any>
  ): Promise<[number, number]> {
    const start = process.hrtime();
    return client.query(queryOptions).then(() => process.hrtime(start));
  }

  for (let i = 0; i < 10; i++) {
    console.log(`start exec (${log_ident}; ${i})`);
    await timeQuery({
      query: query_q1,
      variables: {
        wahlid: 1
      }
    }).then(time =>
      console.log(
        `Execution (${log_ident}; ${i}): %ds $dms`,
        time[0],
        time[1] / 1000000
      )
    );
  }
}
