import gql from "graphql-tag";
import { DataValue } from "react-apollo";
import { UeberhangMandat } from "../../shared/graphql.types";
import { createTypedGraphqlHoc, IGraphqlType } from "../typedGraphql";

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

interface IGetUeberhangmandateResponse extends IGraphqlType {
  readonly ueberhangmandate?: UeberhangMandat[];
}

interface IGetUeberhangmandateVariables {
  readonly wahlid: number;
}

export interface IGetUeberhangmandateQueryHocProps {
  readonly ueberhangmandateData: DataValue<
    IGetUeberhangmandateResponse,
    IGetUeberhangmandateVariables
  >;
}

const getUeberhangmandateTypedHoc = createTypedGraphqlHoc<
  IGetUeberhangmandateResponse,
  IGetUeberhangmandateVariables
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
