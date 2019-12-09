import gql from "graphql-tag";
import { IGraphqlType, createTypedGraphqlHoc } from "../typedGraphql";
import { IStimmenEntwicklung } from "../../shared/sharedTypes";
import { DataValue } from "react-apollo";
import { getStimmkreisForId } from "../../server/adapters/postgres/queries/stimmkreisPSQL";
const getStimmentwicklungQuery = gql`
  query getStimmentwicklungQuery(
    $wahlid: Int!
    $vglwahlid: Int!
    $stimmkreisid: Int!
  ) {
    stimmentwicklung: getStimmentwicklung(
      wahlid: $wahlid
      vglwahlid: $vglwahlid
      stimmkreisid: $stimmkreisid
    ) {
      partei {
        id
        name
      }
      vorher
      nachher
    }
  }
`;

interface IGetStimmentwicklungQueryResponse extends IGraphqlType {
  readonly stimmentwicklung?: IStimmenEntwicklung[];
}

interface IGetStimmentwicklungQueryVariables {
  readonly wahlid: number;
  readonly vglwahlid: number;
  readonly stimmkreisid: number;
}

export interface IGetStimmentwicklungQueryHocProps {
  readonly stimmentwicklungData?: DataValue<
    IGetStimmentwicklungQueryResponse,
    IGetStimmentwicklungQueryVariables
  >;
}

const getStimmentwicklungTypedHoc = createTypedGraphqlHoc<
  IGetStimmentwicklungQueryResponse,
  IGetStimmentwicklungQueryVariables
>(getStimmentwicklungQuery);

export const withStimmentwicklungQuery = <TProps = {}>(
  getWahlId: (props: TProps) => number,
  getVglWahlId: (props: TProps) => number,
  getStimmkreisId: (props: TProps) => number
) =>
  getStimmentwicklungTypedHoc<TProps, IGetStimmentwicklungQueryHocProps>({
    options: props => ({
      variables: {
        wahlid: getWahlId(props),
        vglwahlid: getVglWahlId(props),
        stimmkreisid: getStimmkreisId(props)
      }
    }),
    props: ({ data }) => ({
      stimmentwicklungData: data
    })
  });
