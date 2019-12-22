import { ReadStream } from "fs";
import { IDatabaseAnteil } from "../server/databaseEntities";
import {
  Wahlbeteiligung,
  Mandat,
  Stimmentwicklung,
  ParteiName
} from "./graphql.types";

export const getHumanReadableParteiName = (parteiName: ParteiName) =>
  (({
    [ParteiName.FREIE_WAEHLER]: "Freie Wähler",
    [ParteiName.GRUENE]: "Grüne",
    [ParteiName.DIE_LINKE]: "Die Linke",
    [ParteiName.BAYERN_PARTEI]: "Bayern partei",
    [ParteiName.OEDP]: "ÖDP",
    [ParteiName.PIRATEN]: "Piraten",
    [ParteiName.DIE_FRANKEN]: "Die Franken",
    [ParteiName.AFD]: "AfD",
    [ParteiName.MUT]: "mut",
    [ParteiName.DIE_HUMANISTEN]: "Die Humanisten",
    [ParteiName.DIE_PARTEI]: "Die Partei",
    [ParteiName.GESUNDHEITSFORSCHUNG]: "Gesundheitsforschung",
    [ParteiName.TIERSCHUTZPARTEI]: "Tierschutzpartei",
    [ParteiName.V_PARTEI]: "V-Partei"
  } as { [name: string]: string })[parteiName] || parteiName);

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
