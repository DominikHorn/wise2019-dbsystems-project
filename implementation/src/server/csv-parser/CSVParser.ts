import { parse, ParseResult } from "papaparse";
import { PoolClient, Pool } from "pg";
import { GraphQLFileUpload } from "../../shared/sharedTypes";
import { adapters } from "../adapters/adapterUtil";
import {
  insertDirektkandidat,
  getOrCreateKandidatForParteiIdAndName
} from "../adapters/postgres/kandidatPSQL";
import { getOrCreateParteiForIdAndName } from "../adapters/postgres/parteiPSQL";
import { getOrCreateRegierungsbezirkForId } from "../adapters/postgres/regierungsbezirkePSQL";
import {
  VoteType,
  bulkInsertVotes,
  deferVotesConstraints
} from "../adapters/postgres/stimmenPSQL";
import {
  getOrCreateStimmkreis,
  insertStimmkreisInfo
} from "../adapters/postgres/stimmkreisPSQL";
import { getOrCreateWahlForDatum } from "../adapters/postgres/wahlenPSQL";
import {
  IDatabaseKandidat,
  IDatabaseStimmkreis,
  IDatabaseWahl,
  DatabaseSchemaGroup
} from "../databaseEntities";
import { insertListeneintrag } from "../adapters/postgres/listenPSQL";
import { ReadStream } from "fs";

enum CSV_KEYS {
  regierungsbezirkID = "regierungsbezirk-id",
  parteiID = "partei-id",
  parteiName = "partei-name",
  kandidatNr = "Nr.",
  kandidatName = "Name",
  stimmzettelListenPlatz = "SZ.- Rf.1)",
  finalerListenPlatz = "PL.- Nr.2)",
  gewaehltImStimmkreis = "G3)",
  gesamtstimmen = "Gesamtstimmen",
  zweitstimmen = "darunter Zweitstimmen"
}
enum INFO_CSV_KEYS {
  stimmkreisID = "Schlüsselnummer",
  waehler = "Wähler",
  stimmberechtigte = "Stimmberechtigte",
  ungueltige_erstimmen = "ungueltige Erststimmen 2018",
  ungueltige_zweitstimmen = "ungueltige Zweitstimmen 2018"
}

