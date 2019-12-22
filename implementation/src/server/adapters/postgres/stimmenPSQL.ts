import { PoolClient } from "pg";
import {
  DatabaseSchemaGroup,
  IDatabaseKandidatVote
} from "../../databaseEntities";
import { adapters } from "../adapterUtil";

export type VoteFields =
  | "stimmkreis_id"
  | "wahl_id"
  | "partei_id"
  | "kandidat_id"
  | "anzahl";

export type VoteTables =
  | "einzel_gueltige_kandidatgebundene_stimmen"
  | "einzel_gueltige_listengebundene_stimmen"
  | "einzel_ungueltige_erststimmen"
  | "einzel_ungueltige_zweitstimmen"
  | "aggregiert_gueltige_kandidatgebundene_stimmen"
  | "aggregiert_gueltige_listengebundene_stimmen"
  | "aggregiert_ungueltige_erststimmen"
  | "aggregiert_ungueltige_zweitstimmen";

export type VoteViews =
  | "kandidatgebundene_stimmen"
  | "listengebundene_stimmen"
  | "ungueltige_erststimmen"
  | "ungueltige_zweitstimmen";

export type VoteType = {
  values: number[];
  quantity: number;
};

export async function insertVotes(
  fields: VoteFields[],
  table: VoteTables,
  votes: VoteType[],
  client?: PoolClient
): Promise<IDatabaseKandidatVote[] | null> {
  const QUERY_STR = `
    INSERT INTO "${DatabaseSchemaGroup}".${table} (${fields.join(",")})
    ${votes
      .map(
        vote =>
          `SELECT a.* FROM (SELECT ${vote.values.join(
            ","
          )}) a, generate_series(1, ${vote.quantity})`
      )
      .join("\nUNION ALL\n")}
    RETURNING *;`;

  return client
    ? client.query(QUERY_STR).then(res => !!res && res.rows[0])
    : adapters.postgres.transaction(async client =>
        insertVotes(fields, table, votes, client)
      );
}
