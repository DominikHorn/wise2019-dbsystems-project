import * as React from "react";
import {
  IPartei,
  IWahl,
  EParteiNamen,
  IMandat
} from "../../../../shared/sharedTypes";
import { Tag, Table, Row, Col } from "antd";
import {
  withMandateQuery,
  IGetMandateQueryHocProps
} from "../../../../client-graphql/public/getMandateQuery";
import { compose } from "react-apollo";
import { getParteiColor } from "../../guiUtil";
import { TableProps } from "antd/lib/table";

const columns = [
  {
    title: "ID",
    dataIndex: "kandidat.id",
    key: "id",
    width: 50
  },
  {
    title: "Direktmandat",
    dataIndex: "direktmandat",
    key: "direktmandat",
    width: 100,
    render: (value: boolean) =>
      value && <span style={{ color: "green" }}>✔️</span>
  },
  {
    title: "Name",
    dataIndex: "kandidat.name",
    key: "name",
    render: (name: string) => (
      <a
        target={"_blank"}
        href={`https://de.lmgtfy.com/?q=${encodeURIComponent(
          `${name} Bayrischer Landtag`
        )}`}
      >
        {name}
      </a>
    )
  },
  {
    title: "Partei",
    key: "partei",
    dataIndex: "kandidat.partei",
    width: 200,
    render: (partei: IPartei) => (
      <Row type={"flex"} justify={"center"}>
        <Col>
          <Tag color={getParteiColor(partei.name)} key={partei.id}>
            {partei.name}
          </Tag>
        </Col>
      </Row>
    )
  }
];

export interface IMandatListeProps {
  readonly wahl: IWahl;
  readonly tableProps?: TableProps<IMandat>;
  readonly omitIdColumn?: boolean;
}

interface IProps extends IMandatListeProps, IGetMandateQueryHocProps {}

const MandatListeComponent = (props: IProps) => (
  <Table
    pagination={
      (props.mandateData.mandate || []).length > 250 && { pageSize: 250 }
    }
    size={"small"}
    scroll={{ y: 600 }}
    {...props.tableProps}
    columns={props.omitIdColumn ? columns.slice(1) : columns}
    dataSource={props.mandateData.mandate || []}
    loading={props.mandateData.loading}
  ></Table>
);

const MandatListeComponentWithQueries = compose(
  withMandateQuery<IMandatListeProps>(p => p.wahl.id)
)(MandatListeComponent);

export const MandatListe = MandatListeComponentWithQueries as React.ComponentType<
  IMandatListeProps
>;
