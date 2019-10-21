import { Col, Icon, Layout, Menu, Row } from "antd";
import { ApolloClient } from "apollo-client";
import * as React from "react";
import { hot } from "react-hot-loader";
import { matchPath, Route, RouteComponentProps, Switch } from "react-router";
import { Link } from "react-router-dom";
import { isDevelopmentEnv } from "../../shared/util";
import "./PageComponent.css";
import { DEFAULT_ROUTE, IRouteProps, TOPLEVEL_ROUTES } from "./routes";

const { Header, Content, Sider } = Layout;
const { SubMenu } = Menu;

/**
 * Props of a Page component
 */
export interface IPageProps {
  readonly title: string;
  readonly client: ApolloClient<any>;
  readonly routeProps: RouteComponentProps<any>;
}

interface IProps
  extends IPageProps { }

/**
 * State of a Page component
 */
export interface IState {
  readonly menuCollapsed: boolean;
}

class PageComponentClass extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      menuCollapsed: true
    };
  }

  private renderHeader = (title: string) => (
    <Header className={"page-header"}>
      <Row type={"flex"} justify={"end"}>
        <Col span={24}>
          <h1 style={{ textOverflow: "ellipsis" }}>{title}</h1>
        </Col>
        {/* {loggedInUser && (
          <Col span={8}>
            <Button
              className={"page-user-button"}
              icon={"logout"}
              ghost={true}
              onClick={() =>
                this.props.logout().then(this.props.client.resetStore)
              }
            >
              {`Logout ${loggedInUser.name}`}
            </Button>
          </Col>
        )} */}
      </Row>
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
        {TOPLEVEL_ROUTES.map(
          (route: IRouteProps, index: number) => (
            <Route key={index} {...route} />
          )
        )}
        <Route {...DEFAULT_ROUTE} />
      </Switch>
    </Content>
  );

  render() {
    const { title } = this.props;
    const { menuCollapsed } = this.state;

    // Try to obtain active menu path
    const activeMenuKey = this.getActiveMenuKey();

    return (
      <Layout style={{ minHeight: "100vh" }}>
        {this.renderHeader(title)}
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
      </Layout>
    );
  }

  private onMenuCollapseChange = (collapsed: boolean) =>
    this.setState({
      menuCollapsed: collapsed
    });
}

export const PageComponent = isDevelopmentEnv()
  ? hot(module)(PageComponentClass)
  : PageComponentClass;
