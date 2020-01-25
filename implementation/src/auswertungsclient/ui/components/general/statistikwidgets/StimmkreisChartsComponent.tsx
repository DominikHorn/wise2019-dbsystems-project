import { Col, Row, Alert } from "antd";
import * as React from "react";
import { compose } from "react-apollo";
import {
  IGetEntwicklungDerStimmenQueryHocProps,
  withEntwicklungDerStimmenQuery
} from "../../../../../client-graphql/public/getEntwicklungDerStimmenQuery";
import { renderCenteredLoading } from "../../../guiUtil";
import { StimmentwicklungChart } from "./StimmentwicklungChart";
import { ProzAnteilChart } from "./ProzentualerAnteilStimmenChart";
import {
  withDirektmandatQuery,
  IGetDirektmandatQueryHocProps
} from "../../../../../client-graphql/public/getDirektmandatQuery";
import { Wahl, Stimmkreis } from "../../../../../shared/graphql.types";

export interface IStimmkreisChartsComponentProps {
  readonly wahl: Wahl;
  readonly vglWahl?: Wahl;
  readonly stimmkreis: Stimmkreis;
  readonly wahlbeteiligung: number;
}

interface IProps
  extends IStimmkreisChartsComponentProps,
    IGetEntwicklungDerStimmenQueryHocProps,
    IGetDirektmandatQueryHocProps {}

class StimmkreisChartsComponent extends React.PureComponent<IProps> {
  render() {
    const {
      entwicklungDerStimmenData,
      direktmandatData,
      stimmkreis,
      wahl,
      vglWahl,
      wahlbeteiligung
    } = this.props;
    if (!entwicklungDerStimmenData || !direktmandatData) return <></>;
    if (entwicklungDerStimmenData.loading || direktmandatData.loading)
      return renderCenteredLoading();
    if (entwicklungDerStimmenData.error || direktmandatData.error) {
      return (
        <Alert
          type={"error"}
          message={`ERROR: ${
            entwicklungDerStimmenData.error
              ? `${entwicklungDerStimmenData.error.message};\n`
              : ""
          } ${direktmandatData.error ? direktmandatData.error.message : ""}`}
        />
      );
    }

    return (
      <div style={{ height: "100%" }}>
        <Row style={{ height: "50%" }}>
          <Col span={7} style={{ height: "100%", paddingTop: "10px" }}>
            {`Stimmkreis: ${stimmkreis.name}`}
            <br />
            {`Wahlbeteiligung: ${(
              Math.round(wahlbeteiligung * 100) / 100
            ).toFixed()}%`}
            <br />
            {`Gewinner: ${direktmandatData.direktmandat.kandidat.name}`}
            <br />
          </Col>
          <Col span={17} style={{ height: "100%" }}>
            <ProzAnteilChart
              wahl={wahl}
              data={entwicklungDerStimmenData.stimmenEntwicklung}
              stimmkreis={stimmkreis}
            />
          </Col>
        </Row>
        <Row style={{ height: "50%" }}>
          <StimmentwicklungChart
            wahl={wahl}
            vglwahl={vglWahl}
            data={entwicklungDerStimmenData.stimmenEntwicklung}
            stimmkreis={stimmkreis}
          />
        </Row>
      </div>
    );
  }
}

const EntwicklungDerStimmenChartWithQueries = compose(
  withEntwicklungDerStimmenQuery<IStimmkreisChartsComponentProps>(
    props => props.wahl.id,
    props => props.vglWahl && props.vglWahl.id,
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
