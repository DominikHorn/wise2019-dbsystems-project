import ReactEcharts from "echarts-for-react";
import * as React from "react";
import { RouteComponentProps } from "react-router";
import { Card } from "antd";
import {
  IGetMandateQueryHocProps,
  withMandateQuery
} from "../../../../client-graphql/public/getMandateQuery";
import { compose } from "react-apollo";
import { withAllWahlenQuery } from "../../../../client-graphql/public/getAllWahlenQuery";
import { withErrorBoundary } from "../general/ErrorBoundary";
import { EParteiNamen, IMandat } from "../../../../shared/sharedTypes";
import { getParteiColor } from "../../guiUtil";

export interface IStatistikPageProps {
  routeProps: RouteComponentProps<any>;
}

interface IProps extends IStatistikPageProps, IGetMandateQueryHocProps {}

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

const StatistikPageComponent = (props: IProps) => (
  <Card loading={props.mandateData.loading}>
    {props.mandateData.mandate && (
      <ReactEcharts
        option={{
          tooltip: {
            trigger: "item",
            formatter: "{a} <br/>{b}: {c} ({d}%)"
          },
          // legend: {
          //   orient: "vertical",
          //   x: "left",
          //   data: Object.values(EParteiNamen)
          // },
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

const StatistikPageWithQueries = compose(
  withMandateQuery<IStatistikPageProps>(props => 1)
)(StatistikPageComponent);

const StatistikPageWithErrorBoundaries = withErrorBoundary<IStatistikPageProps>(
  StatistikPageWithQueries
);

export const StatistikPage = StatistikPageWithErrorBoundaries as React.ComponentType<
  IStatistikPageProps
>;
