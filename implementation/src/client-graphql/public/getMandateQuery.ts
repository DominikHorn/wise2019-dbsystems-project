import gql from "graphql-tag";
import { DataValue } from "react-apollo";
import { Mandat } from "../../shared/graphql.types";
import { createTypedGraphqlHoc, IGraphqlType } from "../typedGraphql";

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

interface IGetMandateQueryResponse extends IGraphqlType {
  readonly mandate?: Mandat[];
}

interface IGetMandateQueryVariables {
  readonly wahlid: number;
}

export interface IGetMandateQueryHocProps {
  readonly mandateData: DataValue<
    IGetMandateQueryResponse,
    IGetMandateQueryVariables
  >;
}

const getMandateTypedHoc = createTypedGraphqlHoc<
  IGetMandateQueryResponse,
  IGetMandateQueryVariables
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
