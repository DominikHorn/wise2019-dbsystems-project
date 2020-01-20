import { ReadStream } from "fs";

export interface GraphQLFileUpload {
  createReadStream: () => ReadStream;
}
