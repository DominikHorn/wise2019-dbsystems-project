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

const ResponsiveGridLayout = WidthProvider(Responsive);

export interface IStatistikPageProps {
  routeProps: RouteComponentProps<any>;
}

interface IProps extends IStatistikPageProps {}

interface IState {
  readonly layouts: Layout[];
  readonly availableWidth: number;
}

class StatistikPageComponent extends React.PureComponent<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      layouts: [
        { i: "1", x: 0, y: 0, w: 6, h: 8, minW: 4, minH: 8 },
        { i: "2", x: 6, y: 0, w: 6, h: 8, minW: 4, minH: 8 }
      ],
      availableWidth: window.innerWidth - 80
    };
  }

  private updateDimensions = () =>
    this.setState({ availableWidth: window.innerWidth - 80 });

  componentDidMount() {
    window.addEventListener("resize", this.updateDimensions);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateDimensions);
  }

  render() {
    const { layouts, availableWidth } = this.state;
    const cols = 12;
    return (
      <GridLayout
        className={"layout"}
        layout={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={cols}
        rowHeight={50}
        width={availableWidth}
        isResizable={true}
      >
        <div key={"1"}>
          <SitzverteilungsWidget />
        </div>
        <div key={"2"}>
          <SitzverteilungsWidget />
        </div>
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
