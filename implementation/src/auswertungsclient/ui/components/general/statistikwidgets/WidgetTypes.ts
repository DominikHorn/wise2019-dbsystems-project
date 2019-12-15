import { Layout as GridLayout } from "react-grid-layout";

export enum WidgetType {
  PLACEHOLDER = "Platzhalter",
  SITZVERTEILUNG_PIECHART = "Sitzverteilung (Q1) - Torte",
  SITZVERTEILUNG_TABLE = "Sitzverteilung (Q1) - Tabelle",
  MANDAT_LISTE = "Mandatliste (Q2)",
  STIMMKREIS_INFO_WAHLBETEILIGUNG = "Stimmkreisinfo (Q3) - Wahlbeteiligung",
  GEWINNER_STIMMKREISE = "Stimmkreisgewinner (Q4)",
  UEBERHANGMANDATE = "Überhangmandate (Q5)",
  KNAPPSTE_KANDIDATEN = "Knappste Kandidaten (Q6)"
}

export type StatistikWidgetSetting = {
  layout: GridLayout;
  type: WidgetType;
  // Arbitrary widget state
  routableState?: any;
};
