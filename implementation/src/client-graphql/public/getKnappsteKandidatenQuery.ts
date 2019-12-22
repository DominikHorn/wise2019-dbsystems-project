import gql from "graphql-tag";
import { IGraphqlType, createTypedGraphqlHoc } from "../typedGraphql";
import { KnapperKandidat } from "../../shared/graphql.types";
import { DataValue } from "react-apollo";

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

interface IGetKnappsteKandidatenQueryResponse extends IGraphqlType {
  readonly knappsteKandidaten?: KnapperKandidat[];
}

interface IGetKnappsteKandidatenQueryVariables {
  readonly wahlid: number;
  readonly amountPerPartei: number;
}

export interface IGetKnappsteKandidatenQueryHocProps {
  readonly knappsteKandidatenData: DataValue<
    IGetKnappsteKandidatenQueryResponse,
    IGetKnappsteKandidatenQueryVariables
  >;
}

const knappsteKandidatenTypedHoc = createTypedGraphqlHoc<
  IGetKnappsteKandidatenQueryResponse,
  IGetKnappsteKandidatenQueryVariables
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
