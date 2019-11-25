import { ReadStream } from "fs";
import { IDatabaseWahl, IDatabasePartei } from "../server/databaseEntities";

export interface GraphQLFileUpload {
  createReadStream: () => ReadStream;
}

export interface IWahl extends IDatabaseWahl {}

export interface IPartei extends IDatabasePartei {}
