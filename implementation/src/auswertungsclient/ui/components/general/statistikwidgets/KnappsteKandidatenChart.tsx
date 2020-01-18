import * as React from "react";
import "echarts-gl";
import ReactEcharts from "echarts-for-react";
import {
  IGetKnappsteKandidatenQueryHocProps,
  withKnappsteKandidatenQuery
} from "../../../../../client-graphql/public/getKnappsteKandidatenQuery";
import { compose } from "react-apollo";
import { eatEvent, getParteiColor } from "../../../guiUtil";
import { renderCenteredLoading } from "../../../../../wahlclient/ui/guiUtil";
import { sleep } from "../../../../../shared/util";
import {
  KnapperKandidat,
  Kandidat,
  Wahl
} from "../../../../../shared/graphql.types";

type ChartDataType = {
  name: string;
  value: [string, number, number];
  kandidat: Kandidat;
  differenz: number;
  gewinner: boolean;
  itemStyle?: any;
};
function getOption(knappsteKandidaten: KnapperKandidat[]) {
  const partyMap: { [id: number]: string } = {};
  const place = [];
  for (let i = 1; i <= AMOUNT_PER_PARTY; i++) {
    place.push(`${i}. Platz`);
  }
  let max = 0;
  const data = knappsteKandidaten
    .map(knappeKandidat => {
      if (max < knappeKandidat.differenz) {
        max = knappeKandidat.differenz;
      }

      partyMap[knappeKandidat.kandidat.partei.id] =
        knappeKandidat.kandidat.partei.name;

      const chartData: ChartDataType = {
        name: knappeKandidat.kandidat.name,
        itemStyle: {
          color: getParteiColor(knappeKandidat.kandidat.partei.name)
          // opacity: 0.9
        },
        kandidat: knappeKandidat.kandidat,
        differenz: knappeKandidat.differenz,
        gewinner: knappeKandidat.gewinner,
        value: [
          knappeKandidat.kandidat.partei.name,
          knappeKandidat.platz,
          knappeKandidat.differenz
        ]
      };
      return chartData;
    })
    .map((val: ChartDataType) => ({
      ...val,
      value: [val.value[0], val.value[1], (max - val.value[2]) / max]
    }));
  const parties = Object.keys(partyMap)
    .map(key => Number(key))
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
    .map(key => partyMap[key]);

  return {
    toolbox: {
      feature: { saveAsImage: { title: "Als Bild speichern" } }
    },
    tooltip: {
      textStyle: {
        fontSize: 16
      },
      formatter: (params: any) =>
        `${params.value[1]}. Knappe(r) ${
          params.data.gewinner ? "GewinnerIn" : "VerliererIn"
        }:<br/>
        ${params.data.kandidat.name} (${params.value[0]})<br/>
        Differenz zu ${
          params.data.gewinner ? "Zweitbeste(m/r)" : "GewinnerIn"
        }: ${params.data.differenz}`
    },
    xAxis3D: {
      type: "category",
      data: parties,
      axisLabel: {
        interval: 1
      }
    },
    yAxis3D: {
      type: "category",
      data: place
    },
    zAxis3D: {
      type: "value",
      show: false
    },
    grid3D: {
      boxWidth: 200,
      boxDepth: 80,
      viewControl: {},
      postEffect: {
        enable: true,
        SSAO: {
          enable: true,
          radius: 5
        }
      },
      light: {
        main: {
          intensity: 3,
          shadow: true,
          alpha: 25,
          beta: 210
        },
        ambient: {
          intensity: 1
        }
      }
    },
    series: [
      {
        name: "Knappe(r) KandidatIn",
        type: "bar3D",
        data: data,
        bevelSize: 0.4,
        bevelSmoothness: 4,
        shading: "realistic",
        realisticMaterial: {
          roughness: 0.3,
          metalness: 0.7
        },
        emphasis: {
          label: {
            show: false
          }
        }
      }
    ]
  };
}

const AMOUNT_PER_PARTY = 10;

export interface IKnappsteKandidatenChartProps {
  readonly wahl: Wahl;
}

interface IProps
  extends IKnappsteKandidatenChartProps,
    IGetKnappsteKandidatenQueryHocProps {}

class KnappsteKandidatenChartComponent extends React.PureComponent<IProps> {
  componentWillReceiveProps(newProps: IProps) {
    if (
      this.props.knappsteKandidatenData.knappsteKandidaten !==
      newProps.knappsteKandidatenData.knappsteKandidaten
    ) {
      this.updateChartData(newProps);
    }
  }

  private updateChartData = (props: IProps) => {
    if (!this.chart) return;
    if (
      !props.knappsteKandidatenData ||
      !props.knappsteKandidatenData.knappsteKandidaten
    )
      return;

    const chartOption = getOption(
      props.knappsteKandidatenData.knappsteKandidaten || []
    );
    sleep(100).then(() => {
      // this.chart.clear();
      this.chart.setOption(chartOption);
    });
  };

  private chart: any = null;
  render() {
    const { knappsteKandidatenData } = this.props;
    return (
      <div style={{ width: "100%", height: "100%" }} onMouseDown={eatEvent}>
        <ReactEcharts
          style={{ width: "100%", height: "100%" }}
          onChartReady={chart => {
            this.chart = chart;
            this.updateChartData(this.props);
          }}
          option={{}}
        />
        {knappsteKandidatenData.loading && renderCenteredLoading()}
      </div>
    );
  }
}

const KnappsteKandidatenChartWithQueries = compose(
  withKnappsteKandidatenQuery<IKnappsteKandidatenChartProps>(
    props => props.wahl.id,
    () => AMOUNT_PER_PARTY
  )
)(KnappsteKandidatenChartComponent);

export const KnappsteKandidatenChart = KnappsteKandidatenChartWithQueries as React.ComponentType<
  IKnappsteKandidatenChartProps
>;
