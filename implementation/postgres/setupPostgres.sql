CREATE SCHEMA IF NOT EXISTS "landtagswahlen" AUTHORIZATION postgres;

CREATE TABLE IF NOT EXISTS "landtagswahlen".parteien (
	id smallint NOT NULL PRIMARY KEY,
	"name" varchar(40) NOT NULL
);

CREATE TABLE IF NOT EXISTS "landtagswahlen".kandidaten (
	id int NOT NULL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	partei_id smallint NOT NULL,
	"name" varchar(200) NOT NULL,
	-- ON DELETE effectively prohibits deleting parties
	FOREIGN KEY (partei_id) REFERENCES "landtagswahlen".parteien(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "landtagswahlen".wahlen (
	id smallint NOT NULL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	wahldatum date NOT NULL
);

CREATE TABLE IF NOT EXISTS "landtagswahlen".regierungsbezirke (
	id smallint NOT NULL PRIMARY KEY, -- Schluessel_Nummer in csv
	"name" varchar(80) NOT NULL
-- Unsupported in PostgreSQL
--	CHECK (id NOT IN (
--		SELECT id
--		FROM stimmkreise
--	))
);

CREATE TABLE IF NOT EXISTS "landtagswahlen".listen (
	kandidat_id int NOT NULL, -- Partei ergibt sich durch Kandidat
	wahl_id smallint NOT NULL,
	regierungsbezirk_id smallint NOT NULL,
	-- Da wir informatiker sind muss man sich hier auf einen standard einigen => Beginn bei 1 zu zählen
	initialerListenplatz smallint CHECK (initialerListenplatz > 0),
	FOREIGN KEY (kandidat_id) REFERENCES "landtagswahlen".kandidaten(id) ON DELETE CASCADE,
	FOREIGN KEY (wahl_id) REFERENCES "landtagswahlen".wahlen(id) ON DELETE CASCADE,
	FOREIGN KEY (regierungsbezirk_id) REFERENCES "landtagswahlen".regierungsbezirke(id) ON DELETE CASCADE,
	-- Regierungsbezirk_id nicht primary key um zu verhindern, dass ein kandidat in mehreren RB auf Liste erscheint
	PRIMARY KEY (kandidat_id, wahl_id)
);

-- Refresh am Ende der LW mit: REFRESH MATERIALIZED VIEW "landtagswahlen".finaleliste;
DROP MATERIALIZED VIEW IF EXISTS "landtagswahlen".finaleliste;
CREATE MATERIALIZED VIEW "landtagswahlen".finaleliste AS (
	-- TODO: definiere query wenn klar wie sich das errechnet
	SELECT *
	FROM "landtagswahlen".listen
);

-- Mangels nicht existierenden Daten werden Stimmbezirke nicht als relation repräsentiert;
-- Somit entfaellt auch die Modelierung von Direktregionen

-- Abbildung "Stimmkreis"-Entität
CREATE TABLE IF NOT EXISTS "landtagswahlen".stimmkreise (
	id smallint NOT NULL PRIMARY KEY, -- Schluessel_Nummer in csv
	"name" varchar(100) NOT NULL,
	regierungsbezirk_id smallint NOT NULL,
	-- TODO: geographische angaben für Kartenfunktion?
	FOREIGN KEY (regierungsbezirk_id) REFERENCES "landtagswahlen".regierungsbezirke(id) ON DELETE CASCADE
-- Unsupported in PostgreSQL
--	CHECK (id NOT IN (
--		SELECT id
--		FROM regierungsbezirke
--	))
);

-- Hier stehen Daten die sich pro wahl ändern können
CREATE TABLE IF NOT EXISTS "landtagswahlen".stimmkreis_wahlinfo (
	stimmkreis_id smallint NOT NULL,
	wahl_id smallint NOT NULL,
	anzahlWahlberechtigte int NOT NULL DEFAULT 0,
	FOREIGN KEY (stimmkreis_id) REFERENCES "landtagswahlen".stimmkreise(id) ON DELETE CASCADE,
	FOREIGN KEY (wahl_id) REFERENCES "landtagswahlen".wahlen(id) ON DELETE CASCADE,
	PRIMARY KEY (stimmkreis_id, wahl_id)
);

CREATE TABLE IF NOT EXISTS "landtagswahlen".direktkandidaten (
	stimmkreis_id smallint NOT NULL,
	wahl_id smallint NOT NULL,
	direktkandidat_id int NOT NULL,
	FOREIGN KEY (stimmkreis_id) REFERENCES "landtagswahlen".stimmkreise(id) ON DELETE CASCADE,
	FOREIGN KEY (wahl_id) REFERENCES "landtagswahlen".wahlen(id) ON DELETE CASCADE,
	FOREIGN KEY (direktkandidat_id) REFERENCES "landtagswahlen".kandidaten(id) ON DELETE CASCADE,
	PRIMARY KEY (stimmkreis_id, wahl_id, direktkandidat_id)
);

CREATE OR REPLACE VIEW "landtagswahlen".direktmandat_anzahl AS (
	SELECT sk.regierungsbezirk_id, dk.wahl_id, count(*)
	FROM (
						SELECT stimmkreis_id, wahl_id
						FROM "landtagswahlen".direktkandidaten
						GROUP BY stimmkreis_id, wahl_id
				) dk
			JOIN "landtagswahlen".stimmkreise sk ON sk.id = dk.stimmkreis_id
	GROUP BY sk.regierungsbezirk_id, dk.wahl_id
);

CREATE TABLE IF NOT EXISTS "landtagswahlen".regierungsbezirk_wahlinfo (
	regierungsbezirk_id smallint NOT NULL,
	wahl_id smallint NOT NULL,
	anzahlListenmandate smallint NOT NULL DEFAULT 0,
	FOREIGN KEY (regierungsbezirk_id) REFERENCES "landtagswahlen".regierungsbezirke(id) ON DELETE CASCADE,
	FOREIGN KEY (wahl_id) REFERENCES "landtagswahlen".wahlen(id) ON DELETE CASCADE,
	PRIMARY KEY (regierungsbezirk_id, wahl_id)
);

-- Berechnung der #Wahlberechtigten pro Regierungsbezirk statt Speicherung
CREATE OR REPLACE VIEW "landtagswahlen".regierungsbezirk_wahlberechtigte AS (
	SELECT rb.id, rb."name", skw.wahl_id, sum(skw.anzahlWahlberechtigte)
	FROM "landtagswahlen".regierungsbezirke rb
		JOIN "landtagswahlen".stimmkreise sk ON sk.regierungsbezirk_id = rb.id
		JOIN "landtagswahlen".stimmkreis_wahlinfo skw ON sk.id = skw.stimmkreis_id
	GROUP BY rb.id, rb."name", skw.wahl_id
);

-- Unterscheidung zwischen erst, zweitstimmen erfolgt über "direktkandidat" relation
-- Wenn ein Kandidat in einem Stimmkreis direktkandidat ist erhält er dort nur Erststimmen
CREATE TABLE IF NOT EXISTS "landtagswahlen".einzel_gueltige_kandidatgebundene_stimmen (
	id bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
	stimmkreis_id smallint NOT NULL,
	wahl_id smallint NOT NULL,
	kandidat_id int NOT NULL,
	FOREIGN KEY (stimmkreis_id) REFERENCES "landtagswahlen".stimmkreise(id) ON DELETE CASCADE,
	FOREIGN KEY (wahl_id) REFERENCES "landtagswahlen".wahlen(id) ON DELETE CASCADE,
	FOREIGN KEY (kandidat_id) REFERENCES "landtagswahlen".kandidaten(id) ON DELETE CASCADE,
	PRIMARY KEY (id, stimmkreis_id, kandidat_id)
);

CREATE TABLE IF NOT EXISTS "landtagswahlen".einzel_gueltige_listengebundene_stimmen (
	id bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
	stimmkreis_id smallint NOT NULL,
	wahl_id smallint NOT NULL,
	partei_id smallint NOT NULL,
	FOREIGN KEY (stimmkreis_id) REFERENCES "landtagswahlen".stimmkreise(id) ON DELETE CASCADE,
	FOREIGN KEY (wahl_id) REFERENCES "landtagswahlen".wahlen(id) ON DELETE CASCADE,
	FOREIGN KEY (partei_id) REFERENCES "landtagswahlen".parteien(id) ON DELETE CASCADE,
	PRIMARY KEY (id, stimmkreis_id, partei_id)
);

CREATE TABLE IF NOT EXISTS "landtagswahlen".einzel_ungueltige_erststimmen (
    id int NOT NULL GENERATED ALWAYS AS IDENTITY,
	wahl_id smallint NOT NULL,
	stimmkreis_id smallint NOT NULL,
	FOREIGN KEY (stimmkreis_id) REFERENCES "landtagswahlen".stimmkreise(id) ON DELETE CASCADE,
	FOREIGN KEY (wahl_id) REFERENCES "landtagswahlen".wahlen(id) ON DELETE CASCADE,
	PRIMARY KEY (id, wahl_id, stimmkreis_id)
);

CREATE TABLE IF NOT EXISTS "landtagswahlen".einzel_ungueltige_zweitstimmen (
    id int NOT NULL GENERATED ALWAYS AS IDENTITY,
	wahl_id smallint NOT NULL,
	stimmkreis_id smallint NOT NULL,
	FOREIGN KEY (stimmkreis_id) REFERENCES "landtagswahlen".stimmkreise(id) ON DELETE CASCADE,
	FOREIGN KEY (wahl_id) REFERENCES "landtagswahlen".wahlen(id) ON DELETE CASCADE,
	PRIMARY KEY (id, wahl_id, stimmkreis_id)
);

CREATE TABLE IF NOT EXISTS "landtagswahlen".aggregiert_gueltige_kandidatgebundene_stimmen (
	stimmkreis_id smallint NOT NULL,
	wahl_id smallint NOT NULL,
	kandidat_id int NOT NULL,
	anzahl int NOT NULL,
	FOREIGN KEY (stimmkreis_id) REFERENCES "landtagswahlen".stimmkreise(id) ON DELETE CASCADE,
	FOREIGN KEY (kandidat_id) REFERENCES "landtagswahlen".kandidaten(id) ON DELETE CASCADE,
	FOREIGN KEY (wahl_id) REFERENCES"landtagswahlen". wahlen(id) ON DELETE CASCADE,
	PRIMARY KEY (stimmkreis_id, kandidat_id, wahl_id)
);

CREATE TABLE IF NOT EXISTS "landtagswahlen".aggregiert_gueltige_listengebundene_stimmen (
	stimmkreis_id smallint NOT NULL,
	wahl_id smallint NOT NULL,
	partei_id smallint NOT NULL,
	anzahl int NOT NULL,
	FOREIGN KEY (stimmkreis_id) REFERENCES "landtagswahlen".stimmkreise(id) ON DELETE CASCADE,
	FOREIGN KEY (wahl_id) REFERENCES "landtagswahlen".wahlen(id) ON DELETE CASCADE,
	FOREIGN KEY (partei_id) REFERENCES "landtagswahlen".parteien(id) ON DELETE CASCADE,
	PRIMARY KEY (stimmkreis_id, wahl_id, partei_id)
);

CREATE TABLE IF NOT EXISTS "landtagswahlen".aggregiert_ungueltige_erststimmen (
	stimmkreis_id smallint NOT NULL,
	wahl_id smallint NOT NULL,
	anzahl int NOT NULL,
	FOREIGN KEY (stimmkreis_id) REFERENCES "landtagswahlen".stimmkreise(id) ON DELETE CASCADE,
	FOREIGN KEY (wahl_id) REFERENCES "landtagswahlen".wahlen(id) ON DELETE CASCADE,
	PRIMARY KEY (stimmkreis_id, wahl_id)
);

CREATE TABLE IF NOT EXISTS "landtagswahlen".aggregiert_ungueltige_zweitstimmen (
	stimmkreis_id smallint NOT NULL,
	wahl_id smallint NOT NULL,
	anzahl int NOT NULL,
	FOREIGN KEY (stimmkreis_id) REFERENCES "landtagswahlen".stimmkreise(id) ON DELETE CASCADE,
	FOREIGN KEY (wahl_id) REFERENCES "landtagswahlen".wahlen(id) ON DELETE CASCADE,
	PRIMARY KEY (stimmkreis_id, wahl_id)
);

CREATE MATERIALIZED VIEW IF NOT EXISTS "landtagswahlen".kandidatgebundene_gueltige_stimmen (stimmkreis_id, wahl_id, kandidat_id, anzahl) AS (
    (
        SELECT egks.stimmkreis_id, egks.wahl_id, egks.kandidat_id, count(*)
        FROM "landtagswahlen".einzel_gueltige_kandidatgebundene_stimmen egks
        GROUP BY egks.stimmkreis_id, egks.wahl_id, egks.kandidat_id
    )
    UNION ALL
    (
        SELECT agks.stimmkreis_id, agks.wahl_id, agks.kandidat_id, agks.anzahl
        FROM "landtagswahlen".aggregiert_gueltige_kandidatgebundene_stimmen agks
    )
);

CREATE MATERIALIZED VIEW IF NOT EXISTS "landtagswahlen".listengebundene_gueltige_stimmen (stimmkreis_id, wahl_id, partei_id, anzahl) AS (
    (
        SELECT egls.stimmkreis_id, egls.wahl_id, egls.partei_id, count(*)
        FROM "landtagswahlen".einzel_gueltige_listengebundene_stimmen egls
        GROUP BY egls.stimmkreis_id, egls.wahl_id, egls.partei_id
    )
    UNION ALL
    (
        SELECT agls.stimmkreis_id, agls.wahl_id, agls.partei_id, agls.anzahl
        FROM "landtagswahlen".aggregiert_gueltige_listengebundene_stimmen agls
    )
);

CREATE MATERIALIZED VIEW IF NOT EXISTS "landtagswahlen".ungueltige_erststimmen AS (
    (
        SELECT eue.stimmkreis_id, eue.wahl_id, count(*)
        FROM "landtagswahlen".einzel_ungueltige_erststimmen eue
        GROUP BY eue.stimmkreis_id, eue.wahl_id
    )
    UNION ALL
   (
       SELECT aue.stimmkreis_id, aue.wahl_id, aue.anzahl
       FROM "landtagswahlen".aggregiert_ungueltige_erststimmen aue
   )
);

CREATE MATERIALIZED VIEW IF NOT EXISTS "landtagswahlen".ungueltige_zweitstimmen (stimmkreis_id, wahl_id, anzahl) AS (
    (
        SELECT euz.stimmkreis_id, euz.wahl_id, count(*)
        FROM "landtagswahlen".einzel_ungueltige_zweitstimmen euz
        GROUP BY euz.stimmkreis_id, euz.wahl_id
    )
    UNION ALL
    (
       SELECT auz.stimmkreis_id, auz.wahl_id, auz.anzahl
       FROM "landtagswahlen".aggregiert_ungueltige_zweitstimmen auz
    )
);

-- TODO: Mandatsberechnungsfkt implementieren
--DROP MATERIALIZED VIEW "landtagswahlen".direktmandate;
--CREATE MATERIALIZED VIEW "landtagswahlen".direktmandate AS (
--	SELECT id
--	FROM kandidaten
--	LIMIT 1
--);
--DROP MATERIALIZED VIEW "landtagswahlen".listenmandate;
--CREATE MATERIALIZED VIEW "landtagswahlen".listenmandate AS (
--	SELECT id
--	FROM kandidaten
--	LIMIT 1
--);
--DROP MATERIALIZED VIEW "landtagswahlen".ausgleichsmandate;
--CREATE MATERIALIZED VIEW "landtagswahlen".ausgleichsmandate AS (
--	SELECT id
--	FROM kandidaten
--	LIMIT 1
--);