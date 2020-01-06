import { Button, Card, Checkbox, Col, Row } from "antd";
import * as React from "react";
import { compose } from "react-apollo";
import { RouteComponentProps } from "react-router";
import {
  IGetAllDirektKandidatenQueryHocProps,
  withDirektKandidatenQuery
} from "../../../../client-graphql/wahlen/getAllKandidatenQuery";
import { EParteiName } from "../../../../shared/enums";
import { IKandidat, IStimmkreis, IWahl } from "../../../../shared/sharedTypes";
import "./ErststimmePage.css";
import GridGenerator from "./GridGenerator";

interface IState {
  readonly selectedCandidat?: IKandidat;
  readonly clickedCommit?: boolean;
  checkboxes: Array<boolean>;
  stimmeUngueltig: boolean;
}

interface ZweitstimmePageProps {
  //routeProps: RouteComponentProps<any>;
  readonly wahl: IWahl;
  readonly stimmkreis: IStimmkreis;
  onChangeErststimmeAbgg: any;
  onChangeDirektkandidat: any;
}

export interface IProps
  extends ZweitstimmePageProps,
    IGetAllDirektKandidatenQueryHocProps {}

class ZweitstimmePageComponent extends React.PureComponent<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    //debugger;
    this.state = {
      //this.props.candidatesAr.length
      checkboxes: new Array(this.candidatesAr.length).fill(false, 0),
      stimmeUngueltig: false
    };
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
        <Card title={"Zweitstimme"} style={{ minHeight: "100%" }}>
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
        <Card title={"Zweitstimme"} style={{ minHeight: "100%" }}>
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

const ZweitstimmePageWithQueries = compose(
  withDirektKandidatenQuery<ZweitstimmePageProps>(
    props => props.wahl.id,
    props => props.stimmkreis.id
  )
)(ZweitstimmePageComponent);

export const ZweitstimmePage = ZweitstimmePageWithQueries as React.ComponentType<
  ZweitstimmePageProps
>;
