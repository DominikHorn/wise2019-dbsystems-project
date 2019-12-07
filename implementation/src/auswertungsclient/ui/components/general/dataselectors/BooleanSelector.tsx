import * as React from "react";
import { Checkbox } from "antd";

export interface IBooleanSelectorProps {
  readonly label?: string;
  readonly checked?: boolean;
  readonly onValueChanged?: (newValue: boolean) => void;
}

export const BooleanSelector = (props: IBooleanSelectorProps) => (
  <Checkbox
    checked={props.checked}
    onChange={e =>
      props.onValueChanged && props.onValueChanged(e.target.checked)
    }
  >
    {props.label}
  </Checkbox>
);
