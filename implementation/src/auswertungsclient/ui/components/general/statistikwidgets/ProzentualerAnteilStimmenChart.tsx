import {
  IStimmenEntwicklung,
  IWahl,
  IStimmkreis
} from "../../../../../shared/sharedTypes";
import * as React from "react";
import { render } from "react-dom";
import {
  getParteiColor,
  eatEvent,
  renderCenteredLoading
} from "../../../guiUtil";
import { EParteiName } from "../../../../../shared/enums";
import ReactEcharts from "echarts-for-react";
import { sleep } from "../../../../../shared/util";

export interface IProzAnteilChartProps {
  readonly wahl: IWahl;
  readonly data: IStimmenEntwicklung[];
  readonly stimmkreis: IStimmkreis;
}

interface IProps extends IProzAnteilChartProps {}

export class ProzAnteilChart extends React.PureComponent<IProps> {
  private aggregateChartData = (
    stimmenEntwicklung: IStimmenEntwicklung[]
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
            name: curr.partei.name
          }
        }
      }),

      { data: {} } as { [key: string]: any }
    );

    return {
      data: Object.keys(res.data).map(key => res.data[key])
    };
  };

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
    if (this.props.data) console.log(this.aggregateChartData(this.props.data));
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
