import { adapters } from "../../adapterUtil";
import {
  DatabaseSchemaGroup,
  IDatabaseStimmkreisWinner,
  IDatabaseWahlbeteiligung
} from "../../../databaseEntities";
import {
  IMandat,
  IStimmkreisWinner,
  IUeberhangMandat,
  IKnapperKandidat,
  IWahlbeteiligung,
  IAnteil,
  IStimmenEntwicklung
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

const KANDIDATENGEBUNDENE_GUELTIGE_STIMMEN_MVIEW: MaterialViews =
  "kandidatgebundene_gueltige_stimmen";
const GEWONNENE_DIREKTMANDATE_MVIEW: MaterialViews = "gewonnene_direktmandate";
const GEWONNENE_LISTENMANDATE_MVIEW: MaterialViews = "gewonnene_listenmandate";

type Tables =
  | "parteien"
  | "wahlen"
  | "stimmkreise"
  | "kandidaten"
  | "regierungsbezirke"
  | "direktkandidaten";

const PARTEIEN_TABLE: Tables = "parteien";
const WAHLEN_TABLE: Tables = "wahlen";
const STIMMKREIS_TABLE: Tables = "stimmkreise";
const KANDIDATEN_TABLE: Tables = "kandidaten";
const REGIERUNGSBEZIRKE_TABLE: Tables = "regierungsbezirke";
const DIREKTKANDIDATEN_TABLE: Tables = "direktkandidaten";

type Views = "gesamtstimmen_pro_partei";

const GESAMTSTIMMEN_PRO_PARTEI_VIEW: Views = "gesamtstimmen_pro_partei";

const refreshOrder: MaterialViews[] = [
  "kandidatgebundene_gueltige_stimmen",
  "listengebundene_gueltige_stimmen",
  "ungueltige_erststimmen",
  "ungueltige_zweitstimmen",
  "finaleliste",
  "gewonnene_direktmandate",
  "gewonnene_listenmandate"
];

export async function computeWahlbeteiligung(
  wahlid: number,
  einzel: boolean
): Promise<IWahlbeteiligung[]> {
  if (einzel) {
    const res: {
      wahl_id: number;
      wahldatum: Date;
      stimmkreis_id: number;
      stimmkreis_name: string;
      wahlbeteiligung: number;
    }[] = await adapters.postgres.query(
      `
      WITH gueltige_erststimmen_pro_stimmkreis AS(
          SELECT kgs.wahl_id, kgs.stimmkreis_id, count(kgs.*) as anzahl
          FROM "${DatabaseSchemaGroup}".direktkandidaten dk, "${DatabaseSchemaGroup}".einzel_gueltige_kandidatgebundene_stimmen kgs
          WHERE dk.wahl_id = $1 AND dk.wahl_id = kgs.wahl_id AND dk.stimmkreis_id = kgs.stimmkreis_id AND dk.direktkandidat_id = kgs.kandidat_id
          GROUP BY  kgs.wahl_id, kgs.stimmkreis_id
          ORDER BY kgs.wahl_id, kgs.stimmkreis_id
      ), gesamtzahl_ungueltige_erststimmen_pro_stimmkreis AS(
          SELECT wahl_id, stimmkreis_id, count(*) as anzahl
          FROM "${DatabaseSchemaGroup}".einzel_ungueltige_erststimmen
          WHERE wahl_id = $1
          GROUP BY wahl_id, stimmkreis_id
      ), gesamtanzahl_erststimmen_pro_stimmkreis AS(
          SELECT geps.wahl_id, geps.stimmkreis_id, (geps.anzahl + ue.anzahl) as anzahl
          FROM gueltige_erststimmen_pro_stimmkreis geps, gesamtzahl_ungueltige_erststimmen_pro_stimmkreis ue
          WHERE geps.wahl_id = ue.wahl_id AND geps.stimmkreis_id = ue.stimmkreis_id
      ), wahlbeteiligung (wahl_id, wahldatum, stimmkreis_id, stimmkreis_name, wahlbeteiligung) AS (
        SELECT w.id as wahl_id,
               w.wahldatum as wahldatum,
               sk.id as stimmkreis_id,
               sk.name as stimmkreis_name,
               geps2.stimmkreis_id, 
               (geps2.anzahl / swi.anzahlwahlberechtigte) * 100 as wahlbeteiligung
        FROM "${DatabaseSchemaGroup}".stimmkreis_wahlinfo swi
          JOIN gesamtanzahl_erststimmen_pro_stimmkreis geps2
            ON swi.wahl_id = geps2.wahl_id AND swi.stimmkreis_id = geps2.stimmkreis_id
          JOIN "${DatabaseSchemaGroup}".${WAHLEN_TABLE} w
            ON w.id = swi.wahl_id
          JOIN "${DatabaseSchemaGroup}".${STIMMKREIS_TABLE} sk
            ON sk.id = swi.stimmkreis_id
      )
      SELECT * 
      FROM wahlbeteiligung
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
  } else {
    const res: {
      wahl_id: number;
      wahldatum: Date;
      stimmkreis_id: number;
      stimmkreis_name: string;
      wahlbeteiligung: number;
    }[] = await adapters.postgres.query(
      `
      with gueltige_erststimmen_pro_stimmkreis AS(
        SELECT kgs.wahl_id, kgs.stimmkreis_id, sum(kgs.anzahl) as anzahl
        FROM "${DatabaseSchemaGroup}".direktkandidaten dk, "${DatabaseSchemaGroup}".kandidatgebundene_gueltige_stimmen kgs
        WHERE dk.wahl_id = $1 AND dk.wahl_id = kgs.wahl_id AND dk.stimmkreis_id = kgs.stimmkreis_id AND dk.direktkandidat_id = kgs.kandidat_id
        GROUP BY  kgs.wahl_id, kgs.stimmkreis_id
        ORDER BY kgs.wahl_id, kgs.stimmkreis_id
      ),  
      gesamtanzahl_erststimmen_pro_stimmkreis AS(
        SELECT geps.wahl_id, geps.stimmkreis_id, (geps.anzahl + ue.anzahl) as anzahl
        FROM gueltige_erststimmen_pro_stimmkreis geps, "${DatabaseSchemaGroup}".ungueltige_erststimmen ue
        WHERE geps.wahl_id = $1 AND geps.wahl_id = ue.wahl_id AND geps.stimmkreis_id = ue.stimmkreis_id
      ), 
      gueltige_kandidat_zweitstimmen_pro_stimmkreis AS(
        SELECT kgs.wahl_id, kgs.stimmkreis_id, sum(kgs.anzahl) as anzahl
        FROM "${DatabaseSchemaGroup}".kandidatgebundene_gueltige_stimmen kgs
        WHERE kgs.wahl_id = $1 AND not exists(SELECT * FROM "${DatabaseSchemaGroup}".direktkandidaten dk WHERE kgs.kandidat_id = dk.direktkandidat_id AND dk.wahl_id = kgs.wahl_id AND dk.stimmkreis_id = kgs.stimmkreis_id)
        GROUP BY kgs.wahl_id, kgs.stimmkreis_id
      ),
      listengebundene_stimmen_pro_stimmkreis AS (
        SELECT wahl_id, stimmkreis_id, sum(anzahl) as anzahl
        FROM "${DatabaseSchemaGroup}".listengebundene_gueltige_stimmen
        WHERE wahl_id = $1
        GROUP BY wahl_id, stimmkreis_id
      ),
      gueltige_zweitstimmen_pro_stimmkreis AS(
        SELECT lgs.wahl_id, lgs.stimmkreis_id, (lgs.anzahl + gkz.anzahl) as anzahl
        FROM listengebundene_stimmen_pro_stimmkreis lgs, gueltige_kandidat_zweitstimmen_pro_stimmkreis gkz
        WHERE lgs.wahl_id = gkz.wahl_id AND lgs.stimmkreis_id = gkz.stimmkreis_id
      ), gesamtzahl_zweitstimmen_pro_stimmkreis AS (
        SELECT gzps.wahl_id, gzps.stimmkreis_id, (gzps.anzahl + uz.anzahl) as anzahl
        FROM gueltige_zweitstimmen_pro_stimmkreis gzps, "${DatabaseSchemaGroup}".ungueltige_zweitstimmen uz
        WHERE gzps.wahl_id = uz.wahl_id AND gzps.stimmkreis_id = uz.stimmkreis_id
      ),
      gesamt_stimmen_pro_stimmkreis AS(
        SELECT wahl_id, stimmkreis_id, max(anzahl) as anzahl
        FROM (SELECT *
              FROM gesamtanzahl_erststimmen_pro_stimmkreis
              UNION ALL
              SELECT *
              FROM gesamtzahl_zweitstimmen_pro_stimmkreis
              ) as "sz"
          GROUP BY sz.wahl_id, sz.stimmkreis_id
      ),
      wahlbeteiligung AS(
          SELECT w.id as wahl_id,
                 w.wahldatum as wahldatum,
                 sk.id as stimmkreis_id,
                 sk.name as stimmkreis_name,
                 geps2.stimmkreis_id, 
                 (geps2.anzahl / swi.anzahlwahlberechtigte) * 100 as wahlbeteiligung
          FROM "${DatabaseSchemaGroup}".stimmkreis_wahlinfo swi
          JOIN gesamtanzahl_erststimmen_pro_stimmkreis geps2
            ON swi.wahl_id = geps2.wahl_id AND swi.stimmkreis_id = geps2.stimmkreis_id
          JOIN "${DatabaseSchemaGroup}".${WAHLEN_TABLE} w
            ON w.id = swi.wahl_id
          JOIN "${DatabaseSchemaGroup}".${STIMMKREIS_TABLE} sk
            ON sk.id = swi.stimmkreis_id
      )
      SELECT * 
      FROM wahlbeteiligung 
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
}

export async function computeEntwicklungDerStimmmen(
  wahl_id: number,
  wahl_davor_id: number,
  stimmkreis_id: number
): Promise<IStimmenEntwicklung[]> {
  const res: {
    partei_id: number;
    partei_name: string;
    veraenderung: number;
  }[] = await adapters.postgres.query(
    `with kandidatgebundene_stimmen_pro_partei_pro_stimmkreis  AS (
      SELECT kgs.wahl_id, kgs.stimmkreis_id, k.partei_id, sum(kgs.anzahl) as anzahl
      FROM "${DatabaseSchemaGroup}".kandidatgebundene_gueltige_stimmen kgs
        JOIN "${DatabaseSchemaGroup}".kandidaten k ON k.id = kgs.kandidat_id
      WHERE kgs.stimmkreis_id = $3
      GROUP BY kgs.wahl_id, kgs.stimmkreis_id, kgs.wahl_id, k.partei_id, k.partei_id
    ),
    -- Summe von kandidatengebundenen und listengebundenen stimmen pro partei
    gesamtstimmen_pro_partei_pro_stimmkreis AS (
      SELECT kggs.wahl_id, kggs.stimmkreis_id, kggs.partei_id, (kggs.anzahl + lgs.anzahl) as anzahl
      FROM kandidatgebundene_stimmen_pro_partei_pro_stimmkreis kggs
        JOIN "${DatabaseSchemaGroup}".listengebundene_gueltige_stimmen lgs
          ON lgs.stimmkreis_id = kggs.stimmkreis_id AND lgs.partei_id = kggs.partei_id AND
            lgs.wahl_id = kggs.wahl_id
    ),
    gesamtstimmen_pro_partei AS(
      SELECT gppps2.wahl_id, gppps2.partei_id, sum(gppps2.anzahl) as anzahl
      FROM gesamtstimmen_pro_partei_pro_stimmkreis gppps2
      GROUP BY gppps2.wahl_id, gppps2.partei_id
  ),
       --koennen da negative werte zurueck gegeben werden? man muss noch die korrekten wahl ids angeben!!!#########################
       entwicklung_der_gesamtstimmen AS(
           SELECT gpp1.partei_id, (gpp1.anzahl - gpp2.anzahl) as veraenderung
           FROM gesamtstimmen_pro_partei  gpp1
           JOIN gesamtstimmen_pro_partei gpp2
           ON gpp1.partei_id = gpp2.partei_id AND gpp1.wahl_id = $2 AND gpp2.wahl_id = $1
       )
       SELECT edg.partei_id,  p.name, edg.veraenderung FROM entwicklung_der_gesamtstimmen edg, "${DatabaseSchemaGroup}".parteien p
       WHERE p.id = edg.partei_id;`,
    [wahl_id, wahl_davor_id, stimmkreis_id]
  );
  return res.map(resobj => ({
    partei_id: resobj.partei_id,
    partei_name: resobj.partei_name,
    veraenderung: resobj.veraenderung
  }));
}

export async function getDirektmandat(
  wahlid: number,
  stimmkreisid: number
): Promise<IMandat> {
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
    stimmkreis: {
      id: resobj.stimmkreis_id,
      name: resobj.stimmkreis_name
    },
    kandidat: {
      id: resobj.kandidat_id,
      name: resobj.kandidat_name,
      partei: {
        id: resobj.partei_id,
        name: resobj.partei_name as EParteiName
      }
    },
    direktmandat: true
  }))[0];
}

