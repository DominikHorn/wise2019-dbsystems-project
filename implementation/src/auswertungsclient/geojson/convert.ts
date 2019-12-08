import SK_JSON from "./mapshaper_stimmkreise.geojson";

export function convert_stimmkreis_json() {
  const obj = JSON.parse(SK_JSON);
  const sk_data = {
    ...obj,
    features: obj.features.map((feature: any) => {
      const xscale = 350000;
      const yscale = 450000;

      const coordmap = (coord: [number, number]) => [
        coord[0] / xscale,
        coord[1] / yscale
      ];

      const geometry = {
        ...feature.geometry
      };
      switch (feature.geometry.type) {
        case "Polygon":
          geometry.coordinates = feature.geometry.coordinates.map(
            (coordinates: any) => coordinates.map(coordmap)
          );
          break;
        case "MultiPolygon":
          geometry.coordinates = feature.geometry.coordinates.map(
            (coordinates: any) => [coordinates[0].map(coordmap)]
          );
          break;
        default:
          console.error("Invalid geometry type: ", feature.geometry.type);
      }

      return {
        ...feature,
        geometry,
        properties: {
          // ...feature.properties,
          ID_0: feature.properties.SKR_NR,
          name: feature.properties.SKR_NAME
          // X_LABEL: feature.properties.X_LABEL / xscale,
          // Y_LABEL: feature.properties.Y_LABEL / yscale
        }
      };
    })
  };
  console.log(sk_data);
}
