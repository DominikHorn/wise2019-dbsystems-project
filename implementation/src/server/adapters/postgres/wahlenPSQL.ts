import { adapters } from "../adapterUtil";
import { IDatabaseWahl, DatabaseSchemaGroup } from "../../databaseEntities";
import { PoolClient } from "pg";
import { Wahl } from "../../../shared/graphql.types";

export const getAllWahlen = async (): Promise<Wahl[]> =>
  adapters.postgres
    .query<IDatabaseWahl>(
      `
    SELECT * 
    FROM "${DatabaseSchemaGroup}".wahlen 
    ORDER BY wahldatum
    `
    )
    .then(res =>
      res.map(wahl => ({
        ...wahl,
        wahldatum: new Date(wahl.wahldatum.getTime() + 1000 * 60 * 60)
      }))
    );

export const getWahlForDatum = async (
  wahldatum: Date,
  client?: PoolClient
): Promise<IDatabaseWahl | null> => {
  const QUERY_STR = `
        SELECT *
        FROM "${DatabaseSchemaGroup}".wahlen
        WHERE wahldatum = $1`;
  const convertDate = (date: Date) => date.toISOString().slice(0, 10);
  const ARGS = [convertDate(wahldatum)];

  return client
    ? client.query(QUERY_STR, ARGS).then(res => !!res && res.rows[0])
    : adapters.postgres
        .query<IDatabaseWahl>(QUERY_STR, ARGS)
        .then(res => res[0]);
};

export const getOrCreateWahlForDatum = async (
  wahldatum: Date,
  client?: PoolClient
): Promise<IDatabaseWahl> => {
  const wahl = await getWahlForDatum(wahldatum, client);
  if (wahl) return wahl;

  const QUERY_STR = `
    INSERT INTO "${DatabaseSchemaGroup}".wahlen
    VALUES (DEFAULT, $1)
    RETURNING *`;
  const ARGS = [wahldatum.toISOString().slice(0, 10)];

  return client
    ? client.query(QUERY_STR, ARGS).then(res => !!res && res.rows[0])
    : adapters.postgres.query(QUERY_STR, ARGS).then(res => res && res[0]);
};
