import { adapters } from "../adapterUtil";
import {
  DatabaseSchemaGroup,
  IDatabaseStimmkreisWinner
} from "../../databaseEntities";
import {
  Wahlbeteiligung,
  Stimmentwicklung,
  Mandat,
  StimmkreisWinner,
  UeberhangMandat,
  KnapperKandidat,
  Q7
} from "../../../shared/graphql.types";

type MaterialViews =
  | "direktmandat_anzahl"
  | "kandidatgebundene_gueltige_stimmen"
  | "listengebundene_gueltige_stimmen"
  | "ungueltige_erststimmen"
  | "ungueltige_zweitstimmen"
  | "finaleliste"
  | "gewonnene_direktmandate"
  | "gewonnene_listenmandate"
  | "knappste_kandidaten";

const KANDIDATENGEBUNDENE_GUELTIGE_STIMMEN_MVIEW: MaterialViews =
  "kandidatgebundene_gueltige_stimmen";
const LISTENGEBUNDENDE_GUELTIGE_STIMMEN_MVIEW: MaterialViews =
  "listengebundene_gueltige_stimmen";
const GEWONNENE_DIREKTMANDATE_MVIEW: MaterialViews = "gewonnene_direktmandate";
const GEWONNENE_LISTENMANDATE_MVIEW: MaterialViews = "gewonnene_listenmandate";

type Tables =
  | "parteien"
  | "wahlen"
  | "stimmkreise"
  | "kandidaten"
  | "regierungsbezirke"
  | "direktkandidaten"
  | "stimmkreis_wahlinfo";

const PARTEIEN_TABLE: Tables = "parteien";
const WAHLEN_TABLE: Tables = "wahlen";
const KNAPPSTE_KANDIDATEN_MVIEW: MaterialViews = "knappste_kandidaten";
const STIMMKREIS_TABLE: Tables = "stimmkreise";
const KANDIDATEN_TABLE: Tables = "kandidaten";
const REGIERUNGSBEZIRKE_TABLE: Tables = "regierungsbezirke";
const STIMMKREIS_INFO_TABLE: Tables = "stimmkreis_wahlinfo";

const refreshOrder: MaterialViews[] = [
  "direktmandat_anzahl",
  "kandidatgebundene_gueltige_stimmen",
  "listengebundene_gueltige_stimmen",
  "ungueltige_erststimmen",
  "ungueltige_zweitstimmen",
  "finaleliste",
  "gewonnene_direktmandate",
  "gewonnene_listenmandate",
  "knappste_kandidaten"
];

