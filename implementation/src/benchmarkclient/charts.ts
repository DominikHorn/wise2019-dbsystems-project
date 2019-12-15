import { BenchmarkResult } from "./types";

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

const chartColors = [
  "#003366",
  "#006699",
  "#4cabce",
  "#e0934f",
  "#b0631f",
  "#e0c84f",
  "#a947cc"
];

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

function getSeriesXAxisData(
  benchmarkResults: BenchmarkResult[]
): { sec: number; min: number; max: number }[] {
  let min = Infinity;
  let max = 0;
  benchmarkResults.forEach(res =>
    res.queryResults.forEach(qres =>
      qres.results
        .slice(
          qres.results.length - 10 > 0 ? qres.results.length - 10 : 0,
          qres.results.length
        )
        .forEach(qresres => {
          const stamp = convertHRTime([
            qresres.timestamp.hrfirst,
            qresres.timestamp.hrsecond
          ]);
          if (stamp.seconds < min) {
            min = stamp.seconds;
          }
          if (stamp.seconds > max) {
            max = stamp.seconds;
          }
        })
    )
  );
  if (min === Infinity) return [];

  let arr = [];
  const delta = max - min;
  for (let i = delta - 10 > 0 ? delta - 10 : 0; i < delta; i++) {
    arr.push({ sec: i, min, max });
  }
  return arr;
}

type BarSeriesData = {
  name: string;
  type: string;
  barGap: number;
  data: number[];
};
function getBarSeriesData(
  benchmarkResults: BenchmarkResult[]
): BarSeriesData[] {
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

type SeriesSeriesData = {
  name: string;
  type: string;
  stack?: string;
  data: number[];
};
// TODO: optimize
function getSeriesSeriesData(
  benchmarkResults: BenchmarkResult[]
): SeriesSeriesData[] {
  const timestamps = getSeriesXAxisData(benchmarkResults);
  return queryIds.map(queryID => ({
    name: queryID,
    type: "line",
    // per worker, the times from the last 10 calls
    data: timestamps.map(timestamp => {
      // Find latest query result for query with queryID before timestamp per worker and average
      const aggregatedTime = benchmarkResults.reduce(
        (aggr, worker) => {
          const queryRes = worker.queryResults.find(
            qs => qs.queryID === queryID
          );
          if (!queryRes) return aggr;
          const viableStamps = queryRes.results.filter(
            stamp =>
              convertHRTime([stamp.timestamp.hrfirst, stamp.timestamp.hrsecond])
                .seconds -
                timestamp.min <
              timestamp.sec
          );
          if (!viableStamps || viableStamps.length <= 0) return aggr;
          const matchingStamp = viableStamps[viableStamps.length - 1];

          return {
            sum:
              aggr.sum +
              convertHRTime([
                matchingStamp.delta.hrfirst,
                matchingStamp.delta.hrsecond
              ]).milliseconds,
            participating: aggr.participating + 1
          };
        },
        { sum: 0, participating: 0 }
      );

      return aggregatedTime.participating > 0
        ? Math.floor(aggregatedTime.sum / aggregatedTime.participating)
        : 0;
    })
  }));
}

export const workerChartOption = (benchmarkResults: BenchmarkResult[]) => ({
  color: chartColors,
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

export const seriesChartOption = (benchmarkResults: BenchmarkResult[]) => ({
  color: chartColors,
  tooltip: {
    trigger: "axis"
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
      saveAsImage: { title: "Als Bild speichern" }
    }
  },
  xAxis: {
    type: "category",
    boundaryGap: false,
    data: getSeriesXAxisData(benchmarkResults).map(
      sec => `${Math.floor(sec.sec)}`
    )
  },
  yAxis: {
    type: "value"
  },
  series: getSeriesSeriesData(benchmarkResults)
});
