import * as React from "react";
import { Checkbox } from "antd";

export interface IBooleanSelectorProps {
  readonly label?: string;
  readonly checked?: boolean;
  readonly onValueChanged?: (newValue: boolean) => void;
  readonly style?: React.CSSProperties;
}

export const BooleanSelector = (props: IBooleanSelectorProps) => (
  <Checkbox
    checked={props.checked}
    style={props.style}
    onChange={e =>
      props.onValueChanged && props.onValueChanged(e.target.checked)
    }
  >
    {props.label}
  </Checkbox>
);