async function parseCrawledCSV(
  result: ParseResult,
  wahl: IDatabaseWahl,
  aggregiert: boolean,
  client?: PoolClient
) {
  if (!aggregiert && client) {
    // Remove indices and foreign key constraints
    deferVotesConstraints(client);
  }

  const stimmkreisCache: {
    [stimmkreisid: number]: IDatabaseStimmkreis;
  } = {};

  let kandidatEinzelVotes: VoteType[] = [];
  let kandidatAggregiertVotes: VoteType[] = [];
  const sendInsertVotesRequest = async () => {
    if (kandidatEinzelVotes.length > 0) {
      await bulkInsertVotes(
        ["stimmkreis_id", "kandidat_id", "wahl_id"],
        "einzel_gueltige_kandidatgebundene_stimmen",
        kandidatEinzelVotes,
        client
      );
      kandidatEinzelVotes = [];
    }
    if (kandidatAggregiertVotes.length > 0) {
      await bulkInsertVotes(
        ["stimmkreis_id", "kandidat_id", "wahl_id", "anzahl"],
        "aggregiert_gueltige_kandidatgebundene_stimmen",
        kandidatAggregiertVotes,
        client
      );
      kandidatAggregiertVotes = [];
    }
  };

  let listenEinzelVotes: VoteType[] = [];
  let listenAggregiertVotes: VoteType[] = [];
  const sendInsertListVotesRequest = async () => {
    if (listenEinzelVotes.length > 0) {
      await bulkInsertVotes(
        ["stimmkreis_id", "wahl_id", "partei_id"],
        "einzel_gueltige_listengebundene_stimmen",
        listenEinzelVotes,
        client
      );
      listenEinzelVotes = [];
    }
    if (listenAggregiertVotes.length > 0) {
      await bulkInsertVotes(
        ["stimmkreis_id", "wahl_id", "partei_id", "anzahl"],
        "aggregiert_gueltige_listengebundene_stimmen",
        listenAggregiertVotes,
        client
      );
      listenAggregiertVotes = [];
    }
  };

  console.log(`CSV-Parser: parsing ${result.data.length} rows`);
  for (const row of result.data) {
    let kandidat: IDatabaseKandidat = null;
    // Special case, row with zweitstimmen for liste
    if (!row[CSV_KEYS.kandidatNr]) {
      if (
        row[CSV_KEYS.kandidatName] ==
        "Zweitstimmen ohne Kennzeichnung eines Bewerbers"
      ) {
        for (const columnKey of Object.keys(row)) {
          if ((Object.values(CSV_KEYS) as string[]).includes(columnKey))
            continue;

          // Stimmkreis column with key: "_,_,_;  ______", e.g. "901; Fürstenfeldbruck"
          const stimmkreisId = Number(columnKey.slice(0, 3));
          const parteiId = row[CSV_KEYS.parteiID];
          const voteAmount = Number(`${row[columnKey]}`.replace(/\./, ""));

          // Insert statement for stimmen
          if (isNaN(stimmkreisId) || isNaN(wahl.id) || isNaN(parteiId))
            continue;
          if (aggregiert) {
            listenAggregiertVotes.push({
              values: [stimmkreisId, wahl.id, parteiId, voteAmount],
              quantity: 1
            });
          } else {
            listenEinzelVotes.push({
              values: [stimmkreisId, wahl.id, parteiId],
              quantity: voteAmount
            });
          }
        }
      }
      continue;
    }

    const regierungsbezirkId = row[CSV_KEYS.regierungsbezirkID];
    const parteiId = row[CSV_KEYS.parteiID];
    const parteiName = row[CSV_KEYS.parteiName];
    const kandidatName = row[CSV_KEYS.kandidatName];
    const initialerListenplatz =
      row[CSV_KEYS.stimmzettelListenPlatz] || row[CSV_KEYS.kandidatNr];

    await getOrCreateRegierungsbezirkForId(regierungsbezirkId, client);
    await getOrCreateParteiForIdAndName(parteiId, parteiName, client);
    kandidat = await getOrCreateKandidatForParteiIdAndName(
      parteiId,
      kandidatName,
      client
    );
    await insertListeneintrag(
      kandidat.id,
      wahl.id,
      regierungsbezirkId,
      initialerListenplatz,
      client
    );

    // Parsing logic for regular rows (kandidaten row)
    for (const columnKey of Object.keys(row)) {
      if ((Object.values(CSV_KEYS) as string[]).includes(columnKey)) continue;

      // Stimmkreis column with key: "_,_,_;  ______", e.g. "901; Fürstenfeldbruck"
      const stimmkreisId = Number(columnKey.slice(0, 3));
      const stimmkreisName = columnKey.slice(3).trim();
      const stimmkreis =
        stimmkreisCache[stimmkreisId] ||
        (await getOrCreateStimmkreis(
          stimmkreisId,
          stimmkreisName,
          regierungsbezirkId,
          client
        ));
      stimmkreisCache[stimmkreisId] = stimmkreis;

      const voteQuantityStr: string = `${row[columnKey]}`.replace(/\./, "");
      let voteQuantity: number = Number(voteQuantityStr);

      // Insert direktkandidat if field value ends with "*"
      if (voteQuantityStr.charAt(voteQuantityStr.length - 1) == "*") {
        await insertDirektkandidat(stimmkreisId, wahl.id, kandidat.id, client);
        voteQuantity = Number(
          voteQuantityStr.substr(0, voteQuantityStr.length - 1)
        );
      }

      // Insert statement for stimmen
      if (isNaN(stimmkreisId) || isNaN(kandidat.id) || isNaN(wahl.id)) continue;
      if (aggregiert) {
        kandidatAggregiertVotes.push({
          values: [stimmkreisId, kandidat.id, wahl.id, voteQuantity],
          quantity: 1
        });
      } else {
        kandidatEinzelVotes.push({
          values: [stimmkreisId, kandidat.id, wahl.id],
          quantity: voteQuantity
        });
      }
    }
  }
  console.log("CSV-Parser: done parsing rows");

  await sendInsertVotesRequest();
  await sendInsertListVotesRequest();
}

