import { adapters } from "../../adapterUtil";
import { IDatabaseWahl, DatabaseSchemaGroup } from "../../../databaseEntities";
import { PoolClient } from "pg";
import { Wahl } from "../../../../shared/graphql.types";

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
  if (client) {
    return client
      .query(QUERY_STR, [convertDate(wahldatum)])
      .then(res => !!res && res.rows[0]);
  }
  const wahlen = await adapters.postgres.query<IDatabaseWahl>(QUERY_STR, [
    convertDate(wahldatum)
  ]);

  return !!wahlen && wahlen[0];
};

export const getOrCreateWahlForDatum = async (
  wahldatum: Date,
  client?: PoolClient
): Promise<IDatabaseWahl> => {
  if (client) {
    let wahl = await getWahlForDatum(wahldatum, client);
    if (wahl) return wahl;
    await client
      .query(
        `
        INSERT INTO "${DatabaseSchemaGroup}".wahlen
        VALUES (DEFAULT, $1)
        `,
        [wahldatum.toISOString().slice(0, 10)]
      )
      .then(res => !!res && res.rows[0]);
    return getWahlForDatum(wahldatum, client);
  }

  return adapters.postgres.transaction(async client =>
    getOrCreateWahlForDatum(wahldatum, client)
  );
};
