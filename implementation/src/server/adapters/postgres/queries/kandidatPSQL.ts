import { PoolClient } from "pg";
import {
  DatabaseSchemaGroup,
  IDatabaseKandidat,
  IDatabaseDirektkandidat
} from "../../../databaseEntities";
import { adapters } from "../../adapterUtil";

export async function insertKandidat(
  parteiId: number,
  name: string,
  client?: PoolClient
): Promise<IDatabaseKandidat> {
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

export async function insertDirektkandidat(
  stimmkreis_id: number,
  wahl_id: number,
  direktkandidat_id: number,
  client?: PoolClient
): Promise<IDatabaseDirektkandidat> {
  const QUERY_STR = `
    INSERT INTO "${DatabaseSchemaGroup}".direktkandidaten
    VALUES ($1, $2, $3)
    RETURNING *;`;
  if (client) {
    return client
      .query(QUERY_STR, [stimmkreis_id, wahl_id, direktkandidat_id])
      .then(res => !!res && res.rows[0]);
  }
  return adapters.postgres.transaction(async client =>
    insertDirektkandidat(stimmkreis_id, wahl_id, direktkandidat_id, client)
  );
}

//LG
export async function getKandidatIDforParteiIDandName(
  id: number,
  name: string,
  ){
    const QUERY_STR = `
      SELECT id
      FROM "${DatabaseSchemaGroup}".kandidaten
      WHERE partei_id = $1 and name = $2`;
    
      const kandidat_id = await adapters.postgres.query<IDatabaseKandidat>(QUERY_STR, [
      id, name
    ]);
    return kandidat_id;
  }