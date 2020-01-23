import * as React from "react";

export const Rechtsbehelfsbelehrung = () => (
  <>
    <h2>
      Bitte nehmen Sie vor der Stimmabgabe die Rechtsgrundlage zur Kenntnis:
    </h2>
    <iframe
      src={
        "https://www.gesetze-bayern.de/Content/Document/BayLWG/True?view=Print"
      }
      style={{
        width: "100%",
        height: "calc(100vh - 237px)",
        border: "1px dashed gray"
      }}
      // Disable all javascript etc on subpage (stop print popup and other shenaniganz)
      sandbox={""}
      frameBorder={0}
    />
  </>
);
