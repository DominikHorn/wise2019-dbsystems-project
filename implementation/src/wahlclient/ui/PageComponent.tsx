import { Icon, Layout, Menu, Row, Col, Button } from "antd";
import { ApolloClient } from "apollo-client";
import * as React from "react";
import { hot } from "react-hot-loader";
import { matchPath, Route, RouteComponentProps, Switch } from "react-router";
import { Link } from "react-router-dom";
import { isDevelopmentEnv } from "../../shared/util";
import { withErrorBoundary } from "./components/general/ErrorBoundary";
import "./PageComponent.css";
import { DEFAULT_ROUTE, IRouteProps, TOPLEVEL_ROUTES } from "./routes";
import { WaehlenPage } from "./components/roots/WaehlenPage";

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
  readonly menuCollapsed: boolean;

  /**
   * Each wahlclient can either be a wahlkabine or a setup station.
   * Check and adjust accordingly here
   */
  readonly isWahlkabine?: boolean;
}

class PageComponentClass extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      menuCollapsed: true
    };
  }

  private renderHeader = (title: string, subtitle: string) => (
    <Header className={"page-header"}>
      <div className={"title"}>{title}</div>
      <div className={"subtitle"}>{subtitle}</div>
    </Header>
  );

  private getActiveMenuKey = () => {
    const matchingRoute = TOPLEVEL_ROUTES.find(
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
        {TOPLEVEL_ROUTES.map(route =>
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

  private renderContent = (menuCollapsed: boolean) => (
    <Content
      className={"page-content"}
      style={{ marginLeft: menuCollapsed ? "80px" : "200px" }}
    >
      <Switch>
        {TOPLEVEL_ROUTES.map((route: IRouteProps, index: number) => (
          <Route key={index} {...route} />
        ))}
        <Route {...DEFAULT_ROUTE} />
      </Switch>
    </Content>
  );

  private renderAdminInterface = () => {
    const { menuCollapsed } = this.state;
    const activeMenuKey = this.getActiveMenuKey();

    return (
      <Layout className={"page-sider-content-layout"}>
        <>
          {this.renderSider(
            menuCollapsed,
            activeMenuKey,
            this.onMenuCollapseChange
          )}
          {this.renderContent(menuCollapsed)}
        </>
      </Layout>
    );
  };

  private renderSetupClientUI = () => (
    <Row
      type={"flex"}
      justify={"center"}
      align={"middle"}
      style={{
        width: "100vw",
        height: "100vh"
      }}
    >
      <Col>
        <Row type={"flex"} justify={"center"} style={{ marginBottom: "8px" }}>
          <Col style={{ width: "100%" }}>
            <Button
              type={"primary"}
              style={{ width: "100%" }}
              onClick={() => this.setState({ isWahlkabine: true })}
              icon={"check"}
            >
              Einrichten als Wahlkabine
            </Button>
          </Col>
        </Row>
        <Row type={"flex"} justify={"center"}>
          <Col style={{ width: "100%" }}>
            <Button
              type={"primary"}
              style={{ width: "100%" }}
              onClick={() => this.setState({ isWahlkabine: false })}
              icon={"dashboard"}
            >
              Einrichten zur Administration
            </Button>
          </Col>
        </Row>
      </Col>
    </Row>
  );

  private renderWahlUI = () => (
    <Content className={"page-content"} style={{ marginTop: "64px" }}>
      <WaehlenPage />
    </Content>
  );

  render() {
    const { isWahlkabine } = this.state;
    const { title, subtitle } = this.props;

    return (
      <Layout style={{ minHeight: "100vh" }}>
        {this.renderHeader(title, subtitle)}
        {isWahlkabine === undefined || isWahlkabine === null
          ? this.renderSetupClientUI()
          : isWahlkabine
          ? this.renderWahlUI()
          : this.renderAdminInterface()}
      </Layout>
    );
  }

  private onMenuCollapseChange = (collapsed: boolean) =>
    this.setState({
      menuCollapsed: collapsed
    });
}

const PageComponentWithErrorBoundary = withErrorBoundary<IPageProps>(
  PageComponentClass
);

export const PageComponent = isDevelopmentEnv()
  ? hot(module)(PageComponentWithErrorBoundary)
  : PageComponentWithErrorBoundary;