export async function computeQ7(
  wahlid: number,
  stimmkreisid1: number,
  stimmkreisid2: number,
  stimmkreisid3: number,
  stimmkreisid4: number,
  stimmkreisid5: number,
  vorg_wahlid: number
): Promise<Q7[]> {
  const res: {
    stimmkreis_id: number;
    stimmkreis_name: string;
    partei_id: number;
    partei_name: string;
    direktmandat: string;
    wahlbeteiligung: number;
    prozAnteil: number;
    absAnteil: number;
    vorher: number;
    nachher: number;
  }[] = await adapters.postgres.query(
    `with listengebundene_gueltige_stimmen AS (
  SELECT lgs.wahl_id, lgs.stimmkreis_id, lgs.partei_id, sum(anzahl) as anzahl
  FROM (
           (
               SELECT egls.wahl_id, egls.stimmkreis_id, egls.partei_id, count(*) as anzahl
               FROM "landtagswahlen".einzel_gueltige_listengebundene_stimmen egls
               WHERE egls.stimmkreis_id = $2 OR egls.stimmkreis_id = $3 OR egls.stimmkreis_id = $4 OR egls.stimmkreis_id = $5 OR egls.stimmkreis_id = $6
               GROUP BY egls.stimmkreis_id, egls.wahl_id, egls.partei_id
           )
           UNION ALL
           (
               SELECT agls.wahl_id, agls.stimmkreis_id, agls.partei_id, agls.anzahl
               FROM "landtagswahlen".aggregiert_gueltige_listengebundene_stimmen agls
               WHERE agls.stimmkreis_id = $2 OR agls.stimmkreis_id = $3 OR agls.stimmkreis_id = $4 OR agls.stimmkreis_id = $5 OR agls.stimmkreis_id = $6
           )
       ) lgs
  GROUP BY lgs.wahl_id, lgs.stimmkreis_id, lgs.partei_id
), kandidatgebundene_gueltige_stimmen AS(
  (
      SELECT egks.wahl_id, egks.stimmkreis_id, egks.kandidat_id, count(*) as anzahl
      FROM "landtagswahlen".einzel_gueltige_kandidatgebundene_stimmen egks
      GROUP BY egks.stimmkreis_id, egks.kandidat_id, egks.wahl_id
  )
  UNION ALL
  (
      SELECT agks.wahl_id, agks.stimmkreis_id, agks.kandidat_id, agks.anzahl
      FROM "landtagswahlen".aggregiert_gueltige_kandidatgebundene_stimmen agks
  )
),

kandidatgebundene_stimmen_pro_partei_pro_stimmkreis  AS (
SELECT kgs.wahl_id, kgs.stimmkreis_id, k.partei_id, sum(kgs.anzahl) as anzahl
FROM kandidatgebundene_gueltige_stimmen kgs
  JOIN "landtagswahlen".kandidaten k ON k.id = kgs.kandidat_id
GROUP BY kgs.wahl_id, kgs.stimmkreis_id, kgs.wahl_id, k.partei_id, k.partei_id
),
-- --absolute Anzahl an Stimmen pro Partei
gesamtstimmen_pro_partei_pro_stimmkreis AS (
SELECT kggs.wahl_id, kggs.stimmkreis_id, kggs.partei_id, (kggs.anzahl + lgs.anzahl) as anzahl
FROM kandidatgebundene_stimmen_pro_partei_pro_stimmkreis kggs
  JOIN listengebundene_gueltige_stimmen lgs
    ON lgs.stimmkreis_id = kggs.stimmkreis_id AND lgs.partei_id = kggs.partei_id AND
      lgs.wahl_id = kggs.wahl_id
),
 gesamtstimmen_pro_stimmkreis AS(
  SELECT wahl_id, stimmkreis_id, sum(anzahl) as gesamtanzahlstimmen
  FROM gesamtstimmen_pro_partei_pro_stimmkreis
  GROUP BY wahl_id, stimmkreis_id
), prozentualen_anteil_pro_partei as (
  SELECT gppps.wahl_id, gppps.stimmkreis_id, gppps.partei_id, (CAST( gppps.anzahl AS float)/CAST(gps.gesamtanzahlstimmen AS float)) *100 as prozAnteil
FROM gesamtstimmen_pro_stimmkreis gps
  JOIN gesamtstimmen_pro_partei_pro_stimmkreis gppps
      ON  gps.wahl_id = gppps.wahl_id AND gps.stimmkreis_id = gppps.stimmkreis_id
  JOIN "landtagswahlen".parteien p
      ON p.id = gppps.partei_id
), --fuer entwicklung der stimmen
 gesamtstimmen_pro_partei as (
SELECT wahl_id, partei_id, sum(anzahl) as anzahl
FROM gesamtstimmen_pro_partei_pro_stimmkreis
GROUP BY wahl_id, partei_id
), entwicklung as(
    SELECT g1.partei_id, g1.anzahl as vorher, g2.anzahl as nachher
           FROM gesamtstimmen_pro_partei  g1
           JOIN gesamtstimmen_pro_partei g2
           ON g2.partei_id = g1.partei_id AND g2.wahl_id = $1 AND g1.wahl_id = $7

), --direktmandate
 gesamtstimmen (wahl_id, anzahl) AS (
SELECT wahl_id, sum(anzahl)
FROM gesamtstimmen_pro_partei
GROUP BY wahl_id
),
-- Die Parteien, welche nicht gesperrt sind für die Wahl
nicht_gesperrte_parteien (wahl_id, partei_id) AS (
SELECT distinct m.wahl_id, k.partei_id
  FROM (SELECT * FROM "landtagswahlen".gewonnene_direktmandate
      UNION
      SELECT * FROM "landtagswahlen".gewonnene_listenmandate) as m
JOIN "landtagswahlen".kandidaten k
ON k.id = m.kandidat_id
),
nicht_gesperrte_direktkandidaten (wahl_id, stimmkreis_id, kandidat_id, stimmanzahl) AS (
SELECT dk.wahl_id, dk.stimmkreis_id, dk.direktkandidat_id, kgs.anzahl
FROM "landtagswahlen".direktkandidaten dk
  JOIN "landtagswahlen".kandidaten k
    ON k.id = dk.direktkandidat_id
  JOIN "landtagswahlen".stimmkreise sk
    ON sk.id = dk.stimmkreis_id
  JOIN kandidatgebundene_gueltige_stimmen kgs
    ON kgs.kandidat_id = dk.direktkandidat_id
      AND kgs.wahl_id = dk.wahl_id
      AND kgs.stimmkreis_id = dk.stimmkreis_id
  JOIN nicht_gesperrte_parteien ngp
    ON ngp.wahl_id = dk.wahl_id
      AND ngp.partei_id = k.partei_id
), direktmandate as (
SELECT ngd1.wahl_id, ngd1.stimmkreis_id, ngd1.kandidat_id, ngd1.stimmanzahl
FROM nicht_gesperrte_direktkandidaten ngd1
WHERE NOT EXISTS(
SELECT *
FROM nicht_gesperrte_direktkandidaten ngd2
WHERE ngd1.wahl_id = ngd2.wahl_id
  AND ngd1.stimmkreis_id = ngd2.stimmkreis_id
  AND ngd2.stimmanzahl > ngd1.stimmanzahl
)), wahlbeteiligung as (
  SELECT swi.wahl_id, swi.stimmkreis_id,
           (CAST(swi.anzahlwaehler AS float) /CAST( swi.anzahlwahlberechtigte AS float) )  as wahlbeteiligung
  FROM "landtagswahlen".stimmkreis_wahlinfo swi

),  ergebnis as(--sk.name, e.partei_id, p.name, k.name,    e.vorher, e.nachher
SELECT wb.stimmkreis_id as stimmkreis_id, 
       sk.name as stimmkreis_name, 
       gps.partei_id as partei_id, 
       p.name as partei_name, 
       k.name as direktmandat, 
       wb.wahlbeteiligung as wahlbeteiligung, 
       papp.prozAnteil as prozAnteil, 
       gps.anzahl as absAnteil, 
       e.vorher as vorher, 
       e.nachher as nachher
FROM wahlbeteiligung wb
  JOIN direktmandate dk
    ON wb.wahl_id = dk.wahl_id AND wb.stimmkreis_id = dk.stimmkreis_id
  JOIN gesamtstimmen_pro_partei_pro_stimmkreis gps
    ON wb.wahl_id = gps.wahl_id AND wb.stimmkreis_id = gps.stimmkreis_id
  JOIN prozentualen_anteil_pro_partei papp
    ON papp.wahl_id = gps.wahl_id AND papp.stimmkreis_id = gps.stimmkreis_id AND papp.partei_id = gps.partei_id
  JOIN "landtagswahlen".stimmkreise sk
    ON sk.id = papp.stimmkreis_id
  JOIN entwicklung e
    ON e.partei_id = gps.partei_id
  JOIN "landtagswahlen".parteien p
    ON p.id = papp.partei_id
  JOIN "landtagswahlen".kandidaten k
    ON k.id = dk.kandidat_id
)
 SELECT * FROM ergebnis;`,
    [
      wahlid,
      stimmkreisid1,
      stimmkreisid2,
      stimmkreisid3,
      stimmkreisid4,
      stimmkreisid5,
      vorg_wahlid
    ]
  );
  return res.map(resobj => ({
    stimmkreis: {
      id: resobj.stimmkreis_id,
      name: resobj.stimmkreis_name
    },
    partei: {
      id: resobj.partei_id,
      name: resobj.partei_name
    },
    direktmandat: resobj.direktmandat,
    wahlbeteiligung: resobj.wahlbeteiligung,
    prozAnteil: resobj.prozAnteil,
    absAnteil: resobj.absAnteil,
    vorher: resobj.vorher,
    nachher: resobj.nachher
  }));
}

