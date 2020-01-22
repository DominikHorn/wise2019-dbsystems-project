import { AuthenticationError } from "apollo-server-express";
import { PoolClient } from "pg";
import * as config from "../../../../config.server.json";
import {
  MutationToGenerateWahlhelferTokensArgs,
  MutationToSetDataBlockedArgs,
  WahlhelferToken,
  Wahlkabine
} from "../../../shared/graphql.types";
import {
  DatabaseSchemaGroup,
  IDatabaseWahlhelferToken
} from "../../databaseEntities";
import { adapters } from "../adapterUtil";
import { getAllStimmkreise } from "./stimmkreisPSQL";
import { generateRandomToken } from "../../../shared/token";

enum AuthTables {
  DATA_BLOCKED = "datablocked",
  WAHLHELFER_TOKEN = "wahlhelfertoken",
  WAHLKABINEN = "authenticated_wahlkabinen"
}

export function withVerifyIsAdmin<TReturn>(
  auth: string,
  fun: () => TReturn
): TReturn {
  if (config.wahlleiterConfig.password === auth) {
    return fun();
  }

  throw new AuthenticationError("Invalid Wahlleiter Auth");
}

export async function withVerifyIsWahlhelfer<TReturn>(
  auth: string,
  fun: (wahlid: number, stimmkreisid: number) => TReturn
): Promise<TReturn> {
  type WahlhelferData = { wahl_id: number; stimmkreis_id: number };
  const wahlhelferdata: WahlhelferData = await adapters.postgres
    .query<WahlhelferData>(
      `
    SELECT wahl_id, stimmkreis_id
    FROM "${DatabaseSchemaGroup}".${AuthTables.WAHLHELFER_TOKEN}
    WHERE token = $1
  `,
      [auth]
    )
    .then(res => res && res[0]);

  if (!wahlhelferdata) {
    throw new AuthenticationError("Invalid Wahlhelfer Auth");
  } else {
    return fun(wahlhelferdata.wahl_id, wahlhelferdata.stimmkreis_id);
  }
}

export async function withVerifyIsNotBlocked<TReturn>(
  wahlid: number,
  fun: () => Promise<TReturn>
): Promise<TReturn> {
  const isBlocked = await getIsBlocked(wahlid);
  if (!isBlocked) {
    return fun();
  }

  throw new Error("Election result fetching is blocked for this election");
}

export async function setDataBlocked(
  args: MutationToSetDataBlockedArgs
): Promise<boolean> {
  if (args.blocked) {
    return adapters.postgres
      .query(
        `
        INSERT INTO "${DatabaseSchemaGroup}".${AuthTables.DATA_BLOCKED} VALUES ($1) 
        ON CONFLICT DO NOTHING
        `,
        [args.wahlid]
      )
      .then(_ => true);
  } else {
    return adapters.postgres
      .query(
        `
        DELETE FROM "${DatabaseSchemaGroup}".${AuthTables.DATA_BLOCKED} WHERE wahl_id = $1
        `,
        [args.wahlid]
      )
      .then(_ => true);
  }
}

export async function getIsBlocked(
  wahlid: number,
  client?: PoolClient
): Promise<boolean> {
  const QUERY = `
    SELECT count(*) > 0 as blocked
    FROM "${DatabaseSchemaGroup}".${AuthTables.DATA_BLOCKED}
    WHERE wahl_id = $1
  `;
  const ARGS = [wahlid];
  type TRes = { blocked: boolean };
  return client
    ? client
        .query<TRes>(QUERY, ARGS)
        .then(res => res && res.rows && res.rows[0] && res.rows[0].blocked)
    : adapters.postgres
        .query<TRes>(QUERY, ARGS)
        .then(res => res && res[0] && res[0].blocked);
}

