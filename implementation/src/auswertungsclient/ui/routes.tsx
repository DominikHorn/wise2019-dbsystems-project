import * as H from "history";
import * as React from "react";
import { RouteChildrenProps, RouteComponentProps } from "react-router";
import { WidgetType } from "./components/general/statistikwidgets/WidgetTypes";

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

export const PRECONFIGURED_WIDGET_ROUTES: IMenuRoute[] = [
  {
    menuKey: "Empty",
    menuTitle: "Neues Layout",
    menuIconIdentifier: "plus",
    path: `/`
  },
  {
    menuKey: "Ergebnisse",
    menuTitle: "Ergebnisse",
    menuIconIdentifier: "database",
    path: `/${encodeURIComponent(
      JSON.stringify([
        {
          type: "Mandatliste (Q2)",
          layout: {
            w: 8,
            h: 8,
            x: 0,
            y: 0,
            i: "0",
            minW: 4,
            minH: 4
          }
        }
      ])
    )}`
  }
];
