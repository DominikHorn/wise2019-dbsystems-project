import { Button, Card, Checkbox, Col, Row } from "antd";
import * as React from "react";
import { compose } from "react-apollo";
import {
  IGetAllDirektKandidatenQueryHocProps,
  withDirektKandidatenQuery
} from "../../../../client-graphql/wahlen/getAllKandidatenQuery";
import { EParteiName } from "../../../../shared/enums";
import {
  IKandidat,
  IListenKandidat,
  IPartei,
  IStimmkreis,
  IWahl
} from "../../../../shared/sharedTypes";

interface IState {
  readonly selectedCandidat?: IKandidat;
  readonly clickedCommit?: boolean;
  stimmeUngueltig: boolean;
  checked: {
    kandidat: number;
    partei: number;
  };
  chosen: {
    kandidat: IKandidat;
    partei: IPartei;
    ungueltig: boolean;
  };
}

interface ZweitstimmePageProps {
  readonly wahl: IWahl;
  readonly stimmkreis: IStimmkreis;
  onChangeZweitstimmeAbgg: any;
  onChangeZweitStimme: any;
  //readonly lists: IListenKandidat[];
}

export interface IProps
  extends ZweitstimmePageProps,
    IGetAllDirektKandidatenQueryHocProps {}

function mapData(list: IListenKandidat[]) {
  return list.reduce(
    (data: { [parteiID: number]: IListenKandidat[] }, listenKandidat) => ({
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

  candidatesAr: IListenKandidat[] = [
    {
      listenplatz: 1,
      kandidat: {
        id: 1,
        name: "Kandidat Name1",
        partei: { id: 1, name: EParteiName.CSU }
      }
    },
    {
      listenplatz: 2,
      kandidat: {
        id: 2,
        name: "Kandidat Name2",
        partei: { id: 1, name: EParteiName.CSU }
      }
    },
    {
      listenplatz: 3,
      kandidat: {
        id: 3,
        name: "Kandidat Name3",
        partei: { id: 1, name: EParteiName.CSU }
      }
    },
    {
      listenplatz: 4,
      kandidat: {
        id: 4,
        name: "Kandidat Name4",
        partei: { id: 1, name: EParteiName.CSU }
      }
    },
    {
      listenplatz: 1,
      kandidat: {
        id: 1,
        name: "Kandidat Name1",
        partei: { id: 2, name: EParteiName.SPD }
      }
    },
    {
      listenplatz: 2,
      kandidat: {
        id: 2,
        name: "Kandidat Name2",
        partei: { id: 2, name: EParteiName.SPD }
      }
    },
    {
      listenplatz: 3,
      kandidat: {
        id: 3,
        name: "Kandidat Name3",
        partei: { id: 2, name: EParteiName.SPD }
      }
    },
    {
      listenplatz: 4,
      kandidat: {
        id: 4,
        name: "Kandidat Name4",
        partei: { id: 2, name: EParteiName.SPD }
      }
    },
    {
      listenplatz: 5,
      kandidat: {
        id: 5,
        name: "Kandidat Name5",
        partei: { id: 2, name: EParteiName.SPD }
      }
    },
    {
      listenplatz: 6,
      kandidat: {
        id: 6,
        name: "Kandidat Name6",
        partei: { id: 2, name: EParteiName.SPD }
      }
    },
    {
      listenplatz: 1,
      kandidat: {
        id: 1,
        name: "Kandidat Name1",
        partei: { id: 4, name: EParteiName.GRUENE }
      }
    },
    {
      listenplatz: 2,
      kandidat: {
        id: 2,
        name: "Kandidat Name2",
        partei: { id: 4, name: EParteiName.GRUENE }
      }
    },
    {
      listenplatz: 3,
      kandidat: {
        id: 3,
        name: "Kandidat Name3",
        partei: { id: 4, name: EParteiName.GRUENE }
      }
    },
    {
      listenplatz: 4,
      kandidat: {
        id: 4,
        name: "Kandidat Name4",
        partei: { id: 4, name: EParteiName.GRUENE }
      }
    }
  ];

  data: { [parteiid: number]: IListenKandidat[] } = mapData(this.candidatesAr);

  private renderParteiListenCard(
    partei: IPartei,
    kandidaten: IListenKandidat[]
  ) {
    //debugger;
    //console.log("Rendering all cards");
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

  //to commit an unvalid vote means that a vote was committed but the candidate is undefined
  private commitInvalidVote() {
    this.props.onChangeZweitstimmeAbgg(this.state.stimmeUngueltig);
    // this.setState({
    //   chosen: { kandidat: null, partei: null, ungueltig: true }
    // });
    this.props.onChangeZweitStimme({
      kandidat: null,
      partei: null,
      ungueltig: true
    });
    console.log("committing invalid vote");
  }

  private commitValidVote() {
    //commiting a valid vote hands over the selected candidate to the WaehlenPage
    this.props.onChangeZweitstimmeAbgg(true);
    this.props.onChangeZweitStimme(this.state.chosen);
  }

  render() {
    console.log("Data: " + this.data);
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
              <Button
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
              <Button
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
