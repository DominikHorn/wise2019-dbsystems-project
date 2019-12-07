import { adapters } from "../../adapterUtil";
import {
  DatabaseSchemaGroup,
  IDatabaseStimmkreisWinner
} from "../../../databaseEntities";
import {
  IMandat,
  IStimmkreisWinner,
  IUeberhangMandat
} from "../../../../shared/sharedTypes";
import { EParteiName } from "../../../../shared/enums";

type MaterialViews =
  | "kandidatgebundene_gueltige_stimmen"
  | "listengebundene_gueltige_stimmen"
  | "ungueltige_erststimmen"
  | "ungueltige_zweitstimmen"
  | "finaleliste"
  | "gewonnene_direktmandate"
  | "gewonnene_listenmandate";

type Tables =
  | "parteien"
  | "wahlen"
  | "stimmkreise"
  | "kandidaten"
  | "regierungsbezirke";

const PARTEI_TABLE: Tables = "parteien";
const WAHL_TABLE: Tables = "wahlen";
const STIMMKREIS_TABLE: Tables = "stimmkreise";
const KANDIDATEN_TABLE: Tables = "kandidaten";
const REGIERUNGSBEZIRKE_TABLE: Tables = "regierungsbezirke";

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

enum EWinnerPartyViews {
  SIEGER_ERSTSTIMMEN = "sieger_erstimmen_pro_stimmkreis",
  SIEGER_ZWEITSTIMMEN = "sieger_zweitstimmen_pro_stimmkreis"
}

export async function computeWinnerParties(
  wahlid: number,
  erststimmen: boolean
): Promise<IStimmkreisWinner[]> {
  let data: IDatabaseStimmkreisWinner[] = [];
  data = await adapters.postgres.query(
    `
      SELECT 
        p.id as partei_id,
        p.name as partei_name,
        sk.id as stimmkreis_id,
        sk.name as stimmkreis_name,
        seps.anzahl as anzahl
      FROM "${DatabaseSchemaGroup}".${
      erststimmen
        ? EWinnerPartyViews.SIEGER_ERSTSTIMMEN
        : EWinnerPartyViews.SIEGER_ZWEITSTIMMEN
    } seps
        JOIN "${DatabaseSchemaGroup}".${PARTEI_TABLE} p on seps.partei_id = p.id
        JOIN "${DatabaseSchemaGroup}".${STIMMKREIS_TABLE} sk on seps.stimmkreis_id = sk.id
      WHERE seps.wahl_id = $1
    `,
    [wahlid]
  );
  return data.map(skwinner => ({
    stimmkreis: {
      id: skwinner.stimmkreis_id,
      name: skwinner.stimmkreis_name
    },
    partei: {
      id: skwinner.partei_id,
      name: skwinner.partei_name as EParteiName
    },
    anzahl: skwinner.anzahl
  }));
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
        JOIN "${DatabaseSchemaGroup}".${KANDIDATEN_TABLE} k ON dm.kandidat_id = k.id
        JOIN "${DatabaseSchemaGroup}".${PARTEI_TABLE} p ON k.partei_id = p.id
      WHERE dm.wahl_id = $1
      UNION
      SELECT k.id as kandidat_id, 
            k.name as kandidat_name,
            p.id as partei_id, 
            p.name as partei_name,
            false as direktmandat
      FROM "${DatabaseSchemaGroup}".${listenmandatView} lm
        JOIN "${DatabaseSchemaGroup}".${KANDIDATEN_TABLE} k ON lm.kandidat_id = k.id
        JOIN "${DatabaseSchemaGroup}".${PARTEI_TABLE} p ON k.partei_id = p.id
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

export async function getUeberhangmandate(
  wahlid: number
): Promise<IUeberhangMandat[]> {
  const direktmandatView: MaterialViews = "gewonnene_direktmandate";
  const listenmandatView: MaterialViews = "gewonnene_listenmandate";
  const res: {
    wahl_id: number;
    wahldatum: Date;
    regierungsbezirk_id: number;
    regierungsbezirk_name: string;
    partei_id: number;
    partei_name: string;
    ueberhang: number;
    ausgleich: number;
    zustehend: number;
  }[] = await adapters.postgres.query(
    `
    WITH anzahlGewonneneDirektmandate (regierungsbezirk_id, partei_id, anzahl) AS (
      SELECT sk.regierungsbezirk_id, k.partei_id, count(*) as anzahl
      FROM "${DatabaseSchemaGroup}".${direktmandatView} gd
        JOIN "${DatabaseSchemaGroup}".${KANDIDATEN_TABLE} k ON k.id = gd.kandidat_id
        JOIN "${DatabaseSchemaGroup}".${STIMMKREIS_TABLE} sk ON sk.id = gd.stimmkreis_id
      WHERE gd.wahl_id = $1
      GROUP BY sk.regierungsbezirk_id, k.partei_id
    ), anzahlGewonneneListenmandate (regierungsbezirk_id, partei_id, anzahl) AS (
      SELECT gl.regierungsbezirk_id, k.partei_id, count(*) as anzahl
      FROM "${DatabaseSchemaGroup}".${listenmandatView} gl
        JOIN "${DatabaseSchemaGroup}".${KANDIDATEN_TABLE} k ON k.id = gl.kandidat_id
      WHERE gl.wahl_id = $1
      GROUP BY gl.regierungsbezirk_id, k.partei_id
    )
    SELECT 
      zm.regierungsbezirk_id,
      rb.name as regierungsbezirk_name,
      zm.partei_id,
      p.name as partei_name,
      CASE
        WHEN COALESCE(agd.anzahl, 0) - zm.anzahl < 0 THEN 0
        ELSE COALESCE(agd.anzahl, 0) - zm.anzahl
        END as ueberhang,
      CASE
        WHEN COALESCE(agl.anzahl, 0) - zm.anzahl < 0 THEN 0
        ELSE COALESCE(agl.anzahl, 0) - zm.anzahl
        END as ausgleich,
      zm.anzahl as zustehend
    FROM anzahlGewonneneDirektmandate agd
      RIGHT OUTER JOIN zustehende_mandate(0) zm
        ON zm.regierungsbezirk_id = agd.regierungsbezirk_id
          AND zm.partei_id = agd.partei_id
      LEFT OUTER JOIN anzahlGewonneneListenmandate agl
        ON zm.regierungsbezirk_id = agl.regierungsbezirk_id
          AND zm.partei_id = agl.partei_id
      JOIN "${DatabaseSchemaGroup}".${REGIERUNGSBEZIRKE_TABLE} rb
        ON rb.id = zm.regierungsbezirk_id
      JOIN "${DatabaseSchemaGroup}".${PARTEI_TABLE} p
        ON p.id = zm.partei_id
    WHERE zm.wahl_id = $1
    ORDER BY zm.regierungsbezirk_id, zm.partei_id; 
  `,
    [wahlid]
  );

  return res.map(row => ({
    wahl: {
      id: row.wahl_id,
      wahldatum: row.wahldatum
    },
    regierungsbezirk: {
      id: row.regierungsbezirk_id,
      name: row.regierungsbezirk_name
    },
    partei: {
      id: row.partei_id,
      name: row.partei_name as EParteiName
    },
    ueberhang: row.ueberhang,
    ausgleich: row.ausgleich,
    zustehend: row.zustehend
  }));
}
