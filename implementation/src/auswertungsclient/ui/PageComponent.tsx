import { Icon, Layout, Menu, Button, Dropdown } from "antd";
import * as H from "history";
import { ApolloClient } from "apollo-client";
import * as React from "react";
import * as ReactGridLayout from "react-grid-layout";
import { Layout as GridLayout } from "react-grid-layout";
import { hot } from "react-hot-loader";
import { matchPath, Route, RouteComponentProps, Switch } from "react-router";
import { Link } from "react-router-dom";
import { isDevelopmentEnv } from "../../shared/util";
import "./PageComponent.css";
import { IRouteProps, PRECONFIGURED_WIDGET_ROUTES } from "./routes";
import { withErrorBoundary } from "./components/general/ErrorBoundary";
import {
  WidgetType,
  StatistikWidgetSettings as StatistikWidgetSetting
} from "./components/general/statistikwidgets/WidgetTypes";
import MenuItem from "antd/lib/menu/MenuItem";
import { PlaceholderWidget } from "./components/general/statistikwidgets/PlaceholderWidget";
import { SitzverteilungsWidget } from "./components/general/statistikwidgets/SitzverteilungsWidget";
import { MandatListeWidget } from "./components/general/statistikwidgets/MandatListeWidget";
import { StimmkreisInfoWidget } from "./components/general/statistikwidgets/StimmkreisInfoWidget";
import { GewinnerWidget } from "./components/general/statistikwidgets/GewinnerWidget";
import { UeberhangmandateWidget } from "./components/general/statistikwidgets/UeberhangmandateWidget";
import { KnappsteKandidatenWidget } from "./components/general/statistikwidgets/KnappsteKandidatenWidget";
import { renderError } from "../../wahlclient/ui/guiUtil";

const { Header, Content, Sider } = Layout;
const { SubMenu } = Menu;

/**
 * Props of a Page component
 */
export interface IPageProps {
  readonly title: string;
  readonly subtitle: string;
  readonly client: ApolloClient<any>;
  readonly routeProps: RouteComponentProps<any>;
}

interface IProps extends IPageProps {}

/**
 * State of a Page component
 */
export interface IState {
  // Whether or not the lefthand menu is collapsed
  readonly menuCollapsed: boolean;

  // Important for react grid layout sizing
  readonly availableWidth: number;
  readonly availableHeight: number;
}

const COLUMN_COUNT = 12;
const WIDGET_DIMENSIONS = {
  w: 6,
  h: 8,
  minW: 4,
  minH: 4
};

type WidgetMenuEntry = {
  name: string;
  values: string[];
};

type MainRouteProps = {
  readonly settings: string; // JSON encoded StatistikWidgetSettings[];
};

// Delay in seconds for menu close
const MENU_CLOSE_DELAY = 0.5;

