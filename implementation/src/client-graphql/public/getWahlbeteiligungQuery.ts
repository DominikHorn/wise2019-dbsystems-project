import gql from "graphql-tag";
import { Wahlbeteiligung } from "../../shared/graphql.types";
import { IGraphqlType, createTypedGraphqlHoc } from "../typedGraphql";
import { DataValue } from "react-apollo";

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

interface IGetWahlbeteiligungQueryResponse extends IGraphqlType {
  wahlbeteiligung?: Wahlbeteiligung[];
}

interface IGetWahlbeteiligungQueryVariables {
  readonly wahlid: number;
}

export interface IGetWahlbeteiligungQueryHocProps {
  readonly wahlbeteiligungData: DataValue<
    IGetWahlbeteiligungQueryResponse,
    IGetWahlbeteiligungQueryVariables
  >;
}

const getWahlbeteiligungTypedHoc = createTypedGraphqlHoc<
  IGetWahlbeteiligungQueryResponse,
  IGetWahlbeteiligungQueryVariables
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
