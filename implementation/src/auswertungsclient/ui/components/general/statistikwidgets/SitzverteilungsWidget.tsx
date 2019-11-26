import * as React from "react";
import { compose } from "react-apollo";
import {
  IGetAllWahlenQueryHocProps,
  withAllWahlenQuery
} from "../../../../../client-graphql/public/getAllWahlenQuery";
import { IGetMandateQueryHocProps } from "../../../../../client-graphql/public/getMandateQuery";
import { IWahl } from "../../../../../shared/sharedTypes";
import { renderInfo } from "../../../../../wahlclient/ui/guiUtil";
import { StatistikWidget } from "../StatistikWidget";
import { WahlSelector } from "../WahlSelector";
import { SitzverteilungsChart } from "./SitzverteilungsChart";

export interface ISitzverteilungsWidgetProps {}

interface IProps
  extends ISitzverteilungsWidgetProps,
    IGetAllWahlenQueryHocProps,
    IGetMandateQueryHocProps {}

interface IState {
  selectedWahl?: IWahl;
}

class SitzverteilungsWidgetComponent extends React.PureComponent<
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
    const { selectedWahl } = this.state;
    const { allWahlenData } = this.props;
    return (
      <StatistikWidget
        title={
          <>
            {"Landtagswahl: "}
            <WahlSelector
              displayLoading={allWahlenData.loading}
              selectedWahl={selectedWahl}
              selectableWahlen={allWahlenData.allWahlen}
              onSelectWahl={this.onSelectWahl}
            />
          </>
        }
      >
        {selectedWahl ? (
          <SitzverteilungsChart wahl={selectedWahl} />
        ) : (
          renderInfo("Bitte eine Wahl auswählen")
        )}
      </StatistikWidget>
    );
  }
}

const SitzverteilungsWidgetWithQueries = compose(
  withAllWahlenQuery<ISitzverteilungsWidgetProps>()
)(SitzverteilungsWidgetComponent);

export const SitzverteilungsWidget = SitzverteilungsWidgetWithQueries as React.ComponentType<
  ISitzverteilungsWidgetProps
>;
