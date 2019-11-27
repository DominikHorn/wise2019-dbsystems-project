import * as React from "react";
import { StatistikWidget, IStatistikWidgetProps } from "../StatistikWidget";
import { Button } from "antd";

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
        color: "lightGray"
      }}
      onClick={props.removeWidget}
    >
      Platzhalter
      <br />
      -
      <br />
      Zum Entfernen Klicken
    </Button>
  </StatistikWidget>
);
