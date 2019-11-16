import { parse, ParseResult } from "papaparse";
import { PoolClient } from "pg";
import { GraphQLFileUpload } from "../../shared/sharedTypes";
import { adapters } from "../adapters/adapterUtil";
import { getOrCreateWahlForDatum } from "../adapters/postgres/queries/wahlenPSQL";

const regierungsbezirke = {
  901: "Oberbayern",
  902: "Niederbayern",
  903: "Oberpfalz",
  904: "Oberfranken",
  905: "Mittelfranken",
  906: "Unterfranken",
  907: "Schwaben"
};

export async function parseCrawledCSV(
  csv: Promise<GraphQLFileUpload>,
  wahldatum: Date
): Promise<boolean> {
  parse((await csv).createReadStream(), {
    dynamicTyping: true,
    header: true,
    complete: (result: ParseResult) =>
      adapters.postgres.transaction(async (client: PoolClient) => {
        // Attempt to find wahl for wahldatum; Create if none exists
        const wahl = await getOrCreateWahlForDatum(wahldatum, client);
        console.log("WAHL1:", wahl);
      })
  });
  return true;
}

/*
import * as csv from "csv-parser";
import { adapters } from "./adapters/adapterUtil";
import {IDatabaseUser, DatabaseSchemaGroup} from "./databaseEntities";
 

const fs = require('fs');
let results: any[] | string[] = [];



fs.createReadStream('wahl2018_901.csv')
  .pipe(csv())
  .on('data', (data: string) => results.push(data))
  .on('end', () => {
    console.log(results[0]);
    let keys = Object.keys(results[1]);
    //console.log(keys);
    let i: number;
    //if not length-1 then the values from the last iteration all undefined 
    for(i=0; i<results.length-1; i++){
      let j : number;
      for(j=0; j<keys.length; j++){
        let temp: string;
        temp = results[i][keys[j]];

        
        //console.log(temp);
      }
    }
    //console.log(results[1]['darunter Zweitstimmen']);
    // [
    //   { NAME: 'Daffy Duck', AGE: '24' },
    //   { NAME: 'Bugs Bunny', AGE: '22' }
    // ]
  });
 */

// const csvFilePath='wahl2018_901.csv'
// const csv2=require('csvtojson')
// csv2()
// .fromFile(csvFilePath)
// .then((jsonObj: any)=>{
//     //console.log(jsonObj);
//     Object.keys(jsonObj).forEach(function(k){
//       console.log(k + ' - ' + jsonObj[k]);
//   });
//     /**
//      * [
//      * 	{a:"1", b:"2", c:"3"},
//      * 	{a:"4", b:"5". c:"6"}
//      * ]
//      */
// })
