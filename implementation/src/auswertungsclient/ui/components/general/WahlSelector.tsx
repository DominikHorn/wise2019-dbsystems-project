import * as React from "react";
import { Select, Spin } from "antd";
import { IWahl } from "../../../../shared/sharedTypes";
import { renderCenteredLoading } from "../../guiUtil";

export interface IWahlSelectorProps {
  selectableWahlen?: IWahl[];
  displayLoading?: boolean;
  selectedWahl?: IWahl;
  onSelectWahl?: (wahl: IWahl) => void;
  style?: React.CSSProperties;
  size?: "small" | "default" | "large";
}

export const WahlSelector = (props: IWahlSelectorProps) =>
  (props.selectableWahlen && (
    <Select
      loading={props.displayLoading}
      placeholder={"Datum einer Landtagswahl"}
      style={props.style || { minWidth: "220px" }}
      size={props.size}
      onSelect={(wahlidstr: string) =>
        props.onSelectWahl &&
        props.onSelectWahl(
          props.selectableWahlen.find(wahl => wahl.id === Number(wahlidstr))
        )
      }
      value={props.selectedWahl && props.selectedWahl.id.toString()}
    >
      {props.selectableWahlen.map(wahl => (
        <Select.Option key={`${wahl.id}`}>
          {wahl.wahldatum.toLocaleDateString("de-DE", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
          })}
        </Select.Option>
      ))}
    </Select>
  )) ||
  renderCenteredLoading();
