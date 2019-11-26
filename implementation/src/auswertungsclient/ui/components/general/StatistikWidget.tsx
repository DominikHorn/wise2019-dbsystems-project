import * as React from "react";
import { Card } from "antd";
import { withErrorBoundary } from "./ErrorBoundary";
import { renderError } from "../../guiUtil";

export interface IStatistikWidgetProps {
  readonly title?: string | React.ReactNode;
  readonly children?: React.ReactNode;
}

interface IProps extends IStatistikWidgetProps {}

const StatistikWidgetComponent = (props: IProps) => (
  <Card title={props.title} style={{ margin: "5px" }}>
    {props.children}
  </Card>
);

const StatistikWidgetWithErrorBoundary = withErrorBoundary<
  IStatistikWidgetProps
>(StatistikWidgetComponent, error => <Card>{renderError(error.message)}</Card>);

export const StatistikWidget = StatistikWidgetWithErrorBoundary as React.ComponentType<
  IStatistikWidgetProps
>;