export async function computeWahlbeteiligung(
  wahlid: number
): Promise<Wahlbeteiligung[]> {
  const res: {
    wahl_id: number;
    wahldatum: Date;
    stimmkreis_id: number;
    stimmkreis_name: string;
    wahlbeteiligung: number;
  }[] = await adapters.postgres.query(
    `
      SELECT w.id as wahl_id,
             w.wahldatum as wahldatum,
             sk.id as stimmkreis_id,
             sk.name as stimmkreis_name,
             CAST(anzahlwaehler AS FLOAT) / CAST(anzahlwahlberechtigte AS FLOAT) * 100 as wahlbeteiligung
      FROM "${DatabaseSchemaGroup}".${STIMMKREIS_INFO_TABLE} ski
        JOIN "${DatabaseSchemaGroup}".${WAHLEN_TABLE} w
          ON w.id = ski.wahl_id
        JOIN "${DatabaseSchemaGroup}".${STIMMKREIS_TABLE} sk
          ON sk.id = ski.stimmkreis_id
      WHERE wahl_id = $1;
    `,
    [wahlid]
  );

  return res.map(resobj => ({
    wahl: {
      id: resobj.wahl_id,
      wahldatum: resobj.wahldatum
    },
    stimmkreis: {
      id: resobj.stimmkreis_id,
      name: resobj.stimmkreis_name
    },
    wahlbeteiligung: resobj.wahlbeteiligung
  }));
}

