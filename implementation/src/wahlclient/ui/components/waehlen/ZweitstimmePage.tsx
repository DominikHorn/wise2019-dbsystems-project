import {
  Button,
  Card,
  Checkbox,
  Col,
  Divider,
  Icon,
  Input,
  Row,
  Tooltip
} from "antd";
import memoize from "memoize-one";
import * as React from "react";
import { compose } from "react-apollo";
import {
  QueryToGetListenKandidatenHOCProps,
  withListenKandidaten
} from "../../../../client-graphql/wahlen/getListenKandidatenQuery";
import {
  Kandidat,
  ListenKandidat,
  Partei,
  Regierungsbezirk,
  Wahl
} from "../../../../shared/graphql.types";

interface ZweitstimmePageProps {
  readonly wahl: Wahl;
  readonly regierungsbezirk: Regierungsbezirk;
  readonly selectedKandidat?: Kandidat | null;
  readonly selectedParty?: Partei | null;
  readonly onSelectKandidat: (selected?: Kandidat | null) => void;
  readonly onSelectParty: (selected?: Partei | null) => void;

  readonly goToNextTab: () => void;
  readonly goToPreviousTab: () => void;
}

export interface IProps
  extends ZweitstimmePageProps,
    QueryToGetListenKandidatenHOCProps {}

interface IState {
  readonly searchString?: string;
}

type ParteiListenData = {
  [parteiID: number]: ListenKandidat[];
};

