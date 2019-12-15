import * as React from "react";
import {
  IWahl,
  IWahlbeteiligung,
  IStimmkreis
} from "../../../../../shared/sharedTypes";
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
  readonly onStimmkreisSelect?: (selected: IStimmkreis) => void;
}

interface IProps
  extends IWahlbeteiligungChartProps,
    IGetWahlbeteiligungQueryHocProps {}

function mapToChartData(wahlbeteiligung: IWahlbeteiligung[]) {
  let min = 100;
  let max = 0;
  const data = wahlbeteiligung.map(w => {
    if (w.wahlbeteiligung > max) {
      max = w.wahlbeteiligung;
    }
    if (w.wahlbeteiligung < min) {
      min = w.wahlbeteiligung;
    }
    return {
      name: `${w.stimmkreis.name}`,
      value: w.wahlbeteiligung
    };
  });
  return { data, min, max };
}

const WahlbeteiligungChartComponent = (props: IProps) => {
  const data = mapToChartData(props.wahlbeteiligungData.wahlbeteiligung || []);

  return (
    <>
      {props.wahlbeteiligungData.wahlbeteiligung &&
      props.wahlbeteiligungData.wahlbeteiligung.length > 0 ? (
        <div
          onMouseDown={eatEvent}
          // onWheel={event => {
          //   event.preventDefault();
          // }}
          style={{ width: "100%", height: "100%" }}
        >
          <ReactEcharts
            style={{ width: "100%", height: "100%" }}
            onEvents={{
              mapselectchanged: event => {
                if (event && event.batch && event.batch[0]) {
                  const wbtobj = (
                    props.wahlbeteiligungData.wahlbeteiligung || []
                  ).find(wbt => wbt.stimmkreis.name === event.batch[0].name);
                  wbtobj &&
                    props.onStimmkreisSelect &&
                    props.onStimmkreisSelect(wbtobj.stimmkreis);
                }
              }
            }}
            option={{
              tooltip: {
                trigger: "item",
                showDelay: 0,
                transitionDuration: 0.2
              },
              visualMap: {
                show: true,
                min: data.min,
                max: data.max,
                inRange: {
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
                  selectedMode: "single",
                  map: "Stimmkreise",
                  itemStyle: {
                    emphasis: { label: { show: false }, areaColor: "#ccc" }
                  },
                  data: data.data
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
};

const WahlbeteiligungChartWithQueries = compose(
  withWahlbeteiligungQuery<IWahlbeteiligungChartProps>(props => props.wahl.id)
)(WahlbeteiligungChartComponent);

export const WahlbeteiligungChart = WahlbeteiligungChartWithQueries as React.ComponentType<
  IWahlbeteiligungChartProps
>;
