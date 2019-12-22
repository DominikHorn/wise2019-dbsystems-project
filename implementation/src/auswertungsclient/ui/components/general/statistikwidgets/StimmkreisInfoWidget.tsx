import * as React from "react";
import {
  IGetAllWahlenQueryHocProps,
  withAllWahlenQuery
} from "../../../../../client-graphql/public/getAllWahlenQuery";
import { IStatistikWidgetProps, StatistikWidget } from "../StatistikWidget";
import { Wahl } from "../../../../../shared/graphql.types";
import { compose } from "react-apollo";
import { WahlSelector } from "../dataselectors/WahlSelector";
import { WahlbeteiligungChart } from "./WahlbeteiligungChart";
import { StimmenanteilChart } from "./StimmanzahlChart";
import { renderInfo } from "../../../../../wahlclient/ui/guiUtil";
import { Row, Col } from "antd";
import { StimmentwicklungChart } from "./StimmentwicklungChart";
import { renderCenteredLoading } from "../../../guiUtil";

interface IState {
  readonly selectedWahl?: Wahl;
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
    this.state = {};
  }

  private onSelectWahl = (selectedWahl: Wahl) =>
    this.props.setRoutableState
      ? this.props.setRoutableState({ selectedWahl })
      : this.setState({ selectedWahl });

  render() {
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
          <Row
            type={"flex"}
            gutter={16}
            style={{ height: "100%", width: "100%" }}
          >
            <Col span={10}>
              <WahlbeteiligungChart wahl={selectedWahl} />
            </Col>
            <Col>
              Stimmkreis: Fürstenfeldbruck Ost
              <br />
              Wahlbeteiligung: 78 %
              <br />
              Gewinner: Hans
              <br />
              {previousWahl ? (
                <StimmentwicklungChart
                  wahl={selectedWahl}
                  vglwahl={previousWahl}
                  stimmkreis={{ id: 101, name: "test" }}
                />
              ) : (
                renderCenteredLoading()
              )}
              <br />
              <StimmenanteilChart
                wahl={selectedWahl}
                stimmkreis={{ id: 101, name: "test" }}
                einzelstimmen={false}
              />
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
