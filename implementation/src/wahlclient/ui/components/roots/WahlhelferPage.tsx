import { Alert, Button, Card, Col, message, Row } from "antd";
import Password from "antd/lib/input/Password";
import * as React from "react";
import * as QrReader from "react-qr-reader";
import { RouteComponentProps } from "react-router";
import { WahlkabinenTable } from "../wahlhelfer/WahlkabinenTable";

export interface IWahlhelferPageProps {
  routeProps: RouteComponentProps<any>;
}

interface IState {
  readonly wahlhelferToken?: string;
  readonly qrCodeError?: Error;
}

export class WahlhelferPage extends React.PureComponent<
  IWahlhelferPageProps,
  IState
> {
  constructor(props: IWahlhelferPageProps) {
    super(props);
    this.state = {};
  }

  private renderAuthenticatedWahlhelferUI = () => (
    <>
      <Row type={"flex"} gutter={[16, 16]} justify={"end"}>
        <Col>
          <Button disabled={true}>Stimmeintragung</Button>
        </Col>
      </Row>
      <Row
        type={"flex"}
        gutter={[16, 16]}
        justify={"start"}
        style={{ marginTop: "15px", marginBottom: "15px" }}
      >
        <Col span={24}>
          <WahlkabinenTable wahlhelferAuth={this.state.wahlhelferToken} />
        </Col>
      </Row>
    </>
  );

  private onQrReaderError = (qrCodeError: Error) =>
    this.setState({ qrCodeError });

  private onQrReaderScan = (wahlhelferToken: string | null) => {
    if (!wahlhelferToken) {
      return;
    }
    message.success(`Token erfolgreich ausgelesen`);
    this.setState({ wahlhelferToken });
  };

  private renderUnauthenticatedWahlhelferUI = () => (
    <>
      <Row type={"flex"} justify={"center"}>
        <Col span={10}>
          <QrReader
            onError={this.onQrReaderError}
            onScan={this.onQrReaderScan}
            style={{ width: "100%", height: "100%" }}
          />
        </Col>
      </Row>
      <Row type={"flex"} justify={"center"}>
        <Col span={10}>
          <div
            style={{
              textAlign: "justify",
              fontWeight: "bolder",
              fontSize: "14pt"
            }}
          >
            Bitte halten Sie das vom Wahlleiter für Ihren Stimmkreis
            ausgestellte Authentifizierungstoken in QR-Code Form vor die Kamera.
            Alternativ können Sie Ihr Token auch händisch oben rechts eintippen
          </div>
        </Col>
      </Row>
      {this.state.qrCodeError && (
        <Alert
          type={"error"}
          message={`Auslesen des Tokens fehlgeschlagen: ${this.state.qrCodeError.message}`}
        />
      )}
    </>
  );

  render() {
    const { wahlhelferToken } = this.state;

    return (
      <Card
        title={"WahlhelferInnen Funktionen"}
        style={{ minHeight: "100%" }}
        hoverable={true}
        extra={
          <Password
            value={this.state.wahlhelferToken}
            onChange={i => this.setState({ wahlhelferToken: i.target.value })}
            placeholder={"Bitte Token eingeben"}
          />
        }
      >
        {wahlhelferToken
          ? this.renderAuthenticatedWahlhelferUI()
          : this.renderUnauthenticatedWahlhelferUI()}
      </Card>
    );
  }
}
