import * as React from "react";
import ReactPDF, {
  Page,
  Text,
  View,
  Document,
  StyleSheet
} from "@react-pdf/renderer";
import { Button } from "antd";
import { ButtonProps } from "antd/lib/button";

// TODO: styles!
const styles = StyleSheet.create({
  page: {
    flexDirection: "row",
    backgroundColor: "#E4E4E4"
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1
  }
});

export interface IPDFExporterProps {
  readonly buttonText?: string;
  readonly buttonProps?: ButtonProps;
  readonly componentToExport: React.ReactElement;
  readonly filename?: string;
}

export const PDFExporter = (props: IPDFExporterProps) => (
  <Button
    icon={"download"}
    {...props.buttonProps}
    onClick={() => {
      ReactPDF.renderToFile(
        <Document>
          <Page size="A4" style={styles.page}>
            <View style={styles.section}>
              <Text>Exportiertes Ergebnis:</Text>
              {props.componentToExport}
            </View>
          </Page>
        </Document>,
        props.filename ||
          `${window.location.toString()}_export_${new Date()}.pdf`
      );
    }}
  >
    {props.buttonText || "Als PDF Exportieren"}
  </Button>
);
