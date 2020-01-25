import { Table } from "antd";
import * as React from "react";
import { Stimmkreis, Wahl, Q7 } from "../../../../../shared/graphql.types";
import { compose } from "react-apollo";
import {
  withAllStimmkreisInfosQuery,
  IGetAllStimmkreisInfosQueryHocProps
} from "../../../../../client-graphql/public/getStimmkreisInfoQ7Query";
import { renderCenteredLoading } from "../../../../../wahlclient/ui/guiUtil";

export interface IStimmkreisQ7TableProps {
  readonly wahl: Wahl;
  readonly stimmkreis1: Stimmkreis;
  readonly stimmkreis2: Stimmkreis;
  readonly stimmkreis3: Stimmkreis;
  readonly stimmkreis4: Stimmkreis;
  readonly stimmkreis5: Stimmkreis;
  readonly vglwahl: Wahl;
}

interface IProps
  extends IStimmkreisQ7TableProps,
    IGetAllStimmkreisInfosQueryHocProps {}

type columns_type = {
  title: string;
  dataIndex: string;
  key: string;
};

export class StimmkreisInfoQ7TableComponent extends React.PureComponent<
  IProps
> {
  // componentWillReceiveProps(newProps: IProps) {
  //   if (
  //     this.props.allStimmkreisInfosData.allStimmkreisInfos !==
  //     newProps.allStimmkreisInfosData.allStimmkreisInfos
  //   ) {
  //     //this.updateTableData(newProps);
  //   }
  // }

  private aggregateTableData = (
    stimmkreisInfos: Q7[]
  ): {
    dataSource: {
      key: string;
      stimmkreis: string;
      partei: string;
      vorher: number;
      nachher: number;
      prozAnteil: number;
    }[];
  } => {
    const res = stimmkreisInfos.map(curr => ({
      key: curr.partei.id.toString(),
      stimmkreis: curr.stimmkreis.name,
      partei: curr.partei.name,
      vorher: curr.vorher,
      nachher: curr.nachher,
      prozAnteil: Math.round(curr.prozAnteil * 100) / 100
    }));
    console.log(res);
    return {
      dataSource: res
    };
  };

  dataSource = [
    {
      key: "1",
      name: "Mike",
      age: 32,
      address: "10 Downing Street"
    },
    {
      key: "2",
      name: "John",
      age: 42,
      address: "10 Downing Street"
    }
  ];

  private generateColumnTitles = (props: IProps): columns_type[] => {
    const vglwahl_wahljahr = new Date(props.vglwahl.wahldatum).getFullYear();
    const wahl_wahljahr = new Date(props.wahl.wahldatum).getFullYear();
    const columns = [
      {
        title: "Stimmkreis",
        dataIndex: "stimmkreis",
        key: "stimmkreis"
      },
      {
        title: "Partei",
        dataIndex: "partei",
        key: "partei"
      },
      {
        title: `Stimmen ${vglwahl_wahljahr}`,
        dataIndex: "vorher",
        key: "vorher"
      },
      {
        title: `Stimmen ${wahl_wahljahr}`,
        dataIndex: "nachher",
        key: "nachher"
      },
      {
        title: `Prozentualer Anteil der Stimmen ${wahl_wahljahr}`,
        dataIndex: "prozAnteil",
        key: "prozAnteil"
      }
    ];
    return columns;
  };

  render() {
    const { allStimmkreisInfosData } = this.props;
    if (allStimmkreisInfosData && allStimmkreisInfosData.allStimmkreisInfos) {
      const data = this.aggregateTableData(
        allStimmkreisInfosData.allStimmkreisInfos
      );
    }

    return (
      <>
        {allStimmkreisInfosData && allStimmkreisInfosData.allStimmkreisInfos ? (
          <Table
            dataSource={
              this.aggregateTableData(allStimmkreisInfosData.allStimmkreisInfos)
                .dataSource
            }
            columns={this.generateColumnTitles(this.props)}
          />
        ) : (
          renderCenteredLoading()
        )}
      </>
    );
  }
}

const StimmkreisInfoQ7TableWithQueries = compose(
  withAllStimmkreisInfosQuery<IStimmkreisQ7TableProps>(
    props => props.wahl.id,
    props => props.stimmkreis1.id,
    props => props.stimmkreis2.id,
    props => props.stimmkreis3.id,
    props => props.stimmkreis4.id,
    props => props.stimmkreis5.id,
    props => props.vglwahl.id
  )
)(StimmkreisInfoQ7TableComponent);

export const StimmkreisInfoQ7Table = StimmkreisInfoQ7TableWithQueries as React.ComponentType<
  IStimmkreisQ7TableProps
>;
