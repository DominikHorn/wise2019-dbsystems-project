import * as React from "react";
import * as GridLayout from "react-grid-layout";
import { Layout } from "react-grid-layout";
import { RouteComponentProps } from "react-router";
import { withErrorBoundary } from "../general/ErrorBoundary";
import { AddWidgetWidget } from "../general/statistikwidgets/AddWidgetWidget";
import { SitzverteilungsWidget } from "../general/statistikwidgets/SitzverteilungsWidget";
import { renderError } from "../../../../wahlclient/ui/guiUtil";

type StatistikWidgetSettings = {
  layout: Layout;
  type: WidgetType;
};

export interface IStatistikPageProps {
  routeProps: RouteComponentProps<any>;
}

interface IProps extends IStatistikPageProps {}

interface IState {
  readonly widgetSettings: StatistikWidgetSettings[];
  readonly addCnt: number;
  readonly availableWidth: number;
}

enum WidgetType {
  ADD,
  SITZVERTEILUNG_PIECHART
}

const COLUMN_COUNT = 12;
const WIDGET_DIMENSIONS = {
  w: 4,
  h: 4,
  minW: 4,
  minH: 4
};
class StatistikPageComponent extends React.PureComponent<IProps, IState> {
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
      addCnt: 0,
      availableWidth: window.innerWidth - 80
    };
  }

  private updateDimensions = () =>
    this.setState({ availableWidth: window.innerWidth - 80 });

  private onWidgetAdd = () =>
    this.setState({
      widgetSettings: this.state.widgetSettings.concat([
        {
          type: WidgetType.SITZVERTEILUNG_PIECHART,
          layout: {
            i: `${this.state.addCnt}`,
            x:
              WIDGET_DIMENSIONS.minW *
              (this.state.widgetSettings.length %
                (COLUMN_COUNT / WIDGET_DIMENSIONS.minW)),
            // Puts it at the bottom
            y: Infinity,
            ...WIDGET_DIMENSIONS
          }
        }
      ]),
      addCnt: this.state.addCnt + 1
    });

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

  private renderWidget = (setting: StatistikWidgetSettings) => (
    <div key={setting.layout.i}>
      {setting.type === WidgetType.ADD ? (
        <AddWidgetWidget onWidgetAdd={this.onWidgetAdd} />
      ) : setting.type === WidgetType.SITZVERTEILUNG_PIECHART ? (
        <SitzverteilungsWidget
          removeWidget={() => this.onWidgetRemove(setting.layout.i)}
        />
      ) : (
        renderError("Unkown Widget type")
      )}
    </div>
  );

  render() {
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
      >
        {widgetSettings.map(setting => this.renderWidget(setting))}
      </GridLayout>
    );
  }
}

const StatistikPageWithErrorBoundaries = withErrorBoundary<IStatistikPageProps>(
  StatistikPageComponent
);

export const StatistikPage = StatistikPageWithErrorBoundaries as React.ComponentType<
  IStatistikPageProps
>;
