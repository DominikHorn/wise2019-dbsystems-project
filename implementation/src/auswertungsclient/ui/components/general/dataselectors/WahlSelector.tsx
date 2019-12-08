import * as React from "react";
import { Select, Spin } from "antd";
import { IWahl } from "../../../../../shared/sharedTypes";
import { renderCenteredLoading } from "../../../guiUtil";

export interface IWahlSelectorProps {
  readonly selectableWahlen?: IWahl[];
  readonly displayLoading?: boolean;
  readonly selectedWahl?: IWahl;
  readonly onSelectWahl?: (wahl: IWahl) => void;
  readonly style?: React.CSSProperties;
  readonly size?: "small" | "default" | "large";
  readonly selectDefaultWahl?: boolean;
}

class WahlSelectorComponent extends React.PureComponent<IWahlSelectorProps> {
  render() {
    const {
      selectableWahlen,
      displayLoading,
      selectedWahl,
      onSelectWahl,
      style,
      size,
      selectDefaultWahl
    } = this.props;
    if (
      selectDefaultWahl &&
      !selectedWahl &&
      selectableWahlen &&
      selectableWahlen.length > 0
    ) {
      // This is a react antipattern but the least verbose workaround for
      // the problem of setting defaults everywhere. Since it is contained
      // within this component, all is fine!
      onSelectWahl &&
        setTimeout(() =>
          onSelectWahl(selectableWahlen[selectableWahlen.length - 1])
        );
    }

    return (
      (selectableWahlen && (
        <Select
          loading={displayLoading}
          placeholder={"Datum einer Landtagswahl"}
          style={style || { minWidth: "220px" }}
          defaultActiveFirstOption={selectDefaultWahl}
          size={size}
          onSelect={(wahlidstr: string) =>
            onSelectWahl &&
            onSelectWahl(
              selectableWahlen.find(wahl => wahl.id === Number(wahlidstr))
            )
          }
          value={selectedWahl && selectedWahl.id.toString()}
        >
          {selectableWahlen.map(wahl => (
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
      renderCenteredLoading()
    );
  }
}

export const WahlSelector = WahlSelectorComponent as React.ComponentType<
  IWahlSelectorProps
>;
