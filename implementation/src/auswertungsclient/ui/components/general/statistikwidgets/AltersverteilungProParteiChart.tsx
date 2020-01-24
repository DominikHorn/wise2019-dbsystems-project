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

const getParteiSortedValues = memoize((v: Altersverteilung[]) => {
  const distinctAlter = getDistinctAltersValuesSorted(v);

  const parteimap = v.reduce(
    (aggr, curr) => ({
      ...aggr,
      [curr.partei.name]: {
        ...aggr[curr.partei.name],
        [curr.geburtsjahr]: curr.anzahl
      }
    }),
    {} as { [parteiname: string]: { [geburtsjahr: number]: number } }
  );
  const res: { [parteiname: string]: (number | string)[] } = {};
  Object.keys(parteimap).forEach(key => {
    const parteiname = key;
    const altersvalues: (number | string)[] = [parteiname];
    for (let alter of distinctAlter) {
      altersvalues.push(parteimap[parteiname][Number(alter)] || 0);
    }
    res[parteiname] = altersvalues;
  });

  return res;
});

const AltersverteilungComponent = (props: IProps) => {
  const parteiSortedValues = getParteiSortedValues(
    (props.altersverteilungData &&
      props.altersverteilungData.altersverteilung) ||
      []
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
    dataset: {
      source: [
        [
          "Partei",
          ...getDistinctAltersValuesSorted(
            props.altersverteilungData.altersverteilung || []
          ).map(String)
        ],
        ...Object.values(parteiSortedValues)
      ]
    },
    xAxis: {
      type: "category"
    },
    yAxis: {},
    series: getDistinctAltersValuesSorted(
      props.altersverteilungData.altersverteilung || []
    ).map(geburtsjahr => ({
      type: "bar"
    }))
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