export async function computeEntwicklungDerStimmmen(
  wahl_id: number,
  vgl_wahl_id: number | null | undefined,
  stimmkreis_id: number
): Promise<Stimmentwicklung[]> {
  const VGL_QUERY = `
    WITH gueltige_partei_stimmen (wahl_id, stimmkreis_id, partei_id, anzahl) AS (
      SELECT wahl_id, stimmkreis_id, partei_id, sum(anzahl)
      FROM (
              SELECT kgs.wahl_id, kgs.stimmkreis_id, k.partei_id, kgs.anzahl
              FROM "${DatabaseSchemaGroup}".${KANDIDATENGEBUNDENE_GUELTIGE_STIMMEN_MVIEW} kgs
              JOIN "${DatabaseSchemaGroup}".${KANDIDATEN_TABLE} k
                    ON kgs.kandidat_id = k.id
              UNION ALL
              SELECT *
              FROM "${DatabaseSchemaGroup}".${LISTENGEBUNDENDE_GUELTIGE_STIMMEN_MVIEW}
           ) gueltige_stimmen
      GROUP BY wahl_id, stimmkreis_id, partei_id
    )
    SELECT gs1.partei_id,
           p.name as partei_name,
           gs1.anzahl as nachher,
           COALESCE(gs2.anzahl, 0) as vorher
    FROM gueltige_partei_stimmen gs1
      JOIN "${DatabaseSchemaGroup}".${PARTEIEN_TABLE} p
        ON gs1.partei_id = p.id
      LEFT OUTER JOIN gueltige_partei_stimmen gs2
        ON gs1.stimmkreis_id = gs2.stimmkreis_id
        AND gs1.partei_id = gs2.partei_id
        AND gs1.wahl_id <> gs2.wahl_id
    WHERE gs1.wahl_id = $1
      AND COALESCE(gs2.wahl_id,$2) = $2
      AND gs1.stimmkreis_id = $3;
    `;
  const VGL_ARGS = [wahl_id, vgl_wahl_id, stimmkreis_id];

  const NO_VGL_QUERY = `
    WITH gueltige_partei_stimmen (wahl_id, stimmkreis_id, partei_id, anzahl) AS (
      SELECT wahl_id, stimmkreis_id, partei_id, sum(anzahl)
      FROM (
            SELECT kgs.wahl_id, kgs.stimmkreis_id, k.partei_id, kgs.anzahl
            FROM "${DatabaseSchemaGroup}".${KANDIDATENGEBUNDENE_GUELTIGE_STIMMEN_MVIEW} kgs
              JOIN "${DatabaseSchemaGroup}".${KANDIDATEN_TABLE} k
                ON kgs.kandidat_id = k.id
            UNION ALL
            SELECT *
            FROM "${DatabaseSchemaGroup}".${LISTENGEBUNDENDE_GUELTIGE_STIMMEN_MVIEW}
          ) gueltige_stimmen
      GROUP BY wahl_id, stimmkreis_id, partei_id
    )
    SELECT gs1.partei_id,
          p.name as partei_name,
          gs1.anzahl as nachher,
          0 as vorher
    FROM gueltige_partei_stimmen gs1
      JOIN "${DatabaseSchemaGroup}".${PARTEIEN_TABLE} p
        ON gs1.partei_id = p.id
    WHERE gs1.wahl_id = $1
    AND gs1.stimmkreis_id = $2;
  `;
  const NO_VGL_ARGS = [wahl_id, stimmkreis_id];

  const novgl =
    vgl_wahl_id === null ||
    vgl_wahl_id === undefined ||
    wahl_id === vgl_wahl_id;

  const res: {
    partei_id: number;
    partei_name: string;
    vorher: number;
    nachher: number;
  }[] = await adapters.postgres.query(
    novgl ? NO_VGL_QUERY : VGL_QUERY,
    novgl ? NO_VGL_ARGS : VGL_ARGS
  );
  return res.map(resobj => ({
    partei: {
      id: resobj.partei_id,
      name: resobj.partei_name
    },
    vorher: resobj.vorher,
    nachher: resobj.nachher
  }));
}

