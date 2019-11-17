import { PoolClient } from "pg";
import {
  DatabaseSchemaGroup,
  IDatabaseStimmkreis
} from "../../../databaseEntities";
import { adapters } from "../../adapterUtil";

export async function getStimmkreisForId(
  id: number,
  client?: PoolClient
): Promise<IDatabaseStimmkreis | null> {
  const QUERY_STR = `
    SELECT *
    FROM "${DatabaseSchemaGroup}".stimmkreise
    WHERE id = $1`;
  if (client) {
    return client.query(QUERY_STR, [id]).then(res => !!res && res.rows[0]);
  }
  const stimmkreise = await adapters.postgres.query<IDatabaseStimmkreis>(
    QUERY_STR,
    [id]
  );
  return !!stimmkreise && stimmkreise[0];
}

export async function getOrCreateStimmkreis(
  id: number,
  name: string,
  regierungsbezirk_id: number,
  client?: PoolClient
): Promise<IDatabaseStimmkreis> {
  if (client) {
    const stimmkreis = await getStimmkreisForId(id, client);
    if (stimmkreis) return stimmkreis;
    return client
      .query(
        `
        INSERT INTO "${DatabaseSchemaGroup}".stimmkreise
        VALUES ($1, $2, $3)
        RETURNING *;`,
        [id, name, regierungsbezirk_id]
      )
      .then(res => !!res && res.rows[0]);
  }

  return adapters.postgres.transaction(async client =>
    getOrCreateStimmkreis(id, name, regierungsbezirk_id, client)
  );
}
