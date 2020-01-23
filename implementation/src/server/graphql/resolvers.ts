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
  computeEntwicklungDerStimmmen,
  computeQ7
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
  resetWahlkabine,
  isUnlocked
} from "../adapters/postgres/adminPSQL";
import {
  getDirektKandidaten,
  getListenKandidaten,
  getAltersverteilungImParlament
} from "../adapters/postgres/kandidatPSQL";
import { adapters } from "../adapters/adapterUtil";
import { castVote } from "../adapters/postgres/stimmenPSQL";
import { getAllStimmkreiseForWahl } from "../adapters/postgres/stimmkreisPSQL";

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
    getAllStimmkreise: (_, args) =>
      withVerifyIsNotBlocked(args.wahlid, () =>
        getAllStimmkreiseForWahl(args.wahlid)
      ),
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
    computeEntwicklungDerStimmen: (_, args) =>
      withVerifyIsNotBlocked(args.wahlid, () => 
        computeEntwicklungDerStimmmen(
          args.wahlid,
          args.vglwahlid,
          args.stimmkreisid
        )),
    getAllStimmkreisInfos: (_, args) =>
        withVerifyIsNotBlocked(args.wahlid, () => 
          computeQ7(
            args.wahlid,
            args.stimmkreisid1,
            args.stimmkreisid2,
            args.stimmkreisid3,
            args.stimmkreisid4,
            args.stimmkreisid5,
            args.vgl_wahl
          )),
    getDirektKandidaten: (_, args) =>
      getDirektKandidaten(args.wahlid, args.stimmkreisid),
    getListenKandidaten: (_, args) =>
      getListenKandidaten(args.wahlid, args.regierungsbezirkid),
    getAltersverteilung: (_, args) =>
      withVerifyIsNotBlocked(args.wahlid, () =>
        getAltersverteilungImParlament(args.wahlid)
      ),
    getRegisteredWahlkabinen: (_, args) =>
      withVerifyIsWahlhelfer(args.wahlhelferAuth, getRegisteredWahlkabinen),
    isRegistered: (_, args) => isRegisteredWahlkabine(args.wahlkabineToken),
    isUnlocked: (_, args) =>
      withVerifyIsWahlkabine(args.wahlkabineToken, false, async () =>
        isUnlocked(args.wahlkabineToken)
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
    resetWahlkabine: (_, args) =>
      withVerifyIsWahlkabine(args.wahlkabineToken, false, () =>
        resetWahlkabine(args.wahlkabineToken)
      ),
    castVote: (_, args) =>
      withVerifyIsWahlkabine(
        args.wahlkabineToken,
        true,
        async (wahlid, stimmkreisid) => {
          // Reset wahlkabine
          await resetWahlkabine(args.wahlkabineToken);
          const res = await castVote(
            wahlid,
            stimmkreisid,
            args.erstkandidatID,
            args.zweitkandidatID,
            args.zweitparteiID
          );
          return res;
        }
      )
  }
};
