import gql from "graphql-tag";
import { FetchResult } from "react-apollo";
import { createTypedGraphqlHoc } from "../typedGraphql";

const computeElectionResultsMutation = gql`
  mutation computeElectionResultsMutation {
    success: computeElectionResults
  }
`;

interface IComputeElectionResultsMutationResponse {
  readonly success?: boolean;
}

export interface IComputeElectionResultsMutationVariables {}

export interface IComputeElectionResultsMutationHocProps {
  readonly computeElectionResults: (
    variables: IComputeElectionResultsMutationVariables
  ) => Promise<void | FetchResult<IComputeElectionResultsMutationResponse>>;
}

const computeElectionResultsTypedHoc = createTypedGraphqlHoc<
  IComputeElectionResultsMutationResponse,
  IComputeElectionResultsMutationVariables
>(computeElectionResultsMutation);

export const withComputeElectionResultsMutation = <TProps = {}>() =>
  computeElectionResultsTypedHoc<
    TProps,
    IComputeElectionResultsMutationHocProps
  >({
    props: ({ mutate }) => ({
      computeElectionResults: (
        variables: IComputeElectionResultsMutationVariables
      ) => mutate({ variables })
    })
  });
