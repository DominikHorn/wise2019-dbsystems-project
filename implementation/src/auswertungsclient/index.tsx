import "babel-polyfill";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { App } from "./App";
import "./index.css";
import { registerMap } from "echarts";
import SK_JSON from "./geojson/stimmkreise.geojson";
registerMap("Stimmkreise", SK_JSON as Object);

// import RB_JSON from "../../../../geojson/regierungsbezirke.geojson";
// registerMap("Regierungsbezirke", RB_JSON as Object);
// const regierungsbezirk_data = [
//   { name: "Oberbayern", value: 0 },
//   { name: "Niederbayern", value: 0 },
//   { name: "Oberpfalz", value: 0 },
//   { name: "Oberfranken", value: 0 },
//   { name: "Mittelfranken", value: 0 },
//   { name: "Unterfranken", value: 0 },
//   { name: "Schwaben", value: 1 }
// ];

// Render application
ReactDOM.render(<App />, document.getElementById("root"));
