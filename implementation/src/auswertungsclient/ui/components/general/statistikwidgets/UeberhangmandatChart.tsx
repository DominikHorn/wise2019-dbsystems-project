import * as React from "react";
import {
  IGetUeberhangmandateQueryHocProps,
  withUeberhangmandateQuery
} from "../../../../../client-graphql/public/getUeberhangmandateQuery";
import { compose } from "react-apollo";
import { IWahl, IUeberhangMandat } from "../../../../../shared/sharedTypes";
import ReactEcharts from "echarts-for-react";
import { renderCenteredLoading, getParteiColor } from "../../../guiUtil";
import { sleep } from "../../../../../shared/util";
import { EParteiName } from "../../../../../shared/enums";

export interface IUeberhangmandatChartProps {
  readonly wahl: IWahl;
}

interface IProps
  extends IUeberhangmandatChartProps,
    IGetUeberhangmandateQueryHocProps {}

enum EMandatCategory {
  DIREKTMANDATE = "Direktmandate",
  UEBERHANGMANDATE = "Überhangmandate",
  AUSGLEICHSMANDATE = "Ausgleichsmandate"
}

class UeberhangmandatChartComponent extends React.PureComponent<IProps> {
  private getOptions = () => ({
    animate: true,
    animationEasing: "elasticOut",
    legend: {
      data: [
        EMandatCategory.DIREKTMANDATE,
        EMandatCategory.UEBERHANGMANDATE,
        EMandatCategory.AUSGLEICHSMANDATE
      ],
      align: "left",
      left: 10
    },
    brush: {
      toolbox: ["rect", "polygon", "lineX", "lineY", "keep", "clear"],
      xAxisIndex: 0
    },
    tollbox: {
      feature: {
        magicType: {
          type: ["stack", "tiled"]
        },
        dataView: {}
      }
    },
    tooltip: {},
    yAxis: {
      inverse: true,
      splitArea: { show: false }
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
    ueberhangmandate: IUeberhangMandat[]
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
            [EMandatCategory.DIREKTMANDATE]: {
              ...((prev.data[curr.partei.id] || {})[
                EMandatCategory.DIREKTMANDATE
              ] || {}),
              [curr.regierungsbezirk.id]: -(curr.zustehend + curr.ueberhang)
            },
            [EMandatCategory.AUSGLEICHSMANDATE]: {
              ...((prev.data[curr.partei.id] || {})[
                EMandatCategory.AUSGLEICHSMANDATE
              ] || {}),
              [curr.regierungsbezirk.id]: curr.ausgleich
            },
            [EMandatCategory.UEBERHANGMANDATE]: {
              ...((prev.data[curr.partei.id] || {})[
                EMandatCategory.UEBERHANGMANDATE
              ] || {}),
              [curr.regierungsbezirk.id]: curr.ueberhang
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
          name: key,
          value: res.data[partei_id][category][key],
          itemStyle: category === EMandatCategory.DIREKTMANDATE && {
            color: getParteiColor(
              Object.values(EParteiName)[Number(partei_id) - 1]
            )
          }
        }))
    });

    return {
      xAxisLabels: Object.keys(res.xAxisLabels)
        .sort()
        .map(key => res.xAxisLabels[key]),
      series: Object.keys(res.data).flatMap(partei_id => [
        mapCategory(EMandatCategory.DIREKTMANDATE, partei_id),
        mapCategory(EMandatCategory.AUSGLEICHSMANDATE, partei_id),
        mapCategory(EMandatCategory.UEBERHANGMANDATE, partei_id)
      ])
    };
  };

  private updateChartData = (props: IProps) => {
    if (!this.chart) return;
    if (
      !props.ueberhangmandateData ||
      !props.ueberhangmandateData.ueberhangmandate
    )
      return;
    const chartData = this.aggregateChartData(
      props.ueberhangmandateData.ueberhangmandate
    );

    console.log(chartData);
    this.chart.clear();
    sleep(100).then(() =>
      this.chart.setOption({
        ...this.getOptions(),
        xAxis: {
          data: chartData.xAxisLabels,
          name: "",
          silent: false,
          axisLine: { onZero: true },
          splitLine: { show: false },
          splitArea: { show: false }
        },
        series: chartData.series
      })
    );
  };

  /**
   * This function ensures that the Mousevent is not received
   * By child or parent components. This is necessary to enable
   * panning the brush feature, as the propagated
   * mouse down event will otherwise start the widget drag and
   * drop.
   * @param event MouseEvent from React
   */
  private eatEvent(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  // Echart types are bad ;/
  private chart: any = null;
  render() {
    const { ueberhangmandateData } = this.props;
    return (
      <div
        onMouseDown={this.eatEvent}
        style={{ width: "100%", height: "100%" }}
      >
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