async function parseInfoCSV(
  result: ParseResult,
  wahl: IDatabaseWahl,
  aggregiert: boolean,
  client?: PoolClient
) {
  for (const row of result.data) {
    const stimmkreis_id = row[INFO_CSV_KEYS.stimmkreisID];
    const anzahlWahlberechtigte = row[INFO_CSV_KEYS.stimmberechtigte];
    const anzahlWaehler = row[INFO_CSV_KEYS.waehler];
    const erstvoteAmountStr = row[INFO_CSV_KEYS.ungueltige_erstimmen];
    const zweitvoteAmountStr = row[INFO_CSV_KEYS.ungueltige_zweitstimmen];
    const erstvoteAmount = Number(erstvoteAmountStr);
    const zweitvoteAmount = Number(zweitvoteAmountStr);

    let ungueltigeEinzelErstVotes: VoteType[] = [];
    let ungueltigeAggregiertErstVotes: VoteType[] = [];
    let ungueltigeEinzelZweitVotes: VoteType[] = [];
    let ungueltigeAggregiertZweitVotes: VoteType[] = [];

    await insertStimmkreisInfo(
      stimmkreis_id,
      wahl.id,
      anzahlWahlberechtigte,
      anzahlWaehler,
      client
    );
    // insert ungueltige erstimmen
    if (aggregiert) {
      ungueltigeAggregiertErstVotes.push({
        values: [stimmkreis_id, wahl.id, erstvoteAmount],
        quantity: 1
      });
    } else {
      ungueltigeEinzelErstVotes.push({
        values: [stimmkreis_id, wahl.id],
        quantity: erstvoteAmount
      });
    }
    if (ungueltigeAggregiertErstVotes.length > 0) {
      await bulkInsertVotes(
        ["stimmkreis_id", "wahl_id", "anzahl"],
        "aggregiert_ungueltige_erststimmen",
        ungueltigeAggregiertErstVotes,
        client
      );
      ungueltigeAggregiertErstVotes = [];
    }
    if (ungueltigeEinzelErstVotes.length > 0) {
      await bulkInsertVotes(
        ["stimmkreis_id", "wahl_id"],
        "einzel_ungueltige_erststimmen",
        ungueltigeEinzelErstVotes,
        client
      );
      ungueltigeEinzelErstVotes = [];
    }
    // insert ungueltige zweitstimmen
    if (aggregiert) {
      ungueltigeAggregiertZweitVotes.push({
        values: [stimmkreis_id, wahl.id, zweitvoteAmount],
        quantity: 1
      });
    } else {
      ungueltigeEinzelZweitVotes.push({
        values: [stimmkreis_id, wahl.id],
        quantity: zweitvoteAmount
      });
    }
    if (ungueltigeAggregiertZweitVotes.length > 0) {
      await bulkInsertVotes(
        ["stimmkreis_id", "wahl_id", "anzahl"],
        "aggregiert_ungueltige_zweitstimmen",
        ungueltigeAggregiertZweitVotes,
        client
      );
      ungueltigeAggregiertZweitVotes = [];
    }
    if (ungueltigeEinzelZweitVotes.length > 0) {
      await bulkInsertVotes(
        ["stimmkreis_id", "wahl_id"],
        "einzel_ungueltige_zweitstimmen",
        ungueltigeEinzelZweitVotes,
        client
      );
      ungueltigeEinzelZweitVotes = [];
    }
  }
}

export const parseCSV = async (
  csvReadStream: ReadStream,
  wahldatum: Date,
  aggregiert: boolean,
  client?: PoolClient
): Promise<boolean> =>
  new Promise((resolve, reject) =>
    parse(csvReadStream, {
      dynamicTyping: (field: string | number) => {
        switch (field) {
          case CSV_KEYS.regierungsbezirkID:
          case CSV_KEYS.parteiID:
          case CSV_KEYS.kandidatNr:
          case CSV_KEYS.stimmzettelListenPlatz:
          case CSV_KEYS.finalerListenPlatz:
          case CSV_KEYS.gesamtstimmen:
          case CSV_KEYS.zweitstimmen:
            return true;
        }

        return false;
      },
      header: true,
      complete: async (result: ParseResult) => {
        // Attempt to find wahl for wahldatum; Create if none exists
        const wahl = await getOrCreateWahlForDatum(wahldatum, client);
        try {
          if (!result.meta.fields) {
            reject("CSV Does not appear to contain columns");
            return;
          }
          if (result.meta.fields[0] == INFO_CSV_KEYS.stimmkreisID) {
            // Special info pdf
            await parseInfoCSV(result, wahl, aggregiert, client);
          } else {
            // Crawled format
            await parseCrawledCSV(result, wahl, aggregiert, client);
          }
        } catch (error) {
          console.error(error);
          reject(error);
        }

        resolve(true);
      }
    })
  );