export async function generateWahlhelferToken(
  args: MutationToGenerateWahlhelferTokensArgs
): Promise<WahlhelferToken[]> {
  return adapters.postgres.transaction(async client => {
    const wahlid = await client
      .query(
        `
      SELECT id as wahlid
      FROM "${DatabaseSchemaGroup}".wahlen
      WHERE wahldatum = (SELECT max(wahldatum) FROM "${DatabaseSchemaGroup}".wahlen)
    `
      )
      .then(res => !!res && res.rows[0].wahlid);
    const tokens: IDatabaseWahlhelferToken[] = await getAllStimmkreise(
      client
    ).then(sks =>
      sks.map(sk => ({
        wahl_id: wahlid,
        stimmkreis_id: sk.id,
        token: generateRandomToken()
      }))
    );
    await client.query(
      `DELETE FROM "${DatabaseSchemaGroup}".wahlhelfertoken WHERE wahl_id = $1`,
      [wahlid]
    );
    await client
      .query<IDatabaseWahlhelferToken>(
        `
          INSERT INTO "${DatabaseSchemaGroup}".wahlhelfertoken (wahl_id, stimmkreis_id, token)
          VALUES ${tokens
            .map((_, i) => `($${3 * i + 1}, $${3 * i + 2}, $${3 * i + 3})`)
            .join(", ")}
          RETURNING *
          `,
        tokens.flatMap(wtk => [wtk.wahl_id, wtk.stimmkreis_id, wtk.token])
      )
      .then(res => !!res && res.rows);

    return client
      .query<
        IDatabaseWahlhelferToken & {
          wahldatum: Date;
          stimmkreis_name: string;
        }
      >(
        `
        SELECT wtk.wahl_id, 
               w.wahldatum as wahldatum,
               wtk.stimmkreis_id,
               sk.name as stimmkreis_name,
               wtk.token
        FROM "${DatabaseSchemaGroup}".wahlhelfertoken wtk
          JOIN "${DatabaseSchemaGroup}".wahlen w ON w.id = wtk.wahl_id
          JOIN "${DatabaseSchemaGroup}".stimmkreise sk ON sk.id = wtk.stimmkreis_id
        WHERE wtk.wahl_id = $1
        `,
        [wahlid]
      )
      .then(
        res =>
          !!res &&
          res.rows.map(row => ({
            wahl: {
              id: row.wahl_id,
              wahldatum: new Date(row.wahldatum.getTime() + 1000 * 60 * 60)
            },
            stimmkreis: {
              id: row.stimmkreis_id,
              name: row.stimmkreis_name
            },
            token: row.token
          }))
      );
  });
}

export async function getRegisteredWahlkabinen(
  wahlhelfer_wahlid: number,
  wahlhelfer_stimmkreisid: number
): Promise<Wahlkabine[]> {
  type WahlkabineData = {
    label: string;
    token: string;
  };
  return adapters.postgres.query<WahlkabineData>(
    `
    SELECT label, token
    FROM "${DatabaseSchemaGroup}".${AuthTables.WAHLKABINEN}
    WHERE wahl_id = $1 AND stimmkreis_id = $2
  `,
    [wahlhelfer_wahlid, wahlhelfer_stimmkreisid]
  );
}

export async function registerWahlkabine(
  wahlhelfer_wahlid: number,
  wahlhelfer_stimmkreisid: number,
  wahlkabineToken: string,
  label: string
): Promise<boolean> {
  return adapters.postgres
    .query(
      `
    INSERT INTO "${DatabaseSchemaGroup}".${AuthTables.WAHLKABINEN} (wahl_id, stimmkreis_id, token, label)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `,
      [wahlhelfer_wahlid, wahlhelfer_stimmkreisid, wahlkabineToken, label]
    )
    .then(res => res && !!res[0]);
}

export async function removeWahlkabine(
  wahlhelfer_wahlid: number,
  wahlhelfer_stimmkreisid: number,
  wahlkabineToken: string
): Promise<boolean> {
  return adapters.postgres
    .query(
      `
    DELETE FROM "${DatabaseSchemaGroup}".${AuthTables.WAHLKABINEN}
    WHERE wahl_id = $1 AND stimmkreis_id = $2 AND token = $3
  `,
      [wahlhelfer_wahlid, wahlhelfer_stimmkreisid, wahlkabineToken]
    )
    .then(res => !!res);
}

export async function isRegisteredWahlkabine(
  wahlkabineToken: string
): Promise<boolean> {
  return adapters.postgres
    .query(
      `
    SELECT *
    FROM "${DatabaseSchemaGroup}".${AuthTables.WAHLKABINEN}
    WHERE token = $!   
  `,
      [wahlkabineToken]
    )
    .then(res => res && !!res[0]);
}
