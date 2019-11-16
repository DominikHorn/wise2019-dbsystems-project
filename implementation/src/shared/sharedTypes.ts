import { ReadStream } from "fs";
import { IDatabaseWahl } from "../server/databaseEntities";

export interface GraphQLFileUpload {
    createReadStream: () => ReadStream;
}

export interface IWahl extends IDatabaseWahl {
    
}