import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  List,
  message,
  Modal,
  Row,
  Checkbox,
  Table,
  Switch,
  Input,
  Alert,
  Icon,
  Divider
} from "antd";
import locale from "antd/es/date-picker/locale/de_DE";
import { FormComponentProps } from "antd/lib/form";
import { GetFieldDecoratorOptions } from "antd/lib/form/Form";
import { UploadFile } from "antd/lib/upload/interface";
import * as moment from "moment";
import * as React from "react";
import { compose } from "react-apollo";
import { RouteComponentProps } from "react-router";
import { renderLoading } from "../../guiUtil";
import { withErrorBoundary } from "../general/ErrorBoundary";
import { FilePickerComponent } from "../general/FilePickerComponent";
import "./WahlleiterPage.css";
import {
  IImportCSVDataMutationHocProps,
  withImportCSVDataMutation
} from "../../../../client-graphql/wahlleiter/importCSVDataMutation";
import {
  IComputeElectionResultsMutationHocProps,
  withComputeElectionResultsMutation
} from "../../../../client-graphql/wahlleiter/computeElectionResultsMutation";
import {
  IGetAllWahlenQueryHocProps,
  withAllWahlenQuery
} from "../../../../client-graphql/public/getAllWahlenQuery";
import {
  ISetDataBlockedMutationHOCProps,
  withSetDataBlockedMutation
} from "../../../../client-graphql/wahlleiter/setDataBlockedMutation";
import { WahlhelferToken } from "../../../../shared/graphql.types";
import {
  withGenerateWahlhelferTokensMutation,
  IGenerateWahlhelferTokensHOCProps
} from "../../../../client-graphql/wahlleiter/generateWahlhelferTokensMutation";
import { WahltokenPDFExporter } from "../general/WahltokenPDFExporter";
import * as QRCode from "qrcode.react";

const { Password } = Input;

export interface IWahlleiterPageProps {
  routeProps: RouteComponentProps<any>;
}

interface IProps
  extends IWahlleiterPageProps,
    FormComponentProps,
    ISetDataBlockedMutationHOCProps,
    IGenerateWahlhelferTokensHOCProps,
    IImportCSVDataMutationHocProps,
    IComputeElectionResultsMutationHocProps,
    IGetAllWahlenQueryHocProps {}

interface IState {
  wahlleiterAuth: string;
  modalVisible: boolean;
  voteComputationLoading: boolean;
  uploadLoading: boolean;
  wahlhelferTokensLoading: boolean;
  wahlhelferTokens?: WahlhelferToken[];
}

