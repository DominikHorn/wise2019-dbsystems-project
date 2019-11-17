import { parse, ParseResult } from "papaparse";
import { PoolClient } from "pg";
import { GraphQLFileUpload } from "../../shared/sharedTypes";
import { adapters } from "../adapters/adapterUtil";
import {
  insertKandidat,
  insertDirektkandidat
} from "../adapters/postgres/queries/kandidatPSQL";
import { getOrCreateParteiForIdAndName } from "../adapters/postgres/queries/parteiPSQL";
import { getOrCreateRegierungsbezirkForId } from "../adapters/postgres/queries/regierungsbezirkePSQL";
import {
  insertKandidateVotes,
  insertListenVotes
} from "../adapters/postgres/queries/stimmenPSQL";
import {
  getOrCreateStimmkreis,
  insertAnzahlStimmberechtigte
} from "../adapters/postgres/queries/stimmkreisPSQL";
import { getOrCreateWahlForDatum } from "../adapters/postgres/queries/wahlenPSQL";
import {
  IDatabaseKandidat,
  IDatabaseStimmkreis,
  IDatabaseWahl
} from "../databaseEntities";
import { insertListeneintrag } from "../adapters/postgres/queries/listenPSQL";

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
  stimmberechtigte = "Stimmberechtigte"
}

async function parseCrawledCSV(
  result: ParseResult,
  client: PoolClient,
  wahl: IDatabaseWahl
) {
  const stimmkreisCache: {
    [stimmkreisid: number]: IDatabaseStimmkreis;
  } = {};

  let kandidatStimmenQueryString = "";
  let listenStimmenQueryString = "";

  for (const row of result.data) {
    let kandidat: IDatabaseKandidat;
    // Special cases:
    if (!row[CSV_KEYS.kandidatNr]) {
      // TODO: check if the following are irrelevant: 'Erststimmen insgesamt', 'Zweitstimmen insgesamt', 'Gesamtstimmen'

      if (
        row[CSV_KEYS.kandidatName] ==
        "Zweitstimmen ohne Kennzeichnung eines Bewerbers"
      ) {
        for (const columnKey of Object.keys(row)) {
          switch (columnKey) {
            case CSV_KEYS.parteiID:
            case CSV_KEYS.kandidatNr:
            case CSV_KEYS.finalerListenPlatz:
            case CSV_KEYS.gewaehltImStimmkreis:
            case CSV_KEYS.gesamtstimmen:
            case CSV_KEYS.zweitstimmen:
            case CSV_KEYS.kandidatName:
            case CSV_KEYS.regierungsbezirkID:
            case CSV_KEYS.parteiName:
            case CSV_KEYS.stimmzettelListenPlatz:
            default:
              // Stimmkreis column with key: "_,_,_;  ______", e.g. "901; Fürstenfeldbruck"
              const stimmkreisId = Number(columnKey.slice(0, 3));
              const parteiId = row[CSV_KEYS.parteiID];
              const voteAmount = Number(`${row[columnKey]}`.replace(/\./, ""));

              // Insert statement for stimmen
              if (isNaN(stimmkreisId) || isNaN(wahl.id) || isNaN(parteiId))
                continue;
              const newQueryString = `SELECT unnest(array_fill(${stimmkreisId}, ARRAY[${voteAmount},1])), unnest(array_fill(${wahl.id}, ARRAY[${voteAmount},1])), unnest(array_fill(${parteiId}, ARRAY[${voteAmount},1])), unnest(array_fill(true, ARRAY[${voteAmount},1]))`;
              listenStimmenQueryString +=
                (listenStimmenQueryString ? "\nUNION ALL\n" : "") +
                newQueryString;
              break;
          }
        }
        await insertListenVotes(listenStimmenQueryString, client);
        listenStimmenQueryString = "";
      }
      continue;
    }

    console.log(
      "processing:",
      row[CSV_KEYS.parteiID],
      row[CSV_KEYS.kandidatName]
    );

    await getOrCreateRegierungsbezirkForId(
      row[CSV_KEYS.regierungsbezirkID],
      client
    );
    await getOrCreateParteiForIdAndName(
      row[CSV_KEYS.parteiID],
      row[CSV_KEYS.parteiName],
      client
    );
    kandidat = await insertKandidat(
      row[CSV_KEYS.parteiID],
      row[CSV_KEYS.kandidatName],
      client
    );

    // Parsing logic for regular rows (kandidaten row)
    for (const columnKey of Object.keys(row)) {
      // TODO: rewrite without switch/case
      switch (columnKey) {
        case CSV_KEYS.parteiID:
        case CSV_KEYS.finalerListenPlatz:
        case CSV_KEYS.gewaehltImStimmkreis:
        case CSV_KEYS.gesamtstimmen:
        case CSV_KEYS.zweitstimmen:
        case CSV_KEYS.kandidatName:
        case CSV_KEYS.parteiName:
        case CSV_KEYS.regierungsbezirkID:
          // Ignore irrelevant columns (insert is triggered by other column keys)
          // NOTE: Fallthrough is intended
          break;
        case CSV_KEYS.kandidatNr:
          if (row[CSV_KEYS.stimmzettelListenPlatz]) continue;
        case CSV_KEYS.stimmzettelListenPlatz:
          const regierungsbezirkId = row[CSV_KEYS.regierungsbezirkID];
          const wahl_id = wahl.id;
          const kandidatId = kandidat.id;
          const initialerListenplatz =
            row[CSV_KEYS.stimmzettelListenPlatz] || row[CSV_KEYS.kandidatNr];
          await insertListeneintrag(
            kandidatId,
            wahl_id,
            regierungsbezirkId,
            initialerListenplatz,
            client
          );
          break;
        default:
          // Stimmkreis column with key: "_,_,_;  ______", e.g. "901; Fürstenfeldbruck"
          const stimmkreisId = Number(columnKey.slice(0, 3));
          const stimmkreisName = columnKey.slice(3).trim();
          const stimmkreis =
            stimmkreisCache[stimmkreisId] ||
            (await getOrCreateStimmkreis(
              stimmkreisId,
              stimmkreisName,
              row[CSV_KEYS.regierungsbezirkID],
              client
            ));
          stimmkreisCache[stimmkreisId] = stimmkreis;

          const voteAmountStr: string = `${row[columnKey]}`.replace(/\./, "");
          let voteAmount: number = Number(voteAmountStr);

          // Insert direktkandidat if field value ends with "*"
          if (voteAmountStr.charAt(voteAmountStr.length - 1) == "*") {
            await insertDirektkandidat(
              stimmkreisId,
              wahl.id,
              kandidat.id,
              client
            );
            voteAmount = Number(
              voteAmountStr.substr(0, voteAmountStr.length - 1)
            );
          }

          // Insert statement for stimmen
          if (isNaN(stimmkreisId) || isNaN(kandidat.id) || isNaN(wahl.id))
            continue;
          const newQueryString = `SELECT unnest(array_fill(${stimmkreisId}, ARRAY[${voteAmount},1])), unnest(array_fill(${kandidat.id}, ARRAY[${voteAmount},1])), unnest(array_fill(${wahl.id}, ARRAY[${voteAmount},1])), unnest(array_fill(true, ARRAY[${voteAmount},1]))`;
          kandidatStimmenQueryString +=
            (kandidatStimmenQueryString ? "\nUNION ALL\n" : "") +
            newQueryString;
          break;
      }
    }
    // Actually insert votes
    await insertKandidateVotes(kandidatStimmenQueryString, client);
    kandidatStimmenQueryString = "";
  }
}

