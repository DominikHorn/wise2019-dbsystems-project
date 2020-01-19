import { Button, Card, Col, message, Row } from "antd";
import * as React from "react";
import { RouteComponentProps } from "react-router";
import { ErststimmePage } from "../general/ErststimmePage";
import { ZweitstimmePage } from "../general/ZweitstimmePage";
import { Kandidat, Partei } from "../../../../shared/graphql.types";

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
  selectedDirektkandidat?: Kandidat;
  selectedZweitstimme?: {
    kandidat: Kandidat;
    partei: Partei;
  };
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
      zweitstimme_abgg: false
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
      onChangeDirektkandidat={(candidate: Kandidat) =>
        this.setState({ selectedDirektkandidat: candidate })
      }
    />
  );

  private renderZweitstimme = () => (
    <ZweitstimmePage
      wahl={{ id: 2, wahldatum: new Date() }}
      stimmkreis={{ id: 101, name: "München-Mitte" }}
      onChangeErststimmeAbgg={(newValue: boolean) =>
        this.setState({ zweitstimme_abgg: newValue })
      }
      onChangeZweitStimme={(chosen: { kandidat: Kandidat; partei: Partei }) =>
        this.setState({ selectedZweitstimme: chosen })
      }
    />
  );

  render() {
    console.log(this.state.erststimme_abgg);
    if (!this.state.rechtsbelehrung) {
      return this.renderRechtsbelehrung();
    } else if (!this.state.erststimme_abgg) {
      return this.renderErststimme();
    } else if (!this.state.zweitstimme_abgg) {
      console.log(this.state.selectedDirektkandidat);
      return this.renderZweitstimme();
    } else {
      console.log("Stimmen abgeben:");
      console.log(this.state.selectedDirektkandidat);
      console.log(this.state.selectedZweitstimme);
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
