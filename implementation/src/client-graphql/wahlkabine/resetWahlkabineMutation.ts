import gql from "graphql-tag";
import { MutationFn } from "react-apollo";
import { MutationToResetWahlkabineArgs } from "../../shared/graphql.types";
import { createTypedGraphqlHoc } from "../typedGraphql";

const resetWahlkabineGQL = gql`
  mutation resetWahlkabineMutation($wahlkabineToken: String!) {
    success: resetWahlkabine(wahlkabineToken: $wahlkabineToken)
  }
`;

interface Response {
  readonly success?: boolean;
}

export interface MutationToResetWahlkabineHOCProps {
  readonly resetWahlkabine?: MutationFn<
    Response,
    MutationToResetWahlkabineArgs
  >;
}

const hoc = createTypedGraphqlHoc<Response, MutationToResetWahlkabineArgs>(
  resetWahlkabineGQL
);

export const withResetWahlkabineMutation = () =>
  hoc<{}, MutationToResetWahlkabineHOCProps>({
    props: ({ mutate }) => ({
      resetWahlkabine: mutate
    })
  });
