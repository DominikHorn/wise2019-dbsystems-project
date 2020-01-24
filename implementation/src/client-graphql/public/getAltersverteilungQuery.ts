import gql from "graphql-tag";
import {
  Altersverteilung,
  QueryToGetAltersverteilungArgs
} from "../../shared/graphql.types";
import { DataValue } from "react-apollo";
import { createTypedGraphqlHoc } from "../typedGraphql";

const GQL = gql`
  query getAltersverteilungQuery($wahlid: Int!) {
    altersverteilung: getAltersverteilung(wahlid: $wahlid) {
      geburtsjahr
      partei {
        id
        name
      }
      anzahl
    }
  }
`;

interface Response {
  readonly altersverteilung?: Altersverteilung[];
}

export interface QueryToGetAltersverteilungHOCProps {
  readonly altersverteilungData?: DataValue<
    Response,
    QueryToGetAltersverteilungArgs
  >;
}

const hoc = createTypedGraphqlHoc<Response, QueryToGetAltersverteilungArgs>(
  GQL
);

export const withAltersverteilung = <TProps = {}>(
  getWahlID: (props: TProps) => number
) =>
  hoc<TProps, QueryToGetAltersverteilungHOCProps>({
    options: props => ({
      variables: {
        wahlid: getWahlID(props)
      }
    }),
    props: ({ data }) => ({
      altersverteilungData: data
    })
  });
