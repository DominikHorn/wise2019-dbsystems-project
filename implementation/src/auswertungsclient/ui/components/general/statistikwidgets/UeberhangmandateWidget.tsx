import * as React from "react";
import { compose } from "react-apollo";
import {
  IGetAllWahlenQueryHocProps,
  withAllWahlenQuery
} from "../../../../../client-graphql/public/getAllWahlenQuery";
import { Wahl } from "../../../../../shared/graphql.types";
import { renderInfo } from "../../../guiUtil";
import { WahlSelector } from "../dataselectors/WahlSelector";
import { IStatistikWidgetProps, StatistikWidget } from "../StatistikWidget";
import { UeberhangMandatChart } from "./UeberhangmandatChart";

interface IState {
  readonly selectedWahl?: Wahl;
}

export interface IUeberhangmandateWidgetProps
  extends IStatistikWidgetProps<IState> {}

interface IProps
  extends IUeberhangmandateWidgetProps,
    IGetAllWahlenQueryHocProps {}

class UeberhangmandateWidgetComponent extends React.PureComponent<
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
            <span style={{ float: "left" }}>{"Überhangmandate:"}</span>
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
          <UeberhangMandatChart wahl={selectedWahl} />
        ) : (
          renderInfo("Bitte eine Wahl auswählen")
        )}
      </StatistikWidget>
    );
  }
}

const UeberhangmandateWidgetWithQueries = compose(
  withAllWahlenQuery<IUeberhangmandateWidgetProps>()
)(UeberhangmandateWidgetComponent);

export const UeberhangmandateWidget = UeberhangmandateWidgetWithQueries as React.ComponentType<
  IUeberhangmandateWidgetProps
>;
