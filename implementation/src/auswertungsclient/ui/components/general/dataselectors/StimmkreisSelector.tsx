import { IStimmkreis } from "../../../../../shared/sharedTypes";
import * as React from "react";
import { Select } from "antd";
import { renderCenteredLoading } from "../../../guiUtil";

export interface IStimmkreisSelectorProps {
  readonly selectableStimmkreise?: IStimmkreis[];
  readonly displayLoading?: boolean;
  readonly selectedStimmkreis?: IStimmkreis;
  readonly onSelectStimmkreis?: (stimmkreis: IStimmkreis) => void;
  readonly style?: React.CSSProperties;
  readonly size?: "small" | "default" | "large";
  readonly selectDefaultStimmkreis?: boolean;
}

class StimmkreisSelectorComponent extends React.PureComponent<
  IStimmkreisSelectorProps
> {
  render() {
    const {
      selectableStimmkreise,
      displayLoading,
      selectedStimmkreis,
      onSelectStimmkreis,
      style,
      size,
      selectDefaultStimmkreis
    } = this.props;
    if (
      selectDefaultStimmkreis &&
      !selectedStimmkreis &&
      selectableStimmkreise &&
      selectableStimmkreise.length > 0
    ) {
      // This is a react antipattern but the least verbose workaround for
      // the problem of setting defaults everywhere. Since it is contained
      // within this component, all is fine!
      onSelectStimmkreis &&
        setTimeout(() =>
          onSelectStimmkreis(
            selectableStimmkreise[selectableStimmkreise.length - 1]
          )
        );
    }

    return (
      (selectableStimmkreise && (
        <Select
          loading={displayLoading}
          placeholder={"Stimmkreis"}
          style={style || { minWidth: "220px" }}
          defaultActiveFirstOption={selectDefaultStimmkreis}
          size={size}
          onSelect={(stimmkreisidstr: string) =>
            onSelectStimmkreis &&
            onSelectStimmkreis(
              selectableStimmkreise.find(
                stimmkreis => stimmkreis.id === Number(stimmkreisidstr)
              )
            )
          }
          value={selectedStimmkreis && selectedStimmkreis.id.toString()}
        >
          {selectableStimmkreise.map(stimmkreis => (
            <Select.Option key={`${stimmkreis.id}`}>
              {stimmkreis.name}
            </Select.Option>
          ))}
        </Select>
      )) ||
      renderCenteredLoading()
    );
  }
}

export const StimmkreisSelector = StimmkreisSelectorComponent as React.ComponentType<
  IStimmkreisSelectorProps
>;
