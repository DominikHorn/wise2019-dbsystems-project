import { Button, Card, Checkbox, Col, Row, message } from "antd";
import * as React from "react";
import { compose } from "react-apollo";
import {
  IGetAllDirektKandidatenQueryHocProps,
  withDirektKandidatenQuery
} from "../../../../client-graphql/wahlen/getAllKandidatenQuery";
import {
  Kandidat,
  Partei,
  Wahl,
  Stimmkreis
} from "../../../../shared/graphql.types";

interface IState {
  readonly selectedCandidat?: Kandidat;
  readonly clickedCommit?: boolean;
  stimmeUngueltig: boolean;
  checked: {
    kandidat: number;
    partei: number;
  };
  chosen: {
    kandidat: Kandidat;
    partei: Partei;
    ungueltig: boolean;
  };
}

interface ZweitstimmePageProps {
  readonly wahl: Wahl;
  readonly stimmkreis: Stimmkreis;
  onChangeZweitstimmeAbgg: any;
  onChangeZweitStimme: any;
  onChangeBack: any;
}

export interface IProps
  extends ZweitstimmePageProps,
    IGetAllDirektKandidatenQueryHocProps {}

type ListenKandidat = { listenplatz: number; kandidat: Kandidat };

function mapData(list: ListenKandidat[]) {
  return list.reduce(
    (data: { [parteiID: number]: ListenKandidat[] }, listenKandidat) => ({
      ...data,
      [listenKandidat.kandidat.partei.id]: (
        data[listenKandidat.kandidat.partei.id] || []
      ).concat(listenKandidat)
    }),
    {}
  );
}

class ZweitstimmePageComponent extends React.PureComponent<IProps, IState> {
  constructor(props: IProps) {
    super(props);

    //debugger;
    this.state = {
      stimmeUngueltig: false,
      checked: {
        kandidat: null,
        partei: null
      },
      chosen: {
        kandidat: null,
        partei: null,
        ungueltig: false
      }
    };
  }

  candidatesAr: ListenKandidat[] = [
    {
      listenplatz: 1,
      kandidat: {
        id: 1,
        name: "Kandidat Name1",
        partei: { id: 1, name: "CSU" }
      }
    },
    {
      listenplatz: 2,
      kandidat: {
        id: 2,
        name: "Kandidat Name2",
        partei: { id: 1, name: "CSU" }
      }
    },
    {
      listenplatz: 3,
      kandidat: {
        id: 3,
        name: "Kandidat Name3",
        partei: { id: 1, name: "CSU" }
      }
    },
    {
      listenplatz: 4,
      kandidat: {
        id: 4,
        name: "Kandidat Name4",
        partei: { id: 1, name: "CSU" }
      }
    },
    {
      listenplatz: 1,
      kandidat: {
        id: 1,
        name: "Kandidat Name1",
        partei: { id: 2, name: "SPD" }
      }
    },
    {
      listenplatz: 2,
      kandidat: {
        id: 2,
        name: "Kandidat Name2",
        partei: { id: 2, name: "SPD" }
      }
    },
    {
      listenplatz: 3,
      kandidat: {
        id: 3,
        name: "Kandidat Name3",
        partei: { id: 2, name: "SPD" }
      }
    },
    {
      listenplatz: 4,
      kandidat: {
        id: 4,
        name: "Kandidat Name4",
        partei: { id: 2, name: "SPD" }
      }
    },
    {
      listenplatz: 5,
      kandidat: {
        id: 5,
        name: "Kandidat Name5",
        partei: { id: 2, name: "SPD" }
      }
    },
    {
      listenplatz: 6,
      kandidat: {
        id: 6,
        name: "Kandidat Name6",
        partei: { id: 2, name: "SPD" }
      }
    },
    {
      listenplatz: 1,
      kandidat: {
        id: 1,
        name: "Kandidat Name1",
        partei: { id: 4, name: "Grüne" }
      }
    },
    {
      listenplatz: 2,
      kandidat: {
        id: 2,
        name: "Kandidat Name2",
        partei: { id: 4, name: "Grüne" }
      }
    },
    {
      listenplatz: 3,
      kandidat: {
        id: 3,
        name: "Kandidat Name3",
        partei: { id: 4, name: "Grüne" }
      }
    },
    {
      listenplatz: 4,
      kandidat: {
        id: 4,
        name: "Kandidat Name4",
        partei: { id: 4, name: "Grüne" }
      }
    }
  ];

