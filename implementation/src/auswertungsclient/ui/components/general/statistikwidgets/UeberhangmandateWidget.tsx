import * as React from "react";
import { StatistikWidget, IStatistikWidgetProps } from "../StatistikWidget";
import { compose } from "react-apollo";
import {
  withAllWahlenQuery,
  IGetAllWahlenQueryHocProps
} from "../../../../../client-graphql/public/getAllWahlenQuery";
import { WahlSelector } from "../dataselectors/WahlSelector";
import { IWahl } from "../../../../../shared/sharedTypes";
import { Row, Col } from "antd";

export interface IUeberhangmandateWidgetProps extends IStatistikWidgetProps {}

interface IProps
  extends IUeberhangmandateWidgetProps,
    IGetAllWahlenQueryHocProps {}
interface IState {
  readonly selectedWahl?: IWahl;
}

class UeberhangmandateWidgetComponent extends React.PureComponent<
  IProps,
  IState
> {
  constructor(props: IProps) {
    super(props);
    this.state = {};
  }

  private onSelectWahl = (selectedWahl: IWahl) =>
    this.setState({ selectedWahl });

  render() {
    const { selectedWahl } = this.state;
    const { allWahlenData } = this.props;
    return (
      <StatistikWidget
        {...this.props}
        title={
          <>
            <span style={{ float: "left" }}>{"Überhangmandate:"}</span>
            <span
              style={{
                display: "block",
                overflow: "hidden",
                paddingRight: "10px",
                paddingLeft: "10px"
              }}
            >
              <WahlSelector
                displayLoading={allWahlenData.loading}
                selectedWahl={selectedWahl}
                selectableWahlen={allWahlenData.allWahlen}
                onSelectWahl={this.onSelectWahl}
                style={{ width: "100%" }}
                size={"small"}
              />
            </span>
          </>
        }
      ></StatistikWidget>
    );
  }
}

const UeberhangmandateWidgetWithQueries = compose(
  withAllWahlenQuery<IUeberhangmandateWidgetProps>()
)(UeberhangmandateWidgetComponent);

export const UeberhangmandateWidget = UeberhangmandateWidgetWithQueries as React.ComponentType<
  IUeberhangmandateWidgetProps
>;
