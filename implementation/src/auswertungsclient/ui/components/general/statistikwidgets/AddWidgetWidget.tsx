import { Button } from "antd";
import * as React from "react";
import { StatistikWidget } from "../StatistikWidget";

export interface IAddWidgetWidgetProps {
  onWidgetAdd: () => void;
}

export const AddWidgetWidget = (props: IAddWidgetWidgetProps) => (
  <StatistikWidget>
    <Button
      icon={"plus"}
      type={"dashed"}
      style={{ margin: "0px", width: "100%", height: "100%", fontSize: 25 }}
      onClick={props.onWidgetAdd}
    >
      Widget Hinzufügen
    </Button>
  </StatistikWidget>
);
