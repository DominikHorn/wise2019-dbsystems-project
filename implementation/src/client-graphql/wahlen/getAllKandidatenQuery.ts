import gql from "graphql-tag";
import { createTypedGraphqlHoc, IGraphqlType } from "../typedGraphql";
import { DataValue } from "react-apollo";
import { IKandidat } from "../../shared/sharedTypes";

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
  readonly direktKandidaten?: IKandidat[];
}

interface IGetGetAllDirektKandidatenQueryVariables {
  readonly wahlid: number;
  readonly stimmkreisid: number;
}

export interface IGetAllDirektKandidatenQueryHocProps {
  readonly direktKandidatenData: DataValue<
    IGetAllDirektKandidatenQueryResponse,
    IGetGetAllDirektKandidatenQueryVariables
  >;
}

const direktKandidatenTypedHoc = createTypedGraphqlHoc<
  IGetAllDirektKandidatenQueryResponse,
  IGetGetAllDirektKandidatenQueryVariables
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
