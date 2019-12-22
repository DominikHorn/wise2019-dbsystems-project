import gql from "graphql-tag";
import { DataValue } from "react-apollo";
import {
  QueryToGetWahlbeteiligungArgs,
  Wahlbeteiligung
} from "../../shared/graphql.types";
import { createTypedGraphqlHoc } from "../typedGraphql";

const getWahlbeteiligungQuery = gql`
  query getWahlbeteiligungQuery($wahlid: Int!) {
    wahlbeteiligung: getWahlbeteiligung(wahlid: $wahlid) {
      wahl {
        id
        wahldatum
      }
      stimmkreis {
        id
        name
      }
      wahlbeteiligung
    }
  }
`;

interface IGetWahlbeteiligungQueryResponse {
  wahlbeteiligung?: Wahlbeteiligung[];
}

export interface IGetWahlbeteiligungQueryHocProps {
  readonly wahlbeteiligungData: DataValue<
    IGetWahlbeteiligungQueryResponse,
    QueryToGetWahlbeteiligungArgs
  >;
}

const getWahlbeteiligungTypedHoc = createTypedGraphqlHoc<
  IGetWahlbeteiligungQueryResponse,
  QueryToGetWahlbeteiligungArgs
>(getWahlbeteiligungQuery);

export const withWahlbeteiligungQuery = <TProps = {}>(
  getWahlId: (props: TProps) => number
) =>
  getWahlbeteiligungTypedHoc<TProps, IGetWahlbeteiligungQueryHocProps>({
    options: props => ({
      variables: {
        wahlid: getWahlId(props)
      }
    }),
    props: ({ data }) => ({
      wahlbeteiligungData: data
    })
  });
