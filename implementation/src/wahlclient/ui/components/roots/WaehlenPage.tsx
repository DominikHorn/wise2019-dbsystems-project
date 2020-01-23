import { Button, Col, message, Row } from "antd";
import * as QRCode from "qrcode.react";
import * as React from "react";
import { compose, withApollo, WithApolloClient } from "react-apollo";
import { isRegisteredGQL } from "../../../../client-graphql/wahlkabine/isRegisteredQuery";
import { withResetWahlkabineMutation } from "../../../../client-graphql/wahlkabine/resetWahlkabineMutation";
import { generateRandomToken } from "../../../../shared/token";
import { WaehlenController } from "../waehlen/WaehlenController";

export interface IWaehlenPageProps {}

interface IProps extends WithApolloClient<IWaehlenPageProps> {}

interface IState {
  readonly setupDone?: boolean;
  readonly wahlkabineToken: string;
}
class WaehlenPageComponent extends React.PureComponent<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      wahlkabineToken: generateRandomToken()
    };
  }

  private validateWahlkabineSetup = () => {
    this.props.client
      .query({
        query: isRegisteredGQL,
        variables: {
          wahlkabineToken: this.state.wahlkabineToken
        },
        fetchPolicy: "network-only"
      })
      .then(res => {
        if (!res || res.errors || !res.data.isRegistered) {
          message.error("Computer sagt nein");
          return;
        }
        message.success("Wahlkabine fertig konfiguriert");
        this.setState({ setupDone: true });
      })
      .catch(err => {
        message.error(`Fehler: ${err.message}`);
      });
  };

  private renderWahlkabineSetup = () => (
    <Row
      type={"flex"}
      justify={"center"}
      align={"middle"}
      style={{ width: "100%", height: "calc(100vh - 64px)" }}
    >
      <Col span={10}>
        <Row type={"flex"} justify={"center"} style={{ marginBottom: "16px" }}>
          <Col>
            <div
              style={{
                textAlign: "justify",
                fontSize: "12pt",
                fontWeight: "bolder"
              }}
            >
              {`Nutzen Sie den QR Code oder folgendes Token um die Wahlkabine
          in Ihrem Stimmkreis zu registrieren: `}
              <div
                style={{
                  fontFamily: "Courier New",
                  backgroundColor: "lightGray",
                  padding: "5px"
                }}
              >
                {this.state.wahlkabineToken}
              </div>
            </div>
          </Col>
        </Row>
        <Row type={"flex"} justify={"center"} style={{ marginBottom: "16px" }}>
          <Col>
            <QRCode
              bgColor={"#f0f2f5"}
              fgColor={"#000000"}
              level={"H"}
              size={512}
              value={this.state.wahlkabineToken}
            />
          </Col>
        </Row>

        <Row type={"flex"} justify={"center"}>
          <Col>
            <Button
              type={"primary"}
              icon={"check-circle"}
              onClick={this.validateWahlkabineSetup}
            >
              Validieren und Weiter
            </Button>
          </Col>
        </Row>
      </Col>
    </Row>
  );

  render() {
    const { setupDone } = this.state;

    if (!setupDone) {
      return this.renderWahlkabineSetup();
    }

    return <WaehlenController wahlkabineToken={this.state.wahlkabineToken} />;
  }
}

const WaehlenPageWithApollo = withApollo(WaehlenPageComponent);

const WaehlenPageWithQueries = compose(withResetWahlkabineMutation())(
  WaehlenPageWithApollo
);

export const WaehlenPage = WaehlenPageWithQueries as React.ComponentType<
  IWaehlenPageProps
>;
