import { Col, Row } from "antd";
import * as React from "react";
import { compose } from "react-apollo";
import {
  IGetAllStimmkreiseQueryHocProps,
  withAllStimmkreiseQuery
} from "../../../../../client-graphql/public/getAllStimmkreiseQuery";
import { Stimmkreis, Wahl } from "../../../../../shared/graphql.types";
import { renderLoading } from "../../../../../wahlclient/ui/guiUtil";
import { renderInfo } from "../../../guiUtil";
import { StimmkreisSelector } from "../dataselectors/StimmkreisSelector";
import { StimmkreisInfoQ7Table } from "./StimmkreisInfoQ7Table";

interface IState {
  readonly selectedStimmkreis1?: Stimmkreis;
  readonly selectedStimmkreis2?: Stimmkreis;
  readonly selectedStimmkreis3?: Stimmkreis;
  readonly selectedStimmkreis4?: Stimmkreis;
  readonly selectedStimmkreis5?: Stimmkreis;
}

export interface InnerStimmkreisInfoQ7Props {
  readonly wahl: Wahl;
  readonly previousWahl: Wahl;
}

interface IProps
  extends InnerStimmkreisInfoQ7Props,
    IGetAllStimmkreiseQueryHocProps {}

class InnerStimmkreisInfoQ7Component extends React.PureComponent<
  IProps,
  IState
> {
  constructor(props: IProps) {
    super(props);
    this.state = {};
  }

  render() {
    const { allStimmkreiseData } = this.props;
    return (
      <div>
        {this.props.wahl && this.props.previousWahl ? (
          <>
            <Row gutter={5}>
              <Col span={7}>
                1. Stimmkreis:
                <StimmkreisSelector
                  displayLoading={allStimmkreiseData.loading}
                  selectedStimmkreis={this.state.selectedStimmkreis1}
                  selectableStimmkreise={allStimmkreiseData.allStimmkreise}
                  onSelectStimmkreis={(newStimmkreis: Stimmkreis) =>
                    this.setState({ selectedStimmkreis1: newStimmkreis })
                  }
                  selectDefaultStimmkreis={false}
                  size={"small"}
                />
              </Col>
              <Col span={7}>
                2. Stimmkreis:
                <StimmkreisSelector
                  displayLoading={allStimmkreiseData.loading}
                  selectedStimmkreis={this.state.selectedStimmkreis2}
                  selectableStimmkreise={allStimmkreiseData.allStimmkreise}
                  onSelectStimmkreis={(newStimmkreis: Stimmkreis) =>
                    this.setState({ selectedStimmkreis2: newStimmkreis })
                  }
                  selectDefaultStimmkreis={false}
                  size={"small"}
                />
              </Col>
            </Row>
            <Row gutter={5}>
              <Col span={7}>
                3. Stimmkreis:
                <StimmkreisSelector
                  displayLoading={allStimmkreiseData.loading}
                  selectedStimmkreis={this.state.selectedStimmkreis3}
                  selectableStimmkreise={allStimmkreiseData.allStimmkreise}
                  onSelectStimmkreis={(newStimmkreis: Stimmkreis) =>
                    this.setState({ selectedStimmkreis3: newStimmkreis })
                  }
                  selectDefaultStimmkreis={false}
                  size={"small"}
                />
              </Col>
              <Col span={7}>
                4. Stimmkreis:
                <StimmkreisSelector
                  displayLoading={allStimmkreiseData.loading}
                  selectedStimmkreis={this.state.selectedStimmkreis4}
                  selectableStimmkreise={allStimmkreiseData.allStimmkreise}
                  onSelectStimmkreis={(newStimmkreis: Stimmkreis) =>
                    this.setState({ selectedStimmkreis4: newStimmkreis })
                  }
                  selectDefaultStimmkreis={false}
                  size={"small"}
                />
              </Col>
            </Row>
            <Row gutter={5}>
              <Col span={7}>
                5. Stimmkreis:
                <StimmkreisSelector
                  displayLoading={allStimmkreiseData.loading}
                  selectedStimmkreis={this.state.selectedStimmkreis5}
                  selectableStimmkreise={allStimmkreiseData.allStimmkreise}
                  onSelectStimmkreis={(newStimmkreis: Stimmkreis) =>
                    this.setState({ selectedStimmkreis5: newStimmkreis })
                  }
                  selectDefaultStimmkreis={false}
                  size={"small"}
                />
              </Col>
            </Row>
            <Row>
              {this.state.selectedStimmkreis1 &&
              this.state.selectedStimmkreis2 &&
              this.state.selectedStimmkreis3 &&
              this.state.selectedStimmkreis4 &&
              this.state.selectedStimmkreis5 ? (
                <StimmkreisInfoQ7Table
                  wahl={this.props.wahl}
                  stimmkreis1={this.state.selectedStimmkreis1}
                  stimmkreis2={this.state.selectedStimmkreis2}
                  stimmkreis3={this.state.selectedStimmkreis3}
                  stimmkreis4={this.state.selectedStimmkreis4}
                  stimmkreis5={this.state.selectedStimmkreis5}
                  vglwahl={this.props.previousWahl}
                />
              ) : (
                renderInfo("Bitte fünf Stimmkreise auswählen")
              )}
            </Row>
          </>
        ) : (
          renderLoading()
        )}
      </div>
    );
  }
}

const InnerStimmkreisInfoQ7WithQueries = compose(
  withAllStimmkreiseQuery<InnerStimmkreisInfoQ7Props>(props => props.wahl.id)
)(InnerStimmkreisInfoQ7Component);

export const InnerStimmkreisInfoQ7 = InnerStimmkreisInfoQ7WithQueries as React.ComponentType<
  InnerStimmkreisInfoQ7Props
>;
