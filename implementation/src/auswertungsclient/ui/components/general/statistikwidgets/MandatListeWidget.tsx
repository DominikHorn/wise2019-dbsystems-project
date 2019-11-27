import * as React from "react";
import { IWahl } from "../../../../../shared/sharedTypes";
import { compose } from "react-apollo";
import {
  IGetAllWahlenQueryHocProps,
  withAllWahlenQuery
} from "../../../../../client-graphql/public/getAllWahlenQuery";
import { IStatistikWidgetProps, StatistikWidget } from "../StatistikWidget";
import { WahlSelector } from "../WahlSelector";
import { MandatListe } from "../MandatListe";
import { renderInfo } from "../../../../../wahlclient/ui/guiUtil";

export interface IMandatListeWidgetProps extends IStatistikWidgetProps {}

interface IProps extends IMandatListeWidgetProps, IGetAllWahlenQueryHocProps {}

interface IState {
  readonly selectedWahl?: IWahl;
}

class MandatListeWidgetComponent extends React.PureComponent<IProps, IState> {
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
