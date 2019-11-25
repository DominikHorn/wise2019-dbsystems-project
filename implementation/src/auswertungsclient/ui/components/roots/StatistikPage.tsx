import { Card, Row, Button, Col, notification, message } from "antd";
import * as React from "react";
import { RouteComponentProps } from "react-router";

export interface IStatistikPageProps {
  routeProps: RouteComponentProps<any>;
}

export const StatistikPage = (props: IStatistikPageProps) => (
  <div style={{ textAlign: "justify" }}>
    {"Hier könnte Ihre Werbung stehen"}
  </div>
);
