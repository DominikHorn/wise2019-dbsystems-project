import * as React from "react";
import { compose } from "react-apollo";
import {
  withAllWahlenQuery,
  IGetAllWahlenQueryHocProps
} from "../../../../../client-graphql/public/getAllWahlenQuery";
import { IStatistikWidgetProps, StatistikWidget } from "../StatistikWidget";
import { WahlSelector } from "../dataselectors/WahlSelector";
import { GewinnerGeoChart } from "./GewinnerGeoChart";
import { renderInfo } from "../../../../../wahlclient/ui/guiUtil";
import { Wahl } from "../../../../../shared/graphql.types";

interface IState {
  readonly selectedWahl?: Wahl;
  readonly erststimmen: boolean;
}

export interface IGewinnerWidgetProps extends IStatistikWidgetProps<IState> {}

interface IProps extends IGewinnerWidgetProps, IGetAllWahlenQueryHocProps {}

class GewinnerWidgetComponent extends React.PureComponent<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      erststimmen: true
    };
  }

  private onSelectWahl = (selectedWahl: Wahl) =>
    this.props.setRoutableState
      ? this.props.setRoutableState({ selectedWahl })
      : this.setState({ selectedWahl });

  private onSelectErststimmen = (erststimmen: boolean) =>
    this.props.setRoutableState
      ? this.props.setRoutableState({ erststimmen })
      : this.setState({ erststimmen });

  render() {
    const { allWahlenData, routableState } = this.props;
    let selectedWahl,
      erststimmen = null;
    if (routableState) {
      selectedWahl = routableState.selectedWahl;
      erststimmen = routableState.erststimmen || true;
    } else {
      selectedWahl = this.state.selectedWahl;
      erststimmen = this.state.erststimmen;
    }

    return (
      <StatistikWidget
        {...this.props}
        title={
          <>
            <span style={{ float: "left" }}>{"Stimmkreisgewinner:"}</span>
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
          <GewinnerGeoChart
            erststimmen={erststimmen}
            onErststimmenChanged={this.onSelectErststimmen}
            wahl={selectedWahl}
          />
        ) : (
          renderInfo("Bitte eine Wahl auswählen")
        )}
      </StatistikWidget>
    );
  }
}

const GewinnerWidgetWithQueries = compose(
  withAllWahlenQuery<IGewinnerWidgetProps>()
)(GewinnerWidgetComponent);

export const GewinnerWidget = GewinnerWidgetWithQueries as React.ComponentType<
  IGewinnerWidgetProps
>;
