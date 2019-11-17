import { PoolClient } from "pg";
import {
  DatabaseSchemaGroup,
  IDatabasePartei
} from "../../../databaseEntities";
import { adapters } from "../../adapterUtil";

let cachedParteiForId: (
  id: number,
  client: PoolClient
) => IDatabasePartei = () => null;
export async function getParteiForId(
  id: number,
  client?: PoolClient
): Promise<IDatabasePartei | null> {
  const QUERY_STR = `
    SELECT *
    FROM "${DatabaseSchemaGroup}".parteien
    WHERE id = $1`;
  if (client) {
    const res = cachedParteiForId(id, client);
    if (res) {
      return res;
    } else {
      const dbRes = await client
        .query(QUERY_STR, [id])
        .then(res => !!res && res.rows[0]);
      cachedParteiForId = (idParam, clientParam) => {
        if (id === idParam && client === clientParam) return dbRes;
        return null;
      };
      return dbRes;
    }
  }
  const parteien = await adapters.postgres.query<IDatabasePartei>(QUERY_STR, [
    id
  ]);
  return !!parteien && parteien[0];
}

export async function getOrCreateParteiForIdAndName(
  id: number,
  name: string,
  client?: PoolClient
): Promise<IDatabasePartei> {
  if (client) {
    const partei = await getParteiForId(id, client);
    if (partei) return partei;
    return client
      .query(
        `
        INSERT INTO "${DatabaseSchemaGroup}".parteien
        VALUES ($1, $2)
        RETURNING *;`,
        [id, name]
      )
      .then(res => !!res && res.rows[0]);
  }

  return adapters.postgres.transaction(async client =>
    getOrCreateParteiForIdAndName(id, name, client)
  );
}
