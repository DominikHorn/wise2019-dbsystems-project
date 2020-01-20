import ReactPDF, {
  Document,
  Page,
  pdf,
  StyleSheet,
  Text,
  View,
  Canvas
} from "@react-pdf/renderer";
import { Button } from "antd";
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
  qrrow: {
    flexDirection: "row",
    backgroundColor: "#E4E4E4",
    marginBottom: 10
  },
  qrcol: {
    flexGrow: 1
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

  private paintQRCode = (painter: any, value: string): null => {
    // Draw SVG
    painter
      .scale(1.2)
      .path(getQRCodeAsSVGPath(value, "Q"))
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

        {wahlhelferTokens.length > 0 ? (
          wahlhelferTokens.map((token, index) => (
            <View break={true}>
              <View style={styles.qrrow} key={index}>
                <Canvas
                  paint={painter => this.paintQRCode(painter, token.token)}
                  style={{ width: "2cm", height: "2cm" }}
                />
                <Text
                  style={styles.text}
                >{`${token.stimmkreis.id}. ${token.stimmkreis.name}`}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text>Fehler</Text>
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
                    const url = window.URL.createObjectURL(blob);
                    // Open PDF in new tab
                    window.open(url, "_blank");

                    // Download PDF automatically
                    // const link = document.createElement("a");
                    // link.href = url;
                    // link.download = `wahltoken_${new Date().toLocaleDateString()}.pdf`;
                    // link.click();
                    // setTimeout(() => window.URL.revokeObjectURL(url), 100);

                    this.setState({ loading: false });
                  }),
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
