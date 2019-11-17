import {
  IDatabaseKandidat,
  DatabaseSchemaGroup
} from "../../../databaseEntities";
import { PoolClient } from "pg";
import { adapters } from "../../adapterUtil";

export async function insertKandidat(
  parteiId: number,
  name: string,
  client?: PoolClient
): Promise<IDatabaseKandidat> {
  console.log("INSERT:", parteiId, name);
  const QUERY_STR = `
    INSERT INTO "${DatabaseSchemaGroup}".kandidaten
    VALUES (DEFAULT, $1, $2)
    RETURNING *;`;
  if (client) {
    return client
      .query(QUERY_STR, [parteiId, name])
      .then(res => !!res && res.rows[0]);
  }
  return adapters.postgres.transaction(async client =>
    insertKandidat(parteiId, name, client)
  );
}
