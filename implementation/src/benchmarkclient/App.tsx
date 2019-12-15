import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloClient } from "apollo-client";
import { ApolloLink } from "apollo-link";
import { setContext } from "apollo-link-context";
import { createUploadLink } from "apollo-upload-client";
import * as React from "react";
import { ApolloProvider, Query } from "react-apollo";
import { hot } from "react-hot-loader";
// @ts-ignore This works though typescript doesn't accept that fact
import config from "../../config.client.json";
import { isDevelopmentEnv } from "../shared/util";
import "../../node_modules/react-grid-layout/css/styles.css";
import "../../node_modules/react-resizable/css/styles.css";
import { Button, Col, Row, Layout, Spin } from "antd";
import ReactEcharts from "echarts-for-react";
import { BenchmarkResult } from "./types";
import { QUERY_DATA } from "./tmp";
import gql from "graphql-tag";

const { Header, Content, Footer } = Layout;

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

function convertHRTime(hrtime: [number, number]) {
  const nanoseconds = hrtime[0] * 1e9 + hrtime[1];
  const milliseconds = nanoseconds / 1e6;
  const seconds = nanoseconds / 1e9;

  return {
    seconds,
    milliseconds,
    nanoseconds
  };
}

const benchmarkResultsQuery = gql`
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

const queryIds = [
  "Q1",
  "Q2",
  "Q3",
  "Q4 - erststimmen = false",
  "Q4 - erststimmen = true",
  "Q5",
  "Q6"
];
function getBarXAxisData(benchmarkResults: BenchmarkResult[]): string[] {
  return benchmarkResults.map(dt => `W${dt.workerID}`);
}

type SeriesData = {
  name: string;
  type: string;
  barGap: number;
  data: number[];
};
function getBarSeriesData(benchmarkResults: BenchmarkResult[]): SeriesData[] {
  return queryIds.map(queryID => {
    return {
      name: queryID,
      type: "bar",
      barGap: 0,
      data: benchmarkResults.map(worker => {
        const queryRes = worker.queryResults.find(qs => qs.queryID === queryID);
        if (!queryRes) return 0;
        return (
          queryRes.results.length > 0 &&
          convertHRTime([
            queryRes.results[queryRes.results.length - 1].delta.hrfirst,
            queryRes.results[queryRes.results.length - 1].delta.hrsecond
          ]).milliseconds
        );
      })
    };
  });
}

const workerChartOption = (benchmarkResults: BenchmarkResult[]) => ({
  color: [
    "#003366",
    "#006699",
    "#4cabce",
    "#e0934f",
    "#b0631f",
    "#e0c84f",
    "#a947cc"
  ],
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "shadow"
    }
  },
  legend: {
    data: queryIds
  },
  toolbox: {
    show: true,
    orient: "vertical",
    left: "top",
    top: "center",
    feature: {
      mark: { show: true },
      magicType: {
        show: true,
        type: ["bar", "stack", "tiled"]
      },
      saveAsImage: { show: true, title: "Als Bild speichern" }
    }
  },
  calculable: true,
  xAxis: [
    {
      type: "category",
      axisTick: { show: false },
      data: getBarXAxisData(benchmarkResults)
    }
  ],
  yAxis: [
    {
      type: "value"
    }
  ],
  series: getBarSeriesData(benchmarkResults)
});

const seriesChartOption = {
  title: {
    text: "折线图堆叠"
  },
  tooltip: {
    trigger: "axis"
  },
  legend: {
    data: ["邮件营销", "联盟广告", "视频广告", "直接访问", "搜索引擎"]
  },
  grid: {
    left: "3%",
    right: "4%",
    bottom: "3%",
    containLabel: true
  },
  toolbox: {
    feature: {
      saveAsImage: {}
    }
  },
  xAxis: {
    type: "category",
    boundaryGap: false,
    data: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
  },
  yAxis: {
    type: "value"
  },
  series: [
    {
      name: "邮件营销",
      type: "line",
      stack: "总量",
      data: [120, 132, 101, 134, 90, 230, 210]
    },
    {
      name: "联盟广告",
      type: "line",
      stack: "总量",
      data: [220, 182, 191, 234, 290, 330, 310]
    },
    {
      name: "视频广告",
      type: "line",
      stack: "总量",
      data: [150, 232, 201, 154, 190, 330, 410]
    },
    {
      name: "直接访问",
      type: "line",
      stack: "总量",
      data: [320, 332, 301, 334, 390, 330, 320]
    },
    {
      name: "搜索引擎",
      type: "line",
      stack: "总量",
      data: [820, 932, 901, 934, 1290, 1330, 1320]
    }
  ]
};

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
            <Button icon={"plus"}>Add Worker</Button>
          </Col>
          <Col>
            <Button icon={"delete"}>Kill Worker</Button>
          </Col>
        </Row>
        <Query query={benchmarkResultsQuery} pollInterval={1}>
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
              <ReactEcharts
                option={workerChartOption(props.data.benchmarkResults)}
              />
            );
          }}
        </Query>
        <ReactEcharts option={seriesChartOption} />
      </Content>
    </Layout>
  </ApolloProvider>
);

export const App = isDevelopmentEnv() ? hot(module)(AppClass) : AppClass;
