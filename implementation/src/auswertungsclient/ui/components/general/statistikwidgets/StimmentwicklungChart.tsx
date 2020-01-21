import * as React from "react";
import {
  Wahl,
  Stimmkreis,
  Stimmentwicklung
} from "../../../../../shared/graphql.types";
import ReactEcharts from "echarts-for-react";

export interface IStimmentwicklungChartProps {
  readonly wahl: Wahl;
  readonly vglwahl: Wahl;
  readonly stimmkreis: Stimmkreis;
  readonly data: Stimmentwicklung[];
}

interface IProps extends IStimmentwicklungChartProps {}

function getOptions() {
  return {
    animate: true,
    animationEasing: "bounceInOut",
    toolbox: {
      feature: {
        saveAsImage: { title: "Als Bild speichern" }
      }
    },
    yAxis: {
      // interval: 5,
      type: "value"
    },
    xAxis: {
      type: "category",
      data: ["901", "902"]
      // axisLabel: { rotate: -45 }
    },
    grid: {
      left: 100
    },
    // tooltip: {},
    series: [
      {
        name: "2018",
        type: "bar",
        barGap: 0,
        data: [10, 5]
      },
      {
        name: "2013",
        type: "bar",
        data: [15, 6]
      }
    ]
  };
}

export const StimmentwicklungChart = (props: IProps) => (
  <div style={{ width: "100%", height: "100%" }}>
    <ReactEcharts option={getOptions()} />
  </div>
);
