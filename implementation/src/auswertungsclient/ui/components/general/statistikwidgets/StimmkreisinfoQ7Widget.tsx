import { IWahl, IStimmkreis } from "../../../../../shared/sharedTypes";
import { IStatistikWidgetProps, StatistikWidget } from "../StatistikWidget";
import {
  IGetAllWahlenQueryHocProps,
  withAllWahlenQuery
} from "../../../../../client-graphql/public/getAllWahlenQuery";
import * as React from "react";
import { renderInfo } from "../../../guiUtil";
import { WahlSelector } from "../dataselectors/WahlSelector";
import { compose } from "react-apollo";

interface IState {
  readonly selectedWahl?: IWahl;
  readonly selectedStimmkreis1?: IStimmkreis;
  readonly selectedStimmkreis2?: IStimmkreis;
  readonly selectedStimmkreis3?: IStimmkreis;
  readonly selectedStimmkreis4?: IStimmkreis;
  readonly selectedStimmkreis5?: IStimmkreis;
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
  private onSelectWahl = (selectedWahl: IWahl) =>
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
          <div>Hier könnte Ihre Werbung stehen</div>
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
