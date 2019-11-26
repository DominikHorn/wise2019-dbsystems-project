import * as React from "react";
import { getParteiColor } from "../../../guiUtil";
import { IMandat, IWahl } from "../../../../../shared/sharedTypes";
import { compose } from "react-apollo";
import {
  withMandateQuery,
  IGetMandateQueryHocProps
} from "../../../../../client-graphql/public/getMandateQuery";
import ReactEcharts from "echarts-for-react";
import { Card } from "antd";

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

  return Object.keys(parteiAggr).map(parteiname => ({
    value: parteiAggr[parteiname],
    name: parteiname,
    itemStyle: { color: getParteiColor(parteiname) }
  }));
}

export interface ISitzverteilungsChartProps {
  readonly wahl: IWahl;
}

interface IProps extends ISitzverteilungsChartProps, IGetMandateQueryHocProps {}

const SitzverteilungsChartComponent = (props: IProps) => (
  <Card loading={props.mandateData.loading}>
    {props.mandateData.mandate && (
      <ReactEcharts
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
              radius: [0, "70%"],

              label: {
                normal: {
                  position: "outer",
                  color: "black"
                }
              },
              labelLine: {
                normal: {
                  show: true
                }
              },
              data: aggregateMandate(props.mandateData.mandate)
            }
          ]
        }}
      />
    )}
  </Card>
);

const SitzverteilungsChartWithQueries = compose(
  withMandateQuery<ISitzverteilungsChartProps>(props => props.wahl.id)
)(SitzverteilungsChartComponent);

export const SitzverteilungsChart = SitzverteilungsChartWithQueries as React.ComponentType<
  ISitzverteilungsChartProps
>;
