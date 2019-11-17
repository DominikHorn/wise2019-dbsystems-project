import { PoolClient } from "pg";
import {
  DatabaseSchemaGroup,
  IDatabaseKandidatVote
} from "../../../databaseEntities";
import { adapters } from "../../adapterUtil";

export function buildGueltigeKandidateVotesValuesString(
  amount: number,
  stimmkreis_id: number,
  kandidat_id: number,
  wahl_id: number
): string | null {
  if (amount <= 0) return null;
  if (isNaN(stimmkreis_id)) return null;
  if (isNaN(kandidat_id)) return null;
  if (isNaN(wahl_id)) return null;

  let result = "";
  for (let i = 0; i < amount; i++) {
    // Building the string like this is okay since we only allow numbers
    result += `(${stimmkreis_id}, ${kandidat_id}, ${wahl_id}, true)`;
    if (i + 1 < amount) result += ", ";
  }

  return result;
}

export async function insertGueltigeKandidateVotes(
  valuesString: string,
  client?: PoolClient
): Promise<IDatabaseKandidatVote[] | null> {
  const QUERY_STR = `
    INSERT INTO "${DatabaseSchemaGroup}".kandidatgebundene_stimmen (stimmkreis_id, kandidat_id, wahl_id, gueltig)
    VALUES ${valuesString}
    RETURNING *;`;

  return client
    ? client.query(QUERY_STR).then(res => !!res && res.rows[0])
    : adapters.postgres.transaction(async client =>
        insertGueltigeKandidateVotes(valuesString, client)
      );
}
