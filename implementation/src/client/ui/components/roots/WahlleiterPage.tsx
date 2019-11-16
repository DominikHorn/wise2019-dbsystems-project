import * as React from "react";
import { RouteComponentProps } from "react-router";
import {
  Card,
  message,
  Button,
  Col,
  Row,
  Modal,
  Form,
  Select,
  DatePicker,
  List
} from "antd";
import { FormComponentProps } from "antd/lib/form";
import { GetFieldDecoratorOptions } from "antd/lib/form/Form";
import { FilePickerComponent } from "../general/FilePickerComponent";
import { compose } from "react-apollo";
import {
  withImportCSVDataMutation,
  IImportCSVDataMutationHocProps
} from "../../../graphql/wahlleiter/importCSVDataMutation";
import { UploadFile } from "antd/lib/upload/interface";
import {
  withAllWahlenQuery,
  IGetAllWahlenQueryHocProps
} from "../../../graphql/public/getAllWahlenQuery";
import { renderLoading } from "../../guiUtil";
import locale from "antd/es/date-picker/locale/de_DE";
import { withErrorBoundary } from "../general/ErrorBoundary";
import * as moment from "moment";
import "./WahlleiterPage.css";

export interface IWahlleiterPageProps {
  routeProps: RouteComponentProps<any>;
}

interface IProps
  extends IWahlleiterPageProps,
    FormComponentProps,
    IImportCSVDataMutationHocProps,
    IGetAllWahlenQueryHocProps {}

interface IState {
  modalVisible: boolean;
  uploadLoading: boolean;
}

class WahlleiterPageComponent extends React.PureComponent<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      modalVisible: false,
      uploadLoading: false
    };
  }

  private onCancel = () =>
    this.setState({ modalVisible: false }, this.props.form.resetFields);

  private handleSubmit = (e: React.FormEvent<any>) => {
    // No further propagation
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        this.setState({ uploadLoading: true });
        this.props
          .importCSVData({
            files: values.files.map((f: UploadFile) => f.originFileObj),
            wahldatum: values.wahldatum.toDate()
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
    <Form onSubmit={this.handleSubmit}>
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
        type={"primary"}
        style={{ float: "right" }}
        onClick={() =>
          this.setState({ modalVisible: !this.state.modalVisible })
        }
      >
        CSV Importieren
      </Button>
      <Modal
        title={"CSV Importieren"}
        visible={this.state.modalVisible}
        onCancel={this.onCancel}
        footer={[
          <Button key={"discard"} icon={"delete"} onClick={this.onCancel}>
            Verwerfen
          </Button>,
          <Button
            key={"submit"}
            icon={"cloud-upload-o"}
            type={"primary"}
            loading={this.state.uploadLoading}
            onClick={this.handleSubmit}
          >
            Bestätigen
          </Button>
        ]}
      >
        {this.renderUploadForm(getFieldDecorator)}
      </Modal>
    </>
  );

  render() {
    const {
      form: { getFieldDecorator }
    } = this.props;
    return (
      <Card
        title={"WahlleiterIn Funktionen"}
        style={{ minHeight: "100%" }}
        hoverable={true}
      >
        <Row
          type={"flex"}
          gutter={16}
          justify={"center"}
          style={{ marginTop: "15px" }}
        >
          <Col>{this.renderUploadModal(getFieldDecorator)}</Col>
          <Col>
            <Button
              type={"primary"}
              style={{ float: "right" }}
              onClick={() => {
                message.error("Unimplemented");
              }}
            >
              Stimmen korrigieren
            </Button>
          </Col>
        </Row>
      </Card>
    );
  }
}

const WahlleiterPageComponentWithGraphQL = compose(
  withImportCSVDataMutation<IWahlleiterPageProps>(),
  withAllWahlenQuery<IWahlleiterPageProps>()
)(WahlleiterPageComponent);

const WahlleiterPageWithForm = (Form.create()(
  WahlleiterPageComponentWithGraphQL
) as unknown) as React.ComponentType<IWahlleiterPageProps>;

export const WahlleiterPage = withErrorBoundary<IWahlleiterPageProps>(
  WahlleiterPageWithForm
);
