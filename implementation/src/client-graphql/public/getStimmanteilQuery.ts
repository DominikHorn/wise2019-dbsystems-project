import gql from "graphql-tag";
import { IGraphqlType, createTypedGraphqlHoc } from "../typedGraphql";
import { IStimmenEntwicklung, IAnteil } from "../../shared/sharedTypes";
import { DataValue } from "react-apollo";
import { getStimmkreisForId } from "../../server/adapters/postgres/queries/stimmkreisPSQL";

const getStimmenanteilQuery = gql`
  query getStimmenanteilQuery(
    $wahlid: Int!
    $stimmkreisid: Int!
    $einzel: boolean!
  ) {
    stimmanzahl: getStimmanzahl(
      wahlid: $wahlid
      stimmkreisid: $stimmkreisid
      einzel: $einzel
    )
  }
`;
interface IGetStimmenanteilQueryResponse extends IGraphqlType {
  readonly stimmenanteil?: IAnteil[];
}

interface IGetStimmenanteilQueryVariables {
  readonly wahlid: number;
  readonly stimmkreisid: number;
  readonly einzel: boolean;
}

export interface IGetStimmenanteilQueryHocProps {
  readonly stimmenanteilData?: DataValue<
    IGetStimmenanteilQueryResponse,
    IGetStimmenanteilQueryVariables
  >;
}

const getStimmenanteilTypedHoc = createTypedGraphqlHoc<
  IGetStimmenanteilQueryResponse,
  IGetStimmenanteilQueryVariables
>(getStimmenanteilQuery);

export const withStimmenanteilQuery = <TProps = {}>(
  getWahlId: (props: TProps) => number,
  getStimmkreisId: (props: TProps) => number,
  getEinzel: (props: TProps) => boolean
) =>
  getStimmenanteilTypedHoc<TProps, IGetStimmenanteilQueryHocProps>({
    options: props => ({
      variables: {
        wahlid: getWahlId(props),
        stimmkreisid: getStimmkreisId(props),
        einzel: getEinzel(props)
      }
    }),
    props: ({ data }) => ({
      stimmenanteilData: data
    })
  });
