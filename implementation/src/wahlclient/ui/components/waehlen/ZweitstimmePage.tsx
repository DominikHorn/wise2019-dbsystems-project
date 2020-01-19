import {
  Button,
  Card,
  Checkbox,
  Col,
  Row,
  message,
  Tooltip,
  Icon,
  Divider
} from "antd";
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

interface ZweitstimmePageProps {
  readonly wahl: Wahl;
  readonly stimmkreis: Stimmkreis;
  readonly selectedKandidat?: Kandidat | null;
  readonly selectedParty?: Partei | null;
  readonly onSelectKandidat: (selected?: Kandidat | null) => void;
  readonly onSelectParty: (selected?: Partei | null) => void;

  readonly goToNextTab: () => void;
  readonly goToPreviousTab: () => void;
}

export interface IProps
  extends ZweitstimmePageProps,
    IGetAllDirektKandidatenQueryHocProps {}

class ZweitstimmePageComponent extends React.PureComponent<IProps> {
  // private renderParteiListenCard(partei: Partei, kandidaten: ListenKandidat[]) {
  //   return (
  //     <Col style={{ padding: "5px" }}>
  //       <Card style={{ width: "250px", borderColor: "#365592" }}>
  //         <Checkbox
  //           checked={this.state.checked.partei === partei.id}
  //           onClick={() =>
  //             this.setState({
  //               checked: { kandidat: null, partei: partei.id },
  //               chosen: {
  //                 kandidat: null,
  //                 partei: partei,
  //                 ungueltig: false
  //               }
  //             })
  //           }
  //           style={{ fontWeight: "bold", fontSize: "large" }}
  //         >
  //           {partei.name}
  //         </Checkbox>
  //         {kandidaten.map(kandidat => (
  //           <div>
  //             <Checkbox
  //               checked={this.state.checked.kandidat == kandidat.kandidat.id}
  //               onClick={() =>
  //                 this.setState({
  //                   checked: {
  //                     kandidat: kandidat.kandidat.id,
  //                     partei: null
  //                   },
  //                   chosen: {
  //                     kandidat: kandidat.kandidat,
  //                     partei: null,
  //                     ungueltig: false
  //                   }
  //                 })
  //               }
  //             >
  //               {kandidat.listenplatz + ".    " + kandidat.kandidat.name}
  //             </Checkbox>
  //           </div>
  //         ))}
  //       </Card>
  //     </Col>
  //   );
  // }
  private renderPageControls = () => (
    <Row type={"flex"} justify={"start"} align={"middle"} gutter={16}>
      <Col>
        <Button
          style={{ float: "left" }}
          onClick={this.props.goToPreviousTab}
          icon={"left"}
        >
          Zurück
        </Button>
      </Col>
      <Col>
        <Tooltip
          title={
            this.props.selectedKandidat === undefined
              ? "Bitte treffen Sie zuerst eine Auswahl"
              : undefined
          }
        >
          <Button
            type={"primary"}
            disabled={this.props.selectedKandidat === undefined}
            onClick={this.props.goToNextTab}
          >
            Weiter
            <Icon type={"right"} />
          </Button>
        </Tooltip>
      </Col>
      <Col>
        <b>
          {this.props.selectedKandidat === undefined
            ? "Keine Auswahl getroffen"
            : `Aktuelle Auswahl: ${
                this.props.selectedKandidat === null
                  ? "Erststimme ungültig gemacht"
                  : this.props.selectedKandidat.name
              }`}
        </b>
      </Col>
    </Row>
  );
  render() {
    return (
      <>
        {this.renderPageControls()}
        <Divider />
        <Row type={"flex"}>
          {/* {Object.keys(this.data).map(parteiid =>
            //just hand over the party of the first candidate as they are already sorted according to their parties
            this.renderParteiListenCard(
              this.data[+parteiid][0].kandidat.partei,
              this.data[+parteiid]
            )
          )} */}
        </Row>
      </>
    );
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
