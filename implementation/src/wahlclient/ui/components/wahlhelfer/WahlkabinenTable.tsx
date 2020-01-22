import * as React from "react";
import { compose } from "react-apollo";
import {
  withRegisteredWahlkabinen,
  QueryToGetRegisteredWahlkabinenHOCProps
} from "../../../../client-graphql/wahlkabine/getRegisteredWahlkabinenQuery";
import {
  withRegisterWahlkabineMutation,
  MutationToRegisterWahlkabineHOCProps
} from "../../../../client-graphql/wahlkabine/registerWahlkabineMutation";
import {
  Table,
  Row,
  Col,
  Button,
  Modal,
  Form,
  Alert,
  message,
  Input
} from "antd";
import {
  withRemoveWahlkabineMutation,
  MutationToRemoveWahlkabineHOCProps
} from "../../../../client-graphql/wahlkabine/removeWahlkabineMutation";
import * as QrReader from "react-qr-reader";
import Password from "antd/lib/input/Password";

export interface IWahlkabinenTableProps {
  readonly wahlhelferAuth: string;
}

interface IProps
  extends IWahlkabinenTableProps,
    QueryToGetRegisteredWahlkabinenHOCProps,
    MutationToRegisterWahlkabineHOCProps,
    MutationToRemoveWahlkabineHOCProps {}

interface IState {
  readonly modalVisible: boolean;
  readonly qrCodeError?: Error;
  readonly wahlkabinenToken?: string;
}

class WahlkabinenTableComponent extends React.PureComponent<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      modalVisible: false
    };
  }

  private onQrReaderError = (qrCodeError: Error) =>
    this.setState({ qrCodeError });

  private onQrReaderScan = (token?: string) => {
    if (!token) return;
    message.success("Token erfolgreich ausgelesen");
    this.setState({ wahlkabinenToken: token });
  };

  private renderTokenInput = () => (
    <>
      <Row
        type={"flex"}
        justify={"start"}
        gutter={[16, 16]}
        style={{ marginBottom: "8px" }}
      >
        <Col span={10}>
          <QrReader
            onError={this.onQrReaderError}
            onScan={this.onQrReaderScan}
            style={{ width: "100%", height: "100%" }}
          />
        </Col>
        <Col span={14}>
          <div style={{ lineHeight: "1.2", textAlign: "justify" }}>
            Bitte halten Sie den von der betreffenden Wahlkabine generierten
            QR-Code in den markierten Bereich oder geben das Token hier ein:
          </div>
          <Password
            value={this.state.wahlkabinenToken}
            placeholder={"Bitte Token eingeben"}
            onChange={i => this.setState({ wahlkabinenToken: i.target.value })}
          />
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

  private renderRegisterWahlkabineModal = () =>
    this.state.modalVisible && (
      <Modal
        visible={this.state.modalVisible}
        onCancel={() => this.setState({ modalVisible: false })}
      >
        <Form.Item label={"Bezeichnung"} required={true}>
          <Input placeholder={"Bitte eine Bezeichnung eingeben"} />
        </Form.Item>
        <Form.Item label={"Authentifizierung"} required={true}>
          {this.renderTokenInput()}
        </Form.Item>
      </Modal>
    );

  private renderTable = () => (
    <Table
      size={"small"}
      title={() => (
        <Row type={"flex"} gutter={[16, 16]} align={"middle"}>
          <Col>Authorisierte Wahlkabinen</Col>
          <Col>
            <Button
              icon={"plus"}
              type={"primary"}
              onClick={() => this.setState({ modalVisible: true })}
            >
              Neue Wahlkabine Authorisieren
            </Button>
          </Col>
        </Row>
      )}
      loading={this.props.registeredWahlkabinenData.loading}
      columns={[
        { title: "Label", key: "label", dataIndex: "label" },
        {
          title: "Manage",
          key: "manage",
          render: wahlkabine => (
            <Row
              type={"flex"}
              gutter={[8, 8]}
              justify={"center"}
              align={"middle"}
            >
              <Col>
                <Button type={"danger"} icon={"delete"} />
              </Col>
            </Row>
          )
        }
      ]}
      dataSource={this.props.registeredWahlkabinenData.wahlkabinen}
    />
  );

  render() {
    const { registeredWahlkabinenData } = this.props;
    if (!registeredWahlkabinenData) return <></>;

    return (
      <>
        {this.renderTable()}
        {this.renderRegisterWahlkabineModal()}
      </>
    );
  }
}

const WahlkabinenTableWithQueries = compose(
  withRegisterWahlkabineMutation(),
  withRemoveWahlkabineMutation(),
  withRegisteredWahlkabinen<IWahlkabinenTableProps>(p => p.wahlhelferAuth)
)(WahlkabinenTableComponent);

export const WahlkabinenTable = WahlkabinenTableWithQueries as React.ComponentType<
  IWahlkabinenTableProps
>;
