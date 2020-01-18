import { adapters } from "../adapterUtil";
import { PoolClient } from "pg";
import {
  IDatabaseRegierungsbezirk,
  DatabaseSchemaGroup
} from "../../databaseEntities";

const REGIERUNGSBEZIRKE: { [key: number]: string } = {
  901: "Oberbayern",
  902: "Niederbayern",
  903: "Oberpfalz",
  904: "Oberfranken",
  905: "Mittelfranken",
  906: "Unterfranken",
  907: "Schwaben"
};

let cachedRegierungsbezirkForId: (
  id: number,
  client?: PoolClient
) => IDatabaseRegierungsbezirk = () => null;
export const getRegierungsbezirkForId = async (
  id: number,
  client?: PoolClient
): Promise<IDatabaseRegierungsbezirk | null> => {
  const res = cachedRegierungsbezirkForId(id, client);
  if (res) {
    return res;
  }

  const QUERY_STR = `
    SELECT *
    FROM "${DatabaseSchemaGroup}".regierungsbezirke
    WHERE id = $1;`;
  const ARGS = [id];

  const dbRes = client
    ? await client.query(QUERY_STR, ARGS).then(res => !!res && res.rows[0])
    : await adapters.postgres
        .query<IDatabaseRegierungsbezirk>(QUERY_STR, [id])
        .then(res => res && res[0]);

  cachedRegierungsbezirkForId = (idParam, clientParam) => {
    if (id === idParam && client === clientParam) return dbRes;
    return null;
  };
  return dbRes;
};

export const getOrCreateRegierungsbezirkForId = async (
  id: number,
  client?: PoolClient
): Promise<IDatabaseRegierungsbezirk> => {
  let regierungsbezirk = await getRegierungsbezirkForId(id, client);
  if (regierungsbezirk) return regierungsbezirk;

  const QUERY_STR = `
        INSERT INTO "${DatabaseSchemaGroup}".regierungsbezirke
        VALUES ($1, $2)
        RETURNING *;`;
  const ARGS = [id, REGIERUNGSBEZIRKE[id]];

  return client
    ? await client.query(QUERY_STR, ARGS).then(res => !!res && res.rows[0])
    : await adapters.postgres
        .query<IDatabaseRegierungsbezirk>(QUERY_STR, ARGS)
        .then(res => res && res[0]);
};
