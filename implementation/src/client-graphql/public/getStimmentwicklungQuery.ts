import gql from "graphql-tag";
import { DataValue } from "react-apollo";
import {
  Stimmentwicklung,
  QueryToGetStimmentwicklungArgs
} from "../../shared/graphql.types";
import { createTypedGraphqlHoc } from "../typedGraphql";

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

interface IGetStimmentwicklungQueryResponse {
  readonly stimmentwicklung?: Stimmentwicklung[];
}

export interface IGetStimmentwicklungQueryHocProps {
  readonly stimmentwicklungData?: DataValue<
    IGetStimmentwicklungQueryResponse,
    QueryToGetStimmentwicklungArgs
  >;
}

const getStimmentwicklungTypedHoc = createTypedGraphqlHoc<
  IGetStimmentwicklungQueryResponse,
  QueryToGetStimmentwicklungArgs
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
