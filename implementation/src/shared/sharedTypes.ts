import { ReadStream } from "fs";
import {
  IDatabaseWahl,
  IDatabasePartei,
  IDatabaseStimmkreisWinner
} from "../server/databaseEntities";

export interface GraphQLFileUpload {
  createReadStream: () => ReadStream;
}

export interface IWahl extends IDatabaseWahl {}
export interface IPartei extends IDatabasePartei {}

// TODO: utilize typescript voodo
export interface IKandidat {
  id: number;
  name: string;
  partei: IPartei;
}

export interface IMandat {
  kandidat: IKandidat;
  direktmandat: boolean;
}

export interface IStimmkreisWinner extends IDatabaseStimmkreisWinner {}
