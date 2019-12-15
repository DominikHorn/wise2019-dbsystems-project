import { GraphQLDateTime } from "graphql-iso-date";
import { GraphQLFileUpload } from "../../shared/sharedTypes";
import { getWahlen } from "../adapters/postgres/queries/wahlenPSQL";
import { parseCSV } from "../csv-parser/CSVParser";
import {
  computeElectionResults,
  getMandate,
  computeWinnerParties,
  getUeberhangmandate,
  getKnappsteKandidaten,
  computeWahlbeteiligung,
  getDirektmandat,
  computeEntwicklungDerStimmmen,
  computeAbsolutenAnteil,
  computeProzentualenAnteil
} from "../adapters/postgres/queries/electionPSQL";

export interface IContext {
  readonly userId: Promise<number>;
  readonly userIp: string;
  readonly authToken: string;
}

export const resolvers: { [key: string]: any } = {
  Date: GraphQLDateTime,
  Query: {
    getAllWahlen: () => getWahlen(),
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
    // getAbsoluteAnzahl: (
    //   _: any,
    //   args: { wahlid: number; stimmkreisid: number }
    // ) => computeAbsolutenAnteil(args.wahlid, args.stimmkreisid),
    // getProzentualenAnteil: (
    //   _: any,
    //   args: { wahlid: number; stimmkreisid: number }
    // ) => computeProzentualenAnteil(args.wahlid, args.stimmkreisid)
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
