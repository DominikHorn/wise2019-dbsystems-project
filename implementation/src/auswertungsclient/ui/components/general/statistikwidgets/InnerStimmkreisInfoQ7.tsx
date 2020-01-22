import {
  IGetAllStimmkreiseQueryHocProps,
  withAllStimmkreiseQuery
} from "../../../../../client-graphql/public/getAllStimmkreiseQuery";
import { IWahl, IStimmkreis } from "../../../../../shared/sharedTypes";
import * as React from "react";
import { IStatistikWidgetProps } from "../StatistikWidget";
import { compose } from "react-apollo";
import { Card } from "antd";
import { StimmkreisSelector } from "../dataselectors/StimmkreisSelector";

interface IState {
  readonly selectedStimmkreis1?: IStimmkreis;
  readonly selectedStimmkreis2?: IStimmkreis;
  readonly selectedStimmkreis3?: IStimmkreis;
  readonly selectedStimmkreis4?: IStimmkreis;
  readonly selectedStimmkreis5?: IStimmkreis;
}

export interface InnerStimmkreisInfoQ7Props {
  readonly wahl: IWahl;
}

interface IProps
  extends InnerStimmkreisInfoQ7Props,
    IGetAllStimmkreiseQueryHocProps {}

class InnerStimmkreisInfoQ7Component extends React.PureComponent<
  IProps,
  IState
> {
  constructor(props: IProps) {
    super(props);
    this.state = {};
  }

  render() {
    const { allStimmkreiseData } = this.props;

    return (
      <div>
        <StimmkreisSelector
          displayLoading={allStimmkreiseData.loading}
          selectedStimmkreis={this.state.selectedStimmkreis1}
          selectableStimmkreise={allStimmkreiseData.allStimmkreise}
          onSelectStimmkreis={(newStimmkreis: IStimmkreis) =>
            this.setState({ selectedStimmkreis1: newStimmkreis })
          }
          selectDefaultStimmkreis={false}
          size={"small"}
        />
      </div>
    );
  }
}

const StimmkreisInfoQ7WidgetWithQueries = compose(
  withAllStimmkreiseQuery<InnerStimmkreisInfoQ7Props>(props => props.wahl.id)
)(InnerStimmkreisInfoQ7Component);

export const StimmkreisInfoQ7Widget = StimmkreisInfoQ7WidgetWithQueries as React.ComponentType<
  InnerStimmkreisInfoQ7Props
>;
