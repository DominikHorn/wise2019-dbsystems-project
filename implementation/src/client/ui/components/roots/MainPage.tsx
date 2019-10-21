import { Card, Button } from "antd";
import * as React from "react";
import { renderCenteredLoading } from "../../guiUtil";
import { IPageProps } from "../../PageComponent";
import { RouteComponentProps } from "react-router";

export interface IMainPageProps {
  routeProps: RouteComponentProps<any>;
}

export const MainPage = (props: IMainPageProps) => (
  <Card className={"shared-content-card"} title={"Main"} hoverable={true}>
    <h1>Hello World</h1>
    <p>Lorem Ipsum Dolor Sit Amet ...</p>
    {renderCenteredLoading()}
    <Button>Test</Button>
  </Card>
);