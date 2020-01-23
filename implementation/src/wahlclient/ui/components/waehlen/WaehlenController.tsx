import * as React from "react";
import { Kandidat, Partei } from "../../../../shared/graphql.types";
import {
  MutationToResetWahlkabineHOCProps,
  withResetWahlkabineMutation
} from "../../../../client-graphql/wahlkabine/resetWahlkabineMutation";
import { compose } from "react-apollo";
import { message, Row, Col, Button, Icon, Divider, Tabs, Spin } from "antd";
import { Rechtsbehelfsbelehrung } from "./Rechtsbehelfsbelehrung";
import { ErststimmePage } from "./ErststimmePage";
import { ZweitstimmePage } from "./ZweitstimmePage";
import {
  withIsUnlocked,
  QueryToIsUnlockedHOCProps
} from "../../../../client-graphql/wahlkabine/isUnlockedQuery";

enum WahlTab {
  RECHTSBEHELFSBELEHRUNG = 0,
  ERSTSTIMME = 1,
  ZWEITSTIMME = 2,
  CHECKVOTE = 3,
  VOTECOMMITED = 4
}

function getWahlTabTitle(wahlTab: WahlTab) {
  switch (wahlTab) {
    case WahlTab.RECHTSBEHELFSBELEHRUNG:
      return "Rechtsbehelfsbelehrung";
    case WahlTab.ERSTSTIMME:
      return "Erststimmabgabe";
    case WahlTab.ZWEITSTIMME:
      return "Zweitstimmabgabe";
    case WahlTab.CHECKVOTE:
      return "Bestätigung";
    case WahlTab.VOTECOMMITED:
      return "Stimmabgabe Beendet";
    default:
      return "Error - Unknown Tab";
  }
}

export interface IWaehlenControllerProps {
  readonly wahlkabineToken: string;
}

interface IProps
  extends IWaehlenControllerProps,
    MutationToResetWahlkabineHOCProps,
    QueryToIsUnlockedHOCProps {}

interface IState {
  readonly activeTab: WahlTab;

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

  readonly resetCountdown?: number;
}

class WaehlenControllerComponent extends React.PureComponent<IProps, IState> {
  constructor(props: IProps) {
    super(props);

    this.state = {
      activeTab: WahlTab.RECHTSBEHELFSBELEHRUNG,
      acceptedRechtsbehelfsbelehrung: false
    };
  }

  private isInCleanState = () => {
    return (
      this.state.activeTab === WahlTab.RECHTSBEHELFSBELEHRUNG &&
      !this.state.acceptedRechtsbehelfsbelehrung &&
      this.state.selectedErstkandidat === undefined &&
      this.state.selectedZweitkandidat === undefined &&
      this.state.selectedZweitpartei === undefined
    );
  };

  private resetWahlkabine = () => {
    // Only do cleanup if really necessary
    if (this.isInCleanState()) return;

    this.props.resetWahlkabine({
      variables: { wahlkabineToken: this.props.wahlkabineToken }
    });
    this.setState(
      {
        activeTab: WahlTab.RECHTSBEHELFSBELEHRUNG,
        acceptedRechtsbehelfsbelehrung: false,
        selectedErstkandidat: undefined,
        selectedZweitkandidat: undefined,
        selectedZweitpartei: undefined
      },
      () => {
        message.warning("Wahlkabine wurde zurückgesetzt");
      }
    );
  };

  private startResetCountdown = () => {
    this.setState({ resetCountdown: 5 });
    setTimeout(this.tickResetCountdown, 1000);
  };

  private tickResetCountdown = () => {
    const newCountdownValue = this.state.resetCountdown - 1;
    if (newCountdownValue <= 0) {
      this.setState({ resetCountdown: undefined }, this.resetWahlkabine);
      return;
    } else {
      this.setState(
        {
          resetCountdown: newCountdownValue
        },
        () => setTimeout(this.tickResetCountdown, 1000)
      );
    }
  };

