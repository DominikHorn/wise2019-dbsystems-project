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
  readonly name: string;
}

export interface IDatabaseKandidat extends IDatabaseEntity {
  readonly id: number;
  readonly partei_id: number;
  readonly name: string;
}

export interface IDatabaseStimmkreis extends IDatabaseEntity {
  readonly id: number;
  readonly name: string;
  readonly regierungsbezirk_id: number;
}
