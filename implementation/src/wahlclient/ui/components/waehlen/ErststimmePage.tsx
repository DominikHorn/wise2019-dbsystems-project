import { Button, Card, Checkbox, Col, Divider, Icon, Row, Tooltip } from "antd";
import * as React from "react";
import { compose } from "react-apollo";
import {
  IGetDirektKandidatenQueryHocProps,
  withDirektKandidatenQuery
} from "../../../../client-graphql/wahlen/getDirektKandidatenQuery";
import { Kandidat, Stimmkreis, Wahl } from "../../../../shared/graphql.types";

interface ErststimmePageProps {
  readonly wahl: Wahl;
  readonly stimmkreis: Stimmkreis;
  readonly selectedKandidat?: Kandidat | null;
  readonly onSelectKandidat: (selected?: Kandidat | null) => void;

  readonly goToNextTab: () => void;
  readonly goToPreviousTab: () => void;
}

export interface IProps
  extends ErststimmePageProps,
    IGetDirektKandidatenQueryHocProps {}

class ErststimmePageComponent extends React.PureComponent<IProps> {
  private renderKandidatBox = (kandidat: Kandidat) => (
    <Card
      className={"candidat-card"}
      style={{ borderColor: "#365592" }}
      hoverable={true}
      onClick={() => this.props.onSelectKandidat(kandidat)}
    >
      <b>{kandidat.partei.name}</b>
      <br />
      <Checkbox
        checked={
          this.props.selectedKandidat &&
          this.props.selectedKandidat.id === kandidat.id
        }
      >
        {kandidat.name}
      </Checkbox>
    </Card>
  );

  private renderPageControls = () => (
    <Row type={"flex"} justify={"start"} align={"middle"} gutter={16}>
      <Col span={16}>
        <Button
          style={{ marginRight: "8px" }}
          onClick={this.props.goToPreviousTab}
          icon={"fire"}
        >
          Zurück
        </Button>
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
            style={{ marginRight: "8px" }}
          >
            Weiter
            <Icon type={"right"} />
          </Button>
        </Tooltip>
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
    </Row>
  );

  render() {
    const { direktKandidatenData } = this.props;

    const kandidaten =
      direktKandidatenData && direktKandidatenData.direktKandidaten;

    const numCols = 4;

    return (
      <>
        {this.renderPageControls()}
        <Divider />
        <Row type={"flex"} justify={"start"} gutter={[16, 16]}>
          {(kandidaten || []).map(kandidat => (
            <Col span={24 / numCols} key={kandidat.id}>
              {this.renderKandidatBox(kandidat)}
            </Col>
          ))}
        </Row>
      </>
    );
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
