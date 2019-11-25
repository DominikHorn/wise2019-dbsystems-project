import { ReadStream } from "fs";
import {
  IDatabaseWahl,
  IDatabasePartei,
  IDatabaseKandidat
} from "../server/databaseEntities";

export interface GraphQLFileUpload {
  createReadStream: () => ReadStream;
}

export interface IWahl extends IDatabaseWahl {}

export enum EParteiNamen {
  CSU = "CSU",
  SPD = "SPD",
  FREIE_WAEHLER = "Freie Wähler",
  GRUENE = "Grüne",
  FDP = "FDP",
  DIE_LINKE = "Die Linke",
  BAYERN_PARTEI = "Bayern Partei",
  OEDP = "ÖDP",
  PIRATEN = "Piraten",
  DIE_FRANKEN = "Die Franken",
  AFD = "AfD",
  LKR = "LKR",
  MUT = "mut",
  DIE_HUMANISTEN = "Die Humanisten",
  DIE_PARTEI = "Die Partei",
  GESUNDHEITSFORSCHUNG = "Gesundheitsforschung",
  TIERSCHUTZPARTEI = "Tierschutzpartei",
  V_PARTEI = "V-Partei"
}

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
