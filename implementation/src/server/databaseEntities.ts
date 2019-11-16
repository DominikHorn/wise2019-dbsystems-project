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
