import gql from "graphql-tag";
import { DataValue } from "react-apollo";
import {
  KnapperKandidat,
  QueryToGetKnappsteKandidatenArgs
} from "../../shared/graphql.types";
import { createTypedGraphqlHoc } from "../typedGraphql";

const getKnappsteKandidatenQuery = gql`
  query knappsteKandidatenQuery($wahlid: Int!, $amountPerPartei: Int) {
    knappsteKandidaten: getKnappsteKandidaten(
      wahlid: $wahlid
      amountPerPartei: $amountPerPartei
    ) {
      wahl {
        id
        wahldatum
      }
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
      differenz
      gewinner
      platz
    }
  }
`;

interface IGetKnappsteKandidatenQueryResponse {
  readonly knappsteKandidaten?: KnapperKandidat[];
}

export interface IGetKnappsteKandidatenQueryHocProps {
  readonly knappsteKandidatenData: DataValue<
    IGetKnappsteKandidatenQueryResponse,
    QueryToGetKnappsteKandidatenArgs
  >;
}

const knappsteKandidatenTypedHoc = createTypedGraphqlHoc<
  IGetKnappsteKandidatenQueryResponse,
  QueryToGetKnappsteKandidatenArgs
>(getKnappsteKandidatenQuery);

export const withKnappsteKandidatenQuery = <TProps = {}>(
  getWahlId: (props: TProps) => number,
  getAmountPerPartei?: (props: TProps) => number
) =>
  knappsteKandidatenTypedHoc<TProps, IGetKnappsteKandidatenQueryHocProps>({
    options: props => ({
      variables: {
        wahlid: getWahlId(props),
        amountPerPartei: getAmountPerPartei && getAmountPerPartei(props)
      }
    }),
    props: ({ data }) => ({
      knappsteKandidatenData: data
    })
  });
