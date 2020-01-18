import * as React from "react";
import {
  IGetStimmkreisWinnerHocProps,
  withStimmkreisWinnerQuery
} from "../../../../../client-graphql/public/getStimmkreisWinnerQuery";
import {
  PARTEI_COLORS,
  renderCenteredLoading,
  eatEvent
} from "../../../guiUtil";
import ReactEcharts from "echarts-for-react";
import { compose } from "react-apollo";
import { BooleanSelector } from "../dataselectors/BooleanSelector";
import { Wahl, StimmkreisWinner } from "../../../../../shared/graphql.types";

export interface IGewinnerGeoChartProps {
  readonly erststimmen: boolean;
  readonly onErststimmenChanged: (newValue: boolean) => void;
  readonly wahl: Wahl;
}

interface IProps extends IGewinnerGeoChartProps, IGetStimmkreisWinnerHocProps {}
/**
 * Function for mapping the received IStimmkreisWinner array to
 * the data format required for ECharts geojson map
 * @param queryData
 */
function mapToChartData(
  queryData: StimmkreisWinner[]
): { name: string; value: number }[] {
  return queryData.map(winner => ({
    name: `${winner.stimmkreis.name}`,
    value: winner.partei.id - 1,
    stimmanzahl: winner.anzahl
  }));
}

const GewinnerGeoChartComponent = (props: IProps) => (
  <>
    {props.stimmkreisWinnerData.stimmkreisWinner &&
    props.stimmkreisWinnerData.stimmkreisWinner.length > 0 ? (
      <div onMouseDown={eatEvent} style={{ width: "100%", height: "100%" }}>
        <BooleanSelector
          label={`Aggregierter Stimmtyp (Aktuell ${
            props.erststimmen ? "Erststimm" : "Zweitstimm"
          }gewinner)`}
          style={{ marginLeft: "25px", marginTop: "5px", marginBottom: "5px" }}
          checked={props.erststimmen}
          onValueChanged={val => (
            console.log("props", props), props.onErststimmenChanged(val)
          )}
        />
        <ReactEcharts
          style={{ width: "100%", height: "100%" }}
          option={{
            tooltip: {
              trigger: "item",
              showDelay: 0,
              transitionDuration: 0.2,
              formatter: (params: any) =>
                `${params.name}<br/>${params.value}<br/>Stimmen: ${params.data.stimmanzahl}`
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
              // Visually pleasant align with StatistikWidget card's title
              left: "15px",
              top: "5px",
              feature: {
                saveAsImage: { title: "Als Bild speichern" }
              }
            },
            series: [
              {
                name: "Stimmkreise",
                type: "map",
                roam: true,
                map: "Stimmkreise",
                itemStyle: {
                  emphasis: { label: { show: false } }
                },
                data: mapToChartData(
                  props.stimmkreisWinnerData.stimmkreisWinner || []
                )
              }
            ]
          }}
        />
      </div>
    ) : (
      renderCenteredLoading()
    )}
  </>
);

const GewinnerGeoChartWithQueries = compose(
  withStimmkreisWinnerQuery<IGewinnerGeoChartProps>(
    props => props.wahl.id,
    props => props.erststimmen
  )
)(GewinnerGeoChartComponent);

export const GewinnerGeoChart = GewinnerGeoChartWithQueries as React.ComponentType<
  IGewinnerGeoChartProps
>;
