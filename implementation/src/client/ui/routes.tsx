import * as H from "history";
import * as React from "react";
import {
  Redirect,
  RouteChildrenProps,
  RouteComponentProps
} from "react-router";
import { WaehlenPage } from "./components/roots/WaehlenPage";
import { WahlhelferPage } from "./components/roots/WahlhelferPage";
import { WahlleiterPage } from "./components/roots/WahlleiterPage";

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
  render: () => <Redirect to={"/waehlen"} />
};

export const RouteBasepaths = {
  waehlen: "/waehlen",
  wahlhelfer: "/wahlhelfer",
  wahlleiter: "/wahlleiter",
};

export const TOPLEVEL_ROUTES: IMenuRoute[] = [
  {
    menuKey: "Waehlen",
    menuTitle: "Wählen",
    menuIconIdentifier: "check-square",
    path: `${RouteBasepaths.waehlen}/`,
    render: (props: RouteComponentProps<any>) => (
      <WaehlenPage routeProps={props} />
    )
  },
  {
    menuKey: "Wahlhelfer",
    menuTitle: "WahlhelferIn",
    menuIconIdentifier: "team",
    path: `${RouteBasepaths.wahlhelfer}/`,
    render: (props: RouteComponentProps<any>) => (
      <WahlhelferPage routeProps={props} />
    )
  },
  {
    menuKey: "Wahlleiter",
    menuTitle: "WahlleiterIn",
    menuIconIdentifier: "user",
    path: `${RouteBasepaths.wahlleiter}/`,
    render: (props: RouteComponentProps<any>) => (
      <WahlleiterPage routeProps={props} />
    )
  },
];
