import gql from "graphql-tag";
import { IGraphqlType, createTypedGraphqlHoc } from "../typedGraphql";
import { IQ7 } from "../../shared/sharedTypes";
import { DataValue } from "react-apollo";

const getAllStimmkreisInfoQuery = gql`
  query getAllStimmkreisInfosQuery(
    $wahlid: Int!
    $stimmkreis1: Int!
    $stimmkreis2: Int!
    $stimmkreis3: Int!
    $stimmkreis4: Int!
    $stimmkreis5: Int!
    $vgl_wahlid: Int!
  ) {
    allStimmkreisInfos: getAllStimmkreisInfos(
      wahlid: $wahlid
      stimmkreis1: $stimmkreis1
      stimmkreis2: $stimmkreis2
      stimmkreis3: $stimmkreis3
      stimmkreis4: $stimmkreis4
      stimmkreis5: $stimmkreis5
      vgl_wahlid: $vgl_wahlid
    ) {
      wahl {
        id
        wahldatum
      }
      stimmkreis {
        id
        name
      }
      partei {
        id
        name
      }
      direktmandat
      wahlbeteiligung
      prozAnteil
      absAnteil
      vorher
      nacher
    }
  }
`;

interface IGetAllStimmenkreisInfosQueryResponse extends IGraphqlType {
  readonly allStimmkreisInfos: IQ7[];
}

interface IGetAllStimmkreisInfosQueryVariables {}

export interface IGetAllStimmkreisInfosQueryHocProps {
  readonly allStimmkreisInfosData: DataValue<
    IGetAllStimmenkreisInfosQueryResponse,
    IGetAllStimmkreisInfosQueryVariables
  >;
}

const getAllStimmkreisInfosTypedHoc = createTypedGraphqlHoc<
  IGetAllStimmenkreisInfosQueryResponse,
  IGetAllStimmkreisInfosQueryVariables
>(getAllStimmkreisInfoQuery);

export const withAllStimmkreisInfosQuery = <TProps = {}>(
  getWahlId: (props: TProps) => number,
  getVGLWahlId: (props: TProps) => number,
  getStimmkreisId1: (props: TProps) => number,
  getStimmkreisId2: (props: TProps) => number,
  getStimmkreisId3: (props: TProps) => number,
  getStimmkreisId4: (props: TProps) => number,
  getStimmkreisId5: (props: TProps) => number
) =>
  getAllStimmkreisInfosTypedHoc<TProps, IGetAllStimmkreisInfosQueryHocProps>({
    options: props => ({
      variables: {
        wahlid: getWahlId(props),
        stimmkreisid1: getStimmkreisId1(props),
        stimmkreisid2: getStimmkreisId2(props),
        stimmkreisid3: getStimmkreisId3(props),
        stimmkreisid4: getStimmkreisId4(props),
        stimmkreisid5: getStimmkreisId5(props),
        vglwahlid: getVGLWahlId(props)
      }
    }),
    props: ({ data }) => ({
      allStimmkreisInfosData: data
    })
  });
