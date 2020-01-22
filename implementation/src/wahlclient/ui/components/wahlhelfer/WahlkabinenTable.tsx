import * as React from "react";
import { compose } from "react-apollo";
import {
  withRegisteredWahlkabinen,
  QueryToGetRegisteredWahlkabinenHOCProps
} from "../../../../client-graphql/wahlkabine/getRegisteredWahlkabinenQuery";
import {
  withRegisterWahlkabineMutation,
  MutationToRegisterWahlkabineHOCProps
} from "../../../../client-graphql/wahlkabine/registerWahlkabineMutation";
import { Table, Row, Col, Button } from "antd";
import {
  withRemoveWahlkabineMutation,
  MutationToRemoveWahlkabineHOCProps
} from "../../../../client-graphql/wahlkabine/removeWahlkabineMutation";

export interface IWahlkabinenTableProps {
  readonly wahlhelferAuth: string;
}

interface IProps
  extends IWahlkabinenTableProps,
    QueryToGetRegisteredWahlkabinenHOCProps,
    MutationToRegisterWahlkabineHOCProps,
    MutationToRemoveWahlkabineHOCProps {}

class WahlkabinenTableComponent extends React.PureComponent<IProps> {
  render() {
    const { registeredWahlkabinenData } = this.props;
    if (!registeredWahlkabinenData) return <></>;

    return (
      <Table
        size={"small"}
        title={() => (
          <Row type={"flex"} gutter={[16, 16]} align={"middle"}>
            <Col>Authorisierte Wahlkabinen</Col>
            <Col>
              <Button icon={"plus"} type={"primary"}>
                Neue Wahlkabine Authorisieren
              </Button>
            </Col>
          </Row>
        )}
        loading={registeredWahlkabinenData.loading}
        columns={[
          { title: "Label", key: "label", dataIndex: "label" },
          {
            title: "Manage",
            key: "manage",
            render: wahlkabine => (
              <Row
                type={"flex"}
                gutter={[8, 8]}
                justify={"center"}
                align={"middle"}
              >
                <Col>
                  <Button type={"danger"} icon={"delete"} />
                </Col>
              </Row>
            )
          }
        ]}
        dataSource={registeredWahlkabinenData.wahlkabinen}
      />
    );
  }
}

const WahlkabinenTableWithQueries = compose(
  withRegisterWahlkabineMutation(),
  withRemoveWahlkabineMutation(),
  withRegisteredWahlkabinen<IWahlkabinenTableProps>(p => p.wahlhelferAuth)
)(WahlkabinenTableComponent);

export const WahlkabinenTable = WahlkabinenTableWithQueries as React.ComponentType<
  IWahlkabinenTableProps
>;
