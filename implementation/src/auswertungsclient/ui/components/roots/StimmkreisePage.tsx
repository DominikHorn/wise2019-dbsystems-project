import { Card } from "antd";
import * as React from "react";
import * as GridLayout from "react-grid-layout";
import { Layout } from "react-grid-layout";
import { RouteComponentProps } from "react-router";
import { WahlSelector } from "../general/WahlSelector";
import { compose } from "react-apollo";
import {
  IGetAllWahlenQueryHocProps,
  withAllWahlenQuery
} from "../../../../client-graphql/public/getAllWahlenQuery";
import { withErrorBoundary } from "../general/ErrorBoundary";
import { IWahl } from "../../../../shared/sharedTypes";
import { renderInfo } from "../../guiUtil";
import { MandatListe } from "../general/MandatListe";
import { WidgetType } from "../general/statistikwidgets/WidgetTypes";
import { RegierungsbezirkWidget } from "../general/statistikwidgets/RegierungsbezirkWidget";

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

  private updateDimensions = () =>
    this.setState({ availableWidth: window.innerWidth - 80 });

  private onWidgetRemove = (removedI: string) =>
    this.setState({
      widgetSettings: this.state.widgetSettings.filter(
        setting => setting.layout.i !== removedI
      )
    });

  private onLayoutChange = (layouts: Layout[]) =>
    this.setState({
      widgetSettings: this.state.widgetSettings.map((setting, index) => ({
        ...setting,
        layout: layouts[index]
      }))
    });

  componentDidMount() {
    window.addEventListener("resize", this.updateDimensions);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateDimensions);
  }

  private renderPageLayout = (setting: StatistikWidgetSettings) => {
    const { availableWidth, widgetSettings } = this.state;

    return (
      <GridLayout
        className={"layout"}
        layout={widgetSettings.map(setting => setting.layout)}
        cols={COLUMN_COUNT}
        rowHeight={50}
        width={availableWidth}
        isResizable={true}
        onLayoutChange={this.onLayoutChange}
        compactType={"vertical"}
        margin={[5, 5]}
      >
        <RegierungsbezirkWidget
          //removeWidget={removeWidget}
          showStimmkreise={true}
        />
      </GridLayout>
    );
  };

  render() {
    const { allWahlenData } = this.props;
    const { ausgewaehlteWahl } = this.state;
    const { availableWidth, widgetSettings } = this.state;

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
        {ausgewaehlteWahl
          ? widgetSettings.map(setting => this.renderPageLayout(setting))
          : renderInfo("Bitte eine Landtagswahl auswählen")}
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