class ZweitstimmePageComponent extends React.PureComponent<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {};
  }

  private getParteiListenData = memoize(
    (listenKandidaten: ListenKandidat[]) => {
      const unordered = listenKandidaten.reduce(
        (aggr, curr) => ({
          ...aggr,
          [curr.kandidat.partei.id]: (
            aggr[curr.kandidat.partei.id] || []
          ).concat(curr)
        }),
        {} as ParteiListenData
      );
      const ordered: ParteiListenData = {};
      for (const key of Object.keys(unordered)) {
        const parteiID = Number(key);
        ordered[parteiID] = unordered[parteiID].sort((a, b) =>
          a.platz < b.platz ? -1 : a.platz > b.platz ? 1 : 0
        );
      }
      return ordered;
    }
  );

  private getFilteredParteiListenData = memoize(
    (parteiListenData: ParteiListenData, searchString?: string) => {
      if (!searchString) return parteiListenData;

      const parteiIDs = Object.keys(parteiListenData).map(Number);
      const res: ParteiListenData = {};
      for (const parteiID of parteiIDs) {
        if (
          parteiListenData[parteiID][0].kandidat.partei.name.match(
            new RegExp(searchString, "i")
          )
        ) {
          res[parteiID] = parteiListenData[parteiID];
          continue;
        }

        const searchStringParts = searchString.split(" ");
        const filteredCandidates = parteiListenData[parteiID].filter(lk =>
          searchStringParts.every(ss =>
            lk.kandidat.name.match(new RegExp(ss, "i"))
          )
        );
        if (filteredCandidates.length > 0) {
          res[parteiID] = filteredCandidates;
        }
      }

      return res;
    }
  );

  private numCols = 3;
  private renderParteiListen = (parteiListenData: ParteiListenData) => {
    const filteredParteiListenData = this.getFilteredParteiListenData(
      parteiListenData,
      this.state.searchString
    );
    const partyCount = Object.keys(filteredParteiListenData).length;
    const columnCount =
      partyCount <= 0 ? this.numCols : Math.min(this.numCols, partyCount);
    const checkboxColSpan = columnCount < this.numCols ? 24 / this.numCols : 24;

    return (
      <Row type={"flex"} gutter={[16, 16]} justify={"start"}>
        {Object.keys(filteredParteiListenData).map(key => {
          const parteiID = Number(key);
          return (
            <Col key={parteiID} span={24 / columnCount}>
              <Card
                style={{
                  borderColor: "#365592",
                  height: "100%"
                }}
                title={
                  filteredParteiListenData[parteiID][0].kandidat.partei.name
                }
                extra={
                  <Checkbox
                    checked={
                      this.props.selectedParty &&
                      this.props.selectedParty.id === parteiID
                    }
                    onChange={() =>
                      this.props.onSelectParty(
                        filteredParteiListenData[parteiID][0].kandidat.partei
                      )
                    }
                  >
                    Liste wählen
                  </Checkbox>
                }
                hoverable={true}
              >
                <Row type={"flex"} justify={"start"} align={"middle"}>
                  {filteredParteiListenData[parteiID].map(lk => (
                    <Col key={lk.kandidat.id} span={checkboxColSpan}>
                      <Checkbox
                        checked={
                          this.props.selectedKandidat &&
                          this.props.selectedKandidat.id === lk.kandidat.id
                        }
                        onChange={() =>
                          this.props.onSelectKandidat(lk.kandidat)
                        }
                      >
                        {`${`${lk.platz}`.padStart(2, "0")}. ${
                          lk.kandidat.name
                        }`}
                      </Checkbox>
                    </Col>
                  ))}
                </Row>
              </Card>
            </Col>
          );
        })}
      </Row>
    );
  };

  private renderPageControls = () => (
    <Row type={"flex"} justify={"start"} align={"middle"} gutter={16}>
      <Col span={12}>
        <Button
          style={{ marginRight: "8px" }}
          onClick={this.props.goToPreviousTab}
          icon={"left"}
        >
          Zurück
        </Button>
        <Tooltip
          title={
            this.props.selectedKandidat === undefined
              ? "Bitte wählen Sie einen Kandidaten oder eine Partei oder markieren Sie Ihre Stimme explizit als ungültig"
              : undefined
          }
        >
          <Button
            type={"primary"}
            disabled={this.props.selectedKandidat === undefined}
            onClick={this.props.goToNextTab}
            style={{ marginRight: "8px" }}
          >
            Weiter
            <Icon type={"right"} />
          </Button>
        </Tooltip>
        <b>
          {this.props.selectedKandidat === undefined &&
          this.props.selectedParty === undefined
            ? "Keine Auswahl getroffen"
            : `Aktuelle Auswahl: ${
                this.props.selectedKandidat === null &&
                this.props.selectedParty === null
                  ? "Zweitstimme ungültig gemacht"
                  : this.props.selectedKandidat
                  ? `${this.props.selectedKandidat.name} (${this.props.selectedKandidat.partei.name})`
                  : `${this.props.selectedParty.name} Liste`
              }`}
        </b>
      </Col>
      <Col span={12}>
        <Row type={"flex"} justify={"end"} gutter={16}>
          <Col span={8}>
            <Button
              type={"danger"}
              icon={"issues-close"}
              onClick={() => this.props.onSelectKandidat(null)}
              style={{ float: "right" }}
            >
              Stimme ungültig machen
            </Button>
          </Col>
          <Col span={16}>
            <Input.Search
              placeholder={"Suchen nach einer Partei oder Kandidaten"}
              value={this.state.searchString}
              onChange={e =>
                this.setState({
                  searchString: e.target.value
                })
              }
            />
          </Col>
        </Row>
      </Col>
    </Row>
  );
  render() {
    const { listenKandidatenData } = this.props;
    const parteiListenData =
      listenKandidatenData &&
      listenKandidatenData.listenKandidaten &&
      this.getParteiListenData(listenKandidatenData.listenKandidaten);

    return (
      <>
        {this.renderPageControls()}
        <Divider />
        {parteiListenData && this.renderParteiListen(parteiListenData)}
      </>
    );
  }
}

const ZweitstimmePageWithQueries = compose(
  withListenKandidaten<ZweitstimmePageProps>(
    props => props.wahl.id,
    props => props.regierungsbezirk.id
  )
)(ZweitstimmePageComponent);

export const ZweitstimmePage = ZweitstimmePageWithQueries as React.ComponentType<
  ZweitstimmePageProps
>;
