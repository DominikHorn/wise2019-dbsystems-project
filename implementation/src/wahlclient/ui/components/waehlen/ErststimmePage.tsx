import { Button, Card, Checkbox, Col, Row } from "antd";
import * as React from "react";
import { compose } from "react-apollo";
import {
  IGetAllDirektKandidatenQueryHocProps,
  withDirektKandidatenQuery
} from "../../../../client-graphql/wahlen/getAllKandidatenQuery";
import { Stimmkreis, Wahl } from "../../../../shared/graphql.types";
import "./ErststimmePage.css";

interface ErststimmePageProps {
  readonly wahl: Wahl;
  readonly stimmkreis: Stimmkreis;

  readonly goToNextTab: () => void;
  readonly goToPreviousTab: () => void;
}

export interface IProps
  extends ErststimmePageProps,
    IGetAllDirektKandidatenQueryHocProps {}

class ErststimmePageComponent extends React.PureComponent<IProps> {
  // private renderCard = (item: boolean, i: number) => (
  //   <Card className={"candidat-card"}>
  //     <p>
  //       <input
  //         key={i}
  //         type="checkbox"
  //         checked={item}
  //         onChange={
  //           e =>
  //             this.onChange(e, i) /* notice passing an index. we will use it */
  //         }
  //       />
  //       {this.candidatesAr[i].partei.name}
  //     </p>
  //     <p>{this.candidatesAr[i].name}</p>
  //   </Card>
  // );

  render() {
    console.log(
      "direktKandidaten:",
      this.props.direktKandidatenData &&
        this.props.direktKandidatenData.direktKandidaten
    );
    return (
      <>
        <Row type={"flex"} justify={"end"}>
          <Col>
            <Checkbox onClick={() => {}}>Stimme ungültig machen</Checkbox>
          </Col>
        </Row>
        <Col>
          <Button onClick={() => {}}>Zurück</Button>
        </Col>
        <Row type={"flex"} justify={"end"}>
          <Col>
            <Button type={"primary"} onClick={() => {}}>
              Weiter
            </Button>
          </Col>
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
