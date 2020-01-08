import { Button, Card, Col, message, Row } from "antd";
import * as React from "react";
import { RouteComponentProps } from "react-router";
import { ErststimmePage } from "../general/ErststimmePage";
import { ZweitstimmePage } from "../general/ZweitstimmePage";
import { Kandidat, Partei, Stimmkreis } from "../../../../shared/graphql.types";
import { StimmAbgabePage } from "../general/StimmAngabePage";

export interface IWaehlenPageProps {
  routeProps: RouteComponentProps<any>;
}

interface IProps extends IWaehlenPageProps {}

interface IState {
  rechtsbelehrung: boolean;
  //flags that shows whether first/ second vote was committed (also set if the vote was set unvalid by the user)
  erststimme_abgg: boolean;
  zweitstimme_abgg: boolean;
  //the candidates that where selected by the user (stay undefined if the vote is set unvalid)
  selectedErststimme: {
    kandidat: Kandidat;
    ungueltig: boolean;
  };
  selectedZweitstimme: {
    kandidat: Kandidat;
    partei: Partei;
    ungueltig: boolean;
  };
  commitVote: boolean;
  committed: boolean;
}

const LOREM_IPSUM = `
Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.   
Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim qui blandit praesent luptatum zzril delenit augue duis dolore te feugait nulla facilisi. Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.   
Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat. Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim qui blandit praesent luptatum zzril delenit augue duis dolore te feugait nulla facilisi.   
Nam liber tempor cum soluta nobis eleifend option congue nihil imperdiet doming id quod mazim placerat facer possim assum. Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat.   
Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis.   
At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, At accusam aliquyam diam diam dolore dolores duo eirmod eos erat, et nonumy sed tempor et et invidunt justo labore Stet clita ea et gubergren, kasd magna no rebum. sanctus sea sed takimata ut vero voluptua. est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat.   
Consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus.   
Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.   
Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim qui blandit praesent luptatum zzril delenit augue duis dolore te feugait nulla facilisi. Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.   
Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat. Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim qui blandit praesent luptatum zzril delenit.   
`;

const FACE_PALM = `
🤦🏻‍♀️🤦🏿🤦🏽🤦🏼‍♀️🤦🏻🤦🏾‍♀️🤦🏻‍♀️🤦🏿🤦🏽🤦🏼‍♀️🤦🏻🤦🏾‍♀️🤦🏻‍♀️🤦🏿🤦🏽🤦🏼‍♀️🤦🏻🤦🏾‍♀️🤦🏻‍♀️🤦🏿🤦🏽🤦🏼‍♀️🤦🏻🤦🏾‍♀️🤦🏻‍♀️🤦🏿🤦🏽🤦🏼‍♀️🤦🏻🤦🏾‍♀️🤦🏻‍♀️🤦🏿🤦🏽🤦🏼‍♀️🤦🏻🤦🏾‍♀️
`;

class WaehlenPageComponent extends React.PureComponent<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      rechtsbelehrung: false,
      erststimme_abgg: false,
      zweitstimme_abgg: false,
      commitVote: false,
      committed: false,
      selectedErststimme: {
        kandidat: null,
        ungueltig: false
      },
      selectedZweitstimme: {
        kandidat: null,
        partei: null,
        ungueltig: false
      }
    };
  }
  private renderRechtsbelehrung = () => (
    <Card
      title={"Wählen - Rechtsbehelfsbelehrung"}
      style={{ minHeight: "100%" }}
      hoverable={true}
    >
      <div style={{ textAlign: "justify" }}>{LOREM_IPSUM}</div>
      <Row
        type={"flex"}
        gutter={16}
        justify={"end"}
        style={{ marginTop: "15px" }}
      >
        <Col>
          <Button
            style={{ float: "right" }}
            onClick={() => {
              message.info(FACE_PALM);
            }}
          >
            Nö, nicht verstanden
          </Button>
        </Col>
        <Col>
          <Button
            type={"primary"}
            style={{ float: "right" }}
            onClick={() => {
              this.setState({ rechtsbelehrung: true });
            }}
          >
            Zur Kenntniss genommen
          </Button>
        </Col>
      </Row>
    </Card>
  );

  private renderErststimme = () => (
    <ErststimmePage
      routeProps={this.props.routeProps}
      wahl={{ id: 2, wahldatum: new Date() }}
      stimmkreis={{ id: 101, name: "München-Mitte" }}
      onChangeErststimmeAbgg={(newValue: boolean) =>
        this.setState({ erststimme_abgg: newValue })
      }
      onChangeDirektkandidat={(chosen: {
        kandidat: Kandidat;
        ungueltig: boolean;
      }) => this.setState({ selectedErststimme: chosen })}
    />
  );

  private renderZweitstimme = () => (
    <ZweitstimmePage
      wahl={{ id: 2, wahldatum: new Date() }}
      stimmkreis={{ id: 101, name: "München-Mitte" }}
      onChangeZweitstimmeAbgg={(newValue: boolean) =>
        this.setState({ zweitstimme_abgg: newValue })
      }
      onChangeZweitStimme={(chosen: {
        kandidat: Kandidat;
        partei: Partei;
        ungueltig: boolean;
      }) => this.setState({ selectedZweitstimme: chosen })}
    />
  );

  render() {
    console.log(this.state.erststimme_abgg);
    if (!this.state.rechtsbelehrung) {
      return this.renderRechtsbelehrung();
    } else if (!this.state.erststimme_abgg) {
      return this.renderErststimme();
    } else if (!this.state.zweitstimme_abgg) {
      console.log(this.state.selectedErststimme);
      return this.renderZweitstimme();
    } else if (!this.state.committed) {
      console.log("Stimmen abgeben:");
      console.log(this.state.selectedErststimme);
      console.log(this.state.selectedZweitstimme);
      return (
        <StimmAbgabePage
          erststimme={this.state.selectedErststimme}
          zweitstimme={this.state.selectedZweitstimme}
          onClickCommit={(commit: boolean) =>
            this.setState({ commitVote: commit })
          }
          committedVote={false}
        />
      );
    } else {
      return (
        <StimmAbgabePage
          erststimme={this.state.selectedErststimme}
          zweitstimme={this.state.selectedZweitstimme}
          onClickCommit={(commit: boolean) =>
            this.setState({ commitVote: commit })
          }
          committedVote={true}
        />
      );
    }
  }
}

export const WaehlenPage = WaehlenPageComponent;

// export const WaehlenPage = (props: IWaehlenPageProps) => (
//   <Card
//     title={"Wählen - Rechtsbehelfsbelehrung"}
//     style={{ minHeight: "100%" }}
//     hoverable={true}
//   >
//     <div style={{ textAlign: "justify" }}>{LOREM_IPSUM}</div>
//     <Row
//       type={"flex"}
//       gutter={16}
//       justify={"end"}
//       style={{ marginTop: "15px" }}
//     >
//       <Col>
//         <Button
//           style={{ float: "right" }}
//           onClick={() => {
//             message.info(FACE_PALM);
//           }}
//         >
//           Nö, nicht verstanden
//         </Button>
//       </Col>
//       <Col>
//         <Button
//           type={"primary"}
//           style={{ float: "right" }}
//           onClick={() => {
//             message.error("Unimplemented");
//           }}
//         >
//           Zur Kenntniss genommen
//         </Button>
//       </Col>
//     </Row>
//   </Card>
// );
