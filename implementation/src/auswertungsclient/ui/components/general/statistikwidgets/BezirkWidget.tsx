import { registerMap } from "echarts";
import ReactEcharts from "echarts-for-react";
import * as React from "react";
import RB_JSON from "../../../../geojson/regierungsbezirke.geojson";
import SK_JSON from "../../../../geojson/stimmkreise.geojson";
import { PARTEI_COLORS } from "../../../guiUtil";
import { IStatistikWidgetProps, StatistikWidget } from "../StatistikWidget";
import { EParteiName } from "../../../../../shared/enums";
import { compose } from "react-apollo";
import {
  withStimmkreisWinnerQuery,
  IGetStimmkreisWinnerHocProps
} from "../../../../../client-graphql/public/getStimmkreisWinnerQuery";
import { Spin } from "antd";
import { IStimmkreisWinner } from "../../../../../shared/sharedTypes";

registerMap("Regierungsbezirke", RB_JSON as Object);
registerMap("Stimmkreise", SK_JSON as Object);

export interface IBezirkWidgetProps extends IStatistikWidgetProps {
  readonly showStimmkreise?: boolean;
}

interface IProps extends IBezirkWidgetProps, IGetStimmkreisWinnerHocProps {}

const regierungsbezirk_data = [
  { name: "Oberbayern", value: 0 },
  { name: "Niederbayern", value: 0 },
  { name: "Oberpfalz", value: 0 },
  { name: "Oberfranken", value: 0 },
  { name: "Mittelfranken", value: 0 },
  { name: "Unterfranken", value: 0 },
  { name: "Schwaben", value: 1 }
];

function mapToChartData(
  queryData: IStimmkreisWinner[]
): { name: string; value: number }[] {
  return queryData.map(winner => ({
    name: `${winner.stimmkreis.name}`,
    value: winner.partei.id - 1
  }));
}

class BezirkWidgetComponent extends React.PureComponent<IProps> {
  render() {
    const { showStimmkreise, stimmkreisWinnerData } = this.props;
    const data = mapToChartData(stimmkreisWinnerData.stimmkreisWinner || []);
    return (
      <StatistikWidget
        {...this.props}
        title={`Stimmverteilung - ${
          showStimmkreise ? "Stimmkreise" : "Regierungsbezirke"
        }`}
      >
        {stimmkreisWinnerData.stimmkreisWinner &&
        stimmkreisWinnerData.stimmkreisWinner.length > 0 ? (
          <ReactEcharts
            style={{ width: "100%", height: "100%" }}
            option={{
              tooltip: {
                trigger: "item",
                showDelay: 0,
                transitionDuration: 0.2,
                formatter: (params: any) => {
                  return `${params.name}<br/>${
                    Object.keys(EParteiName)[params.value]
                  }`;
                }
              },
              visualMap: {
                show: false,
                min: 0,
                max: Object.values(PARTEI_COLORS).length - 1,
                inRange: {
                  color: Object.values(PARTEI_COLORS)
                }
              },
              toolbox: {
                left: "left",
                top: "top",
                language: "en",
                feature: {
                  dataView: { readOnly: false },
                  restore: {},
                  saveAsImage: {}
                }
              },
              series: [
                {
                  name: showStimmkreise ? "Stimmkreise" : "Regierungsbezirke",
                  type: "map",
                  roam: true,
                  map: showStimmkreise ? "Stimmkreise" : "Regierungsbezirke",
                  itemStyle: {
                    emphasis: { label: { show: true } }
                  },
                  data: showStimmkreise ? data : regierungsbezirk_data
                }
              ]
            }}
          />
        ) : (
          <Spin />
        )}
      </StatistikWidget>
    );
  }
}

const BezirkWidgetWithQueries = compose(
  withStimmkreisWinnerQuery<IBezirkWidgetProps>(
    () => 1,
    () => true
  )
)(BezirkWidgetComponent);

export const BezirkWidget = BezirkWidgetWithQueries as React.ComponentType<
  IBezirkWidgetProps
>;
