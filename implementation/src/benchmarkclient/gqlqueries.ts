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

export const stopWorkersMutation = gql`
  mutation stopWorkersMutation {
    stopWorkers
  }
`;

export const startWorkersMutation = gql`
  mutation stopWorkersMutation($amount: Int!, $timeout: Int!) {
    startWorkers(amount: $amount, timeout: $timeout)
  }
`;