export async function computeAbsolutenAnteil(
  wahl_id: number,
  stimmkreis_id: number,
  einzel: boolean
): Promise<IAnteil[]> {
  if (einzel) {
    const res: {
      wahl_id: number;
      stimmkreis_id: number;
      partei_id: number;
      partei_name: string;
      anteil: number;
    }[] = await adapters.postgres.query(
      `with listengebundene_gueltige_stimmen AS (
      SELECT lgs.wahl_id, lgs.stimmkreis_id, lgs.partei_id, sum(anzahl) as anzahl
      FROM (
               (
                   SELECT egls.wahl_id, egls.stimmkreis_id, egls.partei_id, count(*) as anzahl
                   FROM "${DatabaseSchemaGroup}".einzel_gueltige_listengebundene_stimmen egls
                   WHERE egls.stimmkreis_id = $2 AND egls.wahl_id = $1
                   GROUP BY egls.stimmkreis_id, egls.wahl_id, egls.partei_id
               )
               UNION ALL
               (
                   SELECT agls.wahl_id, agls.stimmkreis_id, agls.partei_id, agls.anzahl
                   FROM "${DatabaseSchemaGroup}".aggregiert_gueltige_listengebundene_stimmen agls
                   WHERE agls.stimmkreis_id = $2 AND agls.wahl_id = $1
               )
           ) lgs
      GROUP BY lgs.wahl_id, lgs.stimmkreis_id, lgs.partei_id
  ), kandidatgebundene_gueltige_stimmen AS(
  SELECT kgs.wahl_id, kgs.stimmkreis_id, kgs.kandidat_id, sum(anzahl) as anzahl
    FROM (
      (
        SELECT egks.wahl_id, egks.stimmkreis_id, egks.kandidat_id, count(*) as anzahl
        FROM "${DatabaseSchemaGroup}".einzel_gueltige_kandidatgebundene_stimmen egks
        WHERE egks.stimmkreis_id = $2 AND egks.wahl_id = $1
        GROUP BY egks.stimmkreis_id, egks.wahl_id, egks.kandidat_id
      )
      UNION ALL
      (
        SELECT agks.wahl_id, agks.stimmkreis_id, agks.kandidat_id, agks.anzahl
        FROM "${DatabaseSchemaGroup}".aggregiert_gueltige_kandidatgebundene_stimmen agks
          WHERE agks.stimmkreis_id = $2 AND agks.wahl_id = $1
      )
    ) kgs
    GROUP BY kgs.wahl_id, kgs.stimmkreis_id, kgs.kandidat_id
  
  ),
  
  kandidatgebundene_stimmen_pro_partei_pro_stimmkreis  AS (
    SELECT kgs.wahl_id, kgs.stimmkreis_id, k.partei_id, sum(kgs.anzahl) as anzahl
    FROM kandidatgebundene_gueltige_stimmen kgs
      JOIN "${DatabaseSchemaGroup}".kandidaten k ON k.id = kgs.kandidat_id
    WHERE kgs.stimmkreis_id = $2
    GROUP BY kgs.wahl_id, kgs.stimmkreis_id, kgs.wahl_id, k.partei_id, k.partei_id
  ),
  -- Summe von kandidatengebundenen und listengebundenen stimmen pro partei
  gesamtstimmen_pro_partei_pro_stimmkreis AS (
    SELECT kggs.wahl_id, kggs.stimmkreis_id, kggs.partei_id, (kggs.anzahl + lgs.anzahl) as anzahl
    FROM kandidatgebundene_stimmen_pro_partei_pro_stimmkreis kggs
      JOIN listengebundene_gueltige_stimmen lgs
        ON lgs.stimmkreis_id = kggs.stimmkreis_id AND lgs.partei_id = kggs.partei_id AND
          lgs.wahl_id = kggs.wahl_id
  )`,
      [wahl_id, stimmkreis_id]
    );
    return res.map(resobj => ({
      wahl_id: resobj.wahl_id,
      stimmkreis_id: resobj.stimmkreis_id,
      partei_id: resobj.partei_id,
      partei_name: resobj.partei_name,
      anteil: resobj.anteil
    }));
  } else {
    const res: {
      wahl_id: number;
      stimmkreis_id: number;
      partei_id: number;
      partei_name: string;
      anteil: number;
    }[] = await adapters.postgres.query(
      `with kandidatgebundene_stimmen_pro_partei_pro_stimmkreis  AS (
        SELECT kgs.wahl_id, kgs.stimmkreis_id, k.partei_id, sum(kgs.anzahl) as anzahl
        FROM "${DatabaseSchemaGroup}".kandidatgebundene_gueltige_stimmen kgs
          JOIN "${DatabaseSchemaGroup}".kandidaten k ON k.id = kgs.kandidat_id
        WHERE kgs.stimmkreis_id = $2 AND kgs.wahl_id = $1
        GROUP BY kgs.wahl_id, kgs.stimmkreis_id, kgs.wahl_id, k.partei_id, k.partei_id
      ),
      -- Summe von kandidatengebundenen und listengebundenen stimmen pro partei
      gesamtstimmen_pro_partei_pro_stimmkreis AS (
        SELECT kggs.wahl_id, kggs.stimmkreis_id, kggs.partei_id, (kggs.anzahl + lgs.anzahl) as anzahl
        FROM kandidatgebundene_stimmen_pro_partei_pro_stimmkreis kggs
          JOIN "${DatabaseSchemaGroup}".listengebundene_gueltige_stimmen lgs
            ON lgs.stimmkreis_id = kggs.stimmkreis_id AND lgs.partei_id = kggs.partei_id AND
              lgs.wahl_id = kggs.wahl_id
      ), SELECT * FROM gesamtstimmen_pro_partei_pro_stimmkreis`,
      [wahl_id, stimmkreis_id]
    );
    return res.map(resobj => ({
      wahl_id: resobj.wahl_id,
      stimmkreis_id: resobj.stimmkreis_id,
      partei_id: resobj.partei_id,
      partei_name: resobj.partei_name,
      anteil: resobj.anteil
    }));
  }
}

