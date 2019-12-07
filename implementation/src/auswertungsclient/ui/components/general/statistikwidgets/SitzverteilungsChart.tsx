import ReactEcharts from "echarts-for-react";
import * as React from "react";
import { compose } from "react-apollo";
import {
  IGetMandateQueryHocProps,
  withMandateQuery
} from "../../../../../client-graphql/public/getMandateQuery";
import { EParteiName } from "../../../../../shared/enums";
import { IMandat, IWahl } from "../../../../../shared/sharedTypes";
import { getParteiColor } from "../../../guiUtil";
import { sleep } from "../../../../../shared/util";
import { Spin } from "antd";
import { renderCenteredLoading } from "../../../../../wahlclient/ui/guiUtil";

function aggregateMandate(
  mandate: IMandat[]
): {
  value: number;
  name: string;
  selected?: boolean;
  itemStyle?: { color?: string };
}[] {
  const parteiAggr: {
    [parteiname: string]: number;
  } = {};
  mandate.forEach(mandat => {
    parteiAggr[mandat.kandidat.partei.name] =
      (parteiAggr[mandat.kandidat.partei.name] || 0) + 1;
  });

  return Object.keys(parteiAggr)
    .map((parteiname: EParteiName) => ({
      value: parteiAggr[parteiname],
      name: parteiname,
      itemStyle: { color: getParteiColor(parteiname) }
    }))
    .sort((a, b) => {
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return 0;
    });
}

export interface ISitzverteilungsChartProps {
  readonly wahl: IWahl;
}

interface IProps extends ISitzverteilungsChartProps, IGetMandateQueryHocProps {}

class SitzverteilungsChartComponent extends React.PureComponent<IProps> {
  private getOptions = () => ({
    tooltip: {
      trigger: "item",
      formatter: "{a} <br/>{b}: {c} ({d}%)"
    },
    animate: true
    // animationDelayUpdate: () => 100,
    // animationDuration: 3000
  });

  componentWillReceiveProps(newProps: IProps) {
    if (this.props.mandateData.mandate !== newProps.mandateData.mandate) {
      this.updateChartData(newProps);
    }
  }

  private updateChartData = (props: IProps) => {
    if (!this.chart) return;
    if (!props.mandateData || !props.mandateData.mandate) return;
    sleep(100).then(() =>
      this.chart.setOption({
        series: [
          {
            name: "Sitzverteilung",
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
            data: aggregateMandate(props.mandateData.mandate || [])
          }
        ]
      })
    );
  };

  // Echart types ;/
  private chart: any = null;
  render() {
    const { mandateData } = this.props;
    return (
      <>
        <ReactEcharts
          style={{ width: "100%", height: "100%" }}
          onChartReady={chart => {
            this.chart = chart;
            this.updateChartData(this.props);
          }}
          option={this.getOptions()}
        />
        {mandateData.loading && renderCenteredLoading()}
      </>
    );
  }
}

const SitzverteilungsChartWithQueries = compose(
  withMandateQuery<ISitzverteilungsChartProps>(props => props.wahl.id)
)(SitzverteilungsChartComponent);

export const SitzverteilungsChart = SitzverteilungsChartWithQueries as React.ComponentType<
  ISitzverteilungsChartProps
>;
