import gql from "graphql-tag";
import { IGraphqlType, createTypedGraphqlHoc } from "../typedGraphql";
import { DataValue } from "react-apollo";
import { Stimmkreis } from "../../shared/graphql.types";

const getAllStimmkreiseQuery = gql`
  query getAllStimmkkreiseQuery($wahlid: Int!) {
    allStimmkreise: getAllStimmkreise(wahlid: $wahlid) {
      id
      name
    }
  }
`;

interface IGetAllStimmenkreiseQueryResponse extends IGraphqlType {
  readonly allStimmkreise: Stimmkreis[];
}

interface IGetAllStimmkreiseQueryVariables {}

export interface IGetAllStimmkreiseQueryHocProps {
  readonly allStimmkreiseData: DataValue<
    IGetAllStimmenkreiseQueryResponse,
    IGetAllStimmkreiseQueryVariables
  >;
}

const getAllStimmkreiseTypedHoc = createTypedGraphqlHoc<
  IGetAllStimmenkreiseQueryResponse,
  IGetAllStimmkreiseQueryVariables
>(getAllStimmkreiseQuery);

export const withAllStimmkreiseQuery = <TProps = {}>(
  getWahlId: (props: TProps) => number
) =>
  getAllStimmkreiseTypedHoc<TProps, IGetAllStimmkreiseQueryHocProps>({
    options: props => ({
      variables: {
        wahlid: getWahlId(props)
      }
    }),
    props: ({ data }) => ({
      allStimmkreiseData: data
    })
  });
