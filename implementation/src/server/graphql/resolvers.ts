import { GraphQLDateTime } from "graphql-iso-date";
import { GraphQLFileUpload } from "../../shared/sharedTypes";
import { getAllWahlen } from "../adapters/postgres/queries/wahlenPSQL";
import { parseCSV } from "../csv-parser/CSVParser";
import {
  computeElectionResults,
  getMandate,
  computeWinnerParties,
  getUeberhangmandate,
  getKnappsteKandidaten,
  computeWahlbeteiligung,
  getDirektmandat,
  computeEntwicklungDerStimmmen
} from "../adapters/postgres/queries/electionPSQL";
import { Query, Resolver } from "../../shared/graphql.types";

export interface IContext {
  readonly userId: Promise<number>;
  readonly userIp: string;
  readonly authToken: string;
}

export const resolvers: Resolver = {
  Date: GraphQLDateTime,
  Query: {
    getAllWahlen,
    getMandate: (_: any, args: { wahlid: number }) => getMandate(args.wahlid),
    getStimmkreisWinner: (
      _: any,
      args: { wahlid: number; erststimmen: boolean }
    ) => computeWinnerParties(args.wahlid, args.erststimmen),
    getUeberhangMandate: (_: any, args: { wahlid: number }) =>
      getUeberhangmandate(args.wahlid),
    getKnappsteKandidaten: (
      _: any,
      args: { wahlid: number; amountPerPartei?: number }
    ) => getKnappsteKandidaten(args.wahlid, args.amountPerPartei),
    getWahlbeteiligung: (_: any, args: { wahlid: number }) =>
      computeWahlbeteiligung(args.wahlid),
    getDirektmandat: (_: any, args: { wahlid: number; stimmkreisid: number }) =>
      getDirektmandat(args.wahlid, args.stimmkreisid),
    getStimmentwicklung: (
      _: any,
      args: {
        wahlid: number;
        vglwahlid: number;
        stimmkreisid: number;
      }
    ) =>
      computeEntwicklungDerStimmmen(
        args.wahlid,
        args.vglwahlid,
        args.stimmkreisid
      )
  },
  Mutation: {
    importCSVData: async (
      _: any,
      args: {
        files: Promise<GraphQLFileUpload>[];
        wahldatum: Date;
        aggregiert: boolean;
      }
    ) =>
      await Promise.all(
        args.files.map(wahlfile =>
          wahlfile.then(
            file => (
              console.log(file), parseCSV(file, args.wahldatum, args.aggregiert)
            )
          )
        )
      ).then(() => true),
    computeElectionResults: computeElectionResults
  }
};
