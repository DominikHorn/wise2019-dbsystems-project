CREATE SCHEMA IF NOT EXISTS "landtagswahlen" AUTHORIZATION postgres;

CREATE TABLE IF NOT EXISTS "landtagswahlen".parteien (
	id int NOT NULL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	"name" varchar(200) NOT NULL
);

CREATE TABLE IF NOT EXISTS "landtagswahlen".kandidaten (
	id int NOT NULL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	partei_id int NOT NULL,
	"name" varchar(400) NOT NULL,
	FOREIGN KEY (partei_id) REFERENCES "landtagswahlen".parteien(id)
);

CREATE TABLE IF NOT EXISTS "landtagswahlen".wahlen (
	id int NOT NULL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	wahldatum date NOT NULL
);

CREATE TABLE IF NOT EXISTS "landtagswahlen".regierungsbezirke (
	id int NOT NULL PRIMARY KEY, -- Schluessel_Nummer in csv
	"name" varchar(80) NOT NULL
-- Unsupported in PostgreSQL
--	CHECK (id NOT IN (
--		SELECT id
--		FROM stimmkreise
--	))
);

CREATE TABLE IF NOT EXISTS "landtagswahlen".listen (
	kandidat_id int NOT NULL, -- Partei ergibt sich durch Kandidat
	wahl_id int NOT NULL,
	regierungsbezirk_id int NOT NULL,
	-- Da wir informatiker sind muss man sich hier auf einen standard einigen => Beginn bei 1 zu zählen
	initialerListenplatz int CHECK (initialerListenplatz > 0),
	FOREIGN KEY (kandidat_id) REFERENCES "landtagswahlen".kandidaten(id),
	FOREIGN KEY (wahl_id) REFERENCES "landtagswahlen".wahlen(id),
	FOREIGN KEY (regierungsbezirk_id) REFERENCES "landtagswahlen".regierungsbezirke(id),
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
	id int NOT NULL PRIMARY KEY, -- Schluessel_Nummer in csv
	"name" varchar(80) NOT NULL,
	regierungsbezirk_id int,
	-- TODO: geographische angaben für Kartenfunktion?
	FOREIGN KEY (regierungsbezirk_id) REFERENCES "landtagswahlen".regierungsbezirke(id)
-- Unsupported in PostgreSQL
--	CHECK (id NOT IN (
--		SELECT id
--		FROM regierungsbezirke
--	))
);

-- Hier stehen Daten die sich pro wahl ändern können
CREATE TABLE IF NOT EXISTS "landtagswahlen".stimmkreis_wahlinfo (
	stimmkreis_id int NOT NULL,
	wahl_id int NOT NULL,
	anzahlWahlberechtigte int NOT NULL DEFAULT 0,
	anzahlUngueltigeErstStimmen int NOT NULL DEFAULT 0,
	anzahlUngueltigeZweitStimmen int NOT NULL DEFAULT 0,
	FOREIGN KEY (stimmkreis_id) REFERENCES "landtagswahlen".stimmkreise(id),
	FOREIGN KEY (wahl_id) REFERENCES "landtagswahlen".wahlen(id),
	PRIMARY KEY (stimmkreis_id, wahl_id)
);

-- TODO: ... ; (Relation eig nur interessant um später Wahlzettel anzuzeigen. Man könnte das hier auch als view realisieren)
CREATE TABLE IF NOT EXISTS "landtagswahlen".direktkandidaten (
	stimmkreis_id int NOT NULL,
	wahl_id int NOT NULL,
	direktkandidat_id int NOT NULL,
	FOREIGN KEY (stimmkreis_id) REFERENCES "landtagswahlen".stimmkreise(id),
	FOREIGN KEY (wahl_id) REFERENCES "landtagswahlen".wahlen(id),
	FOREIGN KEY (direktkandidat_id) REFERENCES "landtagswahlen".kandidaten(id),
	PRIMARY KEY (stimmkreis_id, wahl_id, direktkandidat_id)
);

-- TODO: wenn sich sk ändern können muss hier noch wahl referenziert werden
CREATE OR REPLACE VIEW "landtagswahlen".direktmandat_anzahl AS (
	SELECT rb.id, count(sk.id)
	FROM "landtagswahlen".regierungsbezirke rb join "landtagswahlen".stimmkreise sk on rb.id = sk.regierungsbezirk_id
	GROUP BY rb.id
);

CREATE TABLE IF NOT EXISTS "landtagswahlen".regierungsbezirk_wahlinfo (
	regierungsbezirk_id int NOT NULL,
	wahl_id int NOT NULL,
	anzahlListenmandate int NOT NULL DEFAULT 0,
	FOREIGN KEY (regierungsbezirk_id) REFERENCES "landtagswahlen".regierungsbezirke(id),
	FOREIGN KEY (wahl_id) REFERENCES "landtagswahlen".wahlen(id),
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

CREATE TABLE IF NOT EXISTS "landtagswahlen".erststimmen (
	stimmkreis_id int NOT NULL,
	kandidat_id int NOT NULL,
	wahl_id int NOT NULL,
	anzahlGueltige int NOT NULL DEFAULT 0,
	FOREIGN KEY (stimmkreis_id) REFERENCES "landtagswahlen".stimmkreise(id),
	FOREIGN KEY (kandidat_id) REFERENCES "landtagswahlen".kandidaten(id),
	FOREIGN KEY (wahl_id) REFERENCES"landtagswahlen". wahlen(id),
	PRIMARY KEY (stimmkreis_id, kandidat_id, wahl_id)
);

CREATE TABLE IF NOT EXISTS "landtagswahlen".kandidatgebundene_zweitstimmen (
	stimmkreis_id int NOT NULL,
	wahl_id int NOT NULL,
	kandidat_id int NOT NULL,
	anzahlGueltige int NOT NULL DEFAULT 0,
	FOREIGN KEY (stimmkreis_id) REFERENCES "landtagswahlen".stimmkreise(id),
	FOREIGN KEY (kandidat_id) REFERENCES "landtagswahlen".kandidaten(id), -- Eigentlich nur die Listenkandidaten (extra tracken?)
	FOREIGN KEY (wahl_id) REFERENCES "landtagswahlen".wahlen(id),
	PRIMARY KEY (stimmkreis_id, kandidat_id, wahl_id)
);

CREATE TABLE IF NOT EXISTS "landtagswahlen".listengebundene_zweitstimmen (
	stimmkreis_id int NOT NULL,
	wahl_id int NOT NULL,
	partei_id int NOT NULL, -- Eigentlich Listen, welche aber (noch) nicht modeliert sind
	anzahlGueltige int NOT NULL DEFAULT 0,
	FOREIGN KEY (stimmkreis_id) REFERENCES "landtagswahlen".stimmkreise(id),
	FOREIGN KEY (partei_id) REFERENCES "landtagswahlen".parteien(id),
	FOREIGN KEY (wahl_id) REFERENCES "landtagswahlen".wahlen(id),
	PRIMARY KEY (stimmkreis_id, wahl_id, partei_id)
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