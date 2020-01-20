import gql from "graphql-tag";
import { createTypedGraphqlHoc, IGraphqlType } from "../typedGraphql";
import { DataValue } from "react-apollo";
import {
  Kandidat,
  QueryToGetDirektKandidatenArgs
} from "../../shared/graphql.types";

const getDirektKandidatenQuery = gql`
  query getDirektKandidatenQuery($wahlid: Int!, $stimmkreisid: Int!) {
    direktKandidaten: getDirektKandidaten(
      wahlid: $wahlid
      stimmkreisid: $stimmkreisid
    ) {
      id
      name
      partei {
        id
        name
      }
    }
  }
`;

interface IGetDirektKandidatenQueryResponse extends IGraphqlType {
  readonly direktKandidaten?: Kandidat[];
}

export interface IGetDirektKandidatenQueryHocProps {
  readonly direktKandidatenData: DataValue<
    IGetDirektKandidatenQueryResponse,
    QueryToGetDirektKandidatenArgs
  >;
}

const direktKandidatenTypedHoc = createTypedGraphqlHoc<
  IGetDirektKandidatenQueryResponse,
  QueryToGetDirektKandidatenArgs
>(getDirektKandidatenQuery);

export const withDirektKandidatenQuery = <TProps = {}>(
  getWahlId: (props: TProps) => number,
  getStimmkreisId: (props: TProps) => number
) =>
  direktKandidatenTypedHoc<TProps, IGetDirektKandidatenQueryHocProps>({
    options: props => ({
      variables: {
        wahlid: getWahlId(props),
        stimmkreisid: getStimmkreisId(props)
      }
    }),
    props: ({ data }) => ({
      direktKandidatenData: data
    })
  });
