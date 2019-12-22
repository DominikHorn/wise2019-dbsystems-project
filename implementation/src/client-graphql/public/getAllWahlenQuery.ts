import gql from "graphql-tag";
import { DataValue } from "react-apollo";
import { Wahl } from "../../shared/graphql.types";
import { createTypedGraphqlHoc } from "../typedGraphql";

const getAllWahlenQuery = gql`
  query getAllWahlenQuery {
    allWahlen: getAllWahlen {
      id
      wahldatum
      dataBlocked
    }
  }
`;

interface IGetAllWahlenQueryResponse {
  readonly allWahlen: Wahl[];
}

export interface IGetAllWahlenQueryHocProps {
  readonly allWahlenData: DataValue<IGetAllWahlenQueryResponse, {}>;
}

const getAllWahlenTypedHoc = createTypedGraphqlHoc<
  IGetAllWahlenQueryResponse,
  {}
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
