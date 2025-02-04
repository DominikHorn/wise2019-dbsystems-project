import gql from "graphql-tag";
import { DataValue } from "react-apollo";
import {
  QueryToGetStimmkreisWinnerArgs,
  StimmkreisWinner
} from "../../shared/graphql.types";
import { createTypedGraphqlHoc } from "../typedGraphql";

const getStimmkreisWinnerQuery = gql`
  query getStimmkreisWinnerQuery($wahlid: Int!, $erststimmen: Boolean!) {
    stimmkreisWinner: getStimmkreisWinner(
      wahlid: $wahlid
      erststimmen: $erststimmen
    ) {
      stimmkreis {
        id
        name
      }
      partei {
        id
        name
      }
      anzahl
    }
  }
`;

interface IGetStimmkreisWinnerQueryResponse {
  readonly stimmkreisWinner: StimmkreisWinner[];
}
export interface IGetStimmkreisWinnerHocProps {
  readonly stimmkreisWinnerData: DataValue<
    IGetStimmkreisWinnerQueryResponse,
    QueryToGetStimmkreisWinnerArgs
  >;
}

const getStimmkreisWinnerTypedHoc = createTypedGraphqlHoc<
  IGetStimmkreisWinnerQueryResponse,
  QueryToGetStimmkreisWinnerArgs
>(getStimmkreisWinnerQuery);

export const withStimmkreisWinnerQuery = <TProps = {}>(
  getWahlId: (props: TProps) => number,
  getErststimmen: (props: TProps) => boolean
) =>
  getStimmkreisWinnerTypedHoc<TProps, IGetStimmkreisWinnerHocProps>({
    options: props => ({
      variables: {
        wahlid: getWahlId(props),
        erststimmen: getErststimmen(props)
      }
    }),
    props: ({ data }) => ({
      stimmkreisWinnerData: data
    })
  });