export async function computeProzentualenAnteil(
  wahl_id: number,
  stimmkreis_id: number,
  einzel: boolean
): Promise<IAnteil[]> {
  if (einzel) {
    const res: {
      wahl_id: number;
      stimmkreis_id: number;
      partei_id: number;
      partei_name: string;
      anteil: number;
    }[] = await adapters.postgres.query(
      `with listengebundene_gueltige_stimmen AS (
      SELECT lgs.wahl_id, lgs.stimmkreis_id, lgs.partei_id, sum(anzahl) as anzahl
      FROM (
               (
                   SELECT egls.wahl_id, egls.stimmkreis_id, egls.partei_id, count(*) as anzahl
                   FROM "${DatabaseSchemaGroup}".einzel_gueltige_listengebundene_stimmen egls
                   WHERE egls.stimmkreis_id = $2 AND egls.wahl_id = $1
                   GROUP BY egls.stimmkreis_id, egls.wahl_id, egls.partei_id
               )
               UNION ALL
               (
                   SELECT agls.wahl_id, agls.stimmkreis_id, agls.partei_id, agls.anzahl
                   FROM "${DatabaseSchemaGroup}".aggregiert_gueltige_listengebundene_stimmen agls
                   WHERE agls.stimmkreis_id = $2 AND agls.wahl_id = $1
               )
           ) lgs
      GROUP BY lgs.wahl_id, lgs.stimmkreis_id, lgs.partei_id
  ), kandidatgebundene_gueltige_stimmen AS(
  SELECT kgs.wahl_id, kgs.stimmkreis_id, kgs.kandidat_id, sum(anzahl) as anzahl
    FROM (
      (
        SELECT egks.wahl_id, egks.stimmkreis_id, egks.kandidat_id, count(*) as anzahl
        FROM "${DatabaseSchemaGroup}".einzel_gueltige_kandidatgebundene_stimmen egks
        WHERE egks.stimmkreis_id = $2 AND egks.wahl_id = $1
        GROUP BY egks.stimmkreis_id, egks.wahl_id, egks.kandidat_id
      )
      UNION ALL
      (
        SELECT agks.wahl_id, agks.stimmkreis_id, agks.kandidat_id, agks.anzahl
        FROM "${DatabaseSchemaGroup}".aggregiert_gueltige_kandidatgebundene_stimmen agks
          WHERE agks.stimmkreis_id = $2 AND agks.wahl_id = $1
      )
    ) kgs
    GROUP BY kgs.wahl_id, kgs.stimmkreis_id, kgs.kandidat_id
  
  ),
  kandidatgebundene_stimmen_pro_partei_pro_stimmkreis  AS (
    SELECT kgs.wahl_id, kgs.stimmkreis_id, k.partei_id, sum(kgs.anzahl) as anzahl
    FROM kandidatgebundene_gueltige_stimmen kgs
      JOIN "${DatabaseSchemaGroup}".kandidaten k ON k.id = kgs.kandidat_id
    WHERE kgs.stimmkreis_id = $2
    GROUP BY kgs.wahl_id, kgs.stimmkreis_id, kgs.wahl_id, k.partei_id, k.partei_id
  ),
  -- Summe von kandidatengebundenen und listengebundenen stimmen pro partei
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
  ) SELECT gppps.wahl_id, gppps.stimmkreis_id, gppps.partei_id, p.name, (gppps.anzahl/gps.gesamtanzahlstimmen) *100 as prozentualerAnteil
  FROM gesamtstimmen_pro_stimmkreis gps
      JOIN gesamtstimmen_pro_partei_pro_stimmkreis gppps
          ON  gps.wahl_id = gppps.wahl_id AND gps.stimmkreis_id = gppps.stimmkreis_id
      JOIN "${DatabaseSchemaGroup}".parteien p
          ON p.id = gppps.partei_id
  ORDER BY gppps.wahl_id, gppps.stimmkreis_id, gppps.partei_id;`,
      [wahl_id, stimmkreis_id]
    );

    return res.map(resobj => ({
      wahl_id: resobj.wahl_id,
      stimmkreis_id: resobj.stimmkreis_id,
      partei_id: resobj.partei_id,
      partei_name: resobj.partei_name,
      anteil: resobj.anteil
    }));
  } else {
    const res: {
      wahl_id: number;
      stimmkreis_id: number;
      partei_id: number;
      partei_name: string;
      anteil: number;
    }[] = await adapters.postgres.query(
      `with kandidatgebundene_stimmen_pro_partei_pro_stimmkreis  AS (
      SELECT kgs.wahl_id, kgs.stimmkreis_id, k.partei_id, sum(kgs.anzahl) as anzahl
      FROM "${DatabaseSchemaGroup}".kandidatgebundene_gueltige_stimmen kgs
        JOIN "${DatabaseSchemaGroup}".kandidaten k ON k.id = kgs.kandidat_id
        WHERE kgs.wahl_id = $1 AND kgs.stimmkreis_id = $2
      GROUP BY kgs.wahl_id, kgs.stimmkreis_id, kgs.wahl_id, k.partei_id, k.partei_id
    ),
    -- Summe von kandidatengebundenen und listengebundenen stimmen pro partei
    gesamtstimmen_pro_partei_pro_stimmkreis AS (
      SELECT kggs.wahl_id, kggs.stimmkreis_id, kggs.partei_id, (kggs.anzahl + lgs.anzahl) as anzahl
      FROM kandidatgebundene_stimmen_pro_partei_pro_stimmkreis kggs
        JOIN "${DatabaseSchemaGroup}".listengebundene_gueltige_stimmen lgs
          ON lgs.stimmkreis_id = kggs.stimmkreis_id AND lgs.partei_id = kggs.partei_id AND
            lgs.wahl_id = kggs.wahl_id
    ),
    gesamtstimmen_pro_stimmkreis AS(
      SELECT wahl_id, stimmkreis_id, sum(anzahl) as gesamtanzahlstimmen
      FROM gesamtstimmen_pro_partei_pro_stimmkreis
      GROUP BY wahl_id, stimmkreis_id
    ),
    SELECT gppps.wahl_id, gppps.stimmkreis_id, gppps.partei_id, p.name, (gppps.anzahl/gps.gesamtanzahlstimmen) *100 as prozentualerAnteil
    FROM gesamtstimmen_pro_stimmkreis gps
        JOIN gesamtstimmen_pro_partei_pro_stimmkreis gppps
            ON  gps.wahl_id = gppps.wahl_id AND gps.stimmkreis_id = gppps.stimmkreis_id
        JOIN "${DatabaseSchemaGroup}".parteien p
            ON p.id = gppps.partei_id
    ORDER BY gppps.wahl_id, gppps.stimmkreis_id, gppps.partei_id;`,
      [wahl_id, stimmkreis_id]
    );

    return res.map(resobj => ({
      wahl_id: resobj.wahl_id,
      stimmkreis_id: resobj.stimmkreis_id,
      partei_id: resobj.partei_id,
      partei_name: resobj.partei_name,
      anteil: resobj.anteil
    }));
  }
}

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
      name: skwinner.partei_name as EParteiName
    },
    anzahl: skwinner.anzahl
  }));
}

