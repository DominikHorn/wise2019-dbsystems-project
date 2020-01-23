import gql from "graphql-tag";
import { MutationFn } from "react-apollo";
import { MutationToRemoveWahlkabineArgs } from "../../shared/graphql.types";
import { createTypedGraphqlHoc } from "../typedGraphql";
import { getRegisteredWahlkabinenQueryName } from "./getRegisteredWahlkabinenQuery";

const removeWahlkabineGQL = gql`
  mutation removeWahlkabineMutation(
    $wahlhelferAuth: String!
    $wahlkabineToken: String!
  ) {
    success: removeWahlkabine(
      wahlhelferAuth: $wahlhelferAuth
      wahlkabineToken: $wahlkabineToken
    )
  }
`;

interface Response {
  readonly success?: boolean;
}

export interface MutationToRemoveWahlkabineHOCProps {
  readonly removeWahlkabine?: MutationFn<
    Response,
    MutationToRemoveWahlkabineArgs
  >;
}

const hoc = createTypedGraphqlHoc<Response, MutationToRemoveWahlkabineArgs>(
  removeWahlkabineGQL
);

export const withRemoveWahlkabineMutation = () =>
  hoc<{}, MutationToRemoveWahlkabineHOCProps>({
    props: ({ mutate }) => ({
      removeWahlkabine: mutate
    }),
    options: {
      refetchQueries: [getRegisteredWahlkabinenQueryName]
    }
  });
