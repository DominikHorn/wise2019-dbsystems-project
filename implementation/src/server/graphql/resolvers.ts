import { GraphQLDateTime } from "graphql-iso-date";
import { GraphQLFileUpload } from "../../shared/sharedTypes";
import { getWahlen } from "../adapters/postgres/queries/wahlenPSQL";
import { parseCrawledCSV } from "../csv-parser/CSVParser";

export interface IContext {
  readonly userId: Promise<number>;
  readonly userIp: string;
  readonly authToken: string;
}

export const resolvers: { [key: string]: any } = {
  Date: GraphQLDateTime,
  Query: {
    getAllWahlen: () => getWahlen()
  },
  Mutation: {
    importCSVData: async (
      _: any,
      args: { files: Promise<GraphQLFileUpload>[]; wahldatum: Date }
    ) =>
      args.files.forEach(wahlfile => parseCrawledCSV(wahlfile, args.wahldatum))
  }
};
