import gql from "graphql-tag";
import {
  WahlhelferToken,
  MutationToGenerateWahlhelferTokensArgs
} from "../../shared/graphql.types";
import { FetchResult } from "apollo-link";
import { createTypedGraphqlHoc } from "../typedGraphql";

const generateWahlhelferTokensGQL = gql`
  mutation generateWahlhelferTokensMutation(
    $wahlleiterAuth: String!
    $wahlid: Int!
  ) {
    wahlhelferTokens: generateWahlhelferTokens(
      wahlleiterAuth: $wahlleiterAuth
      wahlid: $wahlid
    ) {
      wahl {
        id
        wahldatum
      }
      stimmkreis {
        id
        name
      }
      token
    }
  }
`;

interface MutationToGenerateWahlhelferTokensResponse {
  readonly wahlhelferTokens?: WahlhelferToken[];
}

export interface IGenerateWahlhelferTokensHOCProps {
  readonly generateWahlhelferTokens: (
    variables: MutationToGenerateWahlhelferTokensArgs
  ) => Promise<void | FetchResult<MutationToGenerateWahlhelferTokensResponse>>;
}

const generateWahlhelferTokensTypedHOC = createTypedGraphqlHoc<
  MutationToGenerateWahlhelferTokensResponse,
  MutationToGenerateWahlhelferTokensArgs
>(generateWahlhelferTokensGQL);

export const withGenerateWahlhelferTokensMutation = <TProps = {}>() =>
  generateWahlhelferTokensTypedHOC<TProps, IGenerateWahlhelferTokensHOCProps>({
    props: ({ mutate }) => ({
      generateWahlhelferTokens: (
        variables: MutationToGenerateWahlhelferTokensArgs
      ) => mutate({ variables })
    })
  });
