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
import { ProzAnteilChart } from "./ProzentualerAnteilStimmenChart";
import {
  withDirektmandatQuery,
  IGetDirektmandatQueryHocProps
} from "../../../../../client-graphql/public/getDirektmandatQuery";

export interface IStimmkreisChartsComponentProps {
  readonly wahl: IWahl;
  readonly vglWahl: IWahl;
  readonly stimmkreis: IStimmkreis;
}

interface IProps
  extends IStimmkreisChartsComponentProps,
    IGetEntwicklungDerStimmenQueryHocProps,
    IGetDirektmandatQueryHocProps {}

class StimmkreisChartsComponent extends React.PureComponent<IProps> {
  render() {
    return (
      <div style={{ height: "100%" }}>
        {this.props.entwicklungDerStimmenData &&
        this.props.vglWahl &&
        this.props.wahl ? (
          <div style={{ height: "100%" }}>
            <Row style={{ height: "50%" }}>
              {this.props.direktmandatData &&
              this.props.direktmandatData.direktmandat ? (
                <Col span={7} style={{ height: "100%" }}>
                  Stimmkreis: {this.props.stimmkreis.name}
                  <br />
                  Wahlbeteiligung: 78 %
                  <br />
                  Gewinner:{" "}
                  {this.props.direktmandatData.direktmandat.kandidat.name}
                  <br />
                </Col>
              ) : (
                <Col span={7} style={{ height: "100%" }}>
                  {renderCenteredLoading()}
                </Col>
              )}

              <Col span={10} style={{ height: "100%" }}>
                <ProzAnteilChart
                  wahl={this.props.wahl}
                  data={this.props.entwicklungDerStimmenData.stimmenEntwicklung}
                  stimmkreis={this.props.stimmkreis}
                />
              </Col>
            </Row>
            <Row style={{ height: "50%" }}>
              <StimmentwicklungChart
                wahl={this.props.wahl}
                vglWahl={this.props.vglWahl}
                data={this.props.entwicklungDerStimmenData.stimmenEntwicklung}
                stimmkreis={this.props.stimmkreis}
              />
            </Row>
          </div>
        ) : (
          renderCenteredLoading()
        )}
      </div>
    );
  }
}

const EntwicklungDerStimmenChartWithQueries = compose(
  withEntwicklungDerStimmenQuery<IStimmkreisChartsComponentProps>(
    props => props.wahl.id,
    props => props.vglWahl.id,
    props => props.stimmkreis.id
  ),
  withDirektmandatQuery<IStimmkreisChartsComponentProps>(
    props => props.wahl.id,
    props => props.stimmkreis.id
  )
)(StimmkreisChartsComponent);

export const StimmkreisCharts = EntwicklungDerStimmenChartWithQueries as React.ComponentType<
  IStimmkreisChartsComponentProps
>;
