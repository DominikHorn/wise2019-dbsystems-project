import gql from "graphql-tag";
import { IGraphqlType, createTypedGraphqlHoc } from "../typedGraphql";
import { Wahl } from "../../shared/graphql.types";
import { DataValue } from "react-apollo";

const getAllWahlenQuery = gql`
  query getAllWahlenQuery {
    allWahlen: getAllWahlen {
      id
      wahldatum
    }
  }
`;

interface IGetAllWahlenQueryResponse extends IGraphqlType {
  readonly allWahlen: Wahl[];
}

interface IGetAllWahlenQueryVariables {}

export interface IGetAllWahlenQueryHocProps {
  readonly allWahlenData: DataValue<
    IGetAllWahlenQueryResponse,
    IGetAllWahlenQueryVariables
  >;
}

const getAllWahlenTypedHoc = createTypedGraphqlHoc<
  IGetAllWahlenQueryResponse,
  IGetAllWahlenQueryVariables
>(getAllWahlenQuery);

export const withAllWahlenQuery = <TProps = {}>() =>
  getAllWahlenTypedHoc<TProps, IGetAllWahlenQueryHocProps>({
    props: ({ data }) => ({
      allWahlenData: {
        ...data,
        allWahlen:
          data.allWahlen &&
          data.allWahlen.map(wahl => ({
            ...wahl,
            wahldatum: new Date(wahl.wahldatum)
          }))
      }
    })
  });
