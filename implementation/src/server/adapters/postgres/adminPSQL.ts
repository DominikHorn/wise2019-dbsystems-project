import { AuthenticationError } from "apollo-server-express";
import { PoolClient } from "pg";
import * as config from "../../../../config.server.json";
import { MutationToSetDataBlockedArgs } from "../../../shared/graphql.types";
import { DatabaseSchemaGroup } from "../../databaseEntities";
import { adapters } from "../adapterUtil";

enum AuthTables {
  DATA_BLOCKED = "datablocked"
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
  type TRes = { blocked: boolean };
  if (client) {
    return client
      .query<TRes>(QUERY, [wahlid])
      .then(res => res && res.rows && res.rows[0] && res.rows[0].blocked);
  }
  return adapters.postgres
    .query<TRes>(QUERY, [wahlid])
    .then(res => res && res[0] && res[0].blocked);
}
