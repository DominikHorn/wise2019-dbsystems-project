import * as React from "react";
import { compose } from "react-apollo";
import {
  withAltersverteilung,
  QueryToGetAltersverteilungHOCProps
} from "../../../../../client-graphql/public/getAltersverteilungQuery";
import { Wahl, Altersverteilung } from "../../../../../shared/graphql.types";
import ReactEcharts from "echarts-for-react";
import { renderCenteredLoading, eatEvent } from "../../../guiUtil";
import memoize from "memoize-one";

export interface IAltersverteilungsProps {
  readonly selectedWahl: Wahl;
}

interface IProps
  extends IAltersverteilungsProps,
    QueryToGetAltersverteilungHOCProps {}

const getDistinctAltersValuesSorted = memoize(
  (verteilung: Altersverteilung[]) =>
    Object.values(
      verteilung.reduce(
        (aggr, v) => ({ ...aggr, [v.geburtsjahr]: v.geburtsjahr }),
        {}
      )
    ).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
);

const getParteiSortedValues = memoize((v: Altersverteilung[]) =>
  v.reduce(
    (aggr, curr) => ({
      ...aggr,
      [curr.geburtsjahr]: (aggr[curr.geburtsjahr] || 0) + curr.anzahl
    }),
    {} as { [geburtsjahr: number]: number }
  )
);

const AltersverteilungComponent = (props: IProps) => {
  const parteiSortedValues = Object.values(
    getParteiSortedValues(
      (props.altersverteilungData &&
        props.altersverteilungData.altersverteilung) ||
        []
    )
  );
  const option = {
    tooltip: {},
    toolbox: {
      feature: {
        saveAsImage: { title: "Als Bild speichern" },
        magicType: {
          type: ["stack", "tiled"]
        },
        dataZoom: { title: "Zoom", yAxisIndex: false }
      }
    },
    legend: false,
    xAxis: {
      type: "category",
      data: getDistinctAltersValuesSorted(
        (props.altersverteilungData &&
          props.altersverteilungData.altersverteilung) ||
          []
      )
    },
    yAxis: {},
    series: [
      {
        type: "bar",
        data: parteiSortedValues
      }
    ]
  };

  return !props.altersverteilungData || props.altersverteilungData.loading ? (
    renderCenteredLoading()
  ) : (
    <div onMouseDown={eatEvent} style={{ width: "100%", height: "100%" }}>
      <ReactEcharts style={{ width: "100%", height: "100%" }} option={option} />
    </div>
  );
};

const AltersverteilungWithQueries = compose(
  withAltersverteilung<IAltersverteilungsProps>(p => p.selectedWahl.id)
)(AltersverteilungComponent);

export const AltersverteilungsChart = AltersverteilungWithQueries as React.ComponentType<
  IAltersverteilungsProps
>;
