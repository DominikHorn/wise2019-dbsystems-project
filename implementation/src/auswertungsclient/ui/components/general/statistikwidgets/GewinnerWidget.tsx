import { registerMap } from "echarts";
import ReactEcharts from "echarts-for-react";
import * as React from "react";
import SK_JSON from "../../../../geojson/stimmkreise.geojson";
import { PARTEI_COLORS, renderCenteredLoading } from "../../../guiUtil";
import { IStatistikWidgetProps, StatistikWidget } from "../StatistikWidget";
import { EParteiName } from "../../../../../shared/enums";
import { compose } from "react-apollo";
import {
  withStimmkreisWinnerQuery,
  IGetStimmkreisWinnerHocProps
} from "../../../../../client-graphql/public/getStimmkreisWinnerQuery";
import { IStimmkreisWinner } from "../../../../../shared/sharedTypes";

registerMap("Stimmkreise", SK_JSON as Object);

export interface IGewinnerWidgetProps extends IStatistikWidgetProps {
  readonly erststimmen: boolean;
}

interface IProps extends IGewinnerWidgetProps, IGetStimmkreisWinnerHocProps {}

// import RB_JSON from "../../../../geojson/regierungsbezirke.geojson";
// registerMap("Regierungsbezirke", RB_JSON as Object);
// const regierungsbezirk_data = [
//   { name: "Oberbayern", value: 0 },
//   { name: "Niederbayern", value: 0 },
//   { name: "Oberpfalz", value: 0 },
//   { name: "Oberfranken", value: 0 },
//   { name: "Mittelfranken", value: 0 },
//   { name: "Unterfranken", value: 0 },
//   { name: "Schwaben", value: 1 }
// ];

function mapToChartData(
  queryData: IStimmkreisWinner[]
): { name: string; value: number }[] {
  return queryData.map(winner => ({
    name: `${winner.stimmkreis.name}`,
    value: winner.partei.id - 1
  }));
}

class GewinnerWidgetComponent extends React.PureComponent<IProps> {
  private eatEvent = (event: React.MouseEvent) => {
    event.bubbles = false;
    event.preventDefault();
  };

  render() {
    const { stimmkreisWinnerData } = this.props;
    const data = mapToChartData(stimmkreisWinnerData.stimmkreisWinner || []);
    return (
      <StatistikWidget {...this.props} title={`Gewinner der Stimmkreise`}>
        {stimmkreisWinnerData.stimmkreisWinner &&
        stimmkreisWinnerData.stimmkreisWinner.length > 0 ? (
          <div
            onClick={this.eatEvent}
            onDrag={this.eatEvent}
            onDrop={this.eatEvent}
            style={{ width: "100%", height: "100%" }}
          >
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
                  feature: {
                    // dataView: { readOnly: true, title: "Als Tabelle ansehen" },
                    // restore: {},
                    saveAsImage: { title: "Als Bild speichern" },
                    dataZoom: {}
                  }
                },
                series: [
                  {
                    name: "Stimmkreise",
                    type: "map",
                    roam: true,
                    map: "Stimmkreise",
                    itemStyle: {
                      emphasis: { label: { show: true } }
                    },
                    data: data
                  }
                ]
              }}
            />
          </div>
        ) : (
          renderCenteredLoading()
        )}
      </StatistikWidget>
    );
  }
}

const GewinnerWidgetWithQueries = compose(
  withStimmkreisWinnerQuery<IGewinnerWidgetProps>(
    () => 1,
    props => props.erststimmen
  )
)(GewinnerWidgetComponent);

export const GewinnerWidget = GewinnerWidgetWithQueries as React.ComponentType<
  IGewinnerWidgetProps
>;
