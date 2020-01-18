import { PoolClient } from "pg";
import {
  DatabaseSchemaGroup,
  IDatabaseStimmkreis,
  IDatabaseStimmkreisInfo
} from "../../databaseEntities";
import { adapters } from "../adapterUtil";
import { Stimmkreis } from "../../../shared/graphql.types";

export async function getAllStimmkreise(
  client?: PoolClient
): Promise<Stimmkreis[]> {
  const QUERY = `
    SELECT *
    FROM "${DatabaseSchemaGroup}".stimmkreise
  `;
  return client
    ? client.query(QUERY).then(res => !!res && res.rows)
    : adapters.postgres.query<Stimmkreis>(QUERY);
}

export async function getStimmkreisForId(
  id: number,
  client?: PoolClient
): Promise<IDatabaseStimmkreis | null> {
  const QUERY_STR = `
    SELECT *
    FROM "${DatabaseSchemaGroup}".stimmkreise
    WHERE id = $1`;
  const ARGS = [id];

  return client
    ? client.query(QUERY_STR, ARGS).then(res => !!res && res.rows[0])
    : adapters.postgres
        .query<IDatabaseStimmkreis>(QUERY_STR, ARGS)
        .then(res => res && res[0]);
}

export async function getOrCreateStimmkreis(
  id: number,
  name: string,
  regierungsbezirk_id: number,
  client?: PoolClient
): Promise<IDatabaseStimmkreis> {
  const stimmkreis = await getStimmkreisForId(id, client);
  if (stimmkreis) return stimmkreis;

  const QUERY_STR = `
    INSERT INTO "${DatabaseSchemaGroup}".stimmkreise
    VALUES ($1, $2, $3)
    RETURNING *;`;
  const ARGS = [id, name, regierungsbezirk_id];

  return client
    ? client.query(QUERY_STR, ARGS).then(res => !!res && res.rows[0])
    : adapters.postgres.query(QUERY_STR, ARGS).then(res => res && res[0]);
}

export async function insertStimmkreisInfo(
  stimmkreis_id: number,
  wahl_id: number,
  anzahlWahlberechtigte: number,
  anzahlWaehler: number,
  client?: PoolClient
): Promise<IDatabaseStimmkreisInfo> {
  const QUERY_STR = `
    INSERT INTO "${DatabaseSchemaGroup}".stimmkreis_wahlinfo
    VALUES ($1, $2, $3, $4)
    RETURNING *;`;
  const ARGS = [stimmkreis_id, wahl_id, anzahlWahlberechtigte, anzahlWaehler];

  return client
    ? client.query(QUERY_STR, ARGS).then(res => !!res && res.rows[0])
    : adapters.postgres.query(QUERY_STR, ARGS).then(res => res && res[0]);
}
