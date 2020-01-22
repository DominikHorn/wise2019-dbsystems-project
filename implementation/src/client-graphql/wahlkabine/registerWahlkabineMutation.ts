import gql from "graphql-tag";
import { MutationFn } from "react-apollo";
import { MutationToRegisterWahlkabineArgs } from "../../shared/graphql.types";
import { createTypedGraphqlHoc } from "../typedGraphql";
import { getRegisteredWahlkabinenQueryName } from "./getRegisteredWahlkabinenQuery";

const registerWahlkabineGQL = gql`
  mutation registerWahlkabineMutation(
    $wahlhelferAuth: String!
    $wahlkabineToken: String!
    $wahlkabineLabel: String!
  ) {
    success: registerWahlkabine(
      wahlhelferAuth: $wahlhelferAuth
      wahlkabineToken: $wahlkabineToken
      wahlkabineLabel: $wahlkabineLabel
    )
  }
`;

interface Response {
  readonly success?: boolean;
}

export interface MutationToRegisterWahlkabineHOCProps {
  readonly registerWahlkabine?: MutationFn<
    Response,
    MutationToRegisterWahlkabineArgs
  >;
}

const hoc = createTypedGraphqlHoc<Response, MutationToRegisterWahlkabineArgs>(
  registerWahlkabineGQL
);

export const withRegisterWahlkabineMutation = () =>
  hoc<{}, MutationToRegisterWahlkabineHOCProps>({
    props: ({ mutate }) => ({
      registerWahlkabine: mutate
    }),
    options: {
      refetchQueries: [getRegisteredWahlkabinenQueryName]
    }
  });
