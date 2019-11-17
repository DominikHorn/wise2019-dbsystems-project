import { parse, ParseResult } from "papaparse";
import { PoolClient } from "pg";
import { GraphQLFileUpload } from "../../shared/sharedTypes";
import { adapters } from "../adapters/adapterUtil";
import { insertKandidat } from "../adapters/postgres/queries/kandidatPSQL";
import { getOrCreateParteiForIdAndName } from "../adapters/postgres/queries/parteiPSQL";
import { getOrCreateRegierungsbezirkForId } from "../adapters/postgres/queries/regierungsbezirkePSQL";
import { getOrCreateWahlForDatum } from "../adapters/postgres/queries/wahlenPSQL";
import { IDatabaseKandidat } from "../databaseEntities";

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

export const parseCrawledCSV = async (
  csvPromise: Promise<GraphQLFileUpload>,
  wahldatum: Date
): Promise<boolean> =>
  new Promise((resolve, reject) =>
    csvPromise.then(csv =>
      parse(csv.createReadStream(), {
        dynamicTyping: true,
        header: true,
        complete: (result: ParseResult) =>
          adapters.postgres.transaction(async (client: PoolClient) => {
            // Attempt to find wahl for wahldatum; Create if none exists
            const wahl = await getOrCreateWahlForDatum(wahldatum, client);

            let index = -1;
            try {
              for (const row of result.data) {
                index++;
                let kandidat: IDatabaseKandidat;
                for (const columnKey of Object.keys(row)) {
                  // TODO: this is for debug purposes
                  console.log(
                    `row[${index}]: ${columnKey} -> ${row[columnKey]}`
                  );
                  switch (columnKey) {
                    case CSV_KEYS.parteiID:
                    case CSV_KEYS.kandidatNr:
                      // Ignore irrelevant columns (insert is triggered by other column keys)
                      // NOTE: Fallthrough is intended
                      break;
                    case CSV_KEYS.kandidatName:
                      // Special cases:
                      if (!row[CSV_KEYS.kandidatNr]) {
                        // TODO: Parse 'Zweitstimmen ohne Kennzeichnung eines Bewerbers'
                        // TODO: check if the following are irrelevant: 'Erststimmen insgesamt', 'Zweitstimmen insgesamt', 'Gesamtstimmen'
                      } else {
                        kandidat = await insertKandidat(
                          row[CSV_KEYS.parteiID],
                          row[CSV_KEYS.parteiName],
                          client
                        );
                      }
                      break;
                    case CSV_KEYS.regierungsbezirkID:
                      await getOrCreateRegierungsbezirkForId(
                        row[columnKey],
                        client
                      );
                      break;
                    case CSV_KEYS.parteiName:
                      await getOrCreateParteiForIdAndName(
                        row[CSV_KEYS.parteiID],
                        row[CSV_KEYS.parteiName],
                        client
                      );
                      break;
                    default:
                      // Stimmkreis row! -> Stimmgenerator anmachen.
                      break;
                  }
                }
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
