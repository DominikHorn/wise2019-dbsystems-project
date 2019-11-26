import * as React from "react";
import { Icon, Row, Col, Button } from "antd";
import { StatistikWidget } from "../StatistikWidget";

export interface IAddWidgetWidgetProps {}

export const AddWidgetWidget = (props: IAddWidgetWidgetProps) => (
  <StatistikWidget>
    <Button
      icon={"plus"}
      type={"dashed"}
      style={{ margin: "1px", width: "100%", height: "100%", fontSize: 25 }}
    >
      Widget Hinzufügen
    </Button>
  </StatistikWidget>
);
