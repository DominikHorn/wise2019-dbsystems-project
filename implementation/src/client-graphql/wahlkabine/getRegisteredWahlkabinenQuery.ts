import gql from "graphql-tag";
import {
  Wahlkabine,
  QueryToGetRegisteredWahlkabinenArgs
} from "../../shared/graphql.types";
import { DataValue } from "react-apollo";
import { createTypedGraphqlHoc } from "../typedGraphql";

export const getRegisteredWahlkabinenQueryName = "getRegisteredWahlkabineQuery";

const getRegisteredWahlkabinenGQL = gql`
  query ${getRegisteredWahlkabinenQueryName}($wahlhelferAuth: String!) {
    wahlkabinen: getRegisteredWahlkabinen(wahlhelferAuth: $wahlhelferAuth) {
      wahlid
      stimmkreisid
      label
      token
      unlocked
    }
  }
`;

interface QueryToGetRegisteredWahlkabinenResponse {
  readonly wahlkabinen?: Wahlkabine[];
}

export interface QueryToGetRegisteredWahlkabinenHOCProps {
  readonly registeredWahlkabinenData?: DataValue<
    QueryToGetRegisteredWahlkabinenResponse,
    QueryToGetRegisteredWahlkabinenArgs
  >;
}

const hoc = createTypedGraphqlHoc<
  QueryToGetRegisteredWahlkabinenResponse,
  QueryToGetRegisteredWahlkabinenArgs
>(getRegisteredWahlkabinenGQL);

export const withRegisteredWahlkabinen = <TProps = {}>(
  getWahlhelferAuth: (props: TProps) => string,
  getPollIntervall?: (props: TProps) => number
) =>
  hoc<TProps, QueryToGetRegisteredWahlkabinenHOCProps>({
    options: props => ({
      variables: {
        wahlhelferAuth: getWahlhelferAuth(props)
      },
      fetchPolicy: "network-only",
      pollInterval: getPollIntervall(props)
    }),
    props: ({ data }) => ({
      registeredWahlkabinenData: data
    })
  });
