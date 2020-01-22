CREATE SCHEMA IF NOT EXISTS "landtagswahlen" AUTHORIZATION postgres;

CREATE TABLE IF NOT EXISTS "landtagswahlen".parteien (
	id smallint NOT NULL PRIMARY KEY,
	"name" varchar(40) NOT NULL
);

CREATE TABLE IF NOT EXISTS "landtagswahlen".kandidaten (
	id int NOT NULL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	partei_id smallint NOT NULL,
	"name" varchar(200) NOT NULL,
	FOREIGN KEY (partei_id) REFERENCES "landtagswahlen".parteien(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "landtagswahlen".wahlen (
	id smallint NOT NULL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	wahldatum date NOT NULL
);
INSERT INTO "landtagswahlen".wahlen (wahldatum)
	SELECT a.*
	FROM (
		SELECT date('2018-10-14')
		UNION
		SELECT date('2013-09-15')
	) a
	WHERE NOT EXISTS (SELECT * FROM "landtagswahlen".wahlen);

CREATE TABLE IF NOT EXISTS "landtagswahlen".datablocked (
	wahl_id smallint NOT NULL UNIQUE,
	FOREIGN KEY (wahl_id) REFERENCES "landtagswahlen".wahlen(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "landtagswahlen".regierungsbezirke (
	id smallint NOT NULL PRIMARY KEY,
	"name" varchar(80) NOT NULL
);
INSERT INTO "landtagswahlen".regierungsbezirke (id, "name")
SELECT a.*
FROM (
    SELECT 901, 'Oberbayern'
    UNION
    SELECT 902, 'Niederbayern'
    UNION
    SELECT 903, 'Oberpfalz'
    UNION
    SELECT 904, 'Oberfranken'
    UNION
    SELECT 905, 'Mittelfranken'
    UNION
    SELECT 906, 'Unterfranken'
    UNION
    SELECT 907, 'Schwaben'
    ) a
WHERE NOT EXISTS (SELECT * FROM "landtagswahlen".regierungsbezirke);

CREATE TABLE IF NOT EXISTS "landtagswahlen".regierungsbezirk_wahlinfo (
	regierungsbezirk_id smallint NOT NULL,
	wahl_id smallint NOT NULL,
	anzahlListenmandate smallint NOT NULL DEFAULT 0,
	FOREIGN KEY (regierungsbezirk_id) REFERENCES "landtagswahlen".regierungsbezirke(id) ON DELETE CASCADE,
	FOREIGN KEY (wahl_id) REFERENCES "landtagswahlen".wahlen(id) ON DELETE CASCADE,
	PRIMARY KEY (regierungsbezirk_id, wahl_id)
);
INSERT INTO "landtagswahlen".regierungsbezirk_wahlinfo (regierungsbezirk_id, wahl_id, anzahlListenmandate)
SELECT a.*
FROM (
    SELECT 901, 1, 30
    UNION
    SELECT 902, 1, 9
    UNION
    SELECT 903, 1, 8
    UNION
    SELECT 904, 1, 8
    UNION
    SELECT 905, 1, 12
    UNION
    SELECT 906, 1, 9
    UNION
    SELECT 907, 1, 13
		UNION
		SELECT 901, 2, 30
		UNION 
		SELECT 902, 2, 9
		UNION
		SELECT 903, 2, 8
		UNION
		SELECT 904, 2, 8
		UNION
		SELECT 905, 2, 12
		UNION
		SELECT 906, 2, 10
		UNION
		SELECT 907, 2, 13
    ) a
WHERE NOT EXISTS (SELECT * FROM "landtagswahlen".regierungsbezirk_wahlinfo);

CREATE TABLE IF NOT EXISTS "landtagswahlen".listen (
	kandidat_id int NOT NULL, -- Partei ergibt sich durch Kandidat
	wahl_id smallint NOT NULL,
	regierungsbezirk_id smallint NOT NULL,
	-- Da wir informatiker sind muss man sich hier auf einen standard einigen => Beginn bei 1 zu zählen damit platz === wert
	initialerListenplatz smallint CHECK (initialerListenplatz > 0),
	FOREIGN KEY (kandidat_id) REFERENCES "landtagswahlen".kandidaten(id) ON DELETE CASCADE,
	FOREIGN KEY (wahl_id) REFERENCES "landtagswahlen".wahlen(id) ON DELETE CASCADE,
	FOREIGN KEY (regierungsbezirk_id) REFERENCES "landtagswahlen".regierungsbezirke(id) ON DELETE CASCADE,
	-- Regierungsbezirk_id nicht primary key um zu verhindern, dass ein kandidat in mehreren RB auf Liste erscheint
	PRIMARY KEY (kandidat_id, wahl_id)
);

-- Mangels nicht existierenden Daten werden Stimmbezirke nicht als relation repräsentiert;
-- Somit entfaellt auch die Modelierung von Direktregionen
-- Abbildung "Stimmkreis"-Entität
CREATE TABLE IF NOT EXISTS "landtagswahlen".stimmkreise (
	id smallint NOT NULL PRIMARY KEY, -- Schluessel_Nummer in csv
	"name" varchar(100) NOT NULL,
	regierungsbezirk_id smallint NOT NULL,
	FOREIGN KEY (regierungsbezirk_id) REFERENCES "landtagswahlen".regierungsbezirke(id) ON DELETE CASCADE
-- Unsupported in PostgreSQL
--	CHECK (id NOT IN (
--		SELECT id
--		FROM regierungsbezirke
--	))
);

CREATE TABLE IF NOT EXISTS "landtagswahlen".wahlhelfertoken (
	wahl_id smallint NOT NULL,
	stimmkreis_id smallint NOT NULL,
	token varchar(80) NOT NULL UNIQUE,
	FOREIGN KEY (wahl_id) REFERENCES "landtagswahlen".wahlen(id) ON DELETE CASCADE,
	FOREIGN KEY (stimmkreis_id) REFERENCES "landtagswahlen".stimmkreise(id) ON DELETE CASCADE,
	PRIMARY KEY (wahl_id, stimmkreis_id)
);

CREATE TABLE IF NOT EXISTS "landtagswahlen".authenticated_wahlkabinen (
	wahl_id smallint NOT NULL,
	stimmkreis_id smallint NOT NULL,
	token varchar(80) NOT NULL UNIQUE,
	label varchar NOT NULL,
	FOREIGN KEY (wahl_id, stimmkreis_id) REFERENCES "landtagswahlen".wahlhelfertoken ON DELETE CASCADE,
	UNIQUE (wahl_id, stimmkreis_id, label),
	PRIMARY KEY (wahl_id, stimmkreis_id, token)
);

-- Hier stehen Daten die sich pro wahl ändern können
CREATE TABLE IF NOT EXISTS "landtagswahlen".stimmkreis_wahlinfo (
	stimmkreis_id smallint NOT NULL,
	wahl_id smallint NOT NULL,
	anzahlWahlberechtigte int NOT NULL DEFAULT 0,
	anzahlWaehler int NOT NULL DEFAULT 0,
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

CREATE MATERIALIZED VIEW IF NOT EXISTS "landtagswahlen".direktmandat_anzahl AS (
	SELECT sk.regierungsbezirk_id, dk.wahl_id, count(*) as anzahl
	FROM (
						SELECT stimmkreis_id, wahl_id
						FROM "landtagswahlen".direktkandidaten
						GROUP BY stimmkreis_id, wahl_id
				) dk
			JOIN "landtagswahlen".stimmkreise sk ON sk.id = dk.stimmkreis_id
	GROUP BY sk.regierungsbezirk_id, dk.wahl_id
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
	stimmkreis_id smallint NOT NULL,
	wahl_id smallint NOT NULL,
	kandidat_id int NOT NULL,
	FOREIGN KEY (stimmkreis_id) REFERENCES "landtagswahlen".stimmkreise(id) ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE,
	FOREIGN KEY (wahl_id) REFERENCES "landtagswahlen".wahlen(id) ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE,
	FOREIGN KEY (kandidat_id) REFERENCES "landtagswahlen".kandidaten(id) ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE
);

-- This index exists to dramatically enhance aggregation performance (factor 250)
CREATE INDEX IF NOT EXISTS egks_kandidat_stimmkreis_wahl_index
ON "landtagswahlen".einzel_gueltige_kandidatgebundene_stimmen (stimmkreis_id, kandidat_id, wahl_id);

CREATE TABLE IF NOT EXISTS "landtagswahlen".einzel_gueltige_listengebundene_stimmen (
	stimmkreis_id smallint NOT NULL,
	wahl_id smallint NOT NULL,
	partei_id smallint NOT NULL,
	FOREIGN KEY (stimmkreis_id) REFERENCES "landtagswahlen".stimmkreise(id) ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE,
	FOREIGN KEY (wahl_id) REFERENCES "landtagswahlen".wahlen(id) ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE,
	FOREIGN KEY (partei_id) REFERENCES "landtagswahlen".parteien(id) ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE
);

CREATE TABLE IF NOT EXISTS "landtagswahlen".einzel_ungueltige_erststimmen (
	wahl_id smallint NOT NULL,
	stimmkreis_id smallint NOT NULL,
	FOREIGN KEY (stimmkreis_id) REFERENCES "landtagswahlen".stimmkreise(id) ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE,
	FOREIGN KEY (wahl_id) REFERENCES "landtagswahlen".wahlen(id) ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE
);

CREATE TABLE IF NOT EXISTS "landtagswahlen".einzel_ungueltige_zweitstimmen (
	wahl_id smallint NOT NULL,
	stimmkreis_id smallint NOT NULL,
	FOREIGN KEY (stimmkreis_id) REFERENCES "landtagswahlen".stimmkreise(id) ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE,
	FOREIGN KEY (wahl_id) REFERENCES "landtagswahlen".wahlen(id) ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE
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

CREATE MATERIALIZED VIEW IF NOT EXISTS "landtagswahlen".kandidatgebundene_gueltige_stimmen (wahl_id, stimmkreis_id, kandidat_id, anzahl) AS (
-- Allgemeinster Fall, es können Stimmen für einen Kandidaten in beiden Tabellen vorkommen
--	with rel as ((
--			SELECT egks.wahl_id, egks.stimmkreis_id, egks.kandidat_id, count(*) as anzahl
--			FROM "landtagswahlen".einzel_gueltige_kandidatgebundene_stimmen egks
--			GROUP BY egks.stimmkreis_id, egks.kandidat_id, egks.wahl_id
--	)
--	UNION ALL
--	(
--			SELECT agks.wahl_id, agks.stimmkreis_id, agks.kandidat_id, agks.anzahl
--			FROM "landtagswahlen".aggregiert_gueltige_kandidatgebundene_stimmen agks
--	))
--	SELECT wahl_id, stimmkreis_id, kandidat_id, sum(anzahl) as anzahl
--	FROM rel
--	GROUP BY wahl_id, stimmkreis_id, kandidat_id;

-- Mit der Einschränkung das Daten zu einer Wahl, Kandidaten und Stimmkreis nicht aufgeteilt werden auf die beiden Tabellen
-- Sondern vollständig in einer enthalten sind lässt sich das Optimieren zu der wesentlich schnelleren Anfrage:
(
    SELECT egks.wahl_id, egks.stimmkreis_id, egks.kandidat_id, count(*) as anzahl
    FROM "landtagswahlen".einzel_gueltige_kandidatgebundene_stimmen egks
    GROUP BY egks.stimmkreis_id, egks.kandidat_id, egks.wahl_id
)
UNION ALL
(
    SELECT agks.wahl_id, agks.stimmkreis_id, agks.kandidat_id, agks.anzahl
    FROM "landtagswahlen".aggregiert_gueltige_kandidatgebundene_stimmen agks
));

CREATE MATERIALIZED VIEW IF NOT EXISTS "landtagswahlen".listengebundene_gueltige_stimmen (wahl_id, stimmkreis_id, partei_id, anzahl) AS (
	SELECT lgs.wahl_id, lgs.stimmkreis_id, lgs.partei_id, sum(anzahl) as anzahl
	FROM (
		(
			SELECT egls.wahl_id, egls.stimmkreis_id, egls.partei_id, count(*) as anzahl
			FROM "landtagswahlen".einzel_gueltige_listengebundene_stimmen egls
			GROUP BY egls.stimmkreis_id, egls.wahl_id, egls.partei_id
		)
		UNION ALL
		(
			SELECT agls.wahl_id, agls.stimmkreis_id, agls.partei_id, agls.anzahl
			FROM "landtagswahlen".aggregiert_gueltige_listengebundene_stimmen agls
		)
	) lgs
	GROUP BY lgs.wahl_id, lgs.stimmkreis_id, lgs.partei_id
);

CREATE MATERIALIZED VIEW IF NOT EXISTS "landtagswahlen".ungueltige_erststimmen (wahl_id, stimmkreis_id, anzahl) AS (
	SELECT ue.wahl_id, ue.stimmkreis_id, sum(anzahl) as anzahl
	FROM (
		(
			SELECT eue.wahl_id, eue.stimmkreis_id, count(*) as anzahl
			FROM "landtagswahlen".einzel_ungueltige_erststimmen eue
			GROUP BY eue.stimmkreis_id, eue.wahl_id
		)
		UNION ALL
		(
			SELECT aue.wahl_id, aue.stimmkreis_id, aue.anzahl
			FROM "landtagswahlen".aggregiert_ungueltige_erststimmen aue
		)
	) ue
	GROUP BY ue.wahl_id, ue.stimmkreis_id
);

CREATE MATERIALIZED VIEW IF NOT EXISTS "landtagswahlen".ungueltige_zweitstimmen (wahl_id, stimmkreis_id, anzahl) AS (
	SELECT uz.wahl_id, uz.stimmkreis_id, sum(uz.anzahl) as anzahl
	FROM (
			(
			SELECT euz.wahl_id, euz.stimmkreis_id, count(*) as anzahl
			FROM "landtagswahlen".einzel_ungueltige_zweitstimmen euz
			GROUP BY euz.stimmkreis_id, euz.wahl_id
		)
		UNION ALL
		(
			SELECT auz.wahl_id, auz.stimmkreis_id, auz.anzahl
			FROM "landtagswahlen".aggregiert_ungueltige_zweitstimmen auz
		)
	) uz
	GROUP BY uz.wahl_id, uz.stimmkreis_id
);

-- Listenplätze nach Auszählung; Materialisiert weil schnell, eigene view weil später evtl interessant
CREATE MATERIALIZED VIEW IF NOT EXISTS "landtagswahlen".finaleliste (wahl_id, regierungsbezirk_id, kandidat_id, finalerListenplatz) AS (
	-- Summe aller Stimmen die ein kandidat erhalten hat pro regierungsbezirk und wahl.
	WITH gesamtstimmen_pro_kandidat (wahl_id, regierungsbezirk_id, kandidat_id, anzahl) AS (
		SELECT kgs.wahl_id, sk.regierungsbezirk_id, kgs.kandidat_id, sum(kgs.anzahl)
		FROM "landtagswahlen".kandidatgebundene_gueltige_stimmen kgs
			JOIN "landtagswahlen".stimmkreise sk ON sk.id = kgs.stimmkreis_id
		GROUP BY kgs.wahl_id, sk.regierungsbezirk_id, kgs.kandidat_id
	) 
	SELECT gpk.wahl_id, gpk.regierungsbezirk_id, k.id, row_number() over (
		PARTITION BY gpk.wahl_id, gpk.regierungsbezirk_id, k.partei_id
		ORDER BY gpk.anzahl DESC
	) as finalerListenplatz
	FROM gesamtstimmen_pro_kandidat gpk JOIN "landtagswahlen".kandidaten k ON gpk.kandidat_id = k.id
);

-- Summe von kandidatengebundenen und listengebundenen stimmen pro partei
CREATE OR REPLACE VIEW "landtagswahlen".gesamtstimmen_pro_partei (wahl_id, regierungsbezirk_id, partei_id, anzahl) AS (
	-- Anzahl kandidatengebundener erst+zweitstimmen pro partei
	WITH kandidatgebundene_gesamtstimmen_pro_partei (wahl_id, regierungsbezirk_id, partei_id, anzahl) AS (
		SELECT kgs.wahl_id, sk.regierungsbezirk_id, k.partei_id, sum(kgs.anzahl)
		FROM "landtagswahlen".kandidatgebundene_gueltige_stimmen kgs
			JOIN "landtagswahlen".stimmkreise sk ON sk.id = kgs.stimmkreis_id
			JOIN "landtagswahlen".kandidaten k ON k.id = kgs.kandidat_id
		GROUP BY kgs.wahl_id, sk.regierungsbezirk_id, k.partei_id
	),
	-- Anzahl stimmen für die liste/den Wahlvorschlag pro partei
	listengebundene_gesamtstimmen_pro_partei (wahl_id, regierungsbezirk_id, partei_id, anzahl) AS (
		SELECT lgs.wahl_id, sk.regierungsbezirk_id, lgs.partei_id, sum(lgs.anzahl)
		FROM "landtagswahlen".listengebundene_gueltige_stimmen lgs
			JOIN "landtagswahlen".stimmkreise sk ON sk.id = lgs.stimmkreis_id
		GROUP BY lgs.wahl_id, sk.regierungsbezirk_id, lgs.partei_id
	)
	SELECT kggs.wahl_id, kggs.regierungsbezirk_id, kggs.partei_id, kggs.anzahl + lggs.anzahl as anzahl
	FROM kandidatgebundene_gesamtstimmen_pro_partei kggs
		JOIN listengebundene_gesamtstimmen_pro_partei lggs
			ON lggs.regierungsbezirk_id = kggs.regierungsbezirk_id AND lggs.partei_id = kggs.partei_id AND
				lggs.wahl_id = kggs.wahl_id
);

-- Anzahl der Mandate die einer Partei in einem Regierungsbezirk zustehenden würden nach Hare-Niemeyer
CREATE OR REPLACE FUNCTION "landtagswahlen".zustehende_mandate(p_ausgleichsmandat_anzahl integer)
	RETURNS TABLE (
			wahl_id smallint,
			regierungsbezirk_id smallint,
			partei_id smallint,
			anzahl int
			)
	AS $$
	-- Gesammtstimmen für jeden Regierungsbezirk
	WITH gesamtstimmen (wahl_id, regierungsbezirk_id, anzahl) AS (
    SELECT wahl_id, regierungsbezirk_id, sum(anzahl)
    FROM "landtagswahlen".gesamtstimmen_pro_partei
    GROUP BY wahl_id, regierungsbezirk_id
	),
	-- Die Parteien, welche nicht gesperrt sind für die Wahl
	nicht_gesperrte_parteien (wahl_id, partei_id) AS (
		SELECT gspp.wahl_id, gspp.partei_id
		FROM (
						SELECT wahl_id, partei_id, sum(anzahl) as anzahl
						FROM "landtagswahlen".gesamtstimmen_pro_partei
						GROUP BY wahl_id, partei_id
			) gspp
			-- Gesammtstimmen gruppiert für Sperrberechnung (hier zählen alle regierungsbezirke und nicht nur der momentane!)
			JOIN (
				SELECT wahl_id, sum(anzahl) as anzahl
				FROM "landtagswahlen".gesamtstimmen_pro_partei
				GROUP BY wahl_id
			) gs ON gs.wahl_id = gspp.wahl_id
		WHERE gspp.anzahl / gs.anzahl >= 0.05
	),
	-- Anzahl der regulären mandate (direkt + liste) die in einem Regierungsbezirk zu vergeben sind
	gesamtmandat_anzahl (regierungsbezirk_id, wahl_id, anzahl) AS (
		SELECT dm.regierungsbezirk_id, dm.wahl_id, dm.anzahl + rwi.anzahllistenmandate + p_ausgleichsmandat_anzahl as anzahl
		FROM "landtagswahlen".direktmandat_anzahl dm
			JOIN "landtagswahlen".regierungsbezirk_wahlinfo rwi
				ON rwi.regierungsbezirk_id = dm.regierungsbezirk_id AND rwi.wahl_id = dm.wahl_id
	),
	-- Prozentualer Stimmanteil jeder Partei in Regierungsbezirken
	stimmanteile (wahl_id, regierungsbezirk_id, partei_id, stimmanteil) AS (
		SELECT gs.wahl_id, gs.regierungsbezirk_id, gspp.partei_id, gspp.anzahl / gs.anzahl as stimmanteil
		FROM gesamtstimmen gs
			JOIN "landtagswahlen".gesamtstimmen_pro_partei gspp
				ON gspp.wahl_id = gs.wahl_id AND gspp.regierungsbezirk_id = gs.regierungsbezirk_id
		WHERE gs.wahl_id = gspp.wahl_id AND gs.regierungsbezirk_id = gspp.regierungsbezirk_id
	),
	-- Anzahl der Stimmen pro Regierungsbezirk die wegen Sperrklausel wegfallen
	sperrklausel_stimmen (wahl_id, regierungsbezirk_id, anzahl) AS (
		SELECT gspp.wahl_id, gspp.regierungsbezirk_id, sum(gspp.anzahl) as anzahl
		FROM "landtagswahlen".gesamtstimmen_pro_partei gspp
		WHERE NOT EXISTS (
			SELECT *
			FROM nicht_gesperrte_parteien ngp
			WHERE gspp.wahl_id = ngp.wahl_id
				AND gspp.partei_id = ngp.partei_id
		)
		GROUP BY gspp.wahl_id, gspp.regierungsbezirk_id
	),
	-- Gesamtstimmen pro Regierungsbezirk exclusive Sperrklausel Stimmen
	bereinigte_gesamtstimmen (wahl_id, regierungsbezirk_id, anzahl) AS (
		SELECT gs.wahl_id, gs.regierungsbezirk_id, gs.anzahl - sks.anzahl
		FROM gesamtstimmen gs
			JOIN sperrklausel_stimmen sks
				ON gs.regierungsbezirk_id = sks.regierungsbezirk_id AND gs.wahl_id = sks.wahl_id
	),
	-- Hare-Niemeyer quotas per regierungsbezirk and partei
	sitzquoten (wahl_id, regierungsbezirk_id, partei_id, quote) AS (
		SELECT bgs.wahl_id, bgs.regierungsbezirk_id, gspp.partei_id, gma.anzahl * gspp.anzahl / bgs.anzahl as quote
		FROM bereinigte_gesamtstimmen bgs
			JOIN gesamtstimmen gs
				ON gs.wahl_id = bgs.wahl_id 
					AND gs.regierungsbezirk_id = bgs.regierungsbezirk_id
			JOIN "landtagswahlen".gesamtstimmen_pro_partei gspp
				ON gspp.wahl_id = bgs.wahl_id
					AND gspp.regierungsbezirk_id = bgs.regierungsbezirk_id
			JOIN nicht_gesperrte_parteien ngp
				ON gspp.wahl_id = ngp.wahl_id
					AND gspp.partei_id = ngp.partei_id
			JOIN gesamtmandat_anzahl gma
				ON gma.wahl_id = bgs.wahl_id
					AND gma.regierungsbezirk_id = bgs.regierungsbezirk_id
	),
	-- Durch abrunden bleiben Sitze übrig. Damit Verfahren summenerhaltend ist werden übrige Mandate verteilt:
	uebgrigemandate (wahl_id, regierungsbezirk_id, anzahl) AS (
		SELECT sqg.wahl_id, sqg.regierungsbezirk_id, gma.anzahl - sqg.anzahl
		FROM (
				SELECT wahl_id, regierungsbezirk_id, sum(floor(quote)) as anzahl
				FROM sitzquoten sq
				GROUP BY wahl_id, regierungsbezirk_id
			) sqg
			JOIN gesamtmandat_anzahl gma
				ON gma.wahl_id = sqg.wahl_id AND gma.regierungsbezirk_id = sqg.regierungsbezirk_id
	),
	-- Pro Wahl und Regierungsbezirk stehen hier Parteien die je einen Zusatzsitz erhalten damit die Sitzverteilung summenerhaltend bleibt
	zusatzsitze (wahl_id, regierungsbezirk_id, partei_id) AS (
		SELECT sqr.wahl_id, sqr.regierungsbezirk_id, sqr.partei_id
		FROM (
				SELECT *,
								-- Da LIMIT keine Variablen nimmt muss man mit row_number() arbeiten
								row_number() OVER (
										PARTITION BY wahl_id, regierungsbezirk_id
										ORDER BY quote - floor(quote) DESC
										) AS row_number
				FROM sitzquoten sq
			) sqr
			JOIN uebgrigemandate um
				ON sqr.wahl_id = um.wahl_id AND sqr.regierungsbezirk_id = um.regierungsbezirk_id
		WHERE sqr.row_number <= um.anzahl
		ORDER BY sqr.wahl_id, sqr.regierungsbezirk_id
	)
	SELECT sq.wahl_id,
		sq.regierungsbezirk_id,
		sq.partei_id,
		CAST(floor(sq.quote) as integer) + (
			CASE
				WHEN EXISTS(
						SELECT *
						FROM zusatzsitze zs
						WHERE zs.wahl_id = sq.wahl_id
							AND zs.regierungsbezirk_id = sq.regierungsbezirk_id
							AND zs.partei_id = sq.partei_id
					)
					THEN 1
				ELSE 0 END
			)
	FROM sitzquoten sq
$$ LANGUAGE SQL
STABLE;

-- Der Gewinner/Direktkandidate jedes Stimmkreises
CREATE MATERIALIZED VIEW IF NOT EXISTS "landtagswahlen".gewonnene_direktmandate (wahl_id, stimmkreis_id, kandidat_id, stimmanzahl) AS (
	WITH gesamtstimmen (wahl_id, anzahl) AS (
		SELECT wahl_id, sum(anzahl)
		FROM "landtagswahlen".gesamtstimmen_pro_partei
		GROUP BY wahl_id
	),
	-- Die Parteien, welche nicht gesperrt sind für die Wahl
	nicht_gesperrte_parteien (wahl_id, partei_id) AS (
		SELECT gspp.wahl_id, gspp.partei_id
		FROM (
				SELECT wahl_id, partei_id, sum(anzahl) as anzahl
				FROM "landtagswahlen".gesamtstimmen_pro_partei 
				GROUP BY wahl_id, partei_id
			) gspp
			JOIN gesamtstimmen gs ON gs.wahl_id = gspp.wahl_id
		WHERE gspp.anzahl / gs.anzahl >= 0.05
	),
	nicht_gesperrte_direktkandidaten (wahl_id, stimmkreis_id, kandidat_id, stimmanzahl) AS (
		SELECT dk.wahl_id, dk.stimmkreis_id, dk.direktkandidat_id, kgs.anzahl
		FROM "landtagswahlen".direktkandidaten dk
			JOIN "landtagswahlen".kandidaten k
				ON k.id = dk.direktkandidat_id
			JOIN "landtagswahlen".stimmkreise sk
				ON sk.id = dk.stimmkreis_id
			JOIN "landtagswahlen".kandidatgebundene_gueltige_stimmen kgs
				ON kgs.kandidat_id = dk.direktkandidat_id
					AND kgs.wahl_id = dk.wahl_id
					AND kgs.stimmkreis_id = dk.stimmkreis_id
			JOIN nicht_gesperrte_parteien ngp
				ON ngp.wahl_id = dk.wahl_id
					AND ngp.partei_id = k.partei_id
	)
	SELECT ngd1.wahl_id, ngd1.stimmkreis_id, ngd1.kandidat_id, ngd1.stimmanzahl
	FROM nicht_gesperrte_direktkandidaten ngd1
	WHERE NOT EXISTS(
		SELECT *
		FROM nicht_gesperrte_direktkandidaten ngd2
		WHERE ngd1.wahl_id = ngd2.wahl_id
			AND ngd1.stimmkreis_id = ngd2.stimmkreis_id
			AND ngd2.stimmanzahl > ngd1.stimmanzahl
	)
);

CREATE MATERIALIZED VIEW IF NOT EXISTS "landtagswahlen".gewonnene_listenmandate (wahl_id, regierungsbezirk_id, kandidat_id, zusatzmandate_in_regierungsbezirk) AS (
	-- Anzahl gewonnener direktmandate pro partei und Regierungsbezirk
	WITH RECURSIVE anzahl_gewonnene_direktmandate (wahl_id, regierungsbezirk_id, partei_id, anzahl) AS (
		SELECT gdm.wahl_id, sk.regierungsbezirk_id, k.partei_id, count(*)
		FROM "landtagswahlen".gewonnene_direktmandate gdm
			JOIN "landtagswahlen".stimmkreise sk
				ON sk.id = gdm.stimmkreis_id
			JOIN "landtagswahlen".kandidaten k
				ON k.id = gdm.kandidat_id
		GROUP BY gdm.wahl_id, sk.regierungsbezirk_id, k.partei_id
	),
	-- Anzahl Listenmandate die jeder Partei zustehen
	listenmandate_recursive (wahl_id, regierungsbezirk_id, partei_id, anzahl, zusatzmandate) AS (
		(
			SELECT z.wahl_id,
						 z.regierungsbezirk_id,
						 z.partei_id,
						 z.anzahl - COALESCE(agd.anzahl, 0) as anzahl,
						 0 as zusatzmandate
			FROM "landtagswahlen".zustehende_mandate(0) z
				LEFT OUTER JOIN anzahl_gewonnene_direktmandate agd
					ON z.wahl_id = agd.wahl_id
						AND z.regierungsbezirk_id = agd.regierungsbezirk_id
						AND z.partei_id = agd.partei_id
		)
		UNION
		(
				SELECT z.wahl_id,
						 	 z.regierungsbezirk_id,
							 z.partei_id,
							 z.anzahl - COALESCE(agd.anzahl, 0) as anzahl,
							 CAST(zlm1.zusatzmandate + 1 as int) as zusatzmandate
				FROM listenmandate_recursive zlm1
					JOIN "landtagswahlen".zustehende_mandate(CAST(zlm1.zusatzmandate + 1 as int)) z
						ON zlm1.wahl_id = z.wahl_id
							AND zlm1.regierungsbezirk_id = z.regierungsbezirk_id
					LEFT OUTER JOIN anzahl_gewonnene_direktmandate agd
						ON z.wahl_id = agd.wahl_id
							AND z.regierungsbezirk_id = agd.regierungsbezirk_id
							AND z.partei_id = agd.partei_id
				WHERE zlm1.anzahl < 0
		)
	), listenmandate_pro_partei (wahl_id, regierungsbezirk_id, partei_id, anzahl, zusatzmandate) AS (
		SELECT zl1.wahl_id, zl1.regierungsbezirk_id, zl1.partei_id, zl1.anzahl, zl1.zusatzmandate
		FROM listenmandate_recursive zl1
		WHERE NOT EXISTS(
				SELECT *
				FROM listenmandate_recursive zl2
				WHERE zl1.wahl_id = zl2.wahl_id
					AND zl1.regierungsbezirk_id = zl2.regierungsbezirk_id
					AND zl1.partei_id = zl2.partei_id
					AND zl1.zusatzmandate < zl2.zusatzmandate
			)
		ORDER BY zl1.partei_id
	)
	SELECT flf.wahl_id, flf.regierungsbezirk_id, k.id, lpp.zusatzmandate
	FROM (
			-- recalculate row number after excluding direkt_mandat gewinner to be able to check with <= predicate who won a listenmandat
			SELECT fl.wahl_id, fl.regierungsbezirk_id, fl.kandidat_id, row_number() OVER (
							PARTITION BY fl.wahl_id, fl.regierungsbezirk_id, k.partei_id
							ORDER BY fl.finalerlistenplatz
					) as mandatordnung
			FROM "landtagswahlen".finaleliste fl
					JOIN "landtagswahlen".kandidaten k
							ON k.id = fl.kandidat_id
			-- Exclude all kandidaten that won a direct mandate
			WHERE NOT EXISTS (
					SELECT *
					FROM "landtagswahlen".gewonnene_direktmandate gdm
						JOIN "landtagswahlen".stimmkreise sk
							ON sk.id = gdm.stimmkreis_id
					WHERE fl.wahl_id = gdm.wahl_id
						AND fl.regierungsbezirk_id = sk.regierungsbezirk_id
						AND fl.kandidat_id = gdm.kandidat_id
			)
	-- finaleListe filtered
	) flf
	JOIN "landtagswahlen".kandidaten k
		ON k.id = flf.kandidat_id
	JOIN listenmandate_pro_partei lpp
		ON flf.wahl_id = lpp.wahl_id
			AND flf.regierungsbezirk_id = lpp.regierungsbezirk_id
			AND k.partei_id = lpp.partei_id
	WHERE flf.mandatordnung <= lpp.anzahl
);

CREATE OR REPLACE VIEW "landtagswahlen".sieger_erstimmen_pro_stimmkreis  AS (
with erststimmen_pro_stimmkreis AS(
    SELECT kgs.wahl_id, kgs.stimmkreis_id, kgs.kandidat_id, kgs.anzahl
    FROM "landtagswahlen".direktkandidaten dk, "landtagswahlen".kandidatgebundene_gueltige_stimmen kgs
    WHERE dk.wahl_id = kgs.wahl_id AND dk.stimmkreis_id = kgs.stimmkreis_id AND dk.direktkandidat_id = kgs.kandidat_id
), erststimmen_pro_partei AS (
    SELECT eps.wahl_id, dk.stimmkreis_id, k.partei_id, sum(eps.anzahl) as anzahl
    FROM erststimmen_pro_stimmkreis eps, "landtagswahlen".kandidaten k, "landtagswahlen".direktkandidaten dk
    WHERE eps.wahl_id  = dk.wahl_id AND eps.kandidat_id = k.id AND k.id = dk.direktkandidat_id
    GROUP BY eps.wahl_id, dk.stimmkreis_id, k.partei_id
    )

    SELECT epp.wahl_id, epp.stimmkreis_id, epp.partei_id, epp.anzahl
    FROM erststimmen_pro_partei epp
    WHERE not exists(SELECT * FROM erststimmen_pro_partei epp2 WHERE epp2.anzahl > epp.anzahl AND epp2.wahl_id = epp.wahl_id AND epp2.stimmkreis_id = epp.stimmkreis_id)
    
);


CREATE OR REPLACE VIEW "landtagswahlen".sieger_zweitstimmen_pro_stimmkreis AS (   
		 with zweitstimmen_pro_stimmkreis AS(
        SELECT lgs.wahl_id, lgs.stimmkreis_id, lgs.partei_id, lgs.anzahl
        FROM "landtagswahlen".listengebundene_gueltige_stimmen lgs

        UNION

        SELECT kgs.wahl_id, kgs.stimmkreis_id, k.partei_id, sum(kgs.anzahl) as anzahl
        FROM "landtagswahlen".kandidatgebundene_gueltige_stimmen kgs, "landtagswahlen".kandidaten k
        WHERE not exists(select * FROM "landtagswahlen".direktkandidaten dk WHERE kgs.kandidat_id = dk.direktkandidat_id AND dk.stimmkreis_id = kgs.stimmkreis_id AND dk.wahl_id = kgs.wahl_id)
        AND k.id = kgs.kandidat_id
        GROUP BY kgs.wahl_id, kgs.stimmkreis_id, k.partei_id

    ), zweitstimmen_pro_partei as (
        SELECT zps.wahl_id, zps.stimmkreis_id, zps.partei_id, sum(zps.anzahl) as anzahl
        FROM zweitstimmen_pro_stimmkreis zps
        GROUP BY zps.wahl_id, zps.stimmkreis_id, zps.partei_id
    )
    SELECT zpp.wahl_id, zpp.stimmkreis_id, zpp.partei_id, zpp.anzahl
    FROM zweitstimmen_pro_partei zpp
    WHERE not exists(SELECT * FROM zweitstimmen_pro_partei zpp2 WHERE zpp2.anzahl > zpp.anzahl AND zpp2.wahl_id = zpp.wahl_id AND zpp2.stimmkreis_id = zpp.stimmkreis_id)
     
		 );



