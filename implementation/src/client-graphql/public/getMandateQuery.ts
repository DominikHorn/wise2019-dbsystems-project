import gql from "graphql-tag";
import { DataValue } from "react-apollo";
import { Mandat, QueryToGetMandateArgs } from "../../shared/graphql.types";
import { createTypedGraphqlHoc } from "../typedGraphql";

const getMandateQuery = gql`
  query getMandateQuery($wahlid: Int!) {
    mandate: getMandate(wahlid: $wahlid) {
      kandidat {
        id
        name
        partei {
          id
          name
        }
      }
      direktmandat
    }
  }
`;

interface IGetMandateQueryResponse {
  readonly mandate?: Mandat[];
}

export interface IGetMandateQueryHocProps {
  readonly mandateData: DataValue<
    IGetMandateQueryResponse,
    QueryToGetMandateArgs
  >;
}

const getMandateTypedHoc = createTypedGraphqlHoc<
  IGetMandateQueryResponse,
  QueryToGetMandateArgs
>(getMandateQuery);

export const withMandateQuery = <TProps = {}>(
  getWahlId: (props: TProps) => number
) =>
  getMandateTypedHoc<TProps, IGetMandateQueryHocProps>({
    options: props => ({
      variables: {
        wahlid: getWahlId(props)
      }
    }),
    props: ({ data }) => ({
      mandateData: data
    })
  });
