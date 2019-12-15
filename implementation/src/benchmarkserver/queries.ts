import gql from "graphql-tag";

/**
 * NOTE: Using existing gql tagged queries by importing them here does not work
 * sadly as it would require a huge refactoring because the *Query.ts files
 * includes react dependencies which require window global variable on load
 * which does not exist in NodeJS ...
 */

export const query_q1 = gql`
  query getMandateQuery($wahlid: Int!) {
    getMandate(wahlid: $wahlid) {
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

// query q2 and q1 share same server endpoint as the
// required data is essentially the same just displayed
// differently
export const query_q2 = query_q1;

// TODO: add remaining queries once they are added
export const query_q3 = gql`
  query getWahlbeteiligungQuery($wahlid: Int!) {
    getWahlbeteiligung(wahlid: $wahlid) {
      wahl {
        id
        wahldatum
      }
      stimmkreis {
        id
        name
      }
      wahlbeteiligung
    }
  }
`;

export const query_q4 = gql`
  query getStimmkreisWinnerQuery($wahlid: Int!, $erststimmen: Boolean!) {
    getStimmkreisWinner(wahlid: $wahlid, erststimmen: $erststimmen) {
      stimmkreis {
        id
        name
      }
      partei {
        id
        name
      }
      anzahl
    }
  }
`;

export const query_q5 = gql`
  query getUeberhangmandateQuery($wahlid: Int!) {
    getUeberhangMandate(wahlid: $wahlid) {
      regierungsbezirk {
        id
        name
      }
      partei {
        id
        name
      }
      ueberhang
      ausgleich
      zustehend
    }
  }
`;

export const query_q6 = gql`
  query knappsteKandidatenQuery($wahlid: Int!, $amountPerPartei: Int) {
    getKnappsteKandidaten(wahlid: $wahlid, amountPerPartei: $amountPerPartei) {
      wahl {
        id
        wahldatum
      }
      stimmkreis {
        id
        name
      }
      kandidat {
        id
        name
        partei {
          id
          name
        }
      }
      differenz
      gewinner
      platz
    }
  }
`;

export const getAllWahlenQuery = gql`
  query getAllWahlenQuery {
    allWahlen: getAllWahlen {
      id
      wahldatum
    }
  }
`;