  componentDidUpdate() {
    // Force reset Wahlkabine if it is not unlocked
    if (this.props.isUnlockedData && !this.props.isUnlockedData.isUnlocked) {
      this.resetWahlkabine();
    }
  }

  private nextTab = () => {
    if (!this.state.acceptedRechtsbehelfsbelehrung) {
      message.error(
        "Zunächst müssen Sie die Rechtsbehelfsbelehrung lesen und akzeptieren"
      );
      return;
    }
    const nextTab = this.state.activeTab + 1;
    if (nextTab > WahlTab.VOTECOMMITED) {
      return;
    }
    if (nextTab === WahlTab.VOTECOMMITED) {
      this.startResetCountdown();
    }
    this.setState({
      activeTab: nextTab
    });
  };

  private previousTab = () => {
    this.setState({
      activeTab: Math.max(
        this.state.activeTab - 1,
        WahlTab.RECHTSBEHELFSBELEHRUNG
      )
    });
  };

  private getFurhtestReachableTab = () => {
    const {
      acceptedRechtsbehelfsbelehrung,
      selectedErstkandidat,
      selectedZweitkandidat
    } = this.state;
    if (this.state.activeTab === WahlTab.VOTECOMMITED) return -1;
    if (!acceptedRechtsbehelfsbelehrung) return WahlTab.RECHTSBEHELFSBELEHRUNG;
    if (selectedErstkandidat === undefined) return WahlTab.ERSTSTIMME;
    if (selectedZweitkandidat === undefined) return WahlTab.ZWEITSTIMME;
    return WahlTab.CHECKVOTE;
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

  private renderRechtsbelehrung = () => {
    const waiting =
      this.props.isUnlockedData && !this.props.isUnlockedData.isUnlocked;
    return this.renderInTabContainer(
      <>
        <Row type={"flex"} justify={"center"} style={{ marginBottom: "8px" }}>
          <Col style={{ width: "100%" }}>
            <Rechtsbehelfsbelehrung />
          </Col>
        </Row>
        <Row type={"flex"} gutter={16} justify={"end"}>
          <Col>
            <Button
              type={"primary"}
              style={{ float: "right" }}
              loading={waiting}
              disabled={waiting}
              onClick={() => {
                if (!this.props.isUnlockedData.isUnlocked) {
                  message.error(
                    "Diese Wahlkabine muss zuerst von einem Wahlhelfer freigegeben werden"
                  );
                  return;
                }
                this.setState(
                  { acceptedRechtsbehelfsbelehrung: true },
                  this.nextTab
                );
              }}
            >
              {waiting
                ? "Warte auf Freigabe durch Wahlleiter"
                : "Ja, ich habe die Rechtsbehelfsbelehrung zur Kenntnis genommen"}
              <Icon type={"right"} />
            </Button>
          </Col>
        </Row>
      </>
    );
  };

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
          this.setState({ selectedZweitkandidat, selectedZweitpartei: null })
        }
        onSelectParty={selectedZweitpartei =>
          this.setState({ selectedZweitpartei, selectedZweitkandidat: null })
        }
        goToNextTab={this.nextTab}
        goToPreviousTab={this.previousTab}
      />
    );

  private renderCheckVote = () =>
    this.renderInTabContainer(
      <>
        <h1>{"Bitte bestätigen Sie die Korrektheit Ihrer Stimmabgabe:"}</h1>
        <Divider />
        <Row type={"flex"} justify={"center"}>
          <Col>
            <h2>
              {`Ihre Erststimme: ${
                this.state.selectedErstkandidat
                  ? `${this.state.selectedErstkandidat.name} (${this.state.selectedErstkandidat.partei.name})`
                  : "ungültig gemacht"
              }`}
            </h2>
          </Col>
        </Row>
        <Row style={{ marginBottom: "20px" }} type={"flex"} justify={"center"}>
          <Col>
            <h2>
              {`Ihre Zweitstimme: ${
                this.state.selectedZweitkandidat
                  ? `${this.state.selectedZweitkandidat.name} (${this.state.selectedZweitkandidat.partei.name})`
                  : this.state.selectedZweitpartei
                  ? `${this.state.selectedZweitpartei.name} Liste`
                  : "ungültig gemacht"
              }`}
            </h2>
          </Col>
        </Row>
        <Row type={"flex"} justify={"center"} gutter={16}>
          <Col>
            <Button onClick={this.previousTab} icon={"left"}>
              Zurück
            </Button>
          </Col>
          <Col>
            <Button type={"primary"} icon={"check"} onClick={this.nextTab}>
              Stimmen Abgeben
            </Button>
          </Col>
        </Row>
      </>
    );

  private renderVoteCommited = () =>
    this.renderInTabContainer(
      <Row
        type={"flex"}
        justify={"center"}
        align={"middle"}
        style={{ width: "100%", height: `calc(100vh - 149px)`, color: "green" }}
      >
        <Col span={16}>
          <Row type={"flex"} justify={"center"}>
            <Col>
              <Icon type={"check"} style={{ fontSize: "100pt" }} />
            </Col>
          </Row>
          <Row>
            <Col style={{ textAlign: "center", fontSize: "30pt" }}>
              {`Ihre Stimme wurde erfolgreich abgegeben. Sie können die Wahlkabine
              nun verlassen. Die Wahlkabine wird automatisch in den Initialzustand 
              versetzt in ${this.state.resetCountdown || 0} Sekunden`}
            </Col>
          </Row>
        </Col>
      </Row>
    );

  render() {
    const { activeTab } = this.state;
    const furthestReachableTab = this.getFurhtestReachableTab();

    const tabPaneStyle: React.CSSProperties = {
      margin: "0px"
    };

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
          tabBarExtraContent={
            <Button
              icon={"reload"}
              onClick={this.resetWahlkabine}
              style={{ marginRight: "8px" }}
              size={"small"}
              disabled={
                activeTab === WahlTab.RECHTSBEHELFSBELEHRUNG ||
                // TODO: automatically reset after x seconds in last tab
                activeTab === WahlTab.VOTECOMMITED
              }
            >
              Zurücksetzen
            </Button>
          }
        >
          <Tabs.TabPane
            tab={getWahlTabTitle(WahlTab.RECHTSBEHELFSBELEHRUNG)}
            key={`${WahlTab.RECHTSBEHELFSBELEHRUNG}`}
            style={tabPaneStyle}
            disabled={furthestReachableTab < WahlTab.RECHTSBEHELFSBELEHRUNG}
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
            tab={getWahlTabTitle(WahlTab.CHECKVOTE)}
            key={`${WahlTab.CHECKVOTE}`}
            style={tabPaneStyle}
            disabled={furthestReachableTab < WahlTab.CHECKVOTE}
          >
            {this.renderCheckVote()}
          </Tabs.TabPane>
          <Tabs.TabPane
            tab={getWahlTabTitle(WahlTab.VOTECOMMITED)}
            key={`${WahlTab.VOTECOMMITED}`}
            style={tabPaneStyle}
            disabled={true}
          >
            {this.renderVoteCommited()}
          </Tabs.TabPane>
        </Tabs>
      </div>
    );
  }
}

const WaehlenControllerWithQueries = compose(
  withResetWahlkabineMutation(),
  withIsUnlocked<IWaehlenControllerProps>(
    p => p.wahlkabineToken,
    // ~5000 wahlkabinen -> 5000 requests per second ;(
    // for real world automatic resetting would have to be
    // implemented differently!!
    () => 1000
  )
)(WaehlenControllerComponent);

export const WaehlenController = WaehlenControllerWithQueries as React.ComponentType<
  IWaehlenControllerProps
>;
