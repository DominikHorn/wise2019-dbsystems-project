import { PoolClient } from "pg";
import {
  DatabaseSchemaGroup,
  IDatabaseKandidatVote
} from "../../../databaseEntities";
import { adapters } from "../../adapterUtil";

export async function insertGueltigeKandidateVotes(
  stimmkreis_ids: number[],
  kandidat_ids: number[],
  wahl_ids: number[],
  gueltig: boolean[],
  client?: PoolClient
): Promise<IDatabaseKandidatVote[] | null> {
  const QUERY_STR = `
    INSERT INTO "${DatabaseSchemaGroup}".kandidatgebundene_stimmen (stimmkreis_id, kandidat_id, wahl_id, gueltig)
    SELECT * FROM UNNEST ($1::int[], $2::int[], $3::int[], $4::boolean[])
    RETURNING *;`;

  return client
    ? client
        .query(QUERY_STR, [stimmkreis_ids, kandidat_ids, wahl_ids, gueltig])
        .then(res => !!res && res.rows[0])
    : adapters.postgres.transaction(async client =>
        insertGueltigeKandidateVotes(
          stimmkreis_ids,
          kandidat_ids,
          wahl_ids,
          gueltig,
          client
        )
      );
}
