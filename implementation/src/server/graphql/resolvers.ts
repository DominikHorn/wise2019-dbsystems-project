import { GraphQLDateTime } from "graphql-iso-date";
import {
  GraphQLFileUpload,
  getGraphqlReadableParteiName
} from "../../shared/sharedTypes";
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
  generateWahlhelferToken
} from "../adapters/postgres/adminPSQL";
import { getAllDirektKandidaten } from "../adapters/postgres/kandidatPSQL";

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
  Partei: {
    name: p => getGraphqlReadableParteiName(p.name)
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
    getAllDirektKandidaten: (_, args) =>
      getAllDirektKandidaten(args.wahlid, args.stimmkreisid)
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
    generateWahlhelferTokens: (_, args) =>
      withVerifyIsAdmin(args.wahlleiterAuth, () =>
        generateWahlhelferToken(args)
      ),
    setDataBlocked: (_, args) =>
      withVerifyIsAdmin(args.wahlleiterAuth, () => setDataBlocked(args))
  }
};
