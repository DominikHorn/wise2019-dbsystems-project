import * as React from "react";
import {
  IGetAllWahlenQueryHocProps,
  withAllWahlenQuery
} from "../../../../../client-graphql/public/getAllWahlenQuery";
import { IStatistikWidgetProps, StatistikWidget } from "../StatistikWidget";
import { Wahl, Stimmkreis } from "../../../../../shared/graphql.types";
import { compose } from "react-apollo";
import { WahlSelector } from "../dataselectors/WahlSelector";
import { WahlbeteiligungChart } from "./WahlbeteiligungChart";
import { renderInfo } from "../../../../../wahlclient/ui/guiUtil";
import { Row, Col } from "antd";
import { renderCenteredLoading } from "../../../guiUtil";
import { StimmentwicklungChart } from "./StimmentwicklungChart";
import { StimmkreisCharts } from "./StimmkreisChartsComponent";

interface IState {
  readonly selectedWahl?: Wahl;
  readonly selectedStimmkreis?: Stimmkreis;
  readonly wahlbeteiligung?: number;
}

export interface IStimmkreisInfoWidgetProps
  extends IStatistikWidgetProps<IState> {}

interface IProps
  extends IStimmkreisInfoWidgetProps,
    IGetAllWahlenQueryHocProps {}

class StimmkreisInfoWidgetComponent extends React.PureComponent<
  IProps,
  IState
> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      selectedStimmkreis: null
    };
  }

  private onSelectWahl = (selectedWahl: Wahl) =>
    this.props.setRoutableState
      ? this.props.setRoutableState({ selectedWahl })
      : this.setState({ selectedWahl });

  render() {
    if (this.state.selectedStimmkreis) {
      console.log(this.state.selectedStimmkreis.name);
    }
    const { allWahlenData, routableState } = this.props;
    let selectedWahl: Wahl = null;
    if (routableState) {
      selectedWahl = routableState.selectedWahl;
    } else {
      selectedWahl = this.state.selectedWahl;
    }

    const previousWahl =
      selectedWahl &&
      (allWahlenData.allWahlen || [])
        .sort((w1, w2) =>
          w1.wahldatum < w2.wahldatum ? -1 : w1.wahldatum > w2.wahldatum ? 1 : 0
        )
        .find(w => new Date(w.wahldatum) < new Date(selectedWahl.wahldatum));

    return (
      <StatistikWidget
        {...this.props}
        title={
          <>
            <span style={{ float: "left" }}>{"Wahlbeteiligung:"}</span>
            <span
              style={{
                display: "block",
                overflow: "hidden",
                paddingRight: "10px",
                paddingLeft: "10px"
              }}
            >
              <WahlSelector
                displayLoading={allWahlenData.loading}
                selectedWahl={selectedWahl}
                selectableWahlen={allWahlenData.allWahlen}
                onSelectWahl={this.onSelectWahl}
                selectDefaultWahl={true}
                style={{ width: "100%" }}
                size={"small"}
              />
            </span>
          </>
        }
      >
        {selectedWahl ? (
          <Row type={"flex"} style={{ height: "100%", width: "100%" }}>
            <Col span={8} style={{ height: "100%" }}>
              <WahlbeteiligungChart
                wahl={selectedWahl}
                onStimmkreisSelect={(
                  selected: Stimmkreis,
                  wahlbeteiligung: number
                ) =>
                  this.setState({
                    selectedStimmkreis: selected,
                    wahlbeteiligung: wahlbeteiligung
                  })
                }
              />
            </Col>
            <Col span={15} style={{ height: "100%" }}>
              {this.state.selectedStimmkreis &&
              previousWahl &&
              this.state.wahlbeteiligung ? (
                <StimmkreisCharts
                  wahl={selectedWahl}
                  vglWahl={previousWahl}
                  stimmkreis={this.state.selectedStimmkreis}
                  wahlbeteiligung={this.state.wahlbeteiligung}
                />
              ) : (
                renderInfo("Bitte einen Stimmkreis anklicken")
              )}
            </Col>
          </Row>
        ) : (
          renderInfo("Bitte eine Wahl auswählen")
        )}
      </StatistikWidget>
    );
  }
}

const StimmkreisInfoWidgetWithQueries = compose(
  withAllWahlenQuery<IStimmkreisInfoWidgetProps>()
)(StimmkreisInfoWidgetComponent);

export const StimmkreisInfoWidget = StimmkreisInfoWidgetWithQueries as React.ComponentType<
  IStimmkreisInfoWidgetProps
>;
