import * as React from "react";
import { IWahl, IStimmkreis } from "../../../../../shared/sharedTypes";
import ReactEcharts from "echarts-for-react";
import {
  IGetStimmenanteilQueryHocProps,
  withStimmenanteilQuery
} from "../../../../../client-graphql/public/getStimmanteilQuery";
import { compose } from "react-apollo";

export interface IStimmenanteilChartProps {
  readonly wahl: IWahl;
  readonly stimmkreis: IStimmkreis;
  readonly einzelstimmen: boolean;
}

interface IProps
  extends IStimmenanteilChartProps,
    IGetStimmenanteilQueryHocProps {}

function getOptions() {
  return {
    animate: true,
    animationEasing: "bounceInOut",
    color: ["#3398DB"],
    tooltip: {
      trigger: "axis",
      axisPointer: {
        // 坐标轴指示器，坐标轴触发有效
        type: "shadow" // 默认为直线，可选为：'line' | 'shadow'
      }
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true
    },
    xAxis: [
      {
        type: "category",
        data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        axisTick: {
          alignWithLabel: true
        }
      }
    ],
    yAxis: [
      {
        type: "value"
      }
    ],
    series: [
      {
        name: "直接访问",
        type: "bar",
        barWidth: "60%",
        data: [10, 52, 200, 334, 390, 330, 220]
      }
    ]
  };
}

const StimmenanteilChartComponent = (props: IProps) => (
  <div style={{ width: "100%", height: "100%" }}>
    <ReactEcharts option={getOptions()} />
  </div>
);

const StimmenanteilChartWithQueries = compose(
  withStimmenanteilQuery<IStimmenanteilChartProps>(
    props => props.wahl.id,
    props => props.stimmkreis.id,
    props => 0
  )
)(StimmenanteilChartComponent);

export const StimmenanteilChart = StimmenanteilChartWithQueries as React.ComponentType<
  IStimmenanteilChartProps
>;
