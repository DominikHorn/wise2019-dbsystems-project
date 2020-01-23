import { GraphQLDateTime } from "graphql-iso-date";
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
  withVerifyIsAdmin,
  withVerifyIsNotBlocked,
  generateWahlhelferToken,
  getRegisteredWahlkabinen,
  withVerifyIsWahlhelfer,
  registerWahlkabine,
  isRegisteredWahlkabine,
  removeWahlkabine,
  setWahlkabineUnlocked,
  withVerifyIsWahlkabine,
  resetWahlkabine
} from "../adapters/postgres/adminPSQL";
import {
  getDirektKandidaten,
  getListenKandidaten
} from "../adapters/postgres/kandidatPSQL";
import { adapters } from "../adapters/adapterUtil";

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
    getMandate: (_, args) =>
      withVerifyIsNotBlocked(args.wahlid, () => getMandate(args.wahlid)),
    getStimmkreisWinner: (_, args) =>
      withVerifyIsNotBlocked(args.wahlid, () =>
        computeWinnerParties(args.wahlid, args.erststimmen)
      ),
    getUeberhangMandate: (_, args) =>
      withVerifyIsNotBlocked(args.wahlid, () =>
        getUeberhangmandate(args.wahlid)
      ),
    getKnappsteKandidaten: (_, args) =>
      withVerifyIsNotBlocked(args.wahlid, () =>
        getKnappsteKandidaten(args.wahlid, args.amountPerPartei)
      ),
    getWahlbeteiligung: (_, args) =>
      withVerifyIsNotBlocked(args.wahlid, () =>
        computeWahlbeteiligung(args.wahlid)
      ),
    getDirektmandat: (_, args) =>
      withVerifyIsNotBlocked(args.wahlid, () =>
        getDirektmandat(args.wahlid, args.stimmkreisid)
      ),
    getStimmentwicklung: (_, args) =>
      withVerifyIsNotBlocked(args.wahlid, () =>
        computeEntwicklungDerStimmmen(
          args.wahlid,
          args.vglwahlid,
          args.stimmkreisid
        )
      ),
    getDirektKandidaten: (_, args) =>
      getDirektKandidaten(args.wahlid, args.stimmkreisid),
    getListenKandidaten: (_, args) =>
      getListenKandidaten(args.wahlid, args.regierungsbezirkid),
    getRegisteredWahlkabinen: (_, args) =>
      withVerifyIsWahlhelfer(args.wahlhelferAuth, getRegisteredWahlkabinen),
    isRegistered: (_, args) => isRegisteredWahlkabine(args.wahlkabineToken)
  },
  Mutation: {
    importCSVData: (_, args) =>
      withVerifyIsAdmin(args.wahlleiterAuth, () =>
        adapters.postgres.transaction(async client => {
          const files = await Promise.all(args.files).catch(
            err => `ERROR: files could not be awaited: ${err}`
          );
          console.log(`CSV-Import: Received ${files.length} files`);

          for (const file of files) {
            const readStream = file.createReadStream();

            console.log("CSV-Import: Processing", file.filename);
            const res = await parseCSV(
              readStream,
              args.wahldatum,
              args.aggregiert,
              client
            );
            if (!res) return false;
          }
          return true;
        })
      ),
    computeElectionResults: (_, args) =>
      withVerifyIsAdmin(args.wahlleiterAuth, computeElectionResults),
    generateWahlhelferTokens: (_, args) =>
      withVerifyIsAdmin(args.wahlleiterAuth, () =>
        generateWahlhelferToken(args)
      ),
    setDataBlocked: (_, args) =>
      withVerifyIsAdmin(args.wahlleiterAuth, () => setDataBlocked(args)),
    registerWahlkabine: (_, args) =>
      withVerifyIsWahlhelfer(args.wahlhelferAuth, (wahlid, stimmkreisid) =>
        registerWahlkabine(
          wahlid,
          stimmkreisid,
          args.wahlkabineToken,
          args.wahlkabineLabel
        )
      ),
    removeWahlkabine: (_, args) =>
      withVerifyIsWahlhelfer(args.wahlhelferAuth, (wahlid, stimmkreisid) =>
        removeWahlkabine(wahlid, stimmkreisid, args.wahlkabineToken)
      ),
    setWahlkabineUnlocked: (_, args) =>
      withVerifyIsWahlhelfer(args.wahlhelferAuth, (wahlid, stimmkreisid) =>
        setWahlkabineUnlocked(
          wahlid,
          stimmkreisid,
          args.wahlkabineToken,
          args.unlocked
        )
      ),
    // No extra verification needed for this wahlkabine
    resetWahlkabine: (_, args) => resetWahlkabine(args.wahlkabineToken)
  }
};
