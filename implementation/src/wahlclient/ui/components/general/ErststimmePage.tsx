import { Button, Card, Checkbox, Col, Row } from "antd";
import * as React from "react";
import { compose } from "react-apollo";
import { RouteComponentProps } from "react-router";
import {
  IGetAllDirektKandidatenQueryHocProps,
  withDirektKandidatenQuery
} from "../../../../client-graphql/wahlen/getAllKandidatenQuery";
import { Kandidat, Stimmkreis, Wahl } from "../../../../shared/graphql.types";
import "./ErststimmePage.css";
import GridGenerator from "./GridGenerator";

interface IState {
  readonly selectedCandidat?: Kandidat;
  readonly clickedCommit?: boolean;
  readonly checkboxes: Array<boolean>;
  readonly stimmeUngueltig: boolean;
}

interface ErststimmePageProps {
  readonly wahl: Wahl;
  readonly stimmkreis: Stimmkreis;
  readonly onChangeErststimmeAbgg: any;
  readonly onChangeDirektkandidat: any;
  readonly onChangeBack: any;
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

  private commitValidVote() {
    //commiting a valid vote hands over the selected candidate to the WaehlenPage
    let i: number;
    for (i = 0; i < this.state.checkboxes.length; i++) {
      if (this.state.checkboxes[i]) {
        this.props.onChangeErststimmeAbgg(this.state.checkboxes[i]);
        this.props.onChangeDirektkandidat({
          kandidat: this.candidatesAr[i],
          ungueltig: false
        });
        break;
      }
    }
  }

  private onClickBack() {
    this.props.onChangeErststimmeAbgg(false);
    this.props.onChangeDirektkandidat({ kandidat: null, ungueltig: false });
    //true because we want to go back -> logik in waehlenPage
    this.props.onChangeBack(true);
  }

  //to commit an unvalid vote means that a vote was committed but the candidate is undefined
  private commitInvalidVote() {
    this.props.onChangeErststimmeAbgg(this.state.stimmeUngueltig);
    this.props.onChangeDirektkandidat({
      kandidat: null,
      ungueltig: true
    });
    //console.log("committing unvalid vote");
  }

  render() {
    //console.log(this.props.direktKandidatenData.direktKandidaten);
    //console.log("Hallo!");
    if (this.state.stimmeUngueltig) {
      return (
        <Card title={"Erststimme"} style={{ minHeight: "100%" }}>
          <p>Stimme is auf ungültig gesetzt worden</p>
          <Row type={"flex"} justify={"end"}>
            <Col>
              <Checkbox
                onClick={() =>
                  this.setState((state, props) => ({
                    stimmeUngueltig: !this.state.stimmeUngueltig
                  }))
                }
              ></Checkbox>{" "}
              Stimme ungültig machen
            </Col>
          </Row>

          <Row type={"flex"} justify={"end"}>
            <Col>
              <Button onClick={() => this.onClickBack()}>Zurück</Button>
            </Col>
            <Col>
              <Button
                type={"primary"}
                onClick={() => {
                  this.commitInvalidVote();
                }}
              >
                Weiter
              </Button>
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
          <Col>
            <Button onClick={() => this.onClickBack()}>Zurück</Button>
          </Col>
          <Row type={"flex"} justify={"end"}>
            <Col>
              <Button
                type={"primary"}
                onClick={() => {
                  this.commitValidVote();
                }}
              >
                Weiter
              </Button>
            </Col>
          </Row>
        </Card>
      );
    }
  }
}

const ErststimmePageWithQueries = compose(
  withDirektKandidatenQuery<ErststimmePageProps>(
    props => props.wahl.id,
    props => props.stimmkreis.id
  )
)(ErststimmePageComponent);

export const ErststimmePage = ErststimmePageWithQueries as React.ComponentType<
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
