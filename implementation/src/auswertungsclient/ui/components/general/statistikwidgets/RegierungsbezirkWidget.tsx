import { registerMap } from "echarts";
import ReactEcharts from "echarts-for-react";
import * as React from "react";
import RB_JSON from "../../../../geojson/regierungsbezirke.geojson";
import SK_JSON from "../../../../geojson/stimmkreise.geojson";
import { PARTEI_COLORS } from "../../../guiUtil";
import { IStatistikWidgetProps, StatistikWidget } from "../StatistikWidget";
import { EParteiName } from "../../../../../shared/enums";

registerMap("Regierungsbezirke", RB_JSON as Object);
registerMap("Stimmkreise", SK_JSON as Object);

export interface IRegierungsbezirkWidgetProps extends IStatistikWidgetProps {
  readonly showStimmkreise?: boolean;
}

const regierungsbezirk_data = [
  { name: "Oberbayern", value: 0 },
  { name: "Niederbayern", value: 0 },
  { name: "Oberpfalz", value: 0 },
  { name: "Oberfranken", value: 0 },
  { name: "Mittelfranken", value: 0 },
  { name: "Unterfranken", value: 0 },
  { name: "Schwaben", value: 1 }
];

const stimmkreis_data = JSON.parse(SK_JSON).features.map((feature: any) => ({
  name: feature.properties.name,
  value: Math.floor(Math.random() * (Object.values(PARTEI_COLORS).length - 1))
}));

export const RegierungsbezirkWidget = (props: IRegierungsbezirkWidgetProps) => (
  <StatistikWidget
    {...props}
    title={`Stimmverteilung - ${
      props.showStimmkreise ? "Stimmkreise" : "Regierungsbezirke"
    }`}
  >
    <ReactEcharts
      style={{ width: "100%", height: "100%" }}
      option={{
        tooltip: {
          trigger: "item",
          showDelay: 0,
          transitionDuration: 0.2,
          formatter: (params: any) =>
            `${params.data.name}<br/>${
              Object.keys(EParteiName)[params.data.value]
            }`
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
            name: props.showStimmkreise ? "Stimmkreise" : "Regierungsbezirke",
            type: "map",
            roam: true,
            map: props.showStimmkreise ? "Stimmkreise" : "Regierungsbezirke",
            itemStyle: {
              emphasis: { label: { show: true } }
            },
            data: props.showStimmkreise
              ? stimmkreis_data
              : regierungsbezirk_data
          }
        ]
      }}
    />
  </StatistikWidget>
);