export async function getMandate(wahlid: number): Promise<IMandat[]> {
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
        name: resobj.partei_name as EParteiName
      }
    },
    direktmandat: resobj.direktmandat
  }));
}

export async function getUeberhangmandate(
  wahlid: number
): Promise<IUeberhangMandat[]> {
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
        JOIN zustehende_mandate(0) zm
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
      name: row.partei_name as EParteiName
    },
    ueberhang: row.ueberhang,
    ausgleich: row.ausgleich,
    zustehend: row.zustehend
  }));
}

export async function getKnappsteKandidaten(
  wahlid: number,
  amountPerPartei: number = 10
): Promise<IKnapperKandidat[]> {
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
    WITH gesamtstimmen (wahl_id, anzahl) AS (
      SELECT wahl_id, sum(anzahl)
      FROM "${DatabaseSchemaGroup}".${GESAMTSTIMMEN_PRO_PARTEI_VIEW}
      GROUP BY wahl_id
    ),
    -- Die Parteien, welche nicht gesperrt sind für die Wahl
    nicht_gesperrte_parteien (wahl_id, partei_id) AS (
      SELECT gspp.wahl_id, gspp.partei_id
      FROM (
          SELECT wahl_id, partei_id, sum(anzahl) as anzahl
          FROM "${DatabaseSchemaGroup}".${GESAMTSTIMMEN_PRO_PARTEI_VIEW}
          GROUP BY wahl_id, partei_id
        ) gspp
        JOIN gesamtstimmen gs ON gs.wahl_id = gspp.wahl_id
      WHERE gspp.anzahl / gs.anzahl >= 0.05
    ),
    nicht_gesperrte_direktkandidaten (wahl_id, stimmkreis_id, kandidat_id, stimmanzahl) AS (
      SELECT dk.wahl_id, dk.stimmkreis_id, dk.direktkandidat_id, kgs.anzahl
      FROM "${DatabaseSchemaGroup}".${DIREKTKANDIDATEN_TABLE} dk
        JOIN "${DatabaseSchemaGroup}".${KANDIDATEN_TABLE} k
          ON k.id = dk.direktkandidat_id
        JOIN "${DatabaseSchemaGroup}".${STIMMKREIS_TABLE} sk
            ON sk.id = dk.stimmkreis_id
        JOIN "${DatabaseSchemaGroup}".${KANDIDATENGEBUNDENE_GUELTIGE_STIMMEN_MVIEW} kgs
          ON kgs.kandidat_id = dk.direktkandidat_id
            AND kgs.wahl_id = dk.wahl_id
            AND kgs.stimmkreis_id = dk.stimmkreis_id
        JOIN nicht_gesperrte_parteien ngp
          ON ngp.wahl_id = dk.wahl_id
            AND ngp.partei_id = k.partei_id
    ), knappste_sieger (wahl_id, stimmkreis_id, kandidat_id, abstand) AS (
      SELECT ngd1.wahl_id,
            ngd1.stimmkreis_id,
            ngd1.kandidat_id,
            ngd1.stimmanzahl - ngd2.stimmanzahl as abstand
      FROM nicht_gesperrte_direktkandidaten ngd1
        JOIN nicht_gesperrte_direktkandidaten ngd2
          ON ngd1.wahl_id = ngd2.wahl_id
            AND ngd1.stimmkreis_id = ngd2.stimmkreis_id
            AND ngd2.stimmanzahl < ngd1.stimmanzahl
      WHERE NOT EXISTS (
        SELECT *
        FROM nicht_gesperrte_direktkandidaten ngd3
        WHERE ngd1.wahl_id = ngd3.wahl_id
          AND ngd1.stimmkreis_id = ngd3.stimmkreis_id
          AND ngd1.kandidat_id <> ngd3.kandidat_id
          AND ngd2.stimmanzahl < ngd3.stimmanzahl
      )
    ), verlierer_direktkandidaten_stimmen (wahl_id, stimmkreis_id, kandidat_id, stimmanzahl) AS (
      SELECT dk.wahl_id, kgs.stimmkreis_id, dk.direktkandidat_id, kgs.anzahl
      FROM "${DatabaseSchemaGroup}".${DIREKTKANDIDATEN_TABLE} dk
        JOIN "${DatabaseSchemaGroup}".${KANDIDATENGEBUNDENE_GUELTIGE_STIMMEN_MVIEW} kgs
          ON dk.wahl_id = kgs.wahl_id
            AND dk.stimmkreis_id = kgs.stimmkreis_id
            AND dk.direktkandidat_id = kgs.kandidat_id
        JOIN "${DatabaseSchemaGroup}".${KANDIDATEN_TABLE} k
          ON dk.direktkandidat_id = k.id
      WHERE NOT EXISTS (
        SELECT *
        FROM "${DatabaseSchemaGroup}".${GEWONNENE_DIREKTMANDATE_MVIEW} gd
          JOIN "${DatabaseSchemaGroup}".kandidaten k2
            ON gd.kandidat_id = k2.id
        WHERE dk.wahl_id = gd.wahl_id AND k.partei_id = k2.partei_id
      )
    ), knappste_verlierer (wahl_id, stimmkreis_id, kandidat_id, differenz_zu_sieger) AS (
      SELECT vds1.wahl_id,
            vds1.stimmkreis_id,
            vds1.kandidat_id,
            gd.stimmanzahl - vds1.stimmanzahl as differenz_zu_sieger
      FROM verlierer_direktkandidaten_stimmen vds1
        JOIN "${DatabaseSchemaGroup}".${GEWONNENE_DIREKTMANDATE_MVIEW} gd
          ON vds1.wahl_id = gd.wahl_id
            AND vds1.stimmkreis_id = gd.stimmkreis_id
    ), looser (wahl_id, stimmkreis_id, kandidat_id, differenz) AS (
      SELECT l.*, k.partei_id, row_number() over (
        PARTITION BY  wahl_id, partei_id
        ORDER BY differenz
        ) as platz
      FROM (
        SELECT wahl_id, stimmkreis_id, kandidat_id, abstand as differenz, true as gewinner
        FROM knappste_sieger
        UNION
        SELECT wahl_id, stimmkreis_id, kandidat_id, differenz_zu_sieger as differenz, false as gewinner
        FROM knappste_verlierer
      ) l
        JOIN "${DatabaseSchemaGroup}".${KANDIDATEN_TABLE} k ON k.id = l.kandidat_id
    )
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
    FROM looser l
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
        name: row.partei_name as EParteiName
      }
    },
    differenz: row.differenz,
    gewinner: row.gewinner,
    platz: row.platz
  }));
}
