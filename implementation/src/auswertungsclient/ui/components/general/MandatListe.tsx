import * as React from "react";
import { IPartei, IWahl, EParteiNamen } from "../../../../shared/sharedTypes";
import { Tag, Table } from "antd";
import {
  withMandateQuery,
  IGetMandateQueryHocProps
} from "../../../../client-graphql/public/getMandateQuery";
import { compose } from "react-apollo";

function getParteiColor(partei: IPartei): string {
  switch (partei.name) {
    case EParteiNamen.CSU:
      return "black";
    case EParteiNamen.SPD:
      return "red";
    case EParteiNamen.FREIE_WAEHLER:
      return "orange";
    case EParteiNamen.GRUENE:
      return "green";
    case EParteiNamen.AFD:
      return "blue";
  }
  return "";
}

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
    pagination={
      (props.mandateData.mandate || []).length > 250 && { pageSize: 250 }
    }
    size={"small"}
    scroll={{ y: 600 }}
  ></Table>
);

const MandatListeComponentWithQueries = compose(
  withMandateQuery<IMandatListeProps>(p => p.wahl.id)
)(MandatListeComponent);

export const MandatListe = MandatListeComponentWithQueries as React.ComponentType<
  IMandatListeProps
>;
