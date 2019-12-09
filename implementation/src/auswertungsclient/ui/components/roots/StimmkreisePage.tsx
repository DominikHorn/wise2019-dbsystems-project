import { Card, Col, Row } from "antd";
import * as React from "react";
import { compose } from "react-apollo";
import { Layout } from "react-grid-layout";
import { RouteComponentProps } from "react-router";
import {
  IGetAllWahlenQueryHocProps,
  withAllWahlenQuery
} from "../../../../client-graphql/public/getAllWahlenQuery";
import { IWahl } from "../../../../shared/sharedTypes";
import { renderInfo } from "../../guiUtil";
import { withErrorBoundary } from "../general/ErrorBoundary";
import { WidgetType } from "../general/statistikwidgets/WidgetTypes";
import { WahlSelector } from "../general/dataselectors/WahlSelector";

type StatistikWidgetSettings = {
  layout: Layout;
  type: WidgetType;
};

export interface IStimmkreisePageProps {
  routeProps: RouteComponentProps<any>;
}

const COLUMN_COUNT = 12;
const WIDGET_DIMENSIONS = {
  w: 4,
  h: 6,
  minW: 4,
  minH: 6
};

interface IState {
  ausgewaehlteWahl?: IWahl;
  readonly widgetSettings: StatistikWidgetSettings[];
  readonly availableWidth: number;
}

interface IProps extends IStimmkreisePageProps, IGetAllWahlenQueryHocProps {}

class StimmkreisePageComponent extends React.PureComponent<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      widgetSettings: [
        {
          type: WidgetType.ADD,
          layout: {
            i: "add",
            x: 0,
            y: 0,
            ...WIDGET_DIMENSIONS
          }
        }
      ],
      availableWidth: window.innerWidth - 80
    };
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
            {"Stimmkreisübersicht für die Landtagswahl: "}
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
          <div>
            <Row>
              <Col span={8}>col-8</Col>
              <Col span={8}>col-8</Col>
              <Col span={8}>col-8</Col>
            </Row>
            <Row>
              <Col span={8}>col-8</Col>
              <Col span={8}>col-8</Col>
              <Col span={8}>col-8</Col>
            </Row>
          </div>
        ) : (
          renderInfo("Bitte eine Landtagswahl auswählen")
        )}
      </Card>
    );
  }
}

const StimmkreisePageComponentWithQueries = compose(withAllWahlenQuery())(
  StimmkreisePageComponent
);

const StimmkreisePageWithErrorBoundary = withErrorBoundary<
  IStimmkreisePageProps
>(StimmkreisePageComponentWithQueries);

export const StimmkreisePage = StimmkreisePageWithErrorBoundary as React.ComponentType<
  IStimmkreisePageProps
>;
