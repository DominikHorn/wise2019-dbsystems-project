import { adapters } from "../../adapterUtil";
import {
  DatabaseSchemaGroup,
  IDatabaseStimmkreisWinner
} from "../../../databaseEntities";
import { IMandat } from "../../../../shared/sharedTypes";
import { EParteiName } from "../../../../shared/enums";

type MaterialViews =
  | "kandidatgebundene_gueltige_stimmen"
  | "listengebundene_gueltige_stimmen"
  | "ungueltige_erststimmen"
  | "ungueltige_zweitstimmen"
  | "finaleliste"
  | "gewonnene_direktmandate"
  | "gewonnene_listenmandate";

const refreshOrder: MaterialViews[] = [
  "kandidatgebundene_gueltige_stimmen",
  "listengebundene_gueltige_stimmen",
  "ungueltige_erststimmen",
  "ungueltige_zweitstimmen",
  "finaleliste",
  "gewonnene_direktmandate",
  "gewonnene_listenmandate"
];

/**
 * Computes election results by refreshing materialized views
 */
export async function computeElectionResults(): Promise<boolean> {
  for (const viewToRefresh of refreshOrder) {
    await adapters.postgres.query(
      `REFRESH MATERIALIZED VIEW "${DatabaseSchemaGroup}".${viewToRefresh};`
    );
  }
  return true;
}

export async function computeWinnerParties(
  wahlid: number,
  erststimmen: boolean
): Promise<IDatabaseStimmkreisWinner[]> {
  if (erststimmen) {
    return adapters.postgres.query(
      `SELECT * FROM "landtagswahlen".sieger_erstimmen_pro_stimmkreis
    `
    );
  } else {
    return adapters.postgres.query(
      `
      SELECT * FROM "landtagswahlen".sieger_zweitstimmen_pro_stimmkreis
      `
    );
  }
}

export async function getMandate(wahlid: number): Promise<IMandat[]> {
  const direktmandatView: MaterialViews = "gewonnene_direktmandate";
  const listenmandatView: MaterialViews = "gewonnene_listenmandate";
  const res: {
    kandidat_id: number;
    kandidat_name: string;
    partei_id: number;
    partei_name: string;
    direktmandat: boolean;
  }[] = await adapters.postgres.query(
    `
    SELECT m.* 
    FROM (
      SELECT k.id as kandidat_id, 
            k.name as kandidat_name,
            p.id as partei_id, 
            p.name as partei_name,
            true as direktmandat
      FROM "${DatabaseSchemaGroup}".${direktmandatView} dm
        JOIN "${DatabaseSchemaGroup}".kandidaten k ON dm.kandidat_id = k.id
        JOIN "${DatabaseSchemaGroup}".parteien p ON k.partei_id = p.id
      WHERE dm.wahl_id = $1
      UNION
      SELECT k.id as kandidat_id, 
            k.name as kandidat_name,
            p.id as partei_id, 
            p.name as partei_name,
            false as direktmandat
      FROM "${DatabaseSchemaGroup}".${listenmandatView} lm
        JOIN "${DatabaseSchemaGroup}".kandidaten k ON lm.kandidat_id = k.id
        JOIN "${DatabaseSchemaGroup}".parteien p ON k.partei_id = p.id
      WHERE lm.wahl_id = $1
    ) m
    ORDER BY m.direktmandat DESC, m.kandidat_id
  `,
    [wahlid]
  );

  return res.map(resobj => ({
    kandidat: {
      id: resobj.kandidat_id,
      name: resobj.kandidat_name,
      partei: {
        id: resobj.partei_id,
        name: resobj.partei_name as EParteiName
      }
    },
    direktmandat: resobj.direktmandat
  }));
}
