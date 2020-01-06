import * as React from "react";
import { IKandidat } from "../../../../shared/sharedTypes";
import { Card } from "antd";

export interface IListCardProps {
  readonly lists: IKandidat[][];
  onChangeCheckbox: any;
}

interface IProps extends IListCardProps {}

export interface IState {
  selected: boolean;
  checkboxes: Array<Array<boolean>>;
}

class ListCardComponent extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);

    this.state = {
      selected: false,
      checkboxes: new Array(this.props.lists.length).map((_, i) =>
        new Array(this.props.lists[i].length).fill(false, 0)
      )
    };
  }

  render() {
    console.log(this.state.checkboxes);
    return () => <Card>Test</Card>;
  }
}

export const ListCards = ListCardComponent;
