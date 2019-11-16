import { PoolClient } from "pg";
import {
  DatabaseSchemaGroup,
  IDatabasePartei
} from "../../../databaseEntities";
import { adapters } from "../../adapterUtil";

export const getParteiForName = async (
  name: string,
  client?: PoolClient
): Promise<IDatabasePartei | null> => {
  const QUERY_STR = `
  SELECT *
  FROM "${DatabaseSchemaGroup}".parteien
  WHERE name = $1`;
  if (client) {
    return client.query(QUERY_STR, [name]).then(res => !!res && res.rows[0]);
  }
  const parteien = await adapters.postgres.query<IDatabasePartei>(QUERY_STR, [
    name
  ]);
  return !!parteien && parteien[0];
};

export const getOrCreateParteiForName = async (
  name: string,
  client?: PoolClient
): Promise<IDatabasePartei> => {
  if (client) {
    let partei = await getParteiForName(name, client);
    if (partei) return partei;
    await client
      .query(
        `
      INSERT INTO "${DatabaseSchemaGroup}".parteien
      VALUES (DEFAULT, $2)
      `,
        [name]
      )
      .then(res => !!res && res.rows[0]);
  }

  return adapters.postgres.transaction(async client =>
    getOrCreateParteiForName(name, client)
  );
};