export async function getDirektmandat(
  wahlid: number,
  stimmkreisid: number
): Promise<Mandat> {
  const direktmandatView: MaterialViews = "gewonnene_direktmandate";
  const res: {
    kandidat_id: number;
    kandidat_name: string;
    partei_id: number;
    partei_name: string;
    stimmkreis_id: number;
    stimmkreis_name: string;
    direktmandat: boolean;
  }[] = await adapters.postgres.query(
    `
    SELECT k.id as kandidat_id, 
          k.name as kandidat_name,
          p.id as partei_id, 
          p.name as partei_name,
          sk.id as stimmkreis_id,
          sk.name as stimmkreis_name
    FROM "${DatabaseSchemaGroup}".${direktmandatView} dm
      JOIN "${DatabaseSchemaGroup}".kandidaten k ON dm.kandidat_id = k.id
      JOIN "${DatabaseSchemaGroup}".parteien p ON k.partei_id = p.id
      JOIN "${DatabaseSchemaGroup}".${STIMMKREIS_TABLE} sk ON sk.id = dm.stimmkreis_id
    WHERE dm.wahl_id = $1 AND dm.stimmkreis_id = $2
  `,
    [wahlid, stimmkreisid]
  );

  return res.map(resobj => ({
    kandidat: {
      id: resobj.kandidat_id,
      name: resobj.kandidat_name,
      partei: {
        id: resobj.partei_id,
        name: resobj.partei_name
      }
    },
    direktmandat: true
  }))[0];
}

/**
 * Computes election results by refreshing materialized views
 */
export async function computeElectionResults(): Promise<boolean> {
  console.time("compute-election-results");
  const query = refreshOrder
    .map(
      viewToRefresh =>
        `REFRESH MATERIALIZED VIEW "${DatabaseSchemaGroup}".${viewToRefresh};`
    )
    .join("\n");

  await adapters.postgres.query(query);
  console.timeEnd("compute-election-results");
  return true;
}

enum EWinnerPartyViews {
  SIEGER_ERSTSTIMMEN = "sieger_erstimmen_pro_stimmkreis",
  SIEGER_ZWEITSTIMMEN = "sieger_zweitstimmen_pro_stimmkreis"
}

