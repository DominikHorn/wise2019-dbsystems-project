import * as React from "react";
import { IWahl, IWahlbeteiligung } from "../../../../../shared/sharedTypes";
import {
  IGetWahlbeteiligungQueryHocProps,
  withWahlbeteiligungQuery
} from "../../../../../client-graphql/public/getWahlbeteiligungQuery";
import { compose } from "react-apollo";
import ReactEcharts from "echarts-for-react";
import { renderCenteredLoading } from "../../../../../wahlclient/ui/guiUtil";
import { eatEvent } from "../../../guiUtil";

export interface IWahlbeteiligungChartProps {
  readonly wahl: IWahl;
}

interface IProps
  extends IWahlbeteiligungChartProps,
    IGetWahlbeteiligungQueryHocProps {}

function mapToChartData(wahlbeteiligung: IWahlbeteiligung[]) {
  return wahlbeteiligung.map(w => ({
    name: `${w.stimmkreis.name}`,
    value: w.wahlbeteiligung
  }));
}

const WahlbeteiligungChartComponent = (props: IProps) => (
  <>
    {props.wahlbeteiligungData.wahlbeteiligung &&
    props.wahlbeteiligungData.wahlbeteiligung.length > 0 ? (
      <div onMouseDown={eatEvent} style={{ width: "100%", height: "100%" }}>
        <ReactEcharts
          style={{ width: "100%", height: "100%" }}
          option={{
            tooltip: {
              trigger: "item",
              showDelay: 0,
              transitionDuration: 0.2
              // formatter: (params: any) =>
              //   `${params.name}<br/>${params.value}`
            },
            visualMap: {
              show: true,
              min: 0,
              max: 100,
              inRange: {
                // TODO: adjust colors
                color: ["#b3402e", "#bdb03a", "#40b830"]
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
                name: "Wahlbeteiligung",
                type: "map",
                roam: true,
                map: "Stimmkreise",
                itemStyle: {
                  emphasis: { label: { show: false } }
                },
                data: mapToChartData(
                  props.wahlbeteiligungData.wahlbeteiligung || []
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

const WahlbeteiligungChartWithQueries = compose(
  withWahlbeteiligungQuery<IWahlbeteiligungChartProps>(props => props.wahl.id)
)(WahlbeteiligungChartComponent);

export const WahlbeteiligungChart = WahlbeteiligungChartWithQueries as React.ComponentType<
  IWahlbeteiligungChartProps
>;
