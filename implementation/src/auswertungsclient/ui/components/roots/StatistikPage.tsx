import * as React from "react";
import { RouteComponentProps } from "react-router";
import { withErrorBoundary } from "../general/ErrorBoundary";
import { SitzverteilungsWidget } from "../general/statistikwidgets/SitzverteilungsWidget";

export interface IStatistikPageProps {
  routeProps: RouteComponentProps<any>;
}

interface IProps extends IStatistikPageProps {}

// TODO: tmp, widget layout goes here
const StatistikPageComponent = (props: IProps) => (
  <>
    <SitzverteilungsWidget />
    <SitzverteilungsWidget />
  </>
);

const StatistikPageWithErrorBoundaries = withErrorBoundary<IStatistikPageProps>(
  StatistikPageComponent
);

export const StatistikPage = StatistikPageWithErrorBoundaries as React.ComponentType<
  IStatistikPageProps
>;
