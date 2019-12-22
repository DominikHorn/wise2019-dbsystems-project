import gql from "graphql-tag";
import { DataValue } from "react-apollo";
import { Mandat } from "../../shared/graphql.types";
import { createTypedGraphqlHoc, IGraphqlType } from "../typedGraphql";

const getDirektmandatQuery = gql`
  query getDirektmandatQuery($wahlid: Int!) {
    direktmandat: getDirektmandat(wahlid: $wahlid) {
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

interface IGetDirektmandatQueryResponse extends IGraphqlType {
  readonly direktmandat?: Mandat;
}

interface IGetDirektmandatQueryVariables {
  readonly wahlid: number;
}

export interface IGetDirektmandatQueryHocProps {
  readonly direktmandatData: DataValue<
    IGetDirektmandatQueryResponse,
    IGetDirektmandatQueryVariables
  >;
}

const getDirektmandatTypedHoc = createTypedGraphqlHoc<
  IGetDirektmandatQueryResponse,
  IGetDirektmandatQueryVariables
>(getDirektmandatQuery);

export const withDirektmandatQuery = <TProps = {}>(
  getWahlId: (props: TProps) => number
) =>
  getDirektmandatTypedHoc<TProps, IGetDirektmandatQueryHocProps>({
    options: props => ({
      variables: {
        wahlid: getWahlId(props)
      }
    }),
    props: ({ data }) => ({
      direktmandatData: data
    })
  });
