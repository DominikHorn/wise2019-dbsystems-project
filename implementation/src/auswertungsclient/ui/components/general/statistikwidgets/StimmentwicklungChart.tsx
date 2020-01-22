import ReactEcharts from "echarts-for-react";
import * as React from "react";
import {
  Wahl,
  Stimmkreis,
  Stimmentwicklung
} from "../../../../../shared/graphql.types";
import { sleep } from "../../../../../shared/util";
import { eatEvent } from "../../../guiUtil";

export interface IStimmentwicklungChartProps {
  readonly wahl: Wahl;
  readonly vglwahl: Wahl;
  readonly stimmkreis: Stimmkreis;
  readonly data: Stimmentwicklung[];
}

interface IProps extends IStimmentwicklungChartProps {}

export class StimmentwicklungChart extends React.PureComponent<IProps> {
  private aggregateChartData = (
    stimmenEntwicklung: Stimmentwicklung[]
  ): {
    xAxisLabels: string[];
    series: {
      name: string; //Name der Partei -> wirklich Sinn dieses labels? Wo taucht das ueberhaupt auf?
      type: string; // immer bar
      data: { vorher: number; nachher: number }; //anzahl Stimmen aus previous bzw gewaehlter wahl
    }[];
  } => {
    const res = stimmenEntwicklung.reduce(
      (prev, curr) => ({
        series: {
          ...(prev.series || {}),
          [curr.partei.id]: {
            name: curr.partei.name,
            type: "bar",
            barGap: 0,
            data: [curr.vorher, curr.nachher]
          }
        },
        xAxisLabels: {
          ...(prev.xAxisLabels || {}),
          [curr.partei.id]: curr.partei.name
        }
      }),

      { series: {}, xAxisLabels: {} } as { [key: string]: any }
    );

    return {
      xAxisLabels: Object.keys(res.xAxisLabels).map(
        key => res.xAxisLabels[key]
      ),
      series: Object.keys(res.series).map(key => res.series[key])
    };
  };

  componentWillReceiveProps(newProps: IProps) {
    if (this.props.data !== newProps.data) {
      this.updateChartData(newProps);
    }
  }

  private getOptions = (props: IProps) => ({
    color: ["#003366", "#006699"],
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
    // grid: {
    //   left: 100
    // },
    legend: {
      data: [props.vglwahl.wahldatum, props.wahl.wahldatum]
    }
    // tooltip: {},
  });

  private updateChartData = (props: IProps) => {
    //debugger;
    if (!this.chart) return;
    if (!props.data) return;

    const chartData = this.aggregateChartData(props.data);
    console.log(chartData.series);
    // return chartData;

    sleep(100).then(() => {
      this.chart.clear();
      this.chart.setOption({
        ...this.getOptions(props),
        xAxis: {
          data: chartData.xAxisLabels,
          type: "category",
          axisLabel: { rotate: -45 }
        },
        series: chartData.series
      });
    });
  };

  private chart: any = null;
  render() {
    if (this.props.data) {
      const chartData = this.aggregateChartData(this.props.data);
      console.log(chartData);
    }
    //debugger;
    return (
      <div onMouseDown={eatEvent} style={{ width: "100%", height: "100%" }}>
        <ReactEcharts
          style={{ width: "100%", height: "100%" }}
          onChartReady={chart => {
            this.chart = chart;
            this.updateChartData(this.props);
          }}
          option={{}}
        />
      </div>
    );
  }
}

// export const StimmentwicklungChart = (props: IProps) => (
//   <div style={{ width: "100%", height: "100%" }}>
//     <ReactEcharts option={getOptions()} />
//   </div>
// );
