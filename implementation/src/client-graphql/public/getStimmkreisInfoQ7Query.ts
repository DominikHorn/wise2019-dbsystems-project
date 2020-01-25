import gql from "graphql-tag";
import { IGraphqlType, createTypedGraphqlHoc } from "../typedGraphql";
import { DataValue } from "react-apollo";
import { Q7 } from "../../shared/graphql.types";

const getAllStimmkreisInfoQuery = gql`
  query getAllStimmkreisInfosQuery(
    $wahlid: Int!
    $stimmkreisid1: Int!
    $stimmkreisid2: Int!
    $stimmkreisid3: Int!
    $stimmkreisid4: Int!
    $stimmkreisid5: Int!
    $vglwahl: Int!
  ) {
    allStimmkreisInfos: getAllStimmkreisInfos(
      wahlid: $wahlid
      stimmkreisid1: $stimmkreisid1
      stimmkreisid2: $stimmkreisid2
      stimmkreisid3: $stimmkreisid3
      stimmkreisid4: $stimmkreisid4
      stimmkreisid5: $stimmkreisid5
      vglwahl: $vglwahl
    ) {
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
      nachher
    }
  }
`;

interface IGetAllStimmenkreisInfosQueryResponse extends IGraphqlType {
  readonly allStimmkreisInfos: Q7[];
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
  getStimmkreisId1: (props: TProps) => number,
  getStimmkreisId2: (props: TProps) => number,
  getStimmkreisId3: (props: TProps) => number,
  getStimmkreisId4: (props: TProps) => number,
  getStimmkreisId5: (props: TProps) => number,
  getVGLWahlId: (props: TProps) => number
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
        vglwahl: getVGLWahlId(props)
      }
    }),
    props: ({ data }) => ({
      allStimmkreisInfosData: data
    })
  });