class PageComponentClass extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      menuCollapsed: true,
      availableWidth: window.innerWidth - 80,
      availableHeight: window.innerHeight - 64
    };
  }

  private updateDimensions = () =>
    this.setState({
      availableWidth: window.innerWidth - (this.state.menuCollapsed ? 80 : 200),
      availableHeight: window.innerHeight - 64
    });

  componentDidMount() {
    window.addEventListener("resize", this.updateDimensions);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateDimensions);
  }

  private setWidgetSettings = (
    newSettings: StatistikWidgetSetting[],
    history: H.History
  ) => history.push(`/${btoa(JSON.stringify(newSettings))}`);

  // TODO: rework where widgets are added -> fit in empty spaces
  private onWidgetAdd = (
    currentWidgetSettings: StatistikWidgetSetting[],
    history: H.History,
    widgetType: WidgetType
  ) => {
    this.setWidgetSettings(
      currentWidgetSettings.concat([
        {
          type: widgetType,
          layout: {
            i: `${currentWidgetSettings.reduce(
              (prevMax, curr) =>
                Number(curr.layout.i) > prevMax
                  ? Number(curr.layout.i)
                  : prevMax,
              0
            ) + 1}`,
            x:
              WIDGET_DIMENSIONS.w *
              (currentWidgetSettings.length %
                (COLUMN_COUNT / WIDGET_DIMENSIONS.w)),
            y: 0,
            ...WIDGET_DIMENSIONS
          }
        }
      ]),
      history
    );
  };

  private onWidgetRemove = (
    currentWidgetSettings: StatistikWidgetSetting[],
    history: H.History,
    removedId: string
  ) =>
    this.setWidgetSettings(
      currentWidgetSettings.filter(setting => setting.layout.i !== removedId),
      history
    );

  private onLayoutChange = (
    currentWidgetSettings: StatistikWidgetSetting[],
    history: H.History,
    layouts: GridLayout[]
  ) => {
    // Only update layout and thus route param when actual
    // user noticable or non deductable changes happen
    let meaningfullUpdate = false;
    const newSettings = currentWidgetSettings.map((setting, index) => {
      if (
        setting.layout.x !== layouts[index].x ||
        setting.layout.y !== layouts[index].y ||
        setting.layout.w !== layouts[index].w ||
        setting.layout.h !== layouts[index].h ||
        setting.layout.minW !== layouts[index].minW ||
        setting.layout.minH !== layouts[index].minH
      ) {
        meaningfullUpdate = true;
        return {
          ...setting,
          layout: layouts[index]
        };
      }
      return setting;
    });
    if (meaningfullUpdate) {
      this.setWidgetSettings(newSettings, history);
    }
  };

  private renderWidgetAddMenu = () =>
    Object.values(WidgetType)
      .reduce((prev, curr) => {
        const newEntry = () => ({
          name: curr.split("-")[0].trim(),
          values: [curr]
        });
        if (prev.length > 0) {
          const latest = prev[prev.length - 1];
          if (curr.startsWith(latest.name)) {
            return prev.slice(0, prev.length - 1).concat([
              {
                ...latest,
                values: latest.values.concat([curr])
              }
            ]);
          } else {
            return prev.concat([newEntry()]);
          }
        } else {
          return [newEntry()];
        }
      }, [] as WidgetMenuEntry[])
      .map((menuEntry: WidgetMenuEntry) => {
        if (menuEntry.values.length === 1) {
          const onlyEntry = menuEntry.values[0];
          return <Menu.Item key={onlyEntry}>{onlyEntry}</Menu.Item>;
        } else {
          return (
            <SubMenu title={menuEntry.name} key={menuEntry.name}>
              {menuEntry.values.map(val => (
                <MenuItem key={val}>{val}</MenuItem>
              ))}
            </SubMenu>
          );
        }
      });

  private renderHeader = (
    title: string,
    subtitle: string,
    currentWidgetSettings: StatistikWidgetSetting[],
    history: H.History
  ) => (
    <Header className={"page-header"}>
      <div style={{ float: "left" }}>
        <Dropdown
          mouseLeaveDelay={MENU_CLOSE_DELAY}
          placement={"bottomCenter"}
          overlay={
            <Menu
              onClick={param =>
                this.onWidgetAdd(
                  currentWidgetSettings,
                  history,
                  param.key as WidgetType
                )
              }
              subMenuCloseDelay={MENU_CLOSE_DELAY}
            >
              {this.renderWidgetAddMenu()}
            </Menu>
          }
        >
          <Button icon={"plus"}>Widget Hinzufügen</Button>
        </Dropdown>
      </div>
      <div className={"title"}>{title}</div>
      <div className={"subtitle"}>{subtitle}</div>
    </Header>
  );

  private getActiveMenuKey = () => {
    const matchingRoute = PRECONFIGURED_WIDGET_ROUTES.find(
      route => !!matchPath(this.props.routeProps.location.pathname, route.path)
    );
    if (!matchingRoute) return null;
    if (matchingRoute.possibleSubroutes) {
      const matchingSubroute = matchingRoute.possibleSubroutes.find(
        subroute =>
          !!matchPath(this.props.routeProps.location.pathname, subroute.path)
      );
      if (!matchingSubroute) return null;
      return matchingSubroute.key;
    }
    return matchingRoute.menuKey;
  };

  private renderSider = (
    menuCollapsed: boolean,
    activeMenuKey: string,
    onCollapseChange: (collapsed: boolean) => void
  ) => (
    <Sider
      className={"page-sider"}
      collapsible={true}
      collapsed={menuCollapsed}
      onCollapse={onCollapseChange}
    >
      <Menu theme={"dark"} mode={"inline"} selectedKeys={[activeMenuKey]}>
        {PRECONFIGURED_WIDGET_ROUTES.map(route =>
          route.possibleSubroutes ? (
            <SubMenu
              key={route.menuKey}
              title={
                <>
                  <Icon type={route.menuIconIdentifier} />
                  <span>{route.menuTitle}</span>
                </>
              }
              onTitleClick={() =>
                this.props.routeProps.history.push(
                  route.possibleSubroutes[0].path
                )
              }
            >
              {route.possibleSubroutes.map(subroute => (
                <Menu.Item key={subroute.key}>
                  <Link to={subroute.path}>
                    <span>{subroute.title}</span>
                  </Link>
                </Menu.Item>
              ))}
            </SubMenu>
          ) : (
            <Menu.Item key={route.menuKey}>
              <Link to={route.path.split(":")[0]}>
                <Icon type={route.menuIconIdentifier} />
                <span>{route.menuTitle}</span>
              </Link>
            </Menu.Item>
          )
        )}
      </Menu>
    </Sider>
  );

  private renderWidget = (
    setting: StatistikWidgetSetting,
    removeWidget: () => void,
    setRoutableState: (newState: any) => void
  ) => {
    return (
      <div key={setting.layout.i}>
        {setting.type === WidgetType.PLACEHOLDER ? (
          <PlaceholderWidget
            routableState={setting.routableState}
            setRoutableState={setRoutableState}
            key={setting.layout.i}
            removeWidget={removeWidget}
          />
        ) : setting.type === WidgetType.SITZVERTEILUNG_PIECHART ? (
          <SitzverteilungsWidget
            routableState={setting.routableState}
            setRoutableState={setRoutableState}
            key={setting.layout.i}
            removeWidget={removeWidget}
          />
        ) : setting.type === WidgetType.SITZVERTEILUNG_TABLE ? (
          <SitzverteilungsWidget
            routableState={setting.routableState}
            setRoutableState={setRoutableState}
            key={setting.layout.i}
            removeWidget={removeWidget}
            renderAsTable={true}
          />
        ) : setting.type === WidgetType.MANDAT_LISTE ? (
          <MandatListeWidget
            routableState={setting.routableState}
            setRoutableState={setRoutableState}
            key={setting.layout.i}
            removeWidget={removeWidget}
          />
        ) : setting.type === WidgetType.STIMMKREIS_INFO_WAHLBETEILIGUNG ? (
          <StimmkreisInfoWidget
            routableState={setting.routableState}
            setRoutableState={setRoutableState}
            key={setting.layout.i}
            removeWidget={removeWidget}
          />
        ) : setting.type === WidgetType.GEWINNER_STIMMKREISE ? (
          <GewinnerWidget
            routableState={setting.routableState}
            setRoutableState={setRoutableState}
            key={setting.layout.i}
            removeWidget={removeWidget}
          />
        ) : setting.type === WidgetType.UEBERHANGMANDATE ? (
          <UeberhangmandateWidget
            routableState={setting.routableState}
            setRoutableState={setRoutableState}
            key={setting.layout.i}
            removeWidget={removeWidget}
          />
        ) : setting.type === WidgetType.KNAPPSTE_KANDIDATEN ? (
          <KnappsteKandidatenWidget
            routableState={setting.routableState}
            setRoutableState={setRoutableState}
            key={setting.layout.i}
            removeWidget={removeWidget}
          />
        ) : (
          renderError("Unkown Widget type")
        )}
      </div>
    );
  };

  private renderContent = (
    menuCollapsed: boolean,
    settings: StatistikWidgetSetting[],
    history: H.History
  ) => {
    const { availableWidth, availableHeight } = this.state;

    return (
      <Content
        className={"page-content"}
        style={{ marginLeft: menuCollapsed ? "80px" : "200px" }}
      >
        <ReactGridLayout
          className={"layout"}
          layout={settings.map(
            (setting: StatistikWidgetSetting) => setting.layout
          )}
          cols={COLUMN_COUNT}
          // header height + margin borders + other
          rowHeight={(availableHeight - (64 + 10 + 30)) / 20}
          width={availableWidth}
          isResizable={true}
          onLayoutChange={layouts =>
            this.onLayoutChange(settings, history, layouts)
          }
          compactType={"vertical"}
          margin={[5, 5]}
        >
          {settings.map((setting: StatistikWidgetSetting) =>
            this.renderWidget(
              setting,
              () => this.onWidgetRemove(settings, history, setting.layout.i),
              newRoutableState =>
                this.setWidgetSettings(
                  settings.map(s =>
                    s.layout.i === setting.layout.i
                      ? {
                          ...s,
                          routableState: {
                            ...(s.routableState || {}),
                            ...newRoutableState
                          }
                        }
                      : s
                  ),
                  history
                )
            )
          )}
        </ReactGridLayout>
      </Content>
    );
  };

  render() {
    const { title, subtitle } = this.props;
    const { menuCollapsed } = this.state;

    // Try to obtain active menu path
    const activeMenuKey = this.getActiveMenuKey();

    return (
      <Switch>
        <Route
          key={"mainroute"}
          path={"/:settings?"}
          render={(props: RouteComponentProps<MainRouteProps>) => {
            const settings = JSON.parse(
              decodeURIComponent(atob(props.match.params.settings || "")) ||
                "[]"
            );
            return (
              <Layout style={{ minHeight: "100vh" }}>
                {this.renderHeader(title, subtitle, settings, props.history)}
                <Layout className={"page-sider-content-layout"}>
                  <>
                    {this.renderSider(
                      menuCollapsed,
                      activeMenuKey,
                      this.onMenuCollapseChange
                    )}
                    {this.renderContent(menuCollapsed, settings, props.history)}
                  </>
                </Layout>
              </Layout>
            );
          }}
        />
      </Switch>
    );
  }

  private onMenuCollapseChange = (collapsed: boolean) =>
    this.setState(
      {
        menuCollapsed: collapsed
      },
      this.updateDimensions
    );
}

const PageComponentWithErrorBoundary = withErrorBoundary<IPageProps>(
  PageComponentClass
);

export const PageComponent = isDevelopmentEnv()
  ? hot(module)(PageComponentWithErrorBoundary)
  : PageComponentWithErrorBoundary;
