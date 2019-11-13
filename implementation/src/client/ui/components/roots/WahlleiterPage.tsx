import * as React from 'react';
import { RouteComponentProps } from "react-router";
import { Card, message, Button, Col, Row } from 'antd';

export interface IWahlleiterPageProps {
    routeProps: RouteComponentProps<any>;
}

export const WahlleiterPage = (props: IWahlleiterPageProps) => (
    <Card title={"WahlleiterIn Funktionen"} style={{ minHeight: '100%' }} hoverable={true}>
        <Row type={'flex'} gutter={16} justify={'center'} style={{ marginTop: "15px" }}>
            <Col>
                <Button type={"primary"} style={{ float: "right" }} onClick={() => {
                    message.error("Unimplemented");
                }}>
                    CSV Importieren
                </Button>
            </Col>
            <Col>
                <Button type={'primary'} style={{ float: "right" }} onClick={() => {
                    message.error("Unimplemented");
                }}>
                    Stimmen korrigieren
                </Button>
            </Col>
        </Row>
    </Card>
);