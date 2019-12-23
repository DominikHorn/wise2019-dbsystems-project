import * as React from "react";
import { Wahl, Stimmkreis } from "../../../../../shared/graphql.types";
import {
  IGetStimmentwicklungQueryHocProps,
  withStimmentwicklungQuery
} from "../../../../../client-graphql/public/getStimmentwicklungQuery";
import { compose } from "react-apollo";
import ReactEcharts from "echarts-for-react";

export interface IStimmentwicklungChartProps {
  readonly wahl: Wahl;
  readonly vglwahl: Wahl;
  readonly stimmkreis: Stimmkreis;
}

interface IProps
  extends IStimmentwicklungChartProps,
    IGetStimmentwicklungQueryHocProps {}

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

const StimmentwicklungChartComponent = (props: IProps) => (
  <div style={{ width: "100%", height: "100%" }}>
    <ReactEcharts option={getOptions()} />
  </div>
);

const StimmentwicklungChartWithQueries = compose(
  withStimmentwicklungQuery<IStimmentwicklungChartProps>(
    props => props.wahl.id,
    props => props.vglwahl.id,
    props => props.stimmkreis.id
  )
)(StimmentwicklungChartComponent);

export const StimmentwicklungChart = StimmentwicklungChartWithQueries as React.ComponentType<
  IStimmentwicklungChartProps
>;
