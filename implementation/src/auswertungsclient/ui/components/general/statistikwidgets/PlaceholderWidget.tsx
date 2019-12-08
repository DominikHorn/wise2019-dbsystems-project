import * as React from "react";
import { StatistikWidget, IStatistikWidgetProps } from "../StatistikWidget";
import { Button } from "antd";
import "./PlaceholderWidget.css";

export interface IPlaceholderWidgetProps extends IStatistikWidgetProps {}

export const PlaceholderWidget = (props: IPlaceholderWidgetProps) => (
  <StatistikWidget>
    <Button
      type={"link"}
      style={{
        margin: "0px",
        width: "100%",
        height: "100%",
        fontSize: 25,
        backgroundColor: "#f0f2f5",
        border: "2px dashed lightGray"
      }}
      onClick={props.removeWidget}
    >
      <div className={"show-only-on-hover"}>
        <div>Zum Entfernen Klicken</div>
      </div>
    </Button>
  </StatistikWidget>
);
