import * as React from "react";
import { IMandat, IWahl } from "../../../../../shared/sharedTypes";
import {
  IGetMandateQueryHocProps,
  withMandateQuery
} from "../../../../../client-graphql/public/getMandateQuery";
import { Table } from "antd";
import { ColumnProps } from "antd/lib/table";
import { compose } from "react-apollo";

type SitzverteilungsTableRow = {
  partei: string;
  anzahl: number;
};

function aggregateMandate(mandate: IMandat[]): SitzverteilungsTableRow[] {
  const parteiAggr: {
    [parteiname: string]: number;
  } = {};
  mandate.forEach(mandat => {
    parteiAggr[mandat.kandidat.partei.name] =
      (parteiAggr[mandat.kandidat.partei.name] || 0) + 1;
  });

  return Object.keys(parteiAggr)
    .map(parteiname => ({
      partei: parteiname,
      anzahl: parteiAggr[parteiname]
    }))
    .sort((a, b) => {
      if (a.anzahl < b.anzahl) return 1;
      if (a.anzahl > b.anzahl) return -1;
      return 0;
    });
}

const columns: ColumnProps<SitzverteilungsTableRow>[] = [
  {
    title: "Partei",
    dataIndex: "partei",
    key: "partei",
    width: 100
  },
  {
    title: "Mandatanzahl",
    dataIndex: "anzahl",
    key: "anzahl",
    width: 100
  }
];

export interface ISitzverteilungsTableProps {
  readonly wahl: IWahl;
}

interface IProps extends ISitzverteilungsTableProps, IGetMandateQueryHocProps {}

const SitzverteilungsTableComponent = (props: IProps) => (
  <Table
    rowKey={"partei"}
    columns={columns}
    size={"small"}
    pagination={false}
    style={{ overflowY: "scroll", height: "100%" }}
    dataSource={aggregateMandate(props.mandateData.mandate || [])}
    loading={props.mandateData.loading}
  />
);

const SitzverteilungsTableWithQueries = compose(
  withMandateQuery<ISitzverteilungsTableProps>(props => props.wahl.id)
)(SitzverteilungsTableComponent);

export const SitzverteilungsTable = SitzverteilungsTableWithQueries as React.ComponentType<
  ISitzverteilungsTableProps
>;
