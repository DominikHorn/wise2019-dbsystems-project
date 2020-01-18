import { ReadStream } from "fs";
import { IDatabaseAnteil } from "../server/databaseEntities";
import { Mandat, Stimmentwicklung, Wahlbeteiligung } from "./graphql.types";

export interface GraphQLFileUpload {
  createReadStream: () => ReadStream;
}

export interface IAnteil extends IDatabaseAnteil {}

export interface IQ7 {
  wahlbeteiligung: Wahlbeteiligung;
  direktmandat: Mandat;
  prozentualerAnteil: IAnteil;
  absoluteAnzahl: IAnteil;
  entwicklung: Stimmentwicklung;
}
