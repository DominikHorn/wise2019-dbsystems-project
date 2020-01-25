import ReactEcharts from "echarts-for-react";
import * as React from "react";
import { sleep } from "../../../../../shared/util";
import {
  eatEvent,
  renderCenteredLoading,
  getParteiColor
} from "../../../guiUtil";
import {
  Wahl,
  Stimmentwicklung,
  Stimmkreis
} from "../../../../../shared/graphql.types";
import memoize from "memoize-one";

export interface IProzAnteilChartProps {
  readonly wahl: Wahl;
  readonly data: Stimmentwicklung[];
  readonly stimmkreis: Stimmkreis;
}

interface IProps extends IProzAnteilChartProps {}

export class ProzAnteilChart extends React.PureComponent<IProps> {
  private aggregateChartData = memoize(
    (
      stimmenEntwicklung: Stimmentwicklung[]
    ): {
      data: {
        value: number;
        name: string;
        selected?: boolean;
        itemStyle?: { color?: string };
      }[];
    } => {
      const res = stimmenEntwicklung.reduce(
        (prev, curr) => ({
          data: {
            ...(prev.data || {}),
            [curr.partei.id]: {
              value: curr.nachher,
              name: curr.partei.name,
              itemStyle: { color: getParteiColor(curr.partei.name) }
            }
          }
        }),

        { data: {} } as { [key: string]: any }
      );

      return {
        data: Object.keys(res.data)
          .map(key => res.data[key])
          .sort((a, b) => (a.value > b.value ? -1 : a.value < b.value ? 1 : 0))
      };
    }
  );

  private getOptions = () => ({
    tooltip: {
      trigger: "item",
      formatter: "{a} <br/>{b}: {c} ({d}%)"
    },
    animate: true,
    animationEasing: "circularInOut",
    toolbox: {
      left: "15px",
      top: "5px",
      feature: {
        saveAsImage: { title: "Als Bild speichern" }
      }
    }
  });

  componentWillReceiveProps(newProps: IProps) {
    if (this.props.data !== newProps.data) {
      this.updateChartData(newProps);
    }
  }

  private updateChartData = (props: IProps) => {
    if (!this.chart) return;
    if (!props.data) return;
    sleep(150).then(() => {
      // this.chart.clear();
      this.chart.setOption({
        series: [
          {
            name: "Stimmenanteile",
            type: "pie",
            selectedMode: "single",
            radius: [0, "65%"],
            label: {
              normal: {
                show: true,
                position: "outer",
                itemStyle: {
                  color: "gray"
                }
              }
            },
            data: this.aggregateChartData(props.data || []).data
          }
        ]
      });
    });
  };

  private chart: any = null;
  render() {
    const { data } = this.props;
    return (
      <div style={{ width: "100%", height: "100%" }} onMouseDown={eatEvent}>
        <ReactEcharts
          style={{ width: "100%", height: "100%" }}
          onChartReady={chart => {
            this.chart = chart;
            this.updateChartData(this.props);
          }}
          option={this.getOptions()}
        />
        {!data && renderCenteredLoading()}
      </div>
    );
  }
}