  data: { [parteiid: number]: ListenKandidat[] } = mapData(this.candidatesAr);

  private renderParteiListenCard(partei: Partei, kandidaten: ListenKandidat[]) {
    return (
      <Col style={{ padding: "5px" }}>
        <Card style={{ width: "250px", borderColor: "#365592" }}>
          <Checkbox
            checked={this.state.checked.partei === partei.id}
            onClick={() =>
              this.setState({
                checked: { kandidat: null, partei: partei.id },
                chosen: {
                  kandidat: null,
                  partei: partei,
                  ungueltig: false
                }
              })
            }
            style={{ fontWeight: "bold", fontSize: "large" }}
          >
            {partei.name}
          </Checkbox>
          {kandidaten.map(kandidat => (
            <div>
              <Checkbox
                checked={this.state.checked.kandidat == kandidat.kandidat.id}
                onClick={() =>
                  this.setState({
                    checked: {
                      kandidat: kandidat.kandidat.id,
                      partei: null
                    },
                    chosen: {
                      kandidat: kandidat.kandidat,
                      partei: null,
                      ungueltig: false
                    }
                  })
                }
              >
                {kandidat.listenplatz + ".    " + kandidat.kandidat.name}
              </Checkbox>
            </div>
          ))}
        </Card>
      </Col>
    );
  }

  private onClickBack() {
    this.props.onChangeZweitstimmeAbgg(false);
    this.props.onChangeZweitStimme({
      kandidat: null,
      partei: null,
      ungueltig: false
    });
    //true because we want to go back -> logik in waehlenPage
    this.props.onChangeBack(true);
  }

  //to commit an unvalid vote means that a vote was committed but the candidate is undefined
  private commitInvalidVote() {
    this.props.onChangeZweitstimmeAbgg(this.state.stimmeUngueltig);
    this.props.onChangeZweitStimme({
      kandidat: null,
      partei: null,
      ungueltig: true
    });
  }

  private commitValidVote() {
    if (
      !(
        this.state.chosen.kandidat === null && this.state.chosen.partei === null
      )
    ) {
      this.props.onChangeZweitstimmeAbgg(true);
      this.props.onChangeZweitStimme(this.state.chosen);
    } else {
      message.error(
        "Bitte wählen Sie einen Kandidaten oder eine Partei oder markieren Sie Ihre Stimme als ungültig"
      );
    }
  }

  render() {
    if (this.state.stimmeUngueltig) {
      return (
        <Card title={"Zweitstimme"} style={{ minHeight: "100%" }}>
          <p>Stimme ist auf ungültig gesetzt worden</p>
          <Row type={"flex"} justify={"end"}>
            <Col>
              <Checkbox
                checked={this.state.stimmeUngueltig}
                onClick={() =>
                  this.setState(state => ({
                    stimmeUngueltig: !state.stimmeUngueltig
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
      return (
        <Card title={"Zweitstimme"} style={{ minHeight: "100%" }}>
          <Row type={"flex"} justify={"end"}>
            <Col>
              <Checkbox
                checked={this.state.stimmeUngueltig}
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
              <Button onClick={() => this.onClickBack()}>Zurück</Button>
            </Col>
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
          <Row type={"flex"}>
            {Object.keys(this.data).map(parteiid =>
              //just hand over the party of the first candidate as they are already sorted according to their parties
              this.renderParteiListenCard(
                this.data[+parteiid][0].kandidat.partei,
                this.data[+parteiid]
              )
            )}
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
