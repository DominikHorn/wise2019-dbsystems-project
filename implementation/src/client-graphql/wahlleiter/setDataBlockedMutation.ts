import gql from "graphql-tag";
import { MutationToSetDataBlockedArgs } from "../../shared/graphql.types";
import { FetchResult } from "apollo-link";
import { createTypedGraphqlHoc } from "../typedGraphql";

const setDataBlockedGQL = gql`
  mutation setDataBlockedMutation(
    $wahlleiterAuth: String!
    $wahlid: Int!
    $blocked: Boolean!
  ) {
    success: setDataBlocked(
      wahlleiterAuth: $wahlleiterAuth
      wahlid: $wahlid
      blocked: $blocked
    )
  }
`;

interface ISetDataBlockedMutationResult {
  readonly success: boolean;
}

export interface ISetDataBlockedMutationHOCProps {
  readonly setDataBlocked: (
    variables: MutationToSetDataBlockedArgs
  ) => Promise<void | FetchResult<ISetDataBlockedMutationResult>>;
}

const setDataBlockedTypedHoc = createTypedGraphqlHoc<
  ISetDataBlockedMutationResult,
  MutationToSetDataBlockedArgs
>(setDataBlockedGQL);

export const withSetDataBlockedMutation = <TProps = {}>() =>
  setDataBlockedTypedHoc<TProps, ISetDataBlockedMutationHOCProps>({
    props: ({ mutate }) => ({
      setDataBlocked: (variables: MutationToSetDataBlockedArgs) =>
        mutate({ variables })
    })
  });
