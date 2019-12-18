import * as React from "react";
import { IKandidat } from "../../../../shared/sharedTypes";
import { Card } from "antd";

export interface ICandidateCardProps {
  readonly candidates: IKandidat[];
}

interface IProps extends ICandidateCardProps {}

export interface IState {
  selected: boolean;
  checkboxes: Array<boolean>;
}

class CandidateCardComponent extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      selected: false,
      // checked/unchecked is stored here
      // initially the first one is checked:
      // [true, false, false]
      checkboxes: new Array(this.props.candidates.length).fill(false, 0)
    };
  }
  onChange(e: React.ChangeEvent<HTMLInputElement>, changedIndex: number) {
    // it is a good habit to extract things from event variable
    const { checked } = e.target;

    this.setState(state => ({
      // this lets you unselect all.
      // but selected can be only one at a time
      checkboxes: state.checkboxes.map((_, i) =>
        i === changedIndex ? checked : false
      )
    }));
  }
  render() {
    const { checkboxes } = this.state;

    return checkboxes.map((item, i) => (
      <Card className={"candidat-card"}>
        <p>
          <input
            key={i}
            type="checkbox"
            checked={item}
            onChange={
              e =>
                this.onChange(
                  e,
                  i
                ) /* notice passing an index. we will use it */
            }
          />
          {this.props.candidates[i].partei.name}
        </p>
        <p>{this.props.candidates[i].name}</p>
      </Card>
    ));
  }
}

export const CandidateCards = CandidateCardComponent;
