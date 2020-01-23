import { Table } from "antd";
import * as React from "react";
import { Stimmkreis, Wahl, Q7 } from "../../../../../shared/graphql.types";
import { compose } from "react-apollo";
import {
  withAllStimmkreisInfosQuery,
  IGetAllStimmkreisInfosQueryHocProps
} from "../../../../../client-graphql/public/getStimmkreisInfoQ7Query";

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

export class StimmkreisInfoQ7TableComponent extends React.PureComponent<
  IProps
> {
  componentWillReceiveProps(newProps: IProps) {
    if (
      this.props.allStimmkreisInfosData.allStimmkreisInfos !==
      newProps.allStimmkreisInfosData.allStimmkreisInfos
    ) {
      //this.updateTableData(newProps);
    }
  }

  private aggregateTableData = (
    stimmkreisInfos: Q7[]
  ): {
    dataSource: {
      key: string;
      partei: string;
      vorher: number;
      nachher: number;
      prozAnteil: number;
    }[];
  } => {
    const res = stimmkreisInfos.map(curr => {
      key: curr.partei.id;
      partei: curr.partei.name;
      vorher: curr.vorher;
      nachher: curr.nachher;
      prozAnteil: curr.prozAnteil;
    });
    console.log(res);
    return {
      dataSource: [
        {
          key: "blubb",
          partei: "blabb",
          vorher: 2,
          nachher: 3,
          prozAnteil: 4
        }
      ]
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

  columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name"
    },
    {
      title: "Age",
      dataIndex: "age",
      key: "age"
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address"
    }
  ];
  render() {
    debugger;
    // const { allStimmkreisInfosData } = this.props;
    // if (allStimmkreisInfosData && allStimmkreisInfosData.allStimmkreisInfos) {
    //   const data = this.aggregateTableData(
    //     allStimmkreisInfosData.allStimmkreisInfos
    //   );
    // }

    return <Table dataSource={this.dataSource} columns={this.columns} />;
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
  )(StimmkreisInfoQ7TableComponent)
);

export const StimmkreisInfoQ7Table = StimmkreisInfoQ7TableWithQueries as React.ComponentType<
  IStimmkreisQ7TableProps
>;
