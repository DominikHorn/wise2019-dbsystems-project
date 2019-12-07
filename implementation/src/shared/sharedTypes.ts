import { ReadStream } from "fs";
import { IDatabasePartei, IDatabaseWahl } from "../server/databaseEntities";

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

export interface IUeberhangMandat {
  regierungsbezirk: IRegierungsbezirk;
  partei: IPartei;
  // How many seats are ueberhang seats
  ueberhang: number;
  // How many seats are ausgleichs seats
  ausgleich: number;
  // How many seats the party should receive (final number of seats = zustehend + ueberhang)
  zustehend: number;
}

export interface IStimmkreis {
  id: number;
  // TODO: add this
  // regierungsbezirk: IRegierungsbezirk;
  name: string;
}

export interface IRegierungsbezirk {
  id: number;
  name: string;
}

export interface IStimmkreisWinner {
  partei: IPartei;
  stimmkreis: IStimmkreis;
  anzahl: number;
}
