import { PoolClient } from "pg";
import {
  DatabaseSchemaGroup,
  IDatabaseKandidatVote
} from "../../../databaseEntities";
import { adapters } from "../../adapterUtil";

export async function insertKandidateVotes(
  stimmenQueryString: string,
  client?: PoolClient
): Promise<IDatabaseKandidatVote[] | null> {
  const QUERY_STR = `
    INSERT INTO "${DatabaseSchemaGroup}".kandidatgebundene_stimmen (stimmkreis_id, kandidat_id, wahl_id, gueltig)
    ${stimmenQueryString}
    RETURNING *;`;

  return client
    ? client.query(QUERY_STR).then(res => !!res && res.rows[0])
    : adapters.postgres.transaction(async client =>
        insertKandidateVotes(stimmenQueryString, client)
      );
}

export async function insertListenVotes(
  stimmenQueryString: string,
  client?: PoolClient
): Promise<IDatabaseKandidatVote[] | null> {
  const QUERY_STR = `
    INSERT INTO "${DatabaseSchemaGroup}".listengebundene_stimmen (stimmkreis_id, wahl_id, partei_id, gueltig)
    ${stimmenQueryString}
    RETURNING *;`;

  return client
    ? client.query(QUERY_STR).then(res => !!res && res.rows[0])
    : adapters.postgres.transaction(async client =>
        insertListenVotes(stimmenQueryString, client)
      );
}
