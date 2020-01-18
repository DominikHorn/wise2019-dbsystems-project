import { PoolClient, Pool } from "pg";
import {
  DatabaseSchemaGroup,
  IDatabaseKandidatVote
} from "../../databaseEntities";
import { adapters } from "../adapterUtil";
import { createObjectCsvWriter } from "csv-writer";
import { exists, fstat, unlink, unlinkSync } from "fs";
import { resolve } from "path";

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

let tempFileCounter = 0;
export async function bulkInsertVotes(
  fields: VoteFields[],
  table: VoteTables,
  votes: VoteType[],
  client?: PoolClient
): Promise<void> {
  const voteCount = votes.reduce((acc, curr) => acc + curr.quantity, 0);
  console.log(
    `Bulk-Vote-Insert: Creating temporary CSV file to hold ${voteCount} votes`
  );
  // Write to temporary csv file and import using SQL COPY command
  const path = `postgres-data/votes_${table}_${tempFileCounter++}.csv`;
  const header = fields.map(field => ({ id: field, title: field }));
  const csvWriter = createObjectCsvWriter({
    path,
    header
  });
  const data = votes.flatMap(vote => {
    const entry = header.reduce(
      (acc, h: { id: string }, i) => ({ ...acc, [h.id]: vote.values[i] }),
      {} as {}
    );

    return Array(vote.quantity).fill(entry);
  });

  await csvWriter.writeRecords(data);

  const QUERY_STR = `
    COPY "${DatabaseSchemaGroup}".${table} (${fields.join(",")})
    FROM '/${path}' DELIMITER ',' CSV HEADER;`;

  console.log(
    `Bulk-Vote-Insert: Inserting ${voteCount} votes of the form ${fields} into ${table}`
  );

  await (client ? client.query(QUERY_STR) : adapters.postgres.query(QUERY_STR));

  console.log(`Bulk-Vote-Insert: completed`);

  // cleanup file
  unlinkSync(path);
}

export async function deferVotesConstraints(client: PoolClient) {
  await client.query(`SET CONSTRAINTS ALL DEFERRED`);
}
