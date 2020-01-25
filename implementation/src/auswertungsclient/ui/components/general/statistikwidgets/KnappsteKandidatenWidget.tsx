import * as React from "react";
import { IStatistikWidgetProps, StatistikWidget } from "../StatistikWidget";
import { Wahl } from "../../../../../shared/graphql.types";
import {
  IGetAllWahlenQueryHocProps,
  withAllWahlenQuery
} from "../../../../../client-graphql/public/getAllWahlenQuery";
import { compose } from "react-apollo";
import { renderInfo } from "../../../../../wahlclient/ui/guiUtil";
import { KnappsteKandidatenChart } from "./KnappsteKandidatenChart";
import { WahlSelector } from "../dataselectors/WahlSelector";

interface IState {
  readonly selectedWahl?: Wahl;
}
export interface IKnappsteKandidatenWidgetProps
  extends IStatistikWidgetProps<IState> {}

interface IProps
  extends IKnappsteKandidatenWidgetProps,
    IGetAllWahlenQueryHocProps {}

class KnappsteKandidatenWidgetComponent extends React.PureComponent<
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
    let selectedWahl = null;
    if (routableState) {
      selectedWahl = routableState.selectedWahl;
    } else {
      selectedWahl = this.state.selectedWahl;
    }

    return (
      <StatistikWidget
        {...this.props}
        title={
          <>
            <span style={{ float: "left" }}>{"Landtagswahl:"}</span>
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
          <KnappsteKandidatenChart wahl={selectedWahl} />
        ) : (
          renderInfo("Bitte eine Wahl auswählen")
        )}
      </StatistikWidget>
    );
  }
}

const KnappsteKandidatenWidgetWithQueries = compose(
  withAllWahlenQuery<IKnappsteKandidatenWidgetProps>()
)(KnappsteKandidatenWidgetComponent);

export const KnappsteKandidatenWidget = KnappsteKandidatenWidgetWithQueries as React.ComponentType<
  IKnappsteKandidatenWidgetProps
>;
