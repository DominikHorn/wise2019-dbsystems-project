import * as React from "react";
import { RouteComponentProps } from "react-router";
import { withErrorBoundary } from "../general/ErrorBoundary";
import { SitzverteilungsWidget } from "../general/statistikwidgets/SitzverteilungsWidget";
import GridLayout, {
  Responsive,
  WidthProvider,
  Layout
} from "react-grid-layout";
import { Card } from "antd";
import { AddWidgetWidget } from "../general/statistikwidgets/AddWidgetWidget";

const ResponsiveGridLayout = WidthProvider(Responsive);

export interface IStatistikPageProps {
  routeProps: RouteComponentProps<any>;
}

interface IProps extends IStatistikPageProps {}

interface IState {
  readonly addWidgetLayout: Layout;
  readonly layouts: Layout[];
  readonly availableWidth: number;
}

class StatistikPageComponent extends React.PureComponent<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      addWidgetLayout: { i: "add", x: 0, y: 0, w: 6, h: 6, minW: 4, minH: 4 },
      layouts: [],
      availableWidth: window.innerWidth - 80
    };
  }

  private updateDimensions = () =>
    this.setState({ availableWidth: window.innerWidth - 80 });

  private onWidgetAdd = () =>
    this.setState({
      layouts: this.state.layouts.concat([
        {
          i: `${this.state.layouts.length}`,
          x: 6 * ((this.state.layouts.length + 1) % 2),
          y: 6 * (this.state.layouts.length / 2),
          w: 6,
          h: 6,
          minW: 4,
          minH: 6
        }
      ])
    });

  componentDidMount() {
    window.addEventListener("resize", this.updateDimensions);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateDimensions);
  }

  render() {
    const { layouts, addWidgetLayout, availableWidth } = this.state;
    const cols = 12;
    return (
      <GridLayout
        className={"layout"}
        layout={[addWidgetLayout].concat(layouts)}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={cols}
        rowHeight={50}
        width={availableWidth}
        isResizable={true}
      >
        <div key={"add"}>
          <AddWidgetWidget onWidgetAdd={this.onWidgetAdd} />
        </div>
        {layouts.map(layout => (
          <div key={layout.i}>
            <SitzverteilungsWidget />
          </div>
        ))}
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
