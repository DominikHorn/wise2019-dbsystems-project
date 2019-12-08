import * as H from "history";
import * as React from "react";
import {
  Redirect,
  RouteChildrenProps,
  RouteComponentProps
} from "react-router";
import { StatistikPage } from "./components/roots/StatistikPage";
import { ErgebnissePage } from "./components/roots/ErgebnissePage";

export interface IRouteProps {
  readonly path: string;
  readonly location?: H.Location;
  readonly exact?: boolean;
  readonly sensitive?: boolean;
  readonly strict?: boolean;
  readonly component?: React.ComponentType<RouteComponentProps<any>>;
  readonly render?: (props: RouteComponentProps<any>) => React.ReactNode;
  readonly children?:
    | ((props: RouteChildrenProps<any>) => React.ReactNode)
    | React.ReactNode;
}

export interface ISubRoute {
  readonly title: string;
  readonly key: string;
  readonly path: string;
}

export interface IMenuRoute extends IRouteProps {
  readonly menuKey: string;
  readonly menuTitle: string;
  readonly menuIconIdentifier: string;

  // If valid, subpaths that will be displayed as submenu entries
  readonly possibleSubroutes?: ISubRoute[];
}

export const DEFAULT_ROUTE: IRouteProps = {
  path: "/",
  render: () => <Redirect to={RouteBasepaths.statistik} />
};

export const RouteBasepaths = {
  statistik: "/statistik",
  ergebnisse: "/ergebnisse"
};

export const TOPLEVEL_ROUTES: IMenuRoute[] = [
  {
    menuKey: "Statistik",
    menuTitle: "Auswertung",
    menuIconIdentifier: "pie-chart",
    path: `${RouteBasepaths.statistik}/`,
    render: (props: RouteComponentProps<any>) => (
      <StatistikPage routeProps={props} />
    )
  },
  {
    menuKey: "Ergebnisse",
    menuTitle: "Ergebnisse",
    menuIconIdentifier: "database",
    path: `${RouteBasepaths.ergebnisse}/`,
    render: (props: RouteComponentProps<any>) => (
      <ErgebnissePage routeProps={props} />
    )
  }
];
