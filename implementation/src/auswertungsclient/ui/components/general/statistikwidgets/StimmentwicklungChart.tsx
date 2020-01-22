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
    source: any[];
    xAxisLabels: string[];
    series: {
      name: string; //Name der Partei -> wirklich Sinn dieses labels? Wo taucht das ueberhaupt auf?
      type: string; // immer bar
      data: { vorher: number; nachher: number }; //anzahl Stimmen aus previous bzw gewaehlter wahl
    }[];
  } => {
    //TODO: Jahreszahlen richtig einbinden -> wie Zugriff auf year bei date?
    const sourceBegin = [["partei", "2013", "2018"]];
    const res = stimmenEntwicklung.reduce(
      (prev, curr) => ({
        source: {
          ...(prev.source || {}),
          [curr.partei.id]: [curr.partei.name, curr.vorher, curr.nachher]
        },
        series: {
          ...(prev.series || {}),
          [curr.partei.id]: {
            type: "bar"
          }
        },
        xAxisLabels: {
          ...(prev.xAxisLabels || {}),
          [curr.partei.id]: curr.partei.name
        }
      }),

      { source: {}, series: {}, xAxisLabels: {} } as { [key: string]: any }
    );

    return {
      source: sourceBegin.concat(
        Object.keys(res.source).map(key => res.source[key])
      ),
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

  private getOptions = () => ({
    toolbox: {
      left: "15px",
      top: "5px",
      feature: {
        saveAsImage: { title: "Als Bild speichern" }
      }
    },
    yAxis: {},
    legend: {
      orient: "vertical",
      right: 10
    },
    tooltip: {}
  });

  private updateChartData = (props: IProps) => {
    //debugger;
    if (!this.chart) return;
    if (!props.data) return;

    const chartData = this.aggregateChartData(props.data);

    sleep(100).then(() => {
      this.chart.clear();
      this.chart.setOption({
        ...this.getOptions(),
        dataset: {
          source: chartData.source
        },
        xAxis: { type: "category", axisLabel: { rotate: -45 } },
        // Declare several bar series, each will be mapped
        // to a column of dataset.source by default.
        series: [{ type: "bar" }, { type: "bar" }]
      });
    });
  };

  private chart: any = null;
  render() {
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
