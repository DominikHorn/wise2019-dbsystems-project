import * as React from "react";
import { IWahl, IStimmkreis } from "../../../../../shared/sharedTypes";
import {
  IGetStimmentwicklungQueryHocProps,
  withStimmentwicklungQuery
} from "../../../../../client-graphql/public/getStimmentwicklungQuery";
import { compose } from "react-apollo";
import ReactEcharts from "echarts-for-react";

export interface IStimmentwicklungChartProps {
  readonly wahl: IWahl;
  readonly vglwahl: IWahl;
  readonly stimmkreis: IStimmkreis;
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
      interval: 5
    },
    xAxis: {
      data: ["901", "902"],
      name: "",
      silent: false,
      axisLine: { onZero: true },
      axisLabel: { rotate: -45 }
    },
    grid: {
      left: 100
    },
    series: {
      name: "Stimmentwicklung",
      type: "bar",
      data: [
        {
          category: "901",
          name: "2018",
          value: 10
        },
        {
          category: "901",
          name: "2013",
          value: 15
        },
        {
          category: "902",
          name: "2018",
          value: 5
        },
        {
          category: "902",
          name: "2013",
          value: 6
        }
      ]
    }
    // tooltip: {}
    // grid: {}
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
