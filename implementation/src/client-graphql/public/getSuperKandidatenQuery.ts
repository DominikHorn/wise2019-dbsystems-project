import gql from "graphql-tag";
import { IGraphqlType, createTypedGraphqlHoc } from "../typedGraphql";
import { DataValue } from "react-apollo";
import { SuperKandidaten } from "../../shared/graphql.types";

const getSuperDirektkandidatenQuery = gql`
  query getSuperDirektkandidaten($wahlid: Int!) {
    superKandidaten: getSuperDirektkandidaten(wahlid: $wahlid) {
      stimmkreis {
        id
        name
      }
      kandidat {
        id
        name
        partei {
          id
          name
        }
      }
      stimmen_direktk
      stimmen_listenk
    }
  }
`;
interface IGetSuperDirektkandidatenQueryResponse extends IGraphqlType {
  readonly superKandidaten?: SuperKandidaten[];
}

interface IGetSuperDirektkandidatenQueryVariables {
  readonly wahlid: number;
}

export interface IGetSuperDirektkandidatenQueryHocProps {
  readonly superKandidatenData?: DataValue<
    IGetSuperDirektkandidatenQueryResponse,
    IGetSuperDirektkandidatenQueryVariables
  >;
}

const getSuperDirektkandidatenTypedHoc = createTypedGraphqlHoc<
  IGetSuperDirektkandidatenQueryResponse,
  IGetSuperDirektkandidatenQueryVariables
>(getSuperDirektkandidatenQuery);

export const withSuperDirektkandidatenQuery = <TProps = {}>(
  getWahlId: (props: TProps) => number
) =>
  getSuperDirektkandidatenTypedHoc<
    TProps,
    IGetSuperDirektkandidatenQueryHocProps
  >({
    options: props => ({
      variables: {
        wahlid: getWahlId(props)
      }
    }),
    props: ({ data }) => ({
      superKandidatenData: data
    })
  });
