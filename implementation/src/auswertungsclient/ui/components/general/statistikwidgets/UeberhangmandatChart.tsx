import * as React from "react";
import {
  IGetUeberhangmandateQueryHocProps,
  withUeberhangmandateQuery
} from "../../../../../client-graphql/public/getUeberhangmandateQuery";
import { compose } from "react-apollo";
import ReactEcharts from "echarts-for-react";
import {
  renderCenteredLoading,
  getParteiColor,
  eatEvent
} from "../../../guiUtil";
import { sleep } from "../../../../../shared/util";
import { Wahl, UeberhangMandat } from "../../../../../shared/graphql.types";

export interface IUeberhangmandatChartProps {
  readonly wahl: Wahl;
}

interface IProps
  extends IUeberhangmandatChartProps,
    IGetUeberhangmandateQueryHocProps {}

enum EMandatCategory {
  ZUSTEHENDEMANDATE = "Zustehende Mandate",
  UEBERHANGMANDATE = "Überhangmandate",
  AUSGLEICHSMANDATE = "Ausgleichsmandate"
}

class UeberhangmandatChartComponent extends React.PureComponent<IProps> {
  private getOptions = () => ({
    animate: true,
    animationEasing: "elasticOut",
    legend: {
      data: [
        EMandatCategory.UEBERHANGMANDATE,
        EMandatCategory.AUSGLEICHSMANDATE
      ],
      align: "auto",
      orient: "vertical",
      left: 10,
      top: 5
    },
    toolbox: {
      feature: {
        saveAsImage: { title: "Als Bild speichern" },
        magicType: {
          type: ["stack", "tiled"]
        },
        dataZoom: { title: "Zoom", yAxisIndex: false }
      }
    },
    tooltip: {
      formatter: (param: any) =>
        `${param.data.category} <br/> ${param.data.partei.name}: ${
          param.data.value < 0 ? -param.data.value : param.data.value
        }`
    },
    yAxis: {
      inverse: false,
      splitArea: { show: false },
      interval: 2
    },
    grid: {
      left: 100
    }
  });

  componentWillReceiveProps(newProps: IProps) {
    if (
      this.props.ueberhangmandateData.ueberhangmandate !==
      newProps.ueberhangmandateData.ueberhangmandate
    ) {
      this.updateChartData(newProps);
    }
  }

  private aggregateChartData = (
    ueberhangmandate: UeberhangMandat[]
  ): {
    xAxisLabels: string[];
    series: {
      name: string; // regierungsbezirk
      type: string; // immer bar
      stack: number; // welcher stapel im regierungsbezirk (parteiId)
      itemStyle: any; // fixed css style
      data: { name: string; value: number; itemStyle: any }[]; // Die zahlen pro bar
    }[];
  } => {
    const res = ueberhangmandate.reduce(
      (prev, curr) => ({
        data: {
          ...(prev.data || {}),
          [curr.partei.id]: {
            ...(prev.data[curr.partei.id] || {}),
            parteiname: curr.partei.name,
            [EMandatCategory.ZUSTEHENDEMANDATE]: {
              ...((prev.data[curr.partei.id] || {})[
                EMandatCategory.ZUSTEHENDEMANDATE
              ] || {}),
              [curr.regierungsbezirk.id]:
                curr.zustehend + curr.ausgleich + curr.ueberhang
            },
            [EMandatCategory.AUSGLEICHSMANDATE]: {
              ...((prev.data[curr.partei.id] || {})[
                EMandatCategory.AUSGLEICHSMANDATE
              ] || {}),
              [curr.regierungsbezirk.id]: -curr.ausgleich
            },
            [EMandatCategory.UEBERHANGMANDATE]: {
              ...((prev.data[curr.partei.id] || {})[
                EMandatCategory.UEBERHANGMANDATE
              ] || {}),
              [curr.regierungsbezirk.id]: -curr.ueberhang
            }
          }
        },
        xAxisLabels: {
          ...(prev.xAxisLabels || {}),
          [curr.regierungsbezirk.id]: curr.regierungsbezirk.name
        }
      }),
      { data: {}, xAxisLabels: {} } as { [key: string]: any }
    );

    const mapCategory = (category: EMandatCategory, partei_id: string) => ({
      name: category,
      type: "bar",
      stack: Number(partei_id),
      itemStyle: {
        normal: {},
        emphasis: {
          barBorderWidth: 1,
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowOffsetY: 0,
          shadowColor: "rgba(0,0,0,0.5)"
        }
      },
      data: Object.keys(res.data[partei_id][category])
        .sort()
        .map((key: string) => ({
          category,
          name: key,
          value: res.data[partei_id][category][key],
          partei: { id: partei_id, name: res.data[partei_id].parteiname },
          itemStyle: category === EMandatCategory.ZUSTEHENDEMANDATE && {
            color: getParteiColor(res.data[partei_id].parteiname)
          }
        }))
    });

    return {
      xAxisLabels: Object.keys(res.xAxisLabels)
        .sort()
        .map(key => res.xAxisLabels[key]),
      series: Object.keys(res.data).flatMap(partei_id => [
        mapCategory(EMandatCategory.ZUSTEHENDEMANDATE, partei_id),
        mapCategory(EMandatCategory.AUSGLEICHSMANDATE, partei_id),
        mapCategory(EMandatCategory.UEBERHANGMANDATE, partei_id)
      ])
    };
  };

  private updateChartData = (props: IProps) => {
    debugger;
    if (!this.chart) return;
    if (
      !props.ueberhangmandateData ||
      !props.ueberhangmandateData.ueberhangmandate
    )
      return;
    const chartData = this.aggregateChartData(
      props.ueberhangmandateData.ueberhangmandate
    );
    console.log(chartData.series);
    sleep(100).then(() => {
      this.chart.clear();
      this.chart.setOption({
        ...this.getOptions(),
        xAxis: {
          data: chartData.xAxisLabels,
          name: "",
          silent: false,
          axisLine: { onZero: true },
          splitLine: { show: false },
          splitArea: { show: false },
          axisLabel: { rotate: -45 }
        },
        series: chartData.series
      });
    });
  };

  // Echart types are bad ;/
  private chart: any = null;
  render() {
    const { ueberhangmandateData } = this.props;
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
        {ueberhangmandateData.loading && renderCenteredLoading()}
      </div>
    );
  }
}

const UeberhangmandatChartWithQueries = compose(
  withUeberhangmandateQuery<IUeberhangmandatChartProps>(props => props.wahl.id)
)(UeberhangmandatChartComponent);

export const UeberhangMandatChart = UeberhangmandatChartWithQueries as React.ComponentType<
  IUeberhangmandatChartProps
>;
