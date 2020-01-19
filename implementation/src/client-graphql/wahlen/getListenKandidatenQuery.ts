import gql from "graphql-tag";
import {
  ListenKandidat,
  QueryToGetListenKandidatenArgs
} from "../../shared/graphql.types";
import { DataValue } from "react-apollo";
import { createTypedGraphqlHoc } from "../typedGraphql";

const getListKandidatenGQL = gql`
  query getListenKandidatenQuery($wahlid: Int!, regierungsbezirkid: Int!) {
    listenKandidaten: getListenKandidaten(wahlid: $wahlid, regierungsbezirkid: $regierungsbezirkid) {
      platz
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

interface QueryToGetListenKandidatenResponse {
  readonly listenKandidaten?: ListenKandidat[];
}

export interface QueryToGetListenKandidatenHOCProps {
  readonly listenKandidatenData?: DataValue<
    QueryToGetListenKandidatenResponse,
    QueryToGetListenKandidatenArgs
  >;
}

const getListenKandidatenHOC = createTypedGraphqlHoc<
  QueryToGetListenKandidatenResponse,
  QueryToGetListenKandidatenArgs
>(getListKandidatenGQL);

export const withListenKandidaten = <TProps = {}>(
  getWahlId: (props: TProps) => number,
  getRegierungsbezirkId: (props: TProps) => number
) =>
  getListenKandidatenHOC<TProps, QueryToGetListenKandidatenHOCProps>({
    options: props => ({
      variables: {
        wahlid: getWahlId(props),
        regierungsbezirkid: getRegierungsbezirkId(props)
      }
    }),
    props: ({ data }) => ({
      listenKandidatenData: data
    })
  });
