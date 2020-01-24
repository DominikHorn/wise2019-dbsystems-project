import gql from "graphql-tag";
import { MutationFn } from "react-apollo";
import { MutationToCastVoteArgs } from "../../shared/graphql.types";
import { createTypedGraphqlHoc } from "../typedGraphql";

const castVoteGQL = gql`
  mutation castVoteMutation(
    $wahlkabineToken: String!
    $erstkandidatID: Int
    $zweitkandidatID: Int
    $zweitparteiID: Int
  ) {
    success: castVote(
      wahlkabineToken: $wahlkabineToken
      erstkandidatID: $erstkandidatID
      zweitkandidatID: $zweitkandidatID
      zweitparteiID: $zweitparteiID
    )
  }
`;

interface Response {
  readonly success?: boolean;
}

export interface MutationToCastVoteHOCProps {
  readonly castVote?: MutationFn<Response, MutationToCastVoteArgs>;
}

const hoc = createTypedGraphqlHoc<Response, MutationToCastVoteArgs>(
  castVoteGQL
);

export const withCastVoteMutation = () =>
  hoc<{}, MutationToCastVoteHOCProps>({
    props: ({ mutate }) => ({
      castVote: mutate
    })
  });
