import * as React from "react";
import { IPartei, IWahl } from "../../../../shared/sharedTypes";
import { Tag, Table } from "antd";
import {
  withMandateQuery,
  IGetMandateQueryHocProps
} from "../../../../client-graphql/public/getMandateQuery";
import { compose } from "react-apollo";

function getParteiColor(partei: IPartei): string {
  return "blue";
}

const columns = [
  {
    title: "ID",
    dataIndex: "kandidat.id",
    key: "id"
  },
  {
    title: "Name",
    dataIndex: "kandidat.name",
    key: "name",
    render: (name: string) => (
      <a
        href={`https://de.lmgtfy.com/?q=${encodeURIComponent(
          `${name} Bayrischer Landtag`
        )}`}
      >
        {name}
      </a>
    )
  },
  {
    title: "Direktmandat",
    dataIndex: "direktmandat",
    key: "direktmandat",
    render: (value: boolean) =>
      value && <span style={{ color: "green" }}>✔️</span>
  },
  {
    title: "Partei",
    key: "partei",
    dataIndex: "kandidat.partei",
    render: (partei: IPartei) => (
      <Tag color={getParteiColor(partei)} key={partei.id}>
        {partei.name}
      </Tag>
    )
  }
];

export interface IMandatListeProps {
  wahl: IWahl;
}

interface IProps extends IMandatListeProps, IGetMandateQueryHocProps {}

const MandatListeComponent = (props: IProps) => (
  <Table
    columns={columns}
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
