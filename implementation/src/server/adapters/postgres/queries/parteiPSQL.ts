import { PoolClient } from "pg";
import {
  DatabaseSchemaGroup,
  IDatabasePartei,
  IDatabaseKandidat
} from "../../../databaseEntities";
import { adapters } from "../../adapterUtil";

let cachedParteiForId: (
  id: number,
  client: PoolClient
) => IDatabasePartei = () => null;
export const getParteiForId = async (
  id: number,
  client?: PoolClient
): Promise<IDatabasePartei | null> => {
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
};

export const getOrCreateParteiForIdAndName = async (
  id: number,
  name: string,
  client?: PoolClient
): Promise<IDatabasePartei> => {
  if (client) {
    let partei = await getParteiForId(id, client);
    if (partei) return partei;
    return await client
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
};
