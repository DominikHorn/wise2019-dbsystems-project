import { Button, Col, Row, Tabs, message } from "antd";
import * as React from "react";
import { RouteComponentProps } from "react-router";
import { Kandidat, Partei } from "../../../../shared/graphql.types";
import { ErststimmePage } from "../waehlen/ErststimmePage";
import { ZweitstimmePage } from "../waehlen/ZweitstimmePage";
import "./WaehlenPage.css";

export interface IWaehlenPageProps {
  routeProps: RouteComponentProps<any>;
}

interface IProps extends IWaehlenPageProps {}

interface IState {
  /** Value meanings as follows:
   *
   * undefined: no selection made
   * null: deliberately set stimme to ungueltig
   * any value: this is the deliberately selected value
   */
  readonly selectedErstkandidat?: Kandidat | null;
  readonly selectedZweitkandidat?: Kandidat | null;
  readonly selectedZweitpartei?: Partei | null;
  readonly acceptedRechtsbehelfsbelehrung: boolean;

  readonly activeTab: WahlTab;
}

enum WahlTab {
  RECHTSBEHELFSBELEHRUNG = 0,
  ERSTSTIMME = 1,
  ZWEITSTIMME = 2,
  COMMITVOTE = 3
}

function getWahlTabTitle(wahlTab: WahlTab) {
  switch (wahlTab) {
    case WahlTab.RECHTSBEHELFSBELEHRUNG:
      return "Rechtsbehelfsbelehrung";
    case WahlTab.ERSTSTIMME:
      return "Erststimmabgabe";
    case WahlTab.ZWEITSTIMME:
      return "Zweitstimmabgabe";
    case WahlTab.COMMITVOTE:
      return "Bestätigung";
    default:
      return "Error - Unknown Tab";
  }
}

const LOREM_IPSUM = `
Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.   
Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim qui blandit praesent luptatum zzril delenit augue duis dolore te feugait nulla facilisi. Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.   
Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat. Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim qui blandit praesent luptatum zzril delenit augue duis dolore te feugait nulla facilisi.   
Nam liber tempor cum soluta nobis eleifend option congue nihil imperdiet doming id quod mazim placerat facer possim assum. Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat.   
Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis.   
At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, At accusam aliquyam diam diam dolore dolores duo eirmod eos erat, et nonumy sed tempor et et invidunt justo labore Stet clita ea et gubergren, kasd magna no rebum. sanctus sea sed takimata ut vero voluptua. est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat.   
Consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus.   
Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.   
Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim qui blandit praesent luptatum zzril delenit augue duis dolore te feugait nulla facilisi. Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.   
Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat. Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim qui blandit praesent luptatum zzril delenit.   
`;

