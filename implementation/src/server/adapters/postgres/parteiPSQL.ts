import { PoolClient } from "pg";
import { DatabaseSchemaGroup, IDatabasePartei } from "../../databaseEntities";
import { adapters } from "../adapterUtil";

let cachedParteiForId: (
  id: number,
  client?: PoolClient
) => IDatabasePartei = () => null;
export async function getParteiForId(
  id: number,
  client?: PoolClient
): Promise<IDatabasePartei | null> {
  const res = cachedParteiForId(id, client);
  if (res) {
    return res;
  }

  const QUERY_STR = `
    SELECT *
    FROM "${DatabaseSchemaGroup}".parteien
    WHERE id = $1`;
  const ARGS = [id];

  const dbRes = client
    ? await client.query(QUERY_STR, ARGS).then(res => !!res && res.rows[0])
    : await adapters.postgres
        .query<IDatabasePartei>(QUERY_STR, ARGS)
        .then(res => res && res[0]);

  cachedParteiForId = (idParam, clientParam) => {
    if (id === idParam && client === clientParam) return dbRes;
    return null;
  };
  return dbRes;
}

export async function getOrCreateParteiForIdAndName(
  id: number,
  name: string,
  client?: PoolClient
): Promise<IDatabasePartei> {
  const partei = await getParteiForId(id, client);
  if (partei) return partei;

  const QUERY_STR = `
    INSERT INTO "${DatabaseSchemaGroup}".parteien
    VALUES ($1, $2)
    RETURNING *;`;
  const ARGS = [id, name];

  return client
    ? client.query(QUERY_STR, ARGS).then(res => !!res && res.rows[0])
    : adapters.postgres
        .query<IDatabasePartei>(QUERY_STR, ARGS)
        .then(res => res && res[0]);
}
