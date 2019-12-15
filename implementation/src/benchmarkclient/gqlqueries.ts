import gql from "graphql-tag";

export const benchmarkResultsQuery = gql`
  query benchmarkResultsQuery {
    benchmarkResults: getBenchmarkResults {
      workerID
      queryResults {
        queryID
        results {
          timestamp {
            hrfirst
            hrsecond
          }
          delta {
            hrfirst
            hrsecond
          }
        }
      }
    }
  }
`;
