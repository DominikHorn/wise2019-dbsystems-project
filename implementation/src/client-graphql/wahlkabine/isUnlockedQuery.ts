import gql from "graphql-tag";
import { DataValue } from "react-apollo";
import { QueryToIsUnlockedArgs } from "../../shared/graphql.types";
import { createTypedGraphqlHoc } from "../typedGraphql";
import { string } from "prop-types";

const isUnlockedGQL = gql`
  query isUnlockedQuery($wahlkabineToken: String!) {
    isUnlocked(wahlkabineToken: $wahlkabineToken)
  }
`;

interface Response {
  readonly isUnlocked?: boolean;
}

export interface QueryToIsUnlockedHOCProps {
  readonly isUnlockedData?: DataValue<Response, QueryToIsUnlockedArgs>;
}

const hoc = createTypedGraphqlHoc<Response, QueryToIsUnlockedArgs>(
  isUnlockedGQL
);

export const withIsUnlocked = <TProps = {}>(
  getWahlkabineToken: (props: TProps) => string,
  getPollInterval?: (props: TProps) => number
) =>
  hoc<TProps, QueryToIsUnlockedHOCProps>({
    options: props => ({
      variables: {
        wahlkabineToken: getWahlkabineToken(props)
      },
      pollInterval: getPollInterval(props)
    }),
    props: ({ data }) => ({
      isUnlockedData: data
    })
  });
