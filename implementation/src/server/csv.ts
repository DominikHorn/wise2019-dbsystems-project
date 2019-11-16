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

