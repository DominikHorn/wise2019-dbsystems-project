import gql from "graphql-tag";
import { FetchResult } from "react-apollo";
import { createTypedGraphqlHoc } from "../typedGraphql";
import { MutationToComputeElectionResultsArgs } from "../../shared/graphql.types";

const computeElectionResultsMutation = gql`
  mutation computeElectionResultsMutation($wahlleiterAuth: String!) {
    success: computeElectionResults(wahlleiterAuth: $$wahlleiterAuth)
  }
`;

interface IComputeElectionResultsMutationResponse {
  readonly success?: boolean;
}

export interface IComputeElectionResultsMutationHocProps {
  readonly computeElectionResults: (
    variables: MutationToComputeElectionResultsArgs
  ) => Promise<void | FetchResult<IComputeElectionResultsMutationResponse>>;
}

const computeElectionResultsTypedHoc = createTypedGraphqlHoc<
  IComputeElectionResultsMutationResponse,
  MutationToComputeElectionResultsArgs
>(computeElectionResultsMutation);

export const withComputeElectionResultsMutation = <TProps = {}>() =>
  computeElectionResultsTypedHoc<
    TProps,
    IComputeElectionResultsMutationHocProps
  >({
    props: ({ mutate }) => ({
      computeElectionResults: (
        variables: MutationToComputeElectionResultsArgs
      ) => mutate({ variables })
    })
  });
