import { Layout as GridLayout } from "react-grid-layout";

export enum WidgetType {
  PLACEHOLDER = "Platzhalter",
  SITZVERTEILUNG_PIECHART = "Sitzverteilung (Q1) - Torte",
  SITZVERTEILUNG_TABLE = "Sitzverteilung (Q1) - Tabelle",
  MANDAT_LISTE = "Mandatliste (Q2)",
  STIMMKREIS_INFO_WAHLBETEILIGUNG = "Stimmkreisinfo (Q3)",
  GEWINNER_STIMMKREISE = "Stimmkreisgewinner (Q4)",
  UEBERHANGMANDATE = "Überhangmandate (Q5)",
  KNAPPSTE_KANDIDATEN = "Knappste Kandidaten (Q6)",
  STIMMKREIS_INFO_Q7 = "Stimmkreisinfos (Q7)",
  ALTERSVERTEILUNG = "Altersverteilung im Landtag (Q8)",
  SUPER_DIREKTKANDIDATEN = "Super-Direktkandidaten (Q9)"
}

export type StatistikWidgetSetting = {
  layout: GridLayout;
  type: WidgetType;
  // Arbitrary widget state
  routableState?: any;
};