export class WaehlenPage extends React.PureComponent<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      activeTab: WahlTab.RECHTSBEHELFSBELEHRUNG,
      acceptedRechtsbehelfsbelehrung: false
    };
  }

  private nextTab = () => {
    if (!this.state.acceptedRechtsbehelfsbelehrung) {
      message.error(
        "Zunächst müssen Sie die Rechtsbehelfsbelehrung lesen und akzeptieren"
      );
      return;
    }
    const nextTab = this.state.activeTab + 1;
    if (nextTab > WahlTab.COMMITVOTE) {
      // TODO: commit data
      return;
    }
    this.setState({
      activeTab: nextTab
    });
  };

  private previousTab = () => {
    this.setState({
      activeTab: Math.min(this.state.activeTab, WahlTab.RECHTSBEHELFSBELEHRUNG)
    });
  };

  private getFurhtestReachableTab = () => {
    const {
      acceptedRechtsbehelfsbelehrung,
      selectedErstkandidat,
      selectedZweitkandidat
    } = this.state;
    if (!acceptedRechtsbehelfsbelehrung) return WahlTab.RECHTSBEHELFSBELEHRUNG;
    if (selectedErstkandidat === undefined) return WahlTab.ERSTSTIMME;
    if (selectedZweitkandidat === undefined) return WahlTab.ZWEITSTIMME;
    return WahlTab.COMMITVOTE;
  };

  private renderInTabContainer = (component: React.ReactElement) => (
    <div
      style={{
        height: `calc(100vh - 109px)`,
        overflowY: "scroll"
      }}
    >
      <div style={{ margin: "20px" }}>{component}</div>
    </div>
  );

  private renderRechtsbelehrung = () =>
    this.renderInTabContainer(
      <>
        <div style={{ textAlign: "justify" }}>{LOREM_IPSUM}</div>
        <Row type={"flex"} gutter={16} justify={"end"}>
          <Col>
            <Button
              type={"primary"}
              style={{ float: "right" }}
              onClick={() =>
                this.setState(
                  { acceptedRechtsbehelfsbelehrung: true },
                  this.nextTab
                )
              }
            >
              Zur Kenntniss genommen
            </Button>
          </Col>
        </Row>
      </>
    );

  private renderErststimme = () =>
    this.renderInTabContainer(
      <ErststimmePage
        wahl={{ id: 2, wahldatum: new Date() }}
        stimmkreis={{ id: 101, name: "München-Mitte" }}
        selectedKandidat={this.state.selectedErstkandidat}
        onSelectKandidat={selectedErstkandidat =>
          this.setState({ selectedErstkandidat })
        }
        goToNextTab={this.nextTab}
        goToPreviousTab={this.previousTab}
      />
    );

  private renderZweitstimme = () =>
    this.renderInTabContainer(
      <ZweitstimmePage
        wahl={{ id: 2, wahldatum: new Date() }}
        regierungsbezirk={{ id: 901, name: "Oberbayern" }}
        selectedKandidat={this.state.selectedZweitkandidat}
        selectedParty={this.state.selectedZweitpartei}
        onSelectKandidat={selectedZweitkandidat =>
          this.setState({ selectedZweitkandidat })
        }
        onSelectParty={selectedZweitpartei =>
          this.setState({ selectedZweitpartei })
        }
        goToNextTab={this.nextTab}
        goToPreviousTab={this.previousTab}
      />
    );

  //if (!this.state.committed) {
  //   return (
  //     <StimmAbgabePage
  //       erststimme={this.state.selectedErststimme}
  //       zweitstimme={this.state.selectedZweitstimme}
  //       onClickCommit={(commit: boolean) =>
  //         this.setState({ commitVote: commit })
  //       }
  //       onClickBack={() => this.setState({ zweitstimme_abgg: false })}
  //       committedVote={false}
  //     />
  //   );
  // } else {
  //   return (
  //     <StimmAbgabePage
  //       erststimme={this.state.selectedErststimme}
  //       zweitstimme={this.state.selectedZweitstimme}
  //       onClickCommit={(commit: boolean) =>
  //         this.setState({ commitVote: commit })
  //       }
  //       onClickBack={null}
  //       committedVote={true}
  //     />
  //   );
  // }
  private renderCommitVote = () => <>{"TODO"}</>;

  render() {
    const { activeTab } = this.state;
    const tabPaneStyle: React.CSSProperties = {
      margin: "0px"
    };

    const furthestReachableTab = this.getFurhtestReachableTab();

    return (
      <div className={"waehlen-page-container"}>
        <Tabs
          activeKey={`${activeTab}`}
          onChange={activeTabKey =>
            this.setState({
              activeTab: Number(activeTabKey) as WahlTab
            })
          }
          style={{ backgroundColor: "white" }}
        >
          <Tabs.TabPane
            tab={getWahlTabTitle(WahlTab.RECHTSBEHELFSBELEHRUNG)}
            key={`${WahlTab.RECHTSBEHELFSBELEHRUNG}`}
            style={tabPaneStyle}
          >
            {this.renderRechtsbelehrung()}
          </Tabs.TabPane>
          <Tabs.TabPane
            tab={getWahlTabTitle(WahlTab.ERSTSTIMME)}
            key={`${WahlTab.ERSTSTIMME}`}
            style={tabPaneStyle}
            disabled={furthestReachableTab < WahlTab.ERSTSTIMME}
          >
            {this.renderErststimme()}
          </Tabs.TabPane>
          <Tabs.TabPane
            tab={getWahlTabTitle(WahlTab.ZWEITSTIMME)}
            key={`${WahlTab.ZWEITSTIMME}`}
            style={tabPaneStyle}
            disabled={furthestReachableTab < WahlTab.ZWEITSTIMME}
          >
            {this.renderZweitstimme()}
          </Tabs.TabPane>
          <Tabs.TabPane
            tab={getWahlTabTitle(WahlTab.COMMITVOTE)}
            key={`${WahlTab.COMMITVOTE}`}
            style={tabPaneStyle}
            disabled={furthestReachableTab < WahlTab.COMMITVOTE}
          >
            {this.renderCommitVote()}
          </Tabs.TabPane>
        </Tabs>
      </div>
    );
  }
}
