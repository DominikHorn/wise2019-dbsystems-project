CREATE SCHEMA IF NOT EXISTS "landtagswahlen" AUTHORIZATION postgres;

CREATE TABLE IF NOT EXISTS "landtagswahlen".parteien (
	id int NOT NULL PRIMARY KEY,
	"name" varchar(200) NOT NULL
);

CREATE TABLE IF NOT EXISTS "landtagswahlen".kandidaten (
	id int NOT NULL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	partei_id int NOT NULL,
	"name" varchar(400) NOT NULL,
	-- ON DELETE effectively prohibits deleting parties
	FOREIGN KEY (partei_id) REFERENCES "landtagswahlen".parteien(id) ON DELETE SET NULL
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
	FOREIGN KEY (kandidat_id) REFERENCES "landtagswahlen".kandidaten(id) ON DELETE SET NULL,
	FOREIGN KEY (wahl_id) REFERENCES "landtagswahlen".wahlen(id) ON DELETE SET NULL,
	FOREIGN KEY (regierungsbezirk_id) REFERENCES "landtagswahlen".regierungsbezirke(id) ON DELETE SET NULL,
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
	"name" varchar(200) NOT NULL,
	regierungsbezirk_id int,
	-- TODO: geographische angaben für Kartenfunktion?
	FOREIGN KEY (regierungsbezirk_id) REFERENCES "landtagswahlen".regierungsbezirke(id) ON DELETE SET NULL
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
	FOREIGN KEY (stimmkreis_id) REFERENCES "landtagswahlen".stimmkreise(id) ON DELETE SET NULL,
	FOREIGN KEY (wahl_id) REFERENCES "landtagswahlen".wahlen(id) ON DELETE SET NULL,
	PRIMARY KEY (stimmkreis_id, wahl_id)
);

CREATE TABLE IF NOT EXISTS "landtagswahlen".direktkandidaten (
	stimmkreis_id int NOT NULL,
	wahl_id int NOT NULL,
	direktkandidat_id int NOT NULL,
	FOREIGN KEY (stimmkreis_id) REFERENCES "landtagswahlen".stimmkreise(id) ON DELETE SET NULL,
	FOREIGN KEY (wahl_id) REFERENCES "landtagswahlen".wahlen(id) ON DELETE SET NULL,
	FOREIGN KEY (direktkandidat_id) REFERENCES "landtagswahlen".kandidaten(id) ON DELETE SET NULL,
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
	FOREIGN KEY (regierungsbezirk_id) REFERENCES "landtagswahlen".regierungsbezirke(id) ON DELETE SET NULL,
	FOREIGN KEY (wahl_id) REFERENCES "landtagswahlen".wahlen(id) ON DELETE SET NULL,
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
CREATE TABLE IF NOT EXISTS "landtagswahlen".kandidatgebundene_stimmen (
  id int NOT NULL GENERATED ALWAYS AS IDENTITY,
	stimmkreis_id int NOT NULL,
	kandidat_id int NOT NULL,
	wahl_id int NOT NULL,
	gueltig boolean NOT NULL,
	FOREIGN KEY (stimmkreis_id) REFERENCES "landtagswahlen".stimmkreise(id) ON DELETE SET NULL,
	FOREIGN KEY (kandidat_id) REFERENCES "landtagswahlen".kandidaten(id) ON DELETE SET NULL,
	FOREIGN KEY (wahl_id) REFERENCES"landtagswahlen". wahlen(id) ON DELETE SET NULL,
	PRIMARY KEY (id, stimmkreis_id, kandidat_id, wahl_id)
);

CREATE TABLE IF NOT EXISTS "landtagswahlen".listengebundene_stimmen (
	id int NOT NULL GENERATED ALWAYS AS IDENTITY,
	-- Es gibt nur eine Liste pro stimmkreis (TODO: sogar regierungsbezirk ?), wahl und partei
	stimmkreis_id int NOT NULL,
	wahl_id int NOT NULL,
	partei_id int NOT NULL,
	gueltig boolean NOT NULL,
	FOREIGN KEY (stimmkreis_id) REFERENCES "landtagswahlen".stimmkreise(id) ON DELETE SET NULL,
	FOREIGN KEY (partei_id) REFERENCES "landtagswahlen".parteien(id) ON DELETE SET NULL,
	FOREIGN KEY (wahl_id) REFERENCES "landtagswahlen".wahlen(id) ON DELETE SET NULL,
	PRIMARY KEY (id, stimmkreis_id, wahl_id, partei_id)
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