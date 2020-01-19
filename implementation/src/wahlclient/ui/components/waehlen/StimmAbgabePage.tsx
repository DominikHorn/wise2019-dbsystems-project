import * as React from "react";
import { Card, Button, Row, Col } from "antd";
import { Kandidat, Partei } from "../../../../shared/graphql.types";

interface IState {}

export interface IProps {
  erststimme: {
    kandidat: Kandidat;
    ungueltig: boolean;
  };
  zweitstimme: {
    kandidat: Kandidat;
    partei: Partei;
    ungueltig: boolean;
  };
  onClickCommit: any;
  onClickBack: any;
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
          <Button onClick={() => this.props.onClickBack()}>Zurück</Button>
          <Button type={"primary"} onClick={this.props.onClickCommit(true)}>
            Stimme abgeben
          </Button>
        </Row>
      </Card>
    );
  }
}
