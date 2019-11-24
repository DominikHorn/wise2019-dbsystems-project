import { adapters } from "../../adapterUtil";
import { DatabaseSchemaGroup } from "../../../databaseEntities";

type MaterialViews =
  | "kandidatgebundene_gueltige_stimmen"
  | "listengebundene_gueltige_stimmen"
  | "ungueltige_erststimmen"
  | "ungueltige_zweitstimmen"
  | "finaleliste"
  | "gewonnene_direktmandate"
  | "gewonnene_regulaere_listenmandate";

const refreshOrder: MaterialViews[] = [
  "kandidatgebundene_gueltige_stimmen",
  "listengebundene_gueltige_stimmen",
  "ungueltige_erststimmen",
  "ungueltige_zweitstimmen",
  "finaleliste",
  "gewonnene_direktmandate",
  "gewonnene_regulaere_listenmandate"
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
