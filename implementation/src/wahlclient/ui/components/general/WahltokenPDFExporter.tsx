import ReactPDF, {
  Document,
  Page,
  pdf,
  StyleSheet,
  Text,
  View,
  Canvas,
  Font
} from "@react-pdf/renderer";
import { Button, message } from "antd";
import * as React from "react";
import { WahlhelferToken } from "../../../../shared/graphql.types";
import { getQRCodeAsSVGPath } from "../../util/qrcode";

const styles = StyleSheet.create({
  body: {
    paddingTop: 35,
    paddingBottom: 65,
    paddingHorizontal: 35
  },
  section: {
    margin: 0,
    padding: 10,
    flexGrow: 1
  },
  header: {
    fontSize: 12,
    marginBottom: 20,
    textAlign: "center",
    color: "grey"
  },
  pageNumber: {
    position: "absolute",
    fontSize: 12,
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "grey"
  },
  text: {
    margin: 12,
    fontSize: 14,
    textAlign: "justify",
    fontFamily: "Times-Roman"
  },
  title: {
    fontSize: 24,
    textAlign: "center"
  },
  watermark: {
    marginVertical: 300,
    marginHorizontal: 20,
    fontSize: 14,
    color: "grey",
    textAlign: "justify"
  },
  qrcodecontainer: {
    display: "flex",
    alignItems: "center"
  },
  qrcode: {
    margin: 12,
    width: "82vw",
    height: "82vw"
  },
  tokencode: {
    marginHorizontal: 12,
    padding: 10,
    fontSize: 11,
    fontFamily: "Courier",
    textAlign: "justify",
    backgroundColor: "#e9e9e9"
  }
});

export interface IPDFExporterProps {
  readonly wahlhelferTokens: WahlhelferToken[];
}

interface IState {
  readonly loading: boolean;
}

export class WahltokenPDFExporter extends React.PureComponent<
  IPDFExporterProps,
  IState
> {
  constructor(props: IPDFExporterProps) {
    super(props);
    this.state = {
      loading: false
    };
  }

  private paintQRCode = (
    painter: any,
    availableWidth: number,
    availableHeight: number,
    value: string
  ): null => {
    const [path, blockcnt] = getQRCodeAsSVGPath(value, "Q");
    const scale = Math.min(availableWidth, availableHeight) / blockcnt;

    // Draw SVG
    painter
      .scale(scale)
      .path(path)
      .fill("black");

    // Quirk of ReactPDF library
    return null;
  };

  private createDoc = (wahlhelferTokens: WahlhelferToken[]) => (
    <Document>
      <Page size="A4" style={styles.body}>
        <Text
          style={styles.header}
          fixed={true}
        >{`Tokens für die Landtagswahl am${
          wahlhelferTokens[0]
            ? ` ${wahlhelferTokens[0].wahl.wahldatum.toLocaleDateString()}`
            : ""
        } (Generiert am ${new Date().toLocaleDateString()})`}</Text>

        <Text style={styles.watermark}>
          Sehr geehrte(r) WahlleiterIn, bitte lassen Sie den jeweiligen
          Zugangsberechtigten Personen die entsprechende Seite aus dem folgenden
          Dokument zukommen.
        </Text>

        {wahlhelferTokens.length > 0 ? (
          wahlhelferTokens.map((token, index) => (
            <View break={true} key={index}>
              <Text style={styles.title}>
                {`${token.stimmkreis.id}. ${token.stimmkreis.name}`}
              </Text>
              <Text style={styles.text}>
                Sehr geehrte WahlhelferInnen, Bei diesem Dokument handelt es
                sich um ein für Sie vom Landeswahlleiter generiertes
                Authentifizierungstoken, welches Sie benutzen können um sich als
                WahlhelferInn zu identifizieren um im Weiteren Wahlkabinen zu
                registrieren und individuell freizuschalten. Scannen Sie bitte
                hierfür an Ihrem steuerungs-PC den folgenden QR-Code:
              </Text>
              <View style={styles.qrcodecontainer}>
                <Canvas
                  paint={(painter, width, height) =>
                    this.paintQRCode(painter, width, height, token.token)
                  }
                  style={styles.qrcode}
                />
              </View>
              <Text
                style={styles.tokencode}
                hyphenationCallback={Number.MAX_SAFE_INTEGER}
              >
                {token.token}
              </Text>
            </View>
          ))
        ) : (
          <Text>
            Es wurden keine Wahlhelfertokens übergeben. Bitte wenden Sie sich an
            eine Kompetente IT Fachkraft Ihrer Wahl
          </Text>
        )}

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          }
          fixed={true}
        />
      </Page>
    </Document>
  );

  render() {
    return (
      <Button
        icon={"download"}
        type={"primary"}
        loading={this.state.loading}
        onClick={() =>
          this.setState({ loading: true }, () =>
            setTimeout(
              () =>
                pdf(this.createDoc(this.props.wahlhelferTokens))
                  .toBlob()
                  .then(blob => {
                    // Obtain URL
                    const url = window.URL.createObjectURL(blob);

                    // Open PDF in new tab
                    window.open(url, "_blank");

                    // Download PDF automatically
                    // const link = document.createElement("a");
                    // link.href = url;
                    // link.download = `wahltoken_${new Date().toLocaleDateString()}.pdf`;
                    // link.click();
                    // setTimeout(() => window.URL.revokeObjectURL(url), 100);
                  })
                  .catch(err => {
                    message.error(`PDF Export fehlgeschlagen: ${err.message}`);
                  })
                  .finally(() => this.setState({ loading: false })),
              1
            )
          )
        }
      >
        {"Als PDF Exportieren"}
      </Button>
    );
  }
}
