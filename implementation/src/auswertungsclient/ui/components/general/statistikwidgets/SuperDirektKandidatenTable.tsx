import { Wahl, SuperKandidaten } from "../../../../../shared/graphql.types";
import {
  IGetSuperDirektkandidatenQueryHocProps,
  withSuperDirektkandidatenQuery
} from "../../../../../client-graphql/public/getSuperKandidatenQuery";
import * as React from "react";
import { Table } from "antd";
import { compose } from "react-apollo";
import { renderCenteredLoading } from "../../../../../wahlclient/ui/guiUtil";

export interface ISuperDirektKandidatenTableProps {
  readonly wahl: Wahl;
}

interface IProps
  extends ISuperDirektKandidatenTableProps,
    IGetSuperDirektkandidatenQueryHocProps {}

type superkData = {
  key: string;
  stimmkreis: string;
  kandidat: string;
  partei: string;
  stimmen_direktk: number;
  stimmen_listenk: number;
};

type column_type = {
  title: string;
  dataIndex: string;
  key: string;
};

class SuperDirektKandidatenTableComponent extends React.PureComponent<IProps> {
  private aggregateTableData = (
    superKandidatenData: SuperKandidaten[]
  ): superkData[] => {
    const res = superKandidatenData.map(curr => ({
      key: curr.kandidat.id.toString(),
      stimmkreis: curr.stimmkreis.name,
      kandidat: curr.kandidat.name,
      partei: curr.kandidat.partei.name,
      stimmen_direktk: curr.stimmen_direktk,
      stimmen_listenk: curr.stimmen_listenk
    }));

    return res;
  };

  private generateColumnTitles = (): column_type[] => {
    const columns = [
      {
        title: "Stimmkreis",
        dataIndex: "stimmkreis",
        key: "stimmkreis"
      },
      {
        title: "Direktkandidat",
        dataIndex: "kandidat",
        key: "kandidat"
      },
      {
        title: "Partei",
        dataIndex: "partei",
        key: "partei"
      },
      {
        title: "#Stimmen des Direktkandidaten",
        dataIndex: "stimmen_direktk",
        key: "stimmen_direktk"
      },
      {
        title: "#Stimmen aller Listenkandidaten",
        dataIndex: "stimmen_listenk",
        key: "stimmen_listenk"
      }
    ];

    return columns;
  };

  render() {
    const { superKandidatenData } = this.props;

    return (
      <div>
        {superKandidatenData && superKandidatenData.superKandidaten ? (
          <Table
            scroll={{ y: 600, scrollToFirstRowOnChange: true }}
            pagination={false}
            dataSource={this.aggregateTableData(
              superKandidatenData.superKandidaten
            )}
            columns={this.generateColumnTitles()}
          />
        ) : (
          renderCenteredLoading()
        )}
      </div>
    );
  }
}

const SuperDirektKandidatenTableWithQueries = compose(
  withSuperDirektkandidatenQuery<ISuperDirektKandidatenTableProps>(
    props => props.wahl.id
  )
)(SuperDirektKandidatenTableComponent);

export const SuperDirektKandidatenTable = SuperDirektKandidatenTableWithQueries as React.ComponentType<
  ISuperDirektKandidatenTableProps
>;
