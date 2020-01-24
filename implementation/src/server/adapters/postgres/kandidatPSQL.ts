import { PoolClient } from "pg";
import {
  DatabaseSchemaGroup,
  IDatabaseKandidat,
  IDatabaseDirektkandidat
} from "../../databaseEntities";
import { adapters } from "../adapterUtil";
import {
  Kandidat,
  ListenKandidat,
  Altersverteilung
} from "../../../shared/graphql.types";

let cachedKandidatForParteiIdAndName: (
  parteiId: number,
  name: string,
  client?: PoolClient
) => IDatabaseKandidat = () => null;
export async function getKandidatForParteiIDAndName(
  parteiId: number,
  name: string,
  client?: PoolClient
): Promise<IDatabaseKandidat | null> {
  const res = cachedKandidatForParteiIdAndName(parteiId, name, client);
  if (res) {
    return res;
  }

  const QUERY_STR = `
    SELECT *
    FROM "${DatabaseSchemaGroup}".kandidaten
    WHERE partei_id = $1 AND name = $2`;
  const ARGS = [parteiId, name];

  const dbRes = client
    ? await client.query(QUERY_STR, ARGS).then(res => !!res && res.rows[0])
    : await adapters.postgres
        .query<IDatabaseKandidat>(QUERY_STR, ARGS)
        .then(res => res && res[0]);

  if (dbRes) {
    cachedKandidatForParteiIdAndName = (
      parteiIdParam,
      nameParam,
      clientParam
    ) => {
      if (
        parteiId === parteiIdParam &&
        name === nameParam &&
        client === clientParam
      )
        return dbRes;
      return null;
    };
  }
  return dbRes;
}

export async function getOrCreateKandidatForParteiIdAndName(
  parteiId: number,
  name: string,
  client?: PoolClient
): Promise<IDatabaseKandidat> {
  const kandidat = await getKandidatForParteiIDAndName(parteiId, name, client);
  if (kandidat) return kandidat;

  const QUERY_STR = `
    INSERT INTO "${DatabaseSchemaGroup}".kandidaten
    VALUES (DEFAULT, $1, $2)
    RETURNING *;`;
  const ARGS = [parteiId, name];
  return client
    ? client.query(QUERY_STR, ARGS).then(res => !!res && res.rows[0])
    : adapters.postgres
        .query<IDatabaseKandidat>(QUERY_STR, ARGS)
        .then(res => res && res[0]);
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
  const ARGS = [stimmkreis_id, wahl_id, direktkandidat_id];

  return client
    ? client.query(QUERY_STR, ARGS).then(res => !!res && res.rows[0])
    : adapters.postgres
        .query<IDatabaseKandidat>(QUERY_STR, ARGS)
        .then(res => res && res[0]);
}

export async function getDirektKandidaten(
  wahlid: number,
  stimmkreisid: number
): Promise<Kandidat[]> {
  const res: {
    partei_id: number;
    partei_name: string;
    kandidat_id: number;
    kandidat_name: string;
  }[] = await adapters.postgres.query(
    `
    SELECT k.id as kandidat_id,
           k.name as kandidat_name, 
           p.id as partei_id, 
           p.name as partei_name
    FROM "${DatabaseSchemaGroup}".direktkandidaten dk
      JOIN "${DatabaseSchemaGroup}".kandidaten k
        ON dk.direktkandidat_id = k.id
      JOIN "${DatabaseSchemaGroup}".parteien p
        ON p.id = k.partei_id
      JOIN "${DatabaseSchemaGroup}".stimmkreise sk
        ON dk.stimmkreis_id = sk.id
    WHERE dk.wahl_id = $1 AND dk.stimmkreis_id = $2;`,
    [wahlid, stimmkreisid]
  );

  return res.map(resobj => ({
    id: resobj.kandidat_id,
    name: resobj.kandidat_name,
    partei: {
      id: resobj.partei_id,
      name: resobj.partei_name
    }
  }));
}

export async function getListenKandidaten(
  wahlid: number,
  regierungsbezirkid: number
): Promise<ListenKandidat[]> {
  type QueryResult = {
    partei_id: number;
    partei_name: string;
    kandidat_id: number;
    kandidat_name: string;
    kandidat_platz: number;
  };
  return adapters.postgres
    .query<QueryResult>(
      `
      SELECT l.initialerlistenplatz as kandidat_platz,
            k.id as kandidat_id,
            k.name as kandidat_name,
            p.id as partei_id,
            p.name as partei_name
      FROM "landtagswahlen".listen l
      JOIN "landtagswahlen".kandidaten k
        ON k.id = l.kandidat_id
      JOIN "landtagswahlen".parteien p
        ON p.id = k.partei_id
      WHERE wahl_id = $1 AND l.regierungsbezirk_id = $2;`,
      [wahlid, regierungsbezirkid]
    )
    .then(
      res =>
        res &&
        res.map(r => ({
          platz: r.kandidat_platz,
          kandidat: {
            id: r.kandidat_id,
            name: r.kandidat_name,
            partei: {
              id: r.partei_id,
              name: r.partei_name
            }
          }
        }))
    );
}

export async function setKandidatZusatzdaten(
  kandidatName: string,
  geburtsjahr: number,
  wohnort: string,
  client?: PoolClient
): Promise<IDatabaseKandidat[]> {
  const QUERY = `
    UPDATE "${DatabaseSchemaGroup}".kandidaten
    SET 
       geburtsjahr = $1,
       wohnort = $2
    WHERE name = $3
    RETURNING *
  `;
  const ARGS = [geburtsjahr, wohnort, kandidatName];
  return (await client)
    ? client.query(QUERY, ARGS).then(r => r && r.rows)
    : adapters.postgres.query(QUERY, ARGS);
}

export async function getAltersverteilungImParlament(
  wahl_id: number,
  client?: PoolClient
): Promise<Altersverteilung[]> {
  const QUERY = `
    WITH mandate (wahl_id, kandidat_id) AS (
      SELECT gd.wahl_id, gd.kandidat_id
      FROM "${DatabaseSchemaGroup}".gewonnene_direktmandate gd
      UNION
      SELECT gl.wahl_id, gl.kandidat_id
      FROM "${DatabaseSchemaGroup}".gewonnene_listenmandate gl
    )
    SELECT k.geburtsjahr, 
           COUNT(COALESCE(k.geburtsjahr, -1)) as anzahl, 
           p.id as partei_id, 
           p.name as partei_name
    FROM mandate m
      JOIN "${DatabaseSchemaGroup}".kandidaten k
        ON k.id = m.kandidat_id
      JOIN "${DatabaseSchemaGroup}".parteien p
        ON p.id = k.partei_id
    WHERE wahl_id = $1
    GROUP BY m.wahl_id, k.geburtsjahr, p.id, p.name
    ORDER BY geburtsjahr;
  `;
  const ARGS = [wahl_id];

  const result: {
    geburtsjahr: number;
    anzahl: number;
    partei_id: number;
    partei_name: string;
  }[] = await (client
    ? client.query(QUERY, ARGS).then(r => r.rows)
    : adapters.postgres.query(QUERY, ARGS));

  return result.map(r => ({
    geburtsjahr: r.geburtsjahr,
    anzahl: r.anzahl,
    partei: {
      id: r.partei_id,
      name: r.partei_name
    }
  }));
}
