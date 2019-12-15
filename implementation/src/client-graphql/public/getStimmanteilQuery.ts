import gql from "graphql-tag";
import { IGraphqlType, createTypedGraphqlHoc } from "../typedGraphql";
import { IAnteil } from "../../shared/sharedTypes";
import { DataValue } from "react-apollo";

const getStimmenanteilQuery = gql`
  query getStimmenanteilQuery($wahlid: Int!, $stimmkreisid: Int!) {
    stimmanzahl: getProzentualenAnteil(
      wahlid: $wahlid
      stimmkreisid: $stimmkreisid
    )
  }
`;
interface IGetStimmenanteilQueryResponse extends IGraphqlType {
  readonly stimmenanteil?: IAnteil[];
}

interface IGetStimmenanteilQueryVariables {
  readonly wahlid: number;
  readonly stimmkreisid: number;
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
  getVGLWahlId: (props: TProps) => number,
  getStimmkreisId: (props: TProps) => number
) =>
  getStimmenanteilTypedHoc<TProps, IGetStimmenanteilQueryHocProps>({
    options: props => ({
      variables: {
        wahlid: getWahlId(props),
        vglWahlId: getVGLWahlId(props),
        stimmkreisid: getStimmkreisId(props)
      }
    }),
    props: ({ data }) => ({
      stimmenanteilData: data
    })
  });