class WahlleiterPageComponent extends React.PureComponent<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      wahlleiterAuth: "",
      modalVisible: false,
      voteComputationLoading: false,
      wahlhelferTokensLoading: false,
      uploadLoading: false
    };
  }

  private onGenerateWahlhelferTokens = () =>
    this.setState({ wahlhelferTokensLoading: true }, () =>
      this.props
        .generateWahlhelferTokens({ wahlleiterAuth: this.state.wahlleiterAuth })
        .then(res =>
          this.setState({
            wahlhelferTokens: res && res.data.wahlhelferTokens
          })
        )
        .catch(err => {
          message.error(`Error generating tokens: ${err.message}`);
        })
        .finally(() => this.setState({ wahlhelferTokensLoading: false }))
    );

  private onComputeElectionResults = () => {
    this.setState({ voteComputationLoading: true });
    this.props
      .computeElectionResults({ wahlleiterAuth: this.state.wahlleiterAuth })
      .then(res => {
        this.setState({ voteComputationLoading: false });
        if (res && res.data.success) {
          message.success(`Successfully computed election results`);
        } else {
          message.error(`Server refused to compute election results`);
        }
      })
      .catch(err => {
        this.setState({ voteComputationLoading: false });
        message.error(`Failed to compute election results: ${err}`);
      });
  };

  private onCancelUploadModal = () =>
    this.setState({ modalVisible: false }, this.props.form.resetFields);

  private handleSubmitUploadModal = (e: React.FormEvent<any>) => {
    // No further propagation
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        this.setState({ uploadLoading: true });
        this.props
          .importCSVData({
            wahlleiterAuth: this.state.wahlleiterAuth,
            files: values.files.map((f: UploadFile) => f.originFileObj),
            wahldatum: values.wahldatum.add(2, "hours").toDate(),
            aggregiert: values.save_aggr
          })
          .then(res => {
            this.setState({ uploadLoading: false });
            if (res && res.data.success) {
              this.props.allWahlenData.refetch();
              this.setState({ modalVisible: false });
              this.props.form.resetFields();
              message.success(
                `Successfully imported CSV file${
                  values.files.length > 0 ? "s" : ""
                }`
              );
            } else {
              message.error(`Server refused to import CSV File`);
            }
          })
          .catch(error => {
            this.setState({ uploadLoading: false });
            message.error(`Failed to import CSV file: ${error.message}`);
          });
      }
    });
  };

  private renderUploadForm = (
    getFieldDecorator: <T extends Object = {}>(
      id: keyof T,
      options?: GetFieldDecoratorOptions
    ) => (node: React.ReactNode) => React.ReactNode
  ) => (
    <Form onSubmit={this.handleSubmitUploadModal}>
      <Form.Item label={"Wahldatum"}>
        {getFieldDecorator("wahldatum", {
          rules: [
            {
              required: true,
              message:
                "Bitte ein Wahldatum für die Zuordnung der CSV Dateien festlegen"
            }
          ]
        })(
          <DatePicker
            locale={locale}
            format={"DD.MM.YYYY"}
            placeholder={"Datum der Wahl"}
            style={{ minWidth: "100%" }}
            renderExtraFooter={
              this.props.allWahlenData.loading
                ? renderLoading
                : !!this.props.allWahlenData.allWahlen &&
                  this.props.allWahlenData.allWahlen.length > 0 &&
                  (() => (
                    <List
                      dataSource={this.props.allWahlenData.allWahlen}
                      style={{ marginTop: "15px" }}
                      size={"small"}
                      renderItem={wahl => (
                        <List.Item
                          onClick={() =>
                            this.props.form.setFieldsValue({
                              wahldatum: moment(wahl.wahldatum)
                            })
                          }
                        >
                          <Button style={{ width: "100%" }}>
                            {wahl.wahldatum.toLocaleDateString("de-DE")}
                          </Button>
                        </List.Item>
                      )}
                    />
                  ))
            }
          />
        )}
      </Form.Item>
      <Form.Item label={"Dateien"}>
        {getFieldDecorator("files", {
          rules: [
            {
              required: true,
              message: "Bitte mindestens eine CSV Datei anhängen"
            }
          ],
          valuePropName: "fileList"
        })(
          <FilePickerComponent
            accept={`.csv`}
            multiple={true}
            placeholder={`Drag & Drop oder klicken um CSV Dateien auszuwählen`}
          />
        )}
      </Form.Item>
      <Form.Item label={"Aggregation"}>
        {getFieldDecorator("save_aggr", {
          valuePropName: "checked",
          initialValue: true
        })(<Checkbox>Stimmen voraggregiert abspeichern</Checkbox>)}
      </Form.Item>
    </Form>
  );

  private renderUploadModal = (
    getFieldDecorator: <T extends Object = {}>(
      id: keyof T,
      options?: GetFieldDecoratorOptions
    ) => (node: React.ReactNode) => React.ReactNode
  ) => (
    <>
      <Button
        onClick={() =>
          this.setState({ modalVisible: !this.state.modalVisible })
        }
        style={{ width: "100%" }}
        icon={"import"}
      >
        CSV Importieren
      </Button>
      <Modal
        title={"CSV Importieren"}
        visible={this.state.modalVisible}
        onCancel={this.onCancelUploadModal}
        footer={[
          <Button
            key={"discard"}
            icon={"delete"}
            onClick={this.onCancelUploadModal}
          >
            Verwerfen
          </Button>,
          <Button
            key={"submit"}
            icon={"cloud-upload-o"}
            type={"primary"}
            loading={this.state.uploadLoading}
            onClick={this.handleSubmitUploadModal}
          >
            Bestätigen
          </Button>
        ]}
      >
        {this.renderUploadForm(getFieldDecorator)}
      </Modal>
    </>
  );

  private renderWahlenTable = () => (
    <Table
      size={"small"}
      pagination={false}
      rowKey={"id"}
      columns={[
        { title: "ID", key: "id", dataIndex: "id" },
        {
          title: "Datum",
          key: "datum",
          render: props => props.wahldatum.toLocaleDateString()
        },
        {
          title: "Blockiert",
          key: "blocked",
          render: props => (
            <Switch
              checked={props.dataBlocked}
              onChange={val =>
                this.props
                  .setDataBlocked({
                    blocked: val,
                    wahlid: props.id,
                    wahlleiterAuth: this.state.wahlleiterAuth
                  })
                  .then(_ => this.props.allWahlenData.refetch())
                  .then(
                    () => {},
                    err => message.error(err.toString())
                  )
              }
            />
          )
        }
      ]}
      dataSource={this.props.allWahlenData.allWahlen || []}
      loading={this.props.allWahlenData.loading}
    />
  );

  private renderWahlhelferTokenTable = () => (
    <>
      <Divider />
      <Row type={"flex"} justify={"center"} style={{ marginTop: "15px" }}>
        <Col style={{ width: "100%" }}>
          <Table
            size={"small"}
            pagination={{ pageSize: 10 }}
            rowKey={"token"}
            title={() => (
              <Row type={"flex"} justify={"start"}>
                <Col>
                  <WahltokenPDFExporter
                    wahlhelferTokens={this.state.wahlhelferTokens}
                  />
                </Col>
              </Row>
            )}
            columns={[
              {
                title: "Wahl ID",
                key: "id",
                dataIndex: "wahl.id",
                width: 75
              },
              {
                title: "Datum",
                key: "datum",
                render: props => props.wahl.wahldatum.toLocaleDateString(),
                width: 100
              },
              {
                title: "Stimmkreis",
                key: "stimmkreis",
                render: props =>
                  `(${props.stimmkreis.id}) ${props.stimmkreis.name}`
              },
              {
                title: "Token",
                key: "token",
                width: 360,
                render: props => (
                  <span style={{ fontFamily: "Courier" }}>{props.token}</span>
                )
              },
              {
                title: "QR",
                key: "qr",
                width: 100,
                render: data => (
                  <QRCode
                    bgColor={"#FFFFFF"}
                    fgColor={"#000000"}
                    level={"L"}
                    size={64}
                    value={data.token}
                  />
                )
              }
            ]}
            dataSource={this.state.wahlhelferTokens || []}
          />
        </Col>
      </Row>
    </>
  );

  private renderAdminActions = () => (
    <Row type={"flex"} gutter={16} justify={"center"} align={"middle"}>
      {!!this.state.wahlleiterAuth && (
        <>
          <Col xs={24} sm={12} md={10} lg={8} xl={6} xxl={4}>
            <Row
              type={"flex"}
              justify={"center"}
              style={{ marginBottom: "8px" }}
            >
              <Col style={{ width: "100%" }}>
                {this.renderUploadModal(this.props.form.getFieldDecorator)}
              </Col>
            </Row>
            <Row
              type={"flex"}
              justify={"center"}
              style={{ marginBottom: "8px" }}
            >
              <Col style={{ width: "100%" }}>
                <Button
                  onClick={this.onComputeElectionResults}
                  loading={this.state.voteComputationLoading}
                  style={{ width: "100%" }}
                  icon={"calculator"}
                >
                  Ergebnisse berechnen
                </Button>
              </Col>
            </Row>
            <Row type={"flex"} justify={"center"}>
              <Col style={{ width: "100%" }}>
                <Button
                  onClick={this.onGenerateWahlhelferTokens}
                  loading={this.state.wahlhelferTokensLoading}
                  style={{ width: "100%" }}
                  icon={"code"}
                >
                  Wahlhelfer Token generieren
                </Button>
              </Col>
            </Row>
          </Col>
          <Col xs={24} sm={12} md={14} lg={16} xl={18} xxl={20}>
            {!!this.state.wahlleiterAuth && this.renderWahlenTable()}
          </Col>
        </>
      )}
    </Row>
  );

  render() {
    const { wahlhelferTokens, wahlleiterAuth } = this.state;

    return (
      <Card
        title={"WahlleiterIn Funktionen"}
        style={{ minHeight: "100%" }}
        hoverable={true}
        extra={
          <Password
            value={this.state.wahlleiterAuth}
            onChange={i => this.setState({ wahlleiterAuth: i.target.value })}
            placeholder={"Bitte Passwort eingeben"}
          />
        }
      >
        {!wahlleiterAuth && (
          <Alert
            type={"warning"}
            message={
              <>
                <Icon type={"lock"} />
                {" Bitte ein Passwort eingeben um Zutritt zu erhalten"}
              </>
            }
          />
        )}
        {this.renderAdminActions()}
        {!!wahlhelferTokens && this.renderWahlhelferTokenTable()}
      </Card>
    );
  }
}

const WahlleiterPageComponentWithGraphQL = compose(
  withSetDataBlockedMutation<IWahlleiterPageProps>(),
  withGenerateWahlhelferTokensMutation<IWahlleiterPageProps>(),
  withImportCSVDataMutation<IWahlleiterPageProps>(),
  withComputeElectionResultsMutation<IWahlleiterPageProps>(),
  withAllWahlenQuery<IWahlleiterPageProps>()
)(WahlleiterPageComponent);

const WahlleiterPageWithForm = (Form.create()(
  WahlleiterPageComponentWithGraphQL
) as unknown) as React.ComponentType<IWahlleiterPageProps>;

export const WahlleiterPage = withErrorBoundary<IWahlleiterPageProps>(
  WahlleiterPageWithForm
);
