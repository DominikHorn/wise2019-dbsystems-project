import * as H from "history";
import * as React from "react";
import { RouteChildrenProps, RouteComponentProps } from "react-router";
import {
  WidgetType,
  StatistikWidgetSetting
} from "./components/general/statistikwidgets/WidgetTypes";

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

function encodeWidgetSettings(settings: StatistikWidgetSetting[]) {
  return `/${btoa(encodeURIComponent(JSON.stringify(settings)))}`;
}

export const PRECONFIGURED_WIDGET_ROUTES: IMenuRoute[] = [
  {
    menuKey: "Empty",
    menuTitle: "Neues Layout",
    menuIconIdentifier: "delete",
    path: `/`
  },
  {
    menuKey: "Ergebnisse",
    menuTitle: "Ergebnisse",
    menuIconIdentifier: "pie-chart",
    path: encodeWidgetSettings([
      {
        type: WidgetType.MANDAT_LISTE,
        layout: {
          w: 6,
          h: 20,
          x: 0,
          y: 0,
          i: "0",
          minW: 4,
          minH: 4
        }
      },
      {
        type: WidgetType.SITZVERTEILUNG_PIECHART,
        layout: {
          w: 6,
          h: 10,
          x: 6,
          y: 0,
          i: "1",
          minW: 4,
          minH: 4
        }
      },
      {
        type: WidgetType.UEBERHANGMANDATE,
        layout: {
          w: 6,
          h: 10,
          x: 6,
          y: 10,
          i: "2",
          minW: 4,
          minH: 4
        }
      }
    ])
  },
  {
    menuKey: "Stimmkreisinfo",
    menuTitle: "Stimmkreisinfo",
    menuIconIdentifier: "pic-left",
    path: encodeWidgetSettings([
      {
        type: WidgetType.STIMMKREIS_INFO_WAHLBETEILIGUNG,
        layout: {
          w: 12,
          h: 20,
          x: 0,
          y: 0,
          i: "0",
          minW: 4,
          minH: 4
        }
      }
    ])
  }
];
