import { Button, Card, Checkbox, Col, Row } from "antd";
import * as React from "react";
import { compose } from "react-apollo";
import { RouteComponentProps } from "react-router";
import {
  IGetAllDirektKandidatenQueryHocProps,
  withDirektKandidatenQuery
} from "../../../../client-graphql/wahlen/getAllKandidatenQuery";
import "./ErststimmePage.css";
import GridGenerator from "./GridGenerator";
import { Kandidat, Wahl, Stimmkreis } from "../../../../shared/graphql.types";

interface IState {
  readonly selectedCandidat?: Kandidat;
  readonly clickedCommit?: boolean;
  checkboxes: Array<boolean>;
  stimmeUngueltig: boolean;
}

interface ErststimmePageProps {
  routeProps: RouteComponentProps<any>;
  readonly wahl: Wahl;
  readonly stimmkreis: Stimmkreis;
}

export interface IProps
  extends ErststimmePageProps,
    IGetAllDirektKandidatenQueryHocProps {}

class ErststimmePageComponent extends React.PureComponent<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    //debugger;
    this.state = {
      //this.props.candidatesAr.length
      checkboxes: new Array(this.candidatesAr.length).fill(false, 0),
      stimmeUngueltig: false
    };
  }

  candidatesAr: Kandidat[] = [
    { id: 1, name: "Kandidat Name1", partei: { id: 1, name: "CSU" } },
    { id: 1, name: "Kandidat Name2", partei: { id: 1, name: "CSU" } },
    { id: 1, name: "Kandidat Name3", partei: { id: 1, name: "CSU" } },
    { id: 1, name: "Kandidat Name1", partei: { id: 1, name: "CSU" } },
    { id: 1, name: "Kandidat Name2", partei: { id: 1, name: "CSU" } },
    { id: 1, name: "Kandidat Name3", partei: { id: 1, name: "CSU" } },
    { id: 1, name: "Kandidat Name1", partei: { id: 1, name: "CSU" } },
    { id: 1, name: "Kandidat Name2", partei: { id: 1, name: "CSU" } },
    { id: 1, name: "Kandidat Name3", partei: { id: 1, name: "CSU" } }
  ];

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

  private renderCard = (item: boolean, i: number) => (
    <Card className={"candidat-card"}>
      <p>
        <input
          key={i}
          type="checkbox"
          checked={item}
          onChange={
            e =>
              this.onChange(e, i) /* notice passing an index. we will use it */
          }
        />
        {this.candidatesAr[i].partei.name}
      </p>
      <p>{this.candidatesAr[i].name}</p>
    </Card>
  );

  render() {
    console.log(this.props.direktKandidatenData.direktKandidaten);
    if (this.state.stimmeUngueltig) {
      return (
        <Card title={"Erststimme"} style={{ minHeight: "100%" }}>
          <p>Stimme is auf ungültig gesetzt worden</p>
          <Row type={"flex"} justify={"end"}>
            <Col>
              <Checkbox
                onClick={() =>
                  this.setState((state, props) => ({
                    stimmeUngueltig: !state.stimmeUngueltig
                  }))
                }
              ></Checkbox>{" "}
              Stimme ungültig machen
            </Col>
          </Row>

          <Row type={"flex"} justify={"end"}>
            <Col>
              <Button>Weiter</Button>
            </Col>
          </Row>
        </Card>
      );
    } else {
      const numOfCols = 4;
      return (
        <Card title={"Erststimme"} style={{ minHeight: "100%" }}>
          <GridGenerator cols={numOfCols}>
            {this.state.checkboxes.map((item, i) => this.renderCard(item, i))}
          </GridGenerator>
          <Row type={"flex"} justify={"end"}>
            <Col>
              <Checkbox
                onClick={() =>
                  this.setState((state, props) => ({
                    stimmeUngueltig: !state.stimmeUngueltig
                  }))
                }
              ></Checkbox>{" "}
              Stimme ungültig machen
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
}

const ErstimmePageWithQueries = compose(
  withDirektKandidatenQuery<ErststimmePageProps>(
    props => props.wahl.id,
    props => props.stimmkreis.id
  )
)(ErststimmePageComponent);

export const ErstimmePage = ErstimmePageWithQueries as React.ComponentType<
  ErststimmePageProps
>;

//export const ErstimmePage = ErststimmePageComponent;

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