export async function computeWinnerParties(
  wahlid: number,
  erststimmen: boolean
): Promise<StimmkreisWinner[]> {
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
        JOIN "${DatabaseSchemaGroup}".${PARTEIEN_TABLE} p on seps.partei_id = p.id
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
      name: skwinner.partei_name
    },
    anzahl: skwinner.anzahl
  }));
}

export async function getMandate(wahlid: number): Promise<Mandat[]> {
  const res: {
    kandidat_id: number;
    kandidat_name: string;
    stimmkreis_id?: number;
    stimmkreis_name?: string;
    partei_id: number;
    partei_name: string;
    direktmandat: boolean;
  }[] = await adapters.postgres.query(
    `
    SELECT m.* 
    FROM (
      SELECT k.id as kandidat_id, 
            k.name as kandidat_name,
            sk.id as stimmkreis_id,
            sk.name as stimmkreis_name,
            p.id as partei_id, 
            p.name as partei_name,
            true as direktmandat
      FROM "${DatabaseSchemaGroup}".${GEWONNENE_DIREKTMANDATE_MVIEW} dm
        JOIN "${DatabaseSchemaGroup}".${KANDIDATEN_TABLE} k ON dm.kandidat_id = k.id
        JOIN "${DatabaseSchemaGroup}".${PARTEIEN_TABLE} p ON k.partei_id = p.id
        JOIN "${DatabaseSchemaGroup}".${STIMMKREIS_TABLE} sk ON sk.id = dm.stimmkreis_id
      WHERE dm.wahl_id = $1
      UNION
      SELECT k.id as kandidat_id, 
            k.name as kandidat_name,
            null as stimmkreis_id,
            null as stimmkreis_name,
            p.id as partei_id, 
            p.name as partei_name,
            false as direktmandat
      FROM "${DatabaseSchemaGroup}".${GEWONNENE_LISTENMANDATE_MVIEW} lm
        JOIN "${DatabaseSchemaGroup}".${KANDIDATEN_TABLE} k ON lm.kandidat_id = k.id
        JOIN "${DatabaseSchemaGroup}".${PARTEIEN_TABLE} p ON k.partei_id = p.id
      WHERE lm.wahl_id = $1
    ) m
    ORDER BY m.direktmandat DESC, m.kandidat_id
  `,
    [wahlid]
  );

  return res.map(resobj => ({
    stimmkreis: {
      id: resobj.stimmkreis_id,
      name: resobj.stimmkreis_name
    },
    kandidat: {
      id: resobj.kandidat_id,
      name: resobj.kandidat_name,
      partei: {
        id: resobj.partei_id,
        name: resobj.partei_name
      }
    },
    direktmandat: resobj.direktmandat
  }));
}

