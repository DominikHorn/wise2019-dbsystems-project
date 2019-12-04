import { Spin } from "antd";
import ReactEcharts from "echarts-for-react";
import * as React from "react";
import { compose } from "react-apollo";
import {
  IGetMandateQueryHocProps,
  withMandateQuery
} from "../../../../../client-graphql/public/getMandateQuery";
import { IMandat, IWahl } from "../../../../../shared/sharedTypes";
import { getParteiColor } from "../../../guiUtil";
import { EParteiName } from "../../../../../shared/enums";
import { sleep } from "../../../../../shared/util";

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
    // animationDelayUpdate: () => 10
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
        data: aggregateMandate(this.props.mandateData.mandate || [])
      }
    ]
  });

  render() {
    const { mandateData } = this.props;
    return (
      (mandateData.mandate && mandateData.mandate.length > 0 && (
        <ReactEcharts
          style={{ width: "100%", height: "100%" }}
          option={this.getOptions()}
        />
      )) || <Spin />
    );
  }
}

const SitzverteilungsChartWithQueries = compose(
  withMandateQuery<ISitzverteilungsChartProps>(props => props.wahl.id)
)(SitzverteilungsChartComponent);

export const SitzverteilungsChart = SitzverteilungsChartWithQueries as React.ComponentType<
  ISitzverteilungsChartProps
>;
