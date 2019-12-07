import { Card } from "antd";
import * as React from "react";
import { RouteComponentProps } from "react-router";
import { WahlSelector } from "../general/dataselectors/WahlSelector";
import { compose } from "react-apollo";
import {
  IGetAllWahlenQueryHocProps,
  withAllWahlenQuery
} from "../../../../client-graphql/public/getAllWahlenQuery";
import { withErrorBoundary } from "../general/ErrorBoundary";
import { IWahl } from "../../../../shared/sharedTypes";
import { renderInfo } from "../../guiUtil";
import { MandatListe } from "../general/MandatListe";

export interface IErgebnissePageProps {
  routeProps: RouteComponentProps<any>;
}

interface IProps extends IErgebnissePageProps, IGetAllWahlenQueryHocProps {}

interface IState {
  ausgewaehlteWahl?: IWahl;
}

class ErgebnissePageComponent extends React.PureComponent<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {};
  }

  private onSelectWahl = (wahl: IWahl) =>
    this.setState({
      ausgewaehlteWahl: wahl
    });

  render() {
    const { allWahlenData } = this.props;
    const { ausgewaehlteWahl } = this.state;

    return (
      <Card
        title={
          <>
            {"Ergebnisse der Landtagswahl: "}
            <WahlSelector
              selectableWahlen={allWahlenData.allWahlen}
              selectedWahl={ausgewaehlteWahl}
              onSelectWahl={this.onSelectWahl}
              displayLoading={allWahlenData.loading}
            />
          </>
        }
        style={{ minHeight: "100%" }}
        hoverable={true}
      >
        {ausgewaehlteWahl ? (
          <MandatListe wahl={ausgewaehlteWahl} />
        ) : (
          renderInfo("Bitte eine Landtagswahl auswählen")
        )}
      </Card>
    );
  }
}

const ErgebnissePageComponentWithQueries = compose(withAllWahlenQuery())(
  ErgebnissePageComponent
);

const ErgebnissePageWithErrorBoundary = withErrorBoundary<IErgebnissePageProps>(
  ErgebnissePageComponentWithQueries
);

export const ErgebnissePage = ErgebnissePageWithErrorBoundary as React.ComponentType<
  IErgebnissePageProps
>;
