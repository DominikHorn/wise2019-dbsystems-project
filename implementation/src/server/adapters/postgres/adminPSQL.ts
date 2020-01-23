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
import { sleep } from "../../../shared/util";

enum AuthTables {
  DATA_BLOCKED = "datablocked",
  WAHLHELFER_TOKEN = "wahlhelfertoken",
  WAHLKABINEN = "authenticated_wahlkabinen"
}

export async function withVerifyIsAdmin<TReturn>(
  auth: string,
  fun: () => Promise<TReturn>
): Promise<TReturn> {
  if (config.wahlleiterConfig.password === auth) {
    return fun();
  }

  await sleep(5000);
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
    await sleep(5000);
    throw new AuthenticationError("Invalid Wahlhelfer Auth");
  } else {
    return fun(wahlhelferdata.wahl_id, wahlhelferdata.stimmkreis_id);
  }
}

export async function withVerifyIsWahlkabine<TReturn>(
  auth: string,
  fun: () => Promise<TReturn>
): Promise<TReturn> {
  const exists = await adapters.postgres
    .query(
      `
    SELECT *
    FROM "${DatabaseSchemaGroup}".${AuthTables.WAHLKABINEN}
    WHERE token = $1
  `,
      [auth]
    )
    .then(res => res && !!res[0]);

  if (!exists) {
    await sleep(5000);
    throw new AuthenticationError("Invalid Wahlkabine Auth");
  }

  return fun();
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
    unlocked: boolean;
    stimmkreisid: number;
    wahlid: number;
  };
  return adapters.postgres.query<WahlkabineData>(
    `
    SELECT label, token, wahl_id as wahlid, stimmkreis_id as stimmkreisid, unlocked
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
    WHERE token = $1   
  `,
      [wahlkabineToken]
    )
    .then(res => res && !!res[0]);
}

export async function setWahlkabineUnlocked(
  wahlhelfer_wahlid: number,
  wahlhelfer_stimmkreisid: number,
  wahlkabine_token: string,
  unlocked: boolean
): Promise<boolean> {
  return adapters.postgres
    .query(
      `
      UPDATE "${DatabaseSchemaGroup}".${AuthTables.WAHLKABINEN}
      SET unlocked = $1
      WHERE wahl_id = $2 AND stimmkreis_id = $3 AND token = $4
      RETURNING unlocked
      `,
      [unlocked, wahlhelfer_wahlid, wahlhelfer_stimmkreisid, wahlkabine_token]
    )
    .then(res => res && !!res[0]);
}

export async function resetWahlkabine(
  wahlkabineToken: string
): Promise<Boolean> {
  return adapters.postgres
    .query(
      `
      UPDATE "${DatabaseSchemaGroup}".${AuthTables.WAHLKABINEN}
      SET unlocked = false
      WHERE token = $1
      RETURNING unlocked
      `,
      [wahlkabineToken]
    )
    .then(res => res && !!res[0]);
}

export async function isUnlocked(wahlkabineToken: string): Promise<Boolean> {
  return adapters.postgres
    .query<{ unlocked: boolean }>(
      `
        SELECT unlocked
        FROM "${DatabaseSchemaGroup}".${AuthTables.WAHLKABINEN}
        WHERE token = $1
      `,
      [wahlkabineToken]
    )
    .then(res => res && res[0].unlocked);
}
