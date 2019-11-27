import { Button, Menu, Dropdown } from "antd";
import * as React from "react";
import { StatistikWidget } from "../StatistikWidget";
import { WidgetType } from "./WidgetTypes";
import SubMenu from "antd/lib/menu/SubMenu";
import MenuItem from "antd/lib/menu/MenuItem";
export interface IAddWidgetWidgetProps {
  onWidgetAdd: (type: WidgetType) => void;
}

type WidgetMenuEntry = {
  name: string;
  values: string[];
};

export const AddWidgetWidget = (props: IAddWidgetWidgetProps) => (
  <StatistikWidget>
    <Dropdown
      overlay={
        <Menu onClick={param => props.onWidgetAdd(param.key as WidgetType)}>
          {Object.values(WidgetType)
            .filter(type => type !== WidgetType.ADD)
            .reduce((prev, curr) => {
              const newEntry = () => ({
                name: curr.split("-")[0].trim(),
                values: [curr]
              });
              if (prev.length > 0) {
                const latest = prev[prev.length - 1];
                if (curr.startsWith(latest.name)) {
                  return prev.slice(0, prev.length - 1).concat([
                    {
                      ...latest,
                      values: latest.values.concat([curr])
                    }
                  ]);
                } else {
                  return prev.concat([newEntry()]);
                }
              } else {
                return [newEntry()];
              }
            }, [] as WidgetMenuEntry[])
            .map((menuEntry: WidgetMenuEntry) => {
              if (menuEntry.values.length === 1) {
                const onlyEntry = menuEntry.values[0];
                return <Menu.Item key={onlyEntry}>{onlyEntry}</Menu.Item>;
              } else {
                return (
                  <SubMenu title={menuEntry.name}>
                    {menuEntry.values.map(val => (
                      <MenuItem key={val}>{val}</MenuItem>
                    ))}
                  </SubMenu>
                );
              }
            })}
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
