import { GraphQLDateTime } from "graphql-iso-date";
import { GraphQLFileUpload } from "../../shared/sharedTypes";
import { getWahlen } from "../adapters/postgres/queries/wahlenPSQL";
import { parseCSV } from "../csv-parser/CSVParser";

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
      // TODO: returning false in the end is for debug purposes such that the modal doesn't close on client
      await Promise.all(
        args.files.map(wahlfile =>
          wahlfile.then(
            file => (console.log(file), parseCSV(file, args.wahldatum))
          )
        )
      ).then(() => true)
  }
};
