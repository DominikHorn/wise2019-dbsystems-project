import { PoolClient } from "pg";
import {
  DatabaseSchemaGroup,
  IDatabaseKandidat,
  IDatabaseDirektkandidat
} from "../../../databaseEntities";
import { adapters } from "../../adapterUtil";
import { IKandidat } from "../../../../shared/sharedTypes";
import { EParteiName } from "../../../../shared/enums";

let cachedKandidatForParteiIdAndName: (
  parteiId: number,
  name: string,
  client: PoolClient
) => IDatabaseKandidat = () => null;
export async function getKandidatForName(
  parteiId: number,
  name: string,
  client?: PoolClient
): Promise<IDatabaseKandidat | null> {
  const QUERY_STR = `
    SELECT *
    FROM "${DatabaseSchemaGroup}".kandidaten
    WHERE partei_id = $1 AND name = $2`;
  if (client) {
    const res = cachedKandidatForParteiIdAndName(parteiId, name, client);
    if (res) {
      console.error("FOUND DUPLICATE CANDIDATE (?):", parteiId, name);
      return res;
    } else {
      const dbRes = await client
        .query(QUERY_STR, [parteiId, name])
        .then(res => !!res && res.rows[0]);
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
      return dbRes;
    }
  }
  const kandidaten = await adapters.postgres.query<IDatabaseKandidat>(
    QUERY_STR,
    [parteiId, name]
  );
  return !!kandidaten && kandidaten[0];
}

export async function getOrCreateKandidatForParteiIdAndName(
  parteiId: number,
  name: string,
  client?: PoolClient
): Promise<IDatabaseKandidat> {
  if (client) {
    const QUERY_STR = `
    INSERT INTO "${DatabaseSchemaGroup}".kandidaten
    VALUES (DEFAULT, $1, $2)
    RETURNING *;`;
    if (client) {
      return client
        .query(QUERY_STR, [parteiId, name])
        .then(res => !!res && res.rows[0]);
    }
  }
  return adapters.postgres.transaction(async client =>
    getOrCreateKandidatForParteiIdAndName(parteiId, name, client)
  );
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
  if (client) {
    return client
      .query(QUERY_STR, [stimmkreis_id, wahl_id, direktkandidat_id])
      .then(res => !!res && res.rows[0]);
  }
  return adapters.postgres.transaction(async client =>
    insertDirektkandidat(stimmkreis_id, wahl_id, direktkandidat_id, client)
  );
}

export async function getAllDirektKandidaten(
  wahlid: number,
  stimmkreisid: number
): Promise<IKandidat[]> {
  const res: {
    partei_id: number;
    partei_name: EParteiName;
    kandidat_id: number;
    kandidat_name: string;
  }[] = await adapters.postgres.query(
    `
    SELECT k.partei_id, p.name, k.name, k.id
    FROM "${DatabaseSchemaGroup}".direktkandidaten dk
      JOIN "${DatabaseSchemaGroup}".kandidaten k
        ON dk.direktkandidat_id = k.id
      JOIN "${DatabaseSchemaGroup}".parteien p
        ON p.id = k.partei_id
      JOIN "${DatabaseSchemaGroup}".stimmkreise sk
        ON dk.stimmkreis_id = sk.id
    WHERE dk.stimmkreis_id = $2 AND dk.wahl_id = $1;
`,
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
