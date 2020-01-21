import { IWahl, IStimmkreis } from "../../../../../shared/sharedTypes";
import * as React from "react";
import {
  IGetEntwicklungDerStimmenQueryHocProps,
  withEntwicklungDerStimmenQuery
} from "../../../../../client-graphql/public/getEntwicklungDerStimmenQuery";
import { compose } from "react-apollo";
import { Row, Col } from "antd";
import { renderCenteredLoading } from "../../../guiUtil";
import { StimmentwicklungChartComponent } from "./StimmentwicklungChart";

export interface IStimmkreisChartsComponentProps {
  readonly wahl: IWahl;
  readonly vglWahl: IWahl;
  readonly stimmkreis: IStimmkreis;
}

interface IProps
  extends IStimmkreisChartsComponentProps,
    IGetEntwicklungDerStimmenQueryHocProps {}

const StimmkreisChartsComponent = (props: IProps) => {
  return (
    <Row>
      {props.entwicklungDerStimmenData ? (
        <Col span={8}>
          <Row style={{ height: "300px" }}>
            Stimmkreis: {props.stimmkreis.name}
            <br />
            Wahlbeteiligung: 78 %
            <br />
            Gewinner: Hans
            <br />
          </Row>
          <Row>
            <br />
            {props.vglWahl && props.wahl ? (
              <StimmentwicklungChartComponent
                wahl={props.wahl}
                vglWahl={props.vglWahl}
                data={props.entwicklungDerStimmenData.stimmenEntwicklung}
                stimmkreis={props.stimmkreis}
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
};

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
