import { Card } from "antd";
import * as React from "react";
import { RouteComponentProps } from "react-router";
import { WahlSelector } from "../general/WahlSelector";
import { compose } from "react-apollo";
import {
  IGetAllWahlenQueryHocProps,
  withAllWahlenQuery
} from "../../../../client-graphql/public/getAllWahlenQuery";

export interface IErgebnissePageProps {
  routeProps: RouteComponentProps<any>;
}

interface IProps extends IErgebnissePageProps, IGetAllWahlenQueryHocProps {}

const ErgebnissePageComponent = (props: IErgebnissePageProps) => (
  <Card
    title={
      <>
        {"Ergebnisse der Landtagswahl: "}
        <WahlSelector />
      </>
    }
    style={{ minHeight: "100%" }}
    hoverable={true}
  >
    <div>TEST</div>
  </Card>
);

const ErgebnissePageComponentWithQueries = compose(withAllWahlenQuery())(
  ErgebnissePageComponent
);

export const ErgebnissePage = ErgebnissePageComponentWithQueries as React.ComponentType<
  IErgebnissePageProps
>;
