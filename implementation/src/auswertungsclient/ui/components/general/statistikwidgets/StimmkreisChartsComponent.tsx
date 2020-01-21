import { Col, Row } from "antd";
import * as React from "react";
import { compose } from "react-apollo";
import {
  IGetEntwicklungDerStimmenQueryHocProps,
  withEntwicklungDerStimmenQuery
} from "../../../../../client-graphql/public/getEntwicklungDerStimmenQuery";
import { IStimmkreis, IWahl } from "../../../../../shared/sharedTypes";
import { renderCenteredLoading } from "../../../guiUtil";
import { StimmentwicklungChart } from "./StimmentwicklungChart";

export interface IStimmkreisChartsComponentProps {
  readonly wahl: IWahl;
  readonly vglWahl: IWahl;
  readonly stimmkreis: IStimmkreis;
}

interface IProps
  extends IStimmkreisChartsComponentProps,
    IGetEntwicklungDerStimmenQueryHocProps {}

class StimmkreisChartsComponent extends React.PureComponent<IProps> {
  render() {
    //debugger;
    console.log(this.props.entwicklungDerStimmenData.loading);
    console.log(this.props.entwicklungDerStimmenData);
    return (
      <Row>
        {this.props.entwicklungDerStimmenData ? (
          <Col>
            <Row style={{ height: "70px" }}>
              Stimmkreis: {this.props.stimmkreis.name}
              <br />
              Wahlbeteiligung: 78 %
              <br />
              Gewinner: Hans
              <br />
            </Row>
            <Row style={{ height: "500px" }}>
              {this.props.vglWahl && this.props.wahl ? (
                <StimmentwicklungChart
                  wahl={this.props.wahl}
                  vglWahl={this.props.vglWahl}
                  data={this.props.entwicklungDerStimmenData.stimmenEntwicklung}
                  stimmkreis={this.props.stimmkreis}
                />
              ) : (
                renderCenteredLoading()
              )}
            </Row>
          </Col>
        ) : (
          renderCenteredLoading()
        )}
      </Row>
    );
  }
}

const EntwicklungDerStimmenChartWithQueries = compose(
  withEntwicklungDerStimmenQuery<IStimmkreisChartsComponentProps>(
    props => props.wahl.id,
    props => props.vglWahl.id,
    props => props.stimmkreis.id
  )
)(StimmkreisChartsComponent);

export const StimmkreisCharts = EntwicklungDerStimmenChartWithQueries as React.ComponentType<
  IStimmkreisChartsComponentProps
>;
