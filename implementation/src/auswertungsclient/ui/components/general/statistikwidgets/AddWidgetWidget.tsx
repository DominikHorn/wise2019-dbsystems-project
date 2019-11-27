import { Button, Menu, Dropdown } from "antd";
import * as React from "react";
import { StatistikWidget } from "../StatistikWidget";
import { WidgetType } from "./WidgetTypes";
export interface IAddWidgetWidgetProps {
  onWidgetAdd: (type: WidgetType) => void;
}

export const AddWidgetWidget = (props: IAddWidgetWidgetProps) => (
  <StatistikWidget>
    <Dropdown
      overlay={
        <Menu onClick={param => props.onWidgetAdd(param.key as WidgetType)}>
          {Object.values(WidgetType)
            .filter(type => type !== WidgetType.ADD)
            .map(value => (
              <Menu.Item key={value}>{value}</Menu.Item>
            ))}
        </Menu>
      }
    >
      <Button
        icon={"plus"}
        type={"dashed"}
        style={{ margin: "0px", width: "100%", height: "100%", fontSize: 25 }}
      >
        Widget Hinzufügen
      </Button>
    </Dropdown>
  </StatistikWidget>
);
