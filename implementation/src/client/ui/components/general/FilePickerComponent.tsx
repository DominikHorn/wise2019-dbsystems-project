import { Button, Col, Icon, Row, Tooltip, Upload } from "antd";
import { UploadChangeParam, UploadFile } from "antd/lib/upload/interface";
import * as React from "react";
import "./FilePickerComponent.css";

const { Dragger } = Upload;

interface IFilePickerComponentProps {
  readonly accept: string;
  readonly multiple: boolean;
  readonly placeholder?: string;

  readonly fileList?: UploadFile[];
  readonly onChange?: (fileList: UploadFile[]) => void;
}

const defaultProps = {
  name: "file"
};

export class FilePickerComponent extends React.PureComponent<
  IFilePickerComponentProps
> {
  private onDeleteUploadFile = (e: Event, file: UploadFile) => {
    const { onChange, fileList } = this.props;
    e.stopPropagation();
    if (onChange) {
      onChange(fileList.filter(f => f.uid !== file.uid));
    }
  };

  private renderFileCardCol = (file: UploadFile) => (
    <Col key={file.uid} xs={12} sm={12} md={6} lg={6} xl={6}>
      <Tooltip title={file.name}>
        <div className={"file-picker-file-box"}>
          <Icon type={"file-text"} className={"file-picker-file-box-icon"} />
          <Button
            icon={"close"}
            className={"file-picker-close-button"}
            size={"small"}
            shape={"circle"}
            onClick={(e: any) => this.onDeleteUploadFile(e, file)}
            onMouseUp={(e: any) => e.stopPropagation()}
          />
          <br />
          {file.name}
        </div>
      </Tooltip>
    </Col>
  );

  private renderFilelist = (fileList: UploadFile[]) => (
    <Row gutter={16} style={{ marginLeft: "10px", marginRight: "10px" }}>
      {fileList.map(this.renderFileCardCol)}
    </Row>
  );

  private renderDragFileChooserPlaceholder = () => (
    <>
      <Row>
        <Col>
          <Icon
            className={"file-picker-file-box-placeholder-icon"}
            type="folder"
          />
        </Col>
      </Row>
      <Row>
        <Col>
          {this.props.placeholder || `Drag & Drop or click to choose files`}
        </Col>
      </Row>
    </>
  );

  render() {
    const { accept, multiple, fileList, onChange } = this.props;
    const value = fileList || [];
    return (
      <Row>
        <Col className={"file-picker-dragger-box"}>
          <Dragger
            {...defaultProps}
            accept={accept}
            multiple={multiple}
            showUploadList={false}
            customRequest={(params: { onSuccess: (message: string) => void }) =>
              setTimeout(() => params.onSuccess("ok"))
            }
            onChange={({ fileList }: UploadChangeParam) =>
              onChange ? onChange(fileList) : null
            }
            fileList={value}
          >
            {value.length === 0
              ? this.renderDragFileChooserPlaceholder()
              : this.renderFilelist(value)}
          </Dragger>
        </Col>
      </Row>
    );
  }
}
