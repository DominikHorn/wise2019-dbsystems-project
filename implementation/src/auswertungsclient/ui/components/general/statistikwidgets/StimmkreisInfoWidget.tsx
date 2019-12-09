import * as React from "react";
import {
  IGetAllWahlenQueryHocProps,
  withAllWahlenQuery
} from "../../../../../client-graphql/public/getAllWahlenQuery";
import { IStatistikWidgetProps, StatistikWidget } from "../StatistikWidget";
import { IWahl } from "../../../../../shared/sharedTypes";
import { compose } from "react-apollo";
import { WahlSelector } from "../dataselectors/WahlSelector";
import { WahlbeteiligungChart } from "./WahlbeteiligungChart";
import { renderInfo } from "../../../../../wahlclient/ui/guiUtil";

export interface IStimmkreisInfoWidgetProps extends IStatistikWidgetProps {}

interface IProps
  extends IStimmkreisInfoWidgetProps,
    IGetAllWahlenQueryHocProps {}

interface IState {
  readonly selectedWahl?: IWahl;
}

class StimmkreisInfoWidgetComponent extends React.PureComponent<
  IProps,
  IState
> {
  constructor(props: IProps) {
    super(props);
    this.state = {};
  }

  private onSelectWahl = (selectedWahl: IWahl) =>
    this.setState({ selectedWahl });

  render() {
    const { allWahlenData } = this.props;
    const { selectedWahl } = this.state;

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
          <WahlbeteiligungChart wahl={selectedWahl} />
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
