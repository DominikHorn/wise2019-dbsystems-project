import gql from "graphql-tag";
import { DataValue } from "react-apollo";
import { Mandat, QueryToGetDirektmandatArgs } from "../../shared/graphql.types";
import { createTypedGraphqlHoc } from "../typedGraphql";

const getDirektmandatQuery = gql`
  query getDirektmandatQuery($wahlid: Int!, $stimmkreisid: Int!) {
    direktmandat: getDirektmandat(
      wahlid: $wahlid
      stimmkreisid: $stimmkreisid
    ) {
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

interface IGetDirektmandatQueryResponse {
  readonly direktmandat?: Mandat;
}

export interface IGetDirektmandatQueryHocProps {
  readonly direktmandatData: DataValue<
    IGetDirektmandatQueryResponse,
    QueryToGetDirektmandatArgs
  >;
}

const getDirektmandatTypedHoc = createTypedGraphqlHoc<
  IGetDirektmandatQueryResponse,
  QueryToGetDirektmandatArgs
>(getDirektmandatQuery);

export const withDirektmandatQuery = <TProps = {}>(
  getWahlId: (props: TProps) => number,
  getStimmkreisId: (props: TProps) => number
) =>
  getDirektmandatTypedHoc<TProps, IGetDirektmandatQueryHocProps>({
    options: props => ({
      variables: {
        wahlid: getWahlId(props),
        stimmkreisid: getStimmkreisId(props)
      }
    }),
    props: ({ data }) => ({
      direktmandatData: data
    })
  });
