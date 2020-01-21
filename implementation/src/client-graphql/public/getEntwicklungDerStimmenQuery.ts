import gql from "graphql-tag";
import { IGraphqlType, createTypedGraphqlHoc } from "../typedGraphql";
import { IStimmenEntwicklung } from "../../shared/sharedTypes";
import { DataValue } from "react-apollo";

const getEntwicklungDerStimmenQuery = gql`
  query computeEntwicklungDerStimmenQuery(
    $wahlid: Int!
    $vglwahlid: Int!
    $stimmkreisid: Int!
  ) {
    stimmenEntwicklung: computeEntwicklungDerStimmen(
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

interface IGetEntwicklungDerStimmenQueryResponse extends IGraphqlType {
  readonly stimmenEntwicklung?: IStimmenEntwicklung[];
}

interface IGetEntwicklungDerStimmenQueryVariables {
  readonly wahlid: number;
  readonly stimmkreisid: number;
}

export interface IGetEntwicklungDerStimmenQueryHocProps {
  readonly entwicklungDerStimmenData?: DataValue<
    IGetEntwicklungDerStimmenQueryResponse,
    IGetEntwicklungDerStimmenQueryVariables
  >;
}

const getEntwicklungDerStimmenTypedHoc = createTypedGraphqlHoc<
  IGetEntwicklungDerStimmenQueryResponse,
  IGetEntwicklungDerStimmenQueryVariables
>(getEntwicklungDerStimmenQuery);

export const withEntwicklungDerStimmenQuery = <TProps = {}>(
  getWahlId: (props: TProps) => number,
  getVGLWahlId: (props: TProps) => number,
  getStimmkreisId: (props: TProps) => number
) =>
  getEntwicklungDerStimmenTypedHoc<
    TProps,
    IGetEntwicklungDerStimmenQueryHocProps
  >({
    options: props => ({
      variables: {
        wahlid: getWahlId(props),
        vglwahlid: getVGLWahlId(props),
        stimmkreisid: getStimmkreisId(props)
      }
    }),
    props: ({ data }) => ({
      entwicklungDerStimmenData: data
    })
  });
