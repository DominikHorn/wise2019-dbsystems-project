import gql from "graphql-tag";
import { IGraphqlType, createTypedGraphqlHoc } from "../typedGraphql";
import { IAnteil } from "../../shared/sharedTypes";
import { DataValue } from "react-apollo";

const getStimmenanzahlQuery = gql`
  query getStimmenanzahlQuery($wahlid: Int!, $stimmkreisid: Int!) {
    stimmanzahl: getAbsoluteAnzahl(wahlid: $wahlid, stimmkreisid: $stimmkreisid)
  }
`;
interface IGetStimmenanzahlQueryResponse extends IGraphqlType {
  readonly stimmenanzahl?: IAnteil[];
}

interface IGetStimmenanzahlQueryVariables {
  readonly wahlid: number;
  readonly stimmkreisid: number;
}

export interface IGetStimmenanzahlQueryHocProps {
  readonly stimmenanzahlData?: DataValue<
    IGetStimmenanzahlQueryResponse,
    IGetStimmenanzahlQueryVariables
  >;
}

const getStimmenanzahlTypedHoc = createTypedGraphqlHoc<
  IGetStimmenanzahlQueryResponse,
  IGetStimmenanzahlQueryVariables
>(getStimmenanzahlQuery);

export const withStimmenanzahlQuery = <TProps = {}>(
  getWahlId: (props: TProps) => number,
  getStimmkreisId: (props: TProps) => number
) =>
  getStimmenanzahlTypedHoc<TProps, IGetStimmenanzahlQueryHocProps>({
    options: props => ({
      variables: {
        wahlid: getWahlId(props),
        stimmkreisid: getStimmkreisId(props)
      }
    }),
    props: ({ data }) => ({
      stimmenanzahlData: data
    })
  });
