import gql from "graphql-tag";

/**
 * Using getMandateQuery does not work sadly and would require
 * a huge refactoring because that file includes react dependencies
 * which require window global variable ...
 */
export const query_q1 = gql`
  query getMandateQuery($wahlid: Int!) {
    mandate: getMandate(wahlid: $wahlid) {
      kandidat {
        id
        name
        partei {
          id
          name
        }
      }
      direktmandat
    }
  }
`;
