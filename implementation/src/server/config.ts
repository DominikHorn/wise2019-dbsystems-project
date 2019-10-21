// @ts-ignore this works but tsconfig complains about it. Maybe json.d.ts is broken?
import configJSON from "../../config.server.json";

/**
 * Base config for all external systems
 */
export interface IExternalSystemConfig {
  readonly user: string;
  readonly host: string;
  readonly password: string;
  readonly port: number;
}

/**
 * Specialized config for postgres
 */
export interface IPostgresConfig extends IExternalSystemConfig {
  readonly database: string;
}

/**
 * Interface for all configurable aspects
 */
export interface IConfig {
  readonly postgresConfig: IPostgresConfig;
  readonly passwordSaltRounds: number;
}

if (!configJSON) {
  console.error("Could not find config.server.json, did you forget to add it?");
  process.exit(-3);
}
export const config: IConfig = configJSON;
