import { adapters } from "../../adapterUtil";
import { PoolClient } from "pg";
import {
  IDatabaseRegierungsbezirk,
  DatabaseSchemaGroup
} from "../../../databaseEntities";

const REGIERUNGSBEZIRKE: { [key: number]: string } = {
  901: "Oberbayern",
  902: "Niederbayern",
  903: "Oberpfalz",
  904: "Oberfranken",
  905: "Mittelfranken",
  906: "Unterfranken",
  907: "Schwaben"
};

export const getRegierungsbezirkForId = async (
  id: number,
  client?: PoolClient
): Promise<IDatabaseRegierungsbezirk | null> => {
  const QUERY_STR = `
  SELECT *
  FROM "${DatabaseSchemaGroup}".regierungsbezirke
  WHERE id = $1;`;
  if (client) {
    return client.query(QUERY_STR, [id]).then(res => !!res && res.rows[0]);
  }
  const regierungsbezirke = await adapters.postgres.query<
    IDatabaseRegierungsbezirk
  >(QUERY_STR, [id]);
  return !!regierungsbezirke && regierungsbezirke[0];
};

export const getOrCreateRegierungsbezirkForId = async (
  id: number,
  client?: PoolClient
): Promise<IDatabaseRegierungsbezirk> => {
  if (!!client) {
    let regierungsbezirk = await getRegierungsbezirkForId(id, client);
    if (regierungsbezirk) return regierungsbezirk;
    await client
      .query(
        `
        INSERT INTO "${DatabaseSchemaGroup}".regierungsbezirke
        VALUES ($1, $2);`,
        [id, REGIERUNGSBEZIRKE[id]]
      )
      .then(res => !!res && res.rows[0]);
    return getRegierungsbezirkForId(id, client);
  }

  return adapters.postgres.transaction(async client =>
    getOrCreateRegierungsbezirkForId(id, client)
  );
};
