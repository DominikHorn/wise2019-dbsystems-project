import { GraphQLDateTime } from "graphql-iso-date";
import { GraphQLFileUpload } from "../../shared/sharedTypes";
import { getAllWahlen } from "../adapters/postgres/wahlenPSQL";
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
} from "../adapters/postgres/electionPSQL";
import { Resolver } from "../../shared/graphql.types";
import {
  getIsBlocked,
  setDataBlocked,
  withVerifyIsAdmin
} from "../adapters/postgres/adminPSQL";

export interface IContext {
  readonly userId: Promise<number>;
  readonly userIp: string;
  readonly authToken: string;
}

export const resolvers: Resolver = {
  Date: GraphQLDateTime,
  Wahl: {
    dataBlocked: w => getIsBlocked(w.id)
  },
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
    importCSVData: (_, args) =>
      withVerifyIsAdmin(args.wahlleiterAuth, () =>
        Promise.all(
          args.files.map(wahlfile =>
            wahlfile.then((file: any) =>
              parseCSV(file, args.wahldatum, args.aggregiert)
            )
          )
        ).then(() => true)
      ),
    computeElectionResults: (_, args) =>
      withVerifyIsAdmin(args.wahlleiterAuth, computeElectionResults),
    setDataBlocked: (_, args) =>
      withVerifyIsAdmin(args.wahlleiterAuth, () => setDataBlocked(args))
  }
};
