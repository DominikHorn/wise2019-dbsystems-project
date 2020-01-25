import gql from "graphql-tag";

export const isRegisteredGQL = gql`
  query isRegisteredQuery($wahlkabineToken: String!) {
    isRegistered(wahlkabineToken: $wahlkabineToken)
  }
`;