async function parseInfoCSV(
  result: ParseResult,
  client: PoolClient,
  wahl: IDatabaseWahl
) {
  for (const row of result.data) {
    const stimmkreis_id = row[INFO_CSV_KEYS.stimmkreisID];
    const anzahlWahlberechtigte = row[INFO_CSV_KEYS.stimmberechtigte];
    await insertAnzahlStimmberechtigte(
      stimmkreis_id,
      wahl.id,
      anzahlWahlberechtigte,
      client
    );
  }
}

export const parseCSV = async (
  csvPromise: Promise<GraphQLFileUpload>,
  wahldatum: Date
): Promise<boolean> =>
  new Promise((resolve, reject) =>
    csvPromise.then(csv =>
      parse(csv.createReadStream(), {
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
        complete: (result: ParseResult) =>
          adapters.postgres.transaction(async (client: PoolClient) => {
            // Attempt to find wahl for wahldatum; Create if none exists
            const wahl = await getOrCreateWahlForDatum(wahldatum, client);

            try {
              if (!result.meta.fields) {
                reject("CSV Does not appear to contain columns");
                return;
              }
              if (result.meta.fields[0] == INFO_CSV_KEYS.stimmkreisID) {
                // Special info pdf
                await parseInfoCSV(result, client, wahl);
              } else {
                // Crawled format
                await parseCrawledCSV(result, client, wahl);
              }
            } catch (error) {
              console.error(error);
              reject(error);
            }

            resolve(true);
          })
      })
    )
  );
