import * as React from "react";
import { Wahl } from "../../../../../shared/graphql.types";
import { compose } from "react-apollo";
import {
  IGetAllWahlenQueryHocProps,
  withAllWahlenQuery
} from "../../../../../client-graphql/public/getAllWahlenQuery";
import { IStatistikWidgetProps, StatistikWidget } from "../StatistikWidget";
import { WahlSelector } from "../dataselectors/WahlSelector";
import { MandatListe } from "../MandatListe";
import { renderInfo } from "../../../../../wahlclient/ui/guiUtil";

interface IState {
  readonly selectedWahl?: Wahl;
}

export interface IMandatListeWidgetProps
  extends IStatistikWidgetProps<IState> {}

interface IProps extends IMandatListeWidgetProps, IGetAllWahlenQueryHocProps {}
class MandatListeWidgetComponent extends React.PureComponent<IProps, IState> {
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
          <MandatListe
            wahl={selectedWahl}
            tableProps={{
              scroll: {},
              style: { overflowY: "scroll", height: "100%" },
              size: "small"
            }}
            omitIdColumn={true}
          />
        ) : (
          renderInfo("Bitte eine Wahl auswählen")
        )}
      </StatistikWidget>
    );
  }
}

const MandatListeWidgetWithQueries = compose(
  withAllWahlenQuery<IMandatListeWidgetProps>()
)(MandatListeWidgetComponent);

export const MandatListeWidget = MandatListeWidgetWithQueries as React.ComponentType<
  IMandatListeWidgetProps
>;
