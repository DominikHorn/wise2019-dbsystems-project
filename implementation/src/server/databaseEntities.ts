/**
 * Schema group name
 */
export const DatabaseSchemaGroup = "voting-data"

/**
 * Empty interface which exists to classify types as database entities
 */
export interface IDatabaseEntity {}

export interface IDatabaseUser extends IDatabaseEntity {
  readonly id: number;
  readonly name: string;
  readonly givenname: string;
}