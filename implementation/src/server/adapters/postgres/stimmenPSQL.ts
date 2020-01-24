import { createObjectCsvWriter } from "csv-writer";
import { unlinkSync } from "fs";
import { PoolClient } from "pg";
import { DatabaseSchemaGroup } from "../../databaseEntities";
import { adapters } from "../adapterUtil";

export type VoteFields =
  | "stimmkreis_id"
  | "wahl_id"
  | "partei_id"
  | "kandidat_id"
  | "anzahl";

export enum VoteTables {
  EINZEL_GUELTIGE_KANDIDATENSTIMMEN = "einzel_gueltige_kandidatgebundene_stimmen",
  EINZEL_GUELTIGE_LISTENSTIMMEN = "einzel_gueltige_listengebundene_stimmen",
  EINZEL_UNGUELTIGE_ERSTSTIMMEN = "einzel_ungueltige_erststimmen",
  EINZEL_UNGUELTIGE_ZWEITSTIMMEN = "einzel_ungueltige_zweitstimmen",
  AGGR_GUELTIGE_KANDIDATENSTIMMEN = "aggregiert_gueltige_kandidatgebundene_stimmen",
  AGGR_GUELTIGE_LISTENSTIMMEN = "aggregiert_gueltige_listengebundene_stimmen",
  AGGR_UNGUELTIGE_ERSTSTIMMEN = "aggregiert_ungueltige_erststimmen",
  AGGR_UNGUELTIGE_ZWEITSTIMMEN = "aggregiert_ungueltige_zweitstimmen"
}

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

export async function castVote(
  wahlid: number,
  stimmkreisid: number,
  erstkandidatID: number | null,
  zweitkandidatID: number | null,
  zweitparteiID: number | null,
  aggregiert: boolean = false
): Promise<boolean> {
  if (
    zweitkandidatID !== undefined &&
    zweitkandidatID !== null &&
    zweitparteiID !== undefined &&
    zweitparteiID !== null
  ) {
    throw new Error(
      "Can not cast secondary vote for party and candidate at the same time!"
    );
  }

  return adapters.postgres.transaction<boolean>(async client => {
    let res = false;
    // Insert erstkandidat stimme
    if (erstkandidatID === undefined || erstkandidatID === null) {
      if (aggregiert) {
        res = await client
          .query(
            `
          INSERT INTO "${DatabaseSchemaGroup}".${VoteTables.AGGR_UNGUELTIGE_ERSTSTIMMEN} (wahl_id, stimmkreis_id, anzahl)
          VALUES ($1, $2, 1)
          ON CONFLICT (wahl_id, stimmkreis_id) DO
            UPDATE "${DatabaseSchemaGroup}".${VoteTables.AGGR_UNGUELTIGE_ERSTSTIMMEN}
            SET anzahl = anzahl + 1
            WHERE wahl_id = $1 AND stimmkreis_id = $2
        `,
            [wahlid, stimmkreisid]
          )
          .then(r => r && r.rowCount > 0);
      } else {
        res = await client
          .query(
            `
          INSERT INTO "${DatabaseSchemaGroup}".${VoteTables.EINZEL_UNGUELTIGE_ERSTSTIMMEN} (wahl_id, stimmkreis_id)
          VALUES ($1, $2)
        `,
            [wahlid, stimmkreisid]
          )
          .then(r => r && r.rowCount > 0);
      }
    } else {
      if (aggregiert) {
        res = await client
          .query(
            `
          INSERT INTO "${DatabaseSchemaGroup}".${VoteTables.AGGR_GUELTIGE_KANDIDATENSTIMMEN} (wahl_id, stimmkreis_id, kandidat_id, anzahl)
          VALUES ($1, $2, $3, 1)
          ON CONFLICT (wahl_id, stimmkreis_id) DO
            UPDATE "${DatabaseSchemaGroup}".${VoteTables.AGGR_GUELTIGE_KANDIDATENSTIMMEN}
            SET anzahl = anzahl + 1
            WHERE wahl_id = $1 AND stimmkreis_id = $2 AND kandidat_id = $3
         `,
            [wahlid, stimmkreisid, erstkandidatID]
          )
          .then(r => r && r.rowCount > 0);
      } else {
        res = await client
          .query(
            `
          INSERT INTO "${DatabaseSchemaGroup}".${VoteTables.EINZEL_GUELTIGE_KANDIDATENSTIMMEN} (wahl_id, stimmkreis_id, kandidat_id)
          VALUES ($1, $2, $3)
        `,
            [wahlid, stimmkreisid, erstkandidatID]
          )
          .then(r => r && r.rowCount > 0);
      }
    }

    // insert zweitstimme
    const zweitkandidatInvalid =
      zweitkandidatID === undefined || zweitkandidatID === null;
    const zweitparteiInvalid =
      zweitparteiID === undefined || zweitparteiID === null;
    if (zweitkandidatInvalid && zweitparteiInvalid) {
      if (aggregiert) {
        res = await client
          .query(
            `
          INSERT INTO "${DatabaseSchemaGroup}".${VoteTables.AGGR_UNGUELTIGE_ZWEITSTIMMEN} (wahl_id, stimmkreis_id, anzahl)
          VALUES ($1, $2, 1)
          ON CONFLICT (wahl_id, stimmkreis_id) DO
            UPDATE "${DatabaseSchemaGroup}".${VoteTables.AGGR_UNGUELTIGE_ZWEITSTIMMEN}
            SET anzahl = anzahl + 1
            WHERE wahl_id = $1 AND stimmkreis_id = $2
        `,
            [wahlid, stimmkreisid]
          )
          .then(r => r && r.rowCount > 0);
      } else {
        res = await client
          .query(
            `
          INSERT INTO "${DatabaseSchemaGroup}".${VoteTables.EINZEL_UNGUELTIGE_ZWEITSTIMMEN} (wahl_id, stimmkreis_id)
          VALUES ($1, $2)
        `,
            [wahlid, stimmkreisid]
          )
          .then(r => r && r.rowCount > 0);
      }
    } else {
      if (aggregiert) {
        res = await client
          .query(
            `
          INSERT INTO "${DatabaseSchemaGroup}".${
              zweitparteiInvalid
                ? VoteTables.AGGR_GUELTIGE_KANDIDATENSTIMMEN
                : VoteTables.AGGR_GUELTIGE_LISTENSTIMMEN
            } (wahl_id, stimmkreis_id, ${
              zweitkandidatID ? "kandidat_id" : "partei_id"
            }, anzahl)
          VALUES ($1, $2, $3, 1)
          ON CONFLICT (wahl_id, stimmkreis_id) DO
            UPDATE "${DatabaseSchemaGroup}".${
              zweitparteiInvalid
                ? VoteTables.AGGR_GUELTIGE_KANDIDATENSTIMMEN
                : VoteTables.AGGR_GUELTIGE_LISTENSTIMMEN
            }
            SET anzahl = anzahl + 1
            WHERE wahl_id = $1 AND stimmkreis_id = $2 AND kandidat_id = $3
         `,
            [
              wahlid,
              stimmkreisid,
              zweitparteiInvalid ? zweitkandidatID : zweitparteiID
            ]
          )
          .then(r => r && r.rowCount > 0);
      } else {
        res = await client
          .query(
            `
          INSERT INTO "${DatabaseSchemaGroup}".${
              zweitparteiInvalid
                ? VoteTables.EINZEL_GUELTIGE_KANDIDATENSTIMMEN
                : VoteTables.EINZEL_GUELTIGE_LISTENSTIMMEN
            } (wahl_id, stimmkreis_id, ${
              zweitparteiInvalid ? "kandidat_id" : "partei_id"
            })
          VALUES ($1, $2, $3)
        `,
            [
              wahlid,
              stimmkreisid,
              zweitparteiInvalid ? zweitkandidatID : zweitparteiID
            ]
          )
          .then(r => r && r.rowCount > 0);
      }
    }

    return res;
  });
}
