import { parse, ParseResult } from "papaparse";
import { PoolClient } from "pg";
import { GraphQLFileUpload } from "../../shared/sharedTypes";
import { adapters } from "../adapters/adapterUtil";
import { getOrCreateWahlForDatum } from "../adapters/postgres/queries/wahlenPSQL";
import { getOrCreateRegierungsbezirkForId } from "../adapters/postgres/queries/regierungsbezirkePSQL";
import { getOrCreateParteiForName } from "../adapters/postgres/queries/parteiPSQL";

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
                for (const columnKey of Object.keys(row)) {
                  // TODO: this is for debug purposes
                  console.log(
                    `row[${index}]: ${columnKey} -> ${row[columnKey]}`
                  );
                  switch (columnKey) {
                    case CSV_KEYS.parteiID:
                      // Ignore parteiId as they are not consistent
                      // across 2013 and 2018 data
                      break;
                    case CSV_KEYS.regierungsbezirkID:
                      await getOrCreateRegierungsbezirkForId(
                        row[columnKey],
                        client
                      );
                      break;
                    case CSV_KEYS.parteiName:
                      await getOrCreateParteiForName(
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
