CREATE SCHEMA IF NOT EXISTS "landtagswahlen" AUTHORIZATION postgres;

CREATE TABLE IF NOT EXISTS "landtagswahlen".parteien (
	id int NOT NULL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	"name" varchar(200) NOT NULL
);

-- TODO: Von Partei aufgestellte Liste mit Reihenfolge für 2. Kandidaten
-- TODO: Als view, Liste mit Reihenfolge nach Stimmauszählung (wichtig zur Sitzberechnung)

CREATE TABLE IF NOT EXISTS "landtagswahlen".kandidaten (
	id int NOT NULL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	partei_id int NOT NULL,
	"name" varchar(200) NOT NULL,
	"surname" varchar(200) NOT NULL,
	FOREIGN KEY (partei_id) REFERENCES parteien(id)
);

CREATE TABLE IF NOT EXISTS "landtagswahlen".wahlen (
	id int NOT NULL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	datum date NOT NULL
);

-- Mangels nicht existierenden Daten werden Stimmbezirke nicht modeliert;
-- Somit entfaellt auch die Modelierung von Direktregionen

-- Abbildung "Stimmkreis"-Entität
CREATE TABLE IF NOT EXISTS "landtagswahlen".stimmkreise (
	id int NOT NULL PRIMARY KEY, -- Schluessel_Nummer in csv
	"name" varchar(80) NOT NULL,
	regierungsbezirk_id int,
	FOREIGN KEY (regierungsbezirk_id) REFERENCES regierungsbezirke(id)
-- Unsupported in PostgreSQL
--	CHECK (id NOT IN (
--		SELECT id
--		FROM regierungsbezirke
--	))
);

-- Abbildung "Regierungsbezirk"-Entität
CREATE TABLE IF NOT EXISTS "landtagswahlen".regierungsbezirke (	
	id int NOT NULL PRIMARY KEY, -- Schluessel_Nummer in csv
	"name" varchar(80) NOT NULL,
-- Unsupported in PostgreSQL
--	CHECK (id NOT IN (
--		SELECT id
--		FROM stimmkreise
--	))
);

CREATE TABLE IF NOT EXISTS "landtagswahlen".erststimmen (
	stimmkreis_id int NOT NULL,
	kandidat_id int NOT NULL,
	wahl_id int NOT NULL,
	anzahl int NOT NULL DEFAULT 0,
	FOREIGN KEY (stimmkreis_id) REFERENCES stimmkreise(id),
	FOREIGN KEY (kandidat_id) REFERENCES kandidaten(id),
	FOREIGN KEY (wahl_id) REFERENCES wahlen(id),
	PRIMARY KEY (stimmkreis_id, kandidat_id, wahl_id)
);

CREATE TABLE IF NOT EXISTS "landtagswahlen".kandidatgebundene_zweitstimmen (
	stimmkreis_id int NOT NULL,
	wahl_id int NOT NULL,
	kandidat_id int NOT NULL,
	anzahl int NOT NULL DEFAULT 0,		
	FOREIGN KEY (stimmkreis_id) REFERENCES stimmkreise(id),
	FOREIGN KEY (kandidat_id) REFERENCES kandidaten(id), -- Eigentlich nur die Listenkandidaten (extra tracken?)
	FOREIGN KEY (wahl_id) REFERENCES wahlen(id),
	PRIMARY KEY (stimmkreis_id, kandidat_id, wahl_id)
);

CREATE TABLE IF NOT EXISTS "landtagswahlen".listengebundene_zweitstimmen (
	stimmkreis_id int NOT NULL,
	wahl_id int NOT NULL,
	partei_id int NOT NULL, -- Eigentlich Listen
	anzahl int NOT NULL DEFAULT 0,		
	FOREIGN KEY (stimmkreis_id) REFERENCES stimmkreise(id),
	FOREIGN KEY (partei_id) REFERENCES parteien(id),
	FOREIGN KEY (wahl_id) REFERENCES wahlen(id),
	PRIMARY KEY (stimmkreis_id, kandidat_id, wahl_id)
);