import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloClient } from "apollo-client";
import { ApolloLink } from "apollo-link";
import { setContext } from "apollo-link-context";
import { createUploadLink } from "apollo-upload-client";
import * as React from "react";
import { ApolloProvider, Query, Mutation } from "react-apollo";
import { hot } from "react-hot-loader";
// @ts-ignore This works though typescript doesn't accept that fact
import config from "../../config.client.json";
import { isDevelopmentEnv } from "../shared/util";
import "../../node_modules/react-grid-layout/css/styles.css";
import "../../node_modules/react-resizable/css/styles.css";
import { Button, Col, Row, Layout, Spin } from "antd";
import ReactEcharts from "echarts-for-react";
import { BenchmarkResult } from "./types";
import {
  benchmarkResultsQuery,
  startWorkersMutation,
  stopWorkersMutation
} from "./gqlqueries";
import { workerChartOption, seriesChartOption } from "./charts";

const { Header, Content } = Layout;

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
    <Layout>
      <Header
        style={{
          color: "white",
          fontSize: "30px",
          textAlign: "center"
        }}
      >
        Dashboard Benchmark Server
      </Header>
      <Content>
        <Row
          type={"flex"}
          gutter={16}
          justify={"start"}
          style={{ padding: "10px" }}
        >
          <Col>
            <Mutation mutation={startWorkersMutation} variables={{ amount: 1 }}>
              {(runmutation: any) => (
                <Button
                  icon={"plus"}
                  onClick={() =>
                    runmutation({
                      amount: 1
                    })
                  }
                >
                  Add Worker
                </Button>
              )}
            </Mutation>
          </Col>
          <Col>
            <Mutation mutation={stopWorkersMutation}>
              {(runMutation: any) => (
                <Button icon={"delete"} onClick={() => runMutation()}>
                  Kill Worker
                </Button>
              )}
            </Mutation>
          </Col>
        </Row>
        <Query query={benchmarkResultsQuery} pollInterval={1000}>
          {(props: {
            data: { benchmarkResults: BenchmarkResult[] };
            loading: boolean;
            error?: Error;
          }) => {
            if (props.error)
              return (
                <div style={{ color: "red" }}>{`ERROR: ${props.error}`}</div>
              );
            if (props.loading && !props.data.benchmarkResults) return <Spin />;

            return (
              <>
                <ReactEcharts
                  option={workerChartOption(props.data.benchmarkResults)}
                />
                <ReactEcharts
                  option={seriesChartOption(props.data.benchmarkResults)}
                />
              </>
            );
          }}
        </Query>
      </Content>
    </Layout>
  </ApolloProvider>
);

export const App = isDevelopmentEnv() ? hot(module)(AppClass) : AppClass;
