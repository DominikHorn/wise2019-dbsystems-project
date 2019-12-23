import gql from "graphql-tag";
import { createTypedGraphqlHoc, IGraphqlType } from "../typedGraphql";
import { DataValue } from "react-apollo";
import {
  Kandidat,
  QueryToGetAllDirektKandidatenArgs
} from "../../shared/graphql.types";

const getAllDirektKandidatenQuery = gql`
  query allDirektKandidatenQuery($wahlid: Int!, $stimmkreisid: Int!) {
    direktKandidaten: getAllDirektKandidaten(
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
    }
  }
`;

interface IGetAllDirektKandidatenQueryResponse extends IGraphqlType {
  readonly direktKandidaten?: Kandidat[];
}

export interface IGetAllDirektKandidatenQueryHocProps {
  readonly direktKandidatenData: DataValue<
    IGetAllDirektKandidatenQueryResponse,
    QueryToGetAllDirektKandidatenArgs
  >;
}

const direktKandidatenTypedHoc = createTypedGraphqlHoc<
  IGetAllDirektKandidatenQueryResponse,
  QueryToGetAllDirektKandidatenArgs
>(getAllDirektKandidatenQuery);

export const withDirektKandidatenQuery = <TProps = {}>(
  getWahlId: (props: TProps) => number,
  getStimmkreisId: (props: TProps) => number
) =>
  direktKandidatenTypedHoc<TProps, IGetAllDirektKandidatenQueryHocProps>({
    options: props => ({
      variables: {
        wahlid: getWahlId(props),
        stimmkreisid: getStimmkreisId && getStimmkreisId(props)
      }
    }),
    props: ({ data }) => ({
      direktKandidatenData: data
    })
  });
