import { ReadStream } from "fs";
import { IDatabaseAnteil } from "../server/databaseEntities";
import {
  Wahlbeteiligung,
  Mandat,
  Stimmentwicklung,
  ParteiName,
  Partei
} from "./graphql.types";

export const getGraphqlReadableParteiName = (parteiName: string): ParteiName =>
  (({
    "Freie Wähler": ParteiName.FREIE_WAEHLER,
    Grüne: ParteiName.GRUENE,
    "Die Linke": ParteiName.DIE_LINKE,
    "Bayern Partei": ParteiName.BAYERN_PARTEI,
    ÖDP: ParteiName.OEDP,
    Piraten: ParteiName.PIRATEN,
    "Die Franken": ParteiName.DIE_FRANKEN,
    AfD: ParteiName.AFD,
    mut: ParteiName.MUT,
    "Die Humanisten": ParteiName.DIE_HUMANISTEN,
    Gesundheitsforschung: ParteiName.GESUNDHEITSFORSCHUNG,
    Tierschutzpartei: ParteiName.TIERSCHUTZPARTEI,
    "V-Partei": ParteiName.V_PARTEI
  } as { [name: string]: ParteiName })[parteiName] ||
  (parteiName as ParteiName));

export const getHumanReadableParteiName = (parteiName: ParteiName) =>
  (({
    [ParteiName.FREIE_WAEHLER]: "Freie Wähler",
    [ParteiName.GRUENE]: "Grüne",
    [ParteiName.DIE_LINKE]: "Die Linke",
    [ParteiName.BAYERN_PARTEI]: "Bayern Partei",
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
