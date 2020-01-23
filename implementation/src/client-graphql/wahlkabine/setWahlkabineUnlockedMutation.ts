import gql from "graphql-tag";
import { MutationFn } from "react-apollo";
import { MutationToSetWahlkabineUnlockedArgs } from "../../shared/graphql.types";
import { createTypedGraphqlHoc } from "../typedGraphql";
import { getRegisteredWahlkabinenQueryName } from "./getRegisteredWahlkabinenQuery";

const setWahlkabineUnlockedGQL = gql`
  mutation setWahlkabineUnlockedMutation(
    $wahlhelferAuth: String!
    $wahlkabineToken: String!
    $unlocked: Boolean!
  ) {
    success: setWahlkabineUnlocked(
      wahlhelferAuth: $wahlhelferAuth
      wahlkabineToken: $wahlkabineToken
      unlocked: $unlocked
    )
  }
`;

interface Response {
  readonly success?: boolean;
}

export interface MutationToSetWahlkabineUnlockedHOCProps {
  readonly setWahlkabineUnlocked?: MutationFn<
    Response,
    MutationToSetWahlkabineUnlockedArgs
  >;
}

const hoc = createTypedGraphqlHoc<
  Response,
  MutationToSetWahlkabineUnlockedArgs
>(setWahlkabineUnlockedGQL);

export const withSetWahlkabineUnlockedMutation = () =>
  hoc<{}, MutationToSetWahlkabineUnlockedHOCProps>({
    props: ({ mutate }) => ({
      setWahlkabineUnlocked: mutate
    }),
    options: {
      refetchQueries: [getRegisteredWahlkabinenQueryName]
    }
  });
