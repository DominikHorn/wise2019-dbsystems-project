import {
  Button,
  Card,
  Checkbox,
  Col,
  Row,
  Spin,
  Icon,
  message,
  Divider,
  Tooltip
} from "antd";
import * as React from "react";
import { compose } from "react-apollo";
import {
  IGetAllDirektKandidatenQueryHocProps,
  withDirektKandidatenQuery
} from "../../../../client-graphql/wahlen/getAllKandidatenQuery";
import { Stimmkreis, Wahl, Kandidat } from "../../../../shared/graphql.types";
import "./ErststimmePage.css";
import memoize from "memoize-one";

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
    IGetAllDirektKandidatenQueryHocProps {}

class ErststimmePageComponent extends React.PureComponent<IProps> {
  private renderUngueltigBox = () => (
    <Card
      className={"ungueltig-card"}
      hoverable={true}
      onClick={() => this.props.onSelectKandidat(null)}
    >
      <Checkbox checked={this.props.selectedKandidat === null}>
        Stimme ungültig machen
      </Checkbox>
    </Card>
  );

  private renderKandidatBox = (kandidat: Kandidat) => (
    <Card
      className={"candidat-card"}
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
        <Divider />
        <Row type={"flex"} justify={"start"} gutter={[16, 16]}>
          <Col span={24 / numCols}>{this.renderUngueltigBox()}</Col>
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
