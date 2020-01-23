import * as React from "react";
import { compose } from "react-apollo";
import {
  IGetAllWahlenQueryHocProps,
  withAllWahlenQuery
} from "../../../../../client-graphql/public/getAllWahlenQuery";
import { Stimmkreis, Wahl } from "../../../../../shared/graphql.types";
import { renderInfo } from "../../../guiUtil";
import { WahlSelector } from "../dataselectors/WahlSelector";
import { IStatistikWidgetProps, StatistikWidget } from "../StatistikWidget";
import { InnerStimmkreisInfoQ7 } from "./InnerStimmkreisInfoQ7";

interface IState {
  readonly selectedWahl?: Wahl;
  readonly selectedStimmkreis1?: Stimmkreis;
  readonly selectedStimmkreis2?: Stimmkreis;
  readonly selectedStimmkreis3?: Stimmkreis;
  readonly selectedStimmkreis4?: Stimmkreis;
  readonly selectedStimmkreis5?: Stimmkreis;
}

export interface StimmkreisInfoQ7WidgetProps
  extends IStatistikWidgetProps<IState> {}

interface IProps
  extends StimmkreisInfoQ7WidgetProps,
    IGetAllWahlenQueryHocProps {}

class StimmkreisInfoQ7WidgetComponent extends React.PureComponent<
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
    let selectedWahl: IWahl = null;
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
        {selectedWahl && previousWahl ? (
          <InnerStimmkreisInfoQ7
            wahl={selectedWahl}
            previousWahl={previousWahl}
          />
        ) : (
          renderInfo("Bitte eine Wahl auswählen")
        )}
      </StatistikWidget>
    );
  }
}

const StimmkreisInfoQ7WidgetWithQueries = compose(
  withAllWahlenQuery<StimmkreisInfoQ7WidgetProps>()
)(StimmkreisInfoQ7WidgetComponent);

export const StimmkreisInfoQ7Widget = StimmkreisInfoQ7WidgetWithQueries as React.ComponentType<
  StimmkreisInfoQ7WidgetProps
>;
