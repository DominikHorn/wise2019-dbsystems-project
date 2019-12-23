import gql from "graphql-tag";
import { DataValue } from "react-apollo";
import {
  QueryToGetUeberhangMandateArgs,
  UeberhangMandat
} from "../../shared/graphql.types";
import { createTypedGraphqlHoc } from "../typedGraphql";

const getUeberhangmandateQuery = gql`
  query getUeberhangmandateQuery($wahlid: Int!) {
    ueberhangmandate: getUeberhangMandate(wahlid: $wahlid) {
      regierungsbezirk {
        id
        name
      }
      partei {
        id
        name
      }
      ueberhang
      ausgleich
      zustehend
    }
  }
`;

interface IGetUeberhangmandateResponse {
  readonly ueberhangmandate?: UeberhangMandat[];
}

export interface IGetUeberhangmandateQueryHocProps {
  readonly ueberhangmandateData: DataValue<
    IGetUeberhangmandateResponse,
    QueryToGetUeberhangMandateArgs
  >;
}

const getUeberhangmandateTypedHoc = createTypedGraphqlHoc<
  IGetUeberhangmandateResponse,
  QueryToGetUeberhangMandateArgs
>(getUeberhangmandateQuery);

export const withUeberhangmandateQuery = <TProps = {}>(
  getWahlId: (props: TProps) => number
) =>
  getUeberhangmandateTypedHoc<TProps, IGetUeberhangmandateQueryHocProps>({
    options: props => ({
      variables: {
        wahlid: getWahlId(props)
      }
    }),
    props: ({ data }) => ({
      ueberhangmandateData: data
    })
  });
