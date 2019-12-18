import { IKandidat, IStimmkreis } from "../../../../shared/sharedTypes";
import * as React from "react";
import { Row, Col, Checkbox, Card, Button } from "antd";
import { RouteComponentProps } from "react-router";
import "./ErststimmePage.css";
import GridGenerator from "./GridGenerator";
import { EParteiName } from "../../../../shared/enums";
import { CandidateCards } from "./CandidateCardsComponent";

interface IState {
  readonly selectedCandidat?: IKandidat;
  readonly clickedCommit?: boolean;
}

interface ErststimmenPageProps {
  routeProps: RouteComponentProps<any>;
  readonly stimmkreis: IStimmkreis;
}

export interface IProps extends ErststimmenPageProps {}

class ErststimmePageComponent extends React.PureComponent<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {};
  }

  candidatesAr: IKandidat[] = [
    { id: 1, name: "Kandidat Name1", partei: { id: 1, name: EParteiName.CSU } },
    { id: 1, name: "Kandidat Name2", partei: { id: 1, name: EParteiName.CSU } },
    { id: 1, name: "Kandidat Name3", partei: { id: 1, name: EParteiName.CSU } },
    { id: 1, name: "Kandidat Name1", partei: { id: 1, name: EParteiName.CSU } },
    { id: 1, name: "Kandidat Name2", partei: { id: 1, name: EParteiName.CSU } },
    { id: 1, name: "Kandidat Name3", partei: { id: 1, name: EParteiName.CSU } },
    { id: 1, name: "Kandidat Name1", partei: { id: 1, name: EParteiName.CSU } },
    { id: 1, name: "Kandidat Name2", partei: { id: 1, name: EParteiName.CSU } },
    { id: 1, name: "Kandidat Name3", partei: { id: 1, name: EParteiName.CSU } }
  ];

  private renderCards(candidats: IKandidat[]) {
    return candidats.map(candidat => (
      <Col span={6}>
        <Card className={"candidat-card"}>
          <p>
            <Checkbox></Checkbox> {candidat.partei.name}
          </p>
          <p>{candidat.name}</p>
        </Card>
      </Col>
    ));
  }

  render() {
    const numOfCols = 4;
    return (
      <Card title={"Erststimme"} style={{ minHeight: "100%" }}>
        <GridGenerator cols={numOfCols}>
          <CandidateCards candidates={this.candidatesAr}></CandidateCards>
        </GridGenerator>
        <Row type={"flex"} justify={"end"}>
          <Col>
            <Checkbox></Checkbox> Stimme ungültig machen
          </Col>
        </Row>

        <Row type={"flex"} justify={"end"}>
          <Col>
            <Button>Weiter</Button>
          </Col>
        </Row>
      </Card>
    );
  }
}

export const ErstimmePage = ErststimmePageComponent;

{
  //{this.renderCards(this.candidatesAr)}
  /* <Card title={"Erststimme"} style={{ minHeight: "100%" }}>
        <Row gutter={8}>
          <Col span={6}>
            <Card className={"candidat-card"}>
              <p>
                <Checkbox></Checkbox> Partei
              </p>
              <p>KandidatName</p>
            </Card>
          </Col>
          <Col span={6}>
            <Card className={"candidat-card"}>
              <p>
                <Checkbox></Checkbox> Partei
              </p>
              <p>KandidatName</p>
            </Card>
          </Col>
          <Col span={6}>
            <Card className={"candidat-card"}>
              <p>
                <Checkbox></Checkbox> Partei
              </p>
              <p>KandidatName</p>
            </Card>
          </Col>
          <Col span={6}>
            <Card className={"candidat-card"}>
              <p>
                <Checkbox></Checkbox> Partei
              </p>
              <p>KandidatName</p>
            </Card>
          </Col>
        </Row>
      </Card> */
}
