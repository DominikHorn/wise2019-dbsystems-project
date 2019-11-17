import { parse, ParseResult } from "papaparse";
import { PoolClient } from "pg";
import { GraphQLFileUpload } from "../../shared/sharedTypes";
import { adapters } from "../adapters/adapterUtil";
import {
  insertDirektkandidat,
  insertKandidat
} from "../adapters/postgres/queries/kandidatPSQL";
import { getOrCreateParteiForIdAndName } from "../adapters/postgres/queries/parteiPSQL";
import { getOrCreateRegierungsbezirkForId } from "../adapters/postgres/queries/regierungsbezirkePSQL";
import { insertGueltigeKandidateVotes } from "../adapters/postgres/queries/stimmenPSQL";
import { getOrCreateStimmkreis } from "../adapters/postgres/queries/stimmkreisPSQL";
import { getOrCreateWahlForDatum } from "../adapters/postgres/queries/wahlenPSQL";
import { IDatabaseKandidat, IDatabaseStimmkreis } from "../databaseEntities";

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
            const stimmkreisCache: {
              [stimmkreisid: number]: IDatabaseStimmkreis;
            } = {};

            let index = -1;
            let stimmenContainer: {
              stimmkreis_ids: number[];
              kandidat_ids: number[];
              wahl_ids: number[];
              gueltig: boolean[];
            } = {
              stimmkreis_ids: [],
              kandidat_ids: [],
              wahl_ids: [],
              gueltig: []
            };

            try {
              for (const row of result.data) {
                index++;
                let kandidat: IDatabaseKandidat;
                // Special cases:
                if (!row[CSV_KEYS.kandidatNr]) {
                  // TODO: Parse 'Zweitstimmen ohne Kennzeichnung eines Bewerbers'
                  // TODO: check if the following are irrelevant: 'Erststimmen insgesamt', 'Zweitstimmen insgesamt', 'Gesamtstimmen'

                  continue;
                }

                // Parsing logic for regular rows (kandidaten row)
                for (const columnKey of Object.keys(row)) {
                  // TODO: this is for debug purposes
                  // console.log(
                  //   `row[${index}]: ${columnKey} -> ${row[columnKey]}`
                  // );
                  switch (columnKey) {
                    case CSV_KEYS.parteiID:
                    case CSV_KEYS.kandidatNr:
                    case CSV_KEYS.finalerListenPlatz:
                    case CSV_KEYS.gewaehltImStimmkreis:
                    case CSV_KEYS.gesamtstimmen:
                    case CSV_KEYS.zweitstimmen:
                      // Ignore irrelevant columns (insert is triggered by other column keys)
                      // NOTE: Fallthrough is intended
                      break;
                    case CSV_KEYS.kandidatName:
                      console.log(
                        "inserting:",
                        row[CSV_KEYS.parteiID],
                        row[CSV_KEYS.kandidatName]
                      );
                      kandidat = await insertKandidat(
                        row[CSV_KEYS.parteiID],
                        row[CSV_KEYS.kandidatName],
                        client
                      );
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
                    case CSV_KEYS.stimmzettelListenPlatz:
                      // TODO
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

                      const voteAmountStr: string = `${row[columnKey]}`.replace(
                        /\./,
                        ""
                      );
                      let voteAmount: number = Number(voteAmountStr);

                      // Insert direktkandidat if field value ends with "*"
                      if (
                        voteAmountStr.charAt(voteAmountStr.length - 1) == "*"
                      ) {
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

                      // Insert stimmen into stimmenContainer, which is then propagated to Stimmengenerator
                      for (let i = 0; i < voteAmount; i++) {
                        stimmenContainer.stimmkreis_ids.push(stimmkreisId);
                        stimmenContainer.kandidat_ids.push(kandidat.id);
                        stimmenContainer.wahl_ids.push(wahl.id);
                        stimmenContainer.gueltig.push(true);
                      }
                      break;
                  }
                }
              }

              // Actually insert votes
              console.log(
                `inserting ${stimmenContainer.wahl_ids.length} tuples`
              );
              await insertGueltigeKandidateVotes(
                stimmenContainer.stimmkreis_ids,
                stimmenContainer.kandidat_ids,
                stimmenContainer.wahl_ids,
                stimmenContainer.gueltig,
                client
              );
            } catch (error) {
              console.error(error);
              reject(error);
            }

            resolve(true);
          })
      })
    )
  );
