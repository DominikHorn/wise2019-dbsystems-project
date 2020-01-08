import * as React from "react";
import { IKandidat, IPartei } from "../../../../shared/sharedTypes";
import { Card, Button, Row, Col } from "antd";

interface IState {}

export interface IProps {
  erststimme: {
    kandidat: IKandidat;
    ungueltig: boolean;
  };
  zweitstimme: {
    kandidat: IKandidat;
    partei: IPartei;
    ungueltig: boolean;
  };
  onClickCommit: any;
  committedVote: boolean;
}

export class StimmAbgabePage extends React.PureComponent<IProps, IState> {
  constructor(props: IProps) {
    super(props);
  }

  private renderErststimme() {
    console.log(this.props.erststimme);
    if (this.props.erststimme.ungueltig) {
      return (
        <>
          <Col>Ihre Erststimme: </Col>
          <Col>ungueltig</Col>
        </>
      );
    } else {
      return (
        <>
          <Col>Ihre Erststimme: </Col>
          <Col>{this.props.erststimme.kandidat.name}</Col>
        </>
      );
    }
  }
  private renderZweitstimme() {
    if (this.props.zweitstimme.ungueltig) {
      return (
        <>
          <Col>Ihre Zweitstimme: </Col>
          <Col>ungueltig</Col>
        </>
      );
    } else if (!(this.props.zweitstimme.kandidat === null)) {
      return (
        <>
          <Col>Ihre Zweitstimme: </Col>
          <Col>{this.props.zweitstimme.kandidat.name}</Col>
        </>
      );
    } else {
      return (
        <>
          <Col>Ihre Zweitstimme: </Col>
          <Col>{this.props.zweitstimme.partei.name}</Col>
        </>
      );
    }
  }

  render() {
    if (this.props.committedVote) {
      return (
        <Card title={"Stimmen abgeben"} style={{ minHeight: "100%" }}>
          Ihre Stimme wurde erfolgreich abgegeben. Sie können die Wahlkabine nun
          verlassen
        </Card>
      );
    }
    return (
      <Card
        title={"Bitte bestätigen Sie die Korrektheit Ihrer Stimmabgabe"}
        style={{ minHeight: "100%" }}
      >
        <Row>{this.renderErststimme()}</Row>
        <Row>{this.renderZweitstimme()}</Row>
        <Row type={"flex"} justify={"end"}>
          <Button type={"primary"} onClick={this.props.onClickCommit(true)}>
            Stimme abgeben
          </Button>
        </Row>
      </Card>
    );
  }
}
