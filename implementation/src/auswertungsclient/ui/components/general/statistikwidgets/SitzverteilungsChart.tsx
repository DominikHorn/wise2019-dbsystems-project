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
    .map(parteiname => ({
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

const SitzverteilungsChartComponent = (props: IProps) =>
  (props.mandateData.mandate && (
    <ReactEcharts
      style={{ width: "100%", height: "100%" }}
      option={{
        tooltip: {
          trigger: "item",
          formatter: "{a} <br/>{b}: {c} ({d}%)"
        },
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

            data: aggregateMandate(props.mandateData.mandate)
          }
        ]
      }}
    />
  )) || <Spin />;

const SitzverteilungsChartWithQueries = compose(
  withMandateQuery<ISitzverteilungsChartProps>(props => props.wahl.id)
)(SitzverteilungsChartComponent);

export const SitzverteilungsChart = SitzverteilungsChartWithQueries as React.ComponentType<
  ISitzverteilungsChartProps
>;
