import { PoolClient } from "pg";
import {
  DatabaseSchemaGroup,
  IDatabaseListen
} from "../../../databaseEntities";
import { adapters } from "../../adapterUtil";

export async function insertListeneintrag(
  kandidat_id: number,
  wahl_id: number,
  regierungsbezirk_id: number,
  initialerListenplatz: number,
  client?: PoolClient
): Promise<IDatabaseListen> {
  const QUERY_STR = `
        INSERT INTO "${DatabaseSchemaGroup}".listen
        VALUES ($1, $2, $3, $4)
        RETURNING *;`;
  if (client) {
    return client
      .query(QUERY_STR, [
        kandidat_id,
        wahl_id,
        regierungsbezirk_id,
        initialerListenplatz
      ])
      .then(res => !!res && res.rows[0]);
  }
  return adapters.postgres.transaction(async client =>
    insertListeneintrag(
      kandidat_id,
      wahl_id,
      regierungsbezirk_id,
      initialerListenplatz,
      client
    )
  );
}