export async function getUeberhangmandate(
  wahlid: number
): Promise<UeberhangMandat[]> {
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
      FROM "${DatabaseSchemaGroup}".${GEWONNENE_DIREKTMANDATE_MVIEW} gd
        JOIN "${DatabaseSchemaGroup}".${KANDIDATEN_TABLE} k ON k.id = gd.kandidat_id
        JOIN "${DatabaseSchemaGroup}".${STIMMKREIS_TABLE} sk ON sk.id = gd.stimmkreis_id
      WHERE gd.wahl_id = $1
      GROUP BY sk.regierungsbezirk_id, k.partei_id
    ), anzahlGewonneneListenmandate (regierungsbezirk_id, partei_id, anzahl) AS (
      SELECT gl.regierungsbezirk_id, k.partei_id, count(*) as anzahl
      FROM "${DatabaseSchemaGroup}".${GEWONNENE_LISTENMANDATE_MVIEW} gl
        JOIN "${DatabaseSchemaGroup}".${KANDIDATEN_TABLE} k ON k.id = gl.kandidat_id
      WHERE gl.wahl_id = $1
      GROUP BY gl.regierungsbezirk_id, k.partei_id
    )
    SELECT COALESCE(agd.regierungsbezirk_id, agl.regierungsbezirk_id) as regierungsbezirk_id,
           rb.name as regierungsbezirk_name,
           COALESCE(agd.partei_id, agl.partei_id) as partei_id,
           p.name as partei_name,
           CASE WHEN COALESCE(agd.anzahl, 0) > zm.anzahl THEN COALESCE(agd.anzahl, 0) - zm.anzahl ELSE 0 END as ueberhang,
           COALESCE(agd.anzahl,0) + COALESCE(agl.anzahl,0) - zm.anzahl - (
               CASE WHEN COALESCE(agd.anzahl, 0) > zm.anzahl THEN COALESCE(agd.anzahl, 0) - zm.anzahl ELSE 0 END
               ) as ausgleich,
           zm.anzahl as zustehend
    FROM anzahlGewonneneDirektmandate agd
        FULL OUTER JOIN anzahlGewonneneListenmandate agl
          ON agd.regierungsbezirk_id = agl.regierungsbezirk_id
            AND agd.partei_id = agl.partei_id
        JOIN "landtagswahlen".zustehende_mandate(0) zm
          ON zm.regierungsbezirk_id = COALESCE(agd.regierungsbezirk_id, agl.regierungsbezirk_id)
            AND zm.partei_id = COALESCE(agd.partei_id, agl.partei_id)
            AND zm.wahl_id = $1
        JOIN "${DatabaseSchemaGroup}".${REGIERUNGSBEZIRKE_TABLE} rb
          ON rb.id = COALESCE(agd.regierungsbezirk_id, agl.regierungsbezirk_id)
        JOIN "${DatabaseSchemaGroup}".${PARTEIEN_TABLE} p
          ON p.id = COALESCE(agd.partei_id, agl.partei_id);
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
      name: row.partei_name
    },
    ueberhang: row.ueberhang,
    ausgleich: row.ausgleich,
    zustehend: row.zustehend
  }));
}

export async function getKnappsteKandidaten(
  wahlid: number,
  amountPerPartei: number = 10
): Promise<KnapperKandidat[]> {
  const res: {
    wahl_id: number;
    wahldatum: Date;
    stimmkreis_id: number;
    stimmkreis_name: string;
    kandidat_id: number;
    kandidat_name: string;
    partei_id: number;
    partei_name: string;
    differenz: number;
    gewinner: boolean;
    platz: number;
  }[] = await adapters.postgres.query(
    `
    SELECT w.id as wahl_id,
           w.wahldatum as wahldatum,
           sk.id as stimmkreis_id,
           sk.name as stimmkreis_name,
           k.id as kandidat_id,
           k.name as kandidat_name,
           p.id as partei_id,
           p.name as partei_name,
           differenz,
           gewinner,
           platz
    FROM "${DatabaseSchemaGroup}".${KNAPPSTE_KANDIDATEN_MVIEW} l
      JOIN "${DatabaseSchemaGroup}".${WAHLEN_TABLE} w
        ON l.wahl_id = w.id
      JOIN "${DatabaseSchemaGroup}".${STIMMKREIS_TABLE} sk
        ON l.stimmkreis_id = sk.id
      JOIN "${DatabaseSchemaGroup}".${KANDIDATEN_TABLE} k
        ON l.kandidat_id = k.id
      JOIN "${DatabaseSchemaGroup}".${PARTEIEN_TABLE} p
        ON l.partei_id = p.id
    WHERE wahl_id = $1 AND platz <= $2
  `,
    [wahlid, amountPerPartei]
  );

  return res.map(row => ({
    wahl: {
      id: row.wahl_id,
      wahldatum: row.wahldatum
    },
    stimmkreis: {
      id: row.stimmkreis_id,
      name: row.stimmkreis_name
    },
    kandidat: {
      id: row.kandidat_id,
      name: row.kandidat_name,
      partei: {
        id: row.partei_id,
        name: row.partei_name
      }
    },
    differenz: row.differenz,
    gewinner: row.gewinner,
    platz: row.platz
  }));
}
