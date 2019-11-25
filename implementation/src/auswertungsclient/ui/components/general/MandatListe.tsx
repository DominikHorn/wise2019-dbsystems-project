import * as React from "react";
import { IPartei } from "../../../../shared/sharedTypes";
import { Tag, Table } from "antd";

function getParteiColor(partei: IPartei): string {
  return "blue";
}

const columns = [
  {
    title: "ID",
    dataIndex: "id",
    key: "id"
  },
  {
    title: "Name",
    dataIndex: "name",
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
    dataIndex: "partei",
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

export const MandatListe = (props: IMandatListeProps) => (
  <Table columns={columns}></Table>
);
