import { ParteiName } from "../shared/graphql.types";

/**
 * Schema group name
 */
export const DatabaseSchemaGroup = "landtagswahlen";

/**
 * Empty interface which exists to classify types as database entities
 */
export interface IDatabaseEntity {}

export interface IDatabaseWahl extends IDatabaseEntity {
  readonly id: number;
  readonly wahldatum: Date;
}

export interface IDatabaseRegierungsbezirk extends IDatabaseEntity {
  readonly id: number;
  readonly name: string;
}

export interface IDatabasePartei extends IDatabaseEntity {
  readonly id: number;
  readonly name: ParteiName;
}

export interface IDatabaseKandidat extends IDatabaseEntity {
  readonly id: number;
  readonly partei_id: number;
  readonly name: string;
}

export interface IDatabaseWahlhelferToken extends IDatabaseEntity {
  readonly wahl_id: number;
  readonly stimmkreis_id: number;
  readonly token: string;
}

export interface IDatabaseStimmkreis extends IDatabaseEntity {
  readonly id: number;
  readonly name: string;
  readonly regierungsbezirk_id: number;
}

export interface IDatabaseStimmkreisInfo extends IDatabaseEntity {
  readonly stimmkreis_id: number;
  readonly wahl_id: number;
  readonly anzahlWahlberechtigte: number;
  readonly anzahlWaehler: number;
}

export interface IDatabaseDirektkandidat extends IDatabaseEntity {
  readonly stimmkreis_id: number;
  readonly wahl_id: number;
  readonly direktkandidat_id: number;
}

export interface IDatabaseListen extends IDatabaseEntity {
  readonly kandidat_id: number;
  readonly wahl_id: number;
  readonly regierungsbezirk_id: number;
  readonly initialerListenplatz: number;
}

export interface IDatabaseKandidatVote extends IDatabaseEntity {
  readonly id: number;
  readonly stimmkreis_id: number;
  readonly kandidat_id: number;
  readonly wahl_id: number;
  readonly gueltig: boolean;
}

export interface IDatabaseStimmkreisWinner extends IDatabaseEntity {
  readonly stimmkreis_id: number;
  readonly stimmkreis_name: string;
  readonly partei_id: number;
  readonly partei_name: ParteiName;
  readonly anzahl: number;
}

export interface IDatabaseWahlbeteiligung extends IDatabaseEntity {
  readonly wahl_id: number;
  readonly stimmkreis_id: number;
  readonly wahlbeteiligung: number;
}

export interface IDatabaseDirektmandate extends IDatabaseEntity {
  readonly wahl_id: number;
  readonly stimmkreis_id: number;
  readonly direktmandat_name: string;
  readonly partei_id: number;
}

export interface IDatabaseAnteil extends IDatabaseEntity {
  readonly wahl_id: number;
  readonly stimmkreis_id: number;
  readonly partei_id: number;
  readonly partei_name: string;
  readonly anteil: number;
}

export interface IDatabaseStimmenEntwicklung extends IDatabaseEntity {
  readonly partei_id: number;
  readonly partei_name: string;
  readonly veraenderung: number;
}
