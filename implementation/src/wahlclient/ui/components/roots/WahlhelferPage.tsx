import * as React from 'react';
import { RouteComponentProps } from "react-router";
import { Card, message, Button, Col, Row } from 'antd';

export interface IWahlhelferPageProps {
    routeProps: RouteComponentProps<any>;
}

export const WahlhelferPage = (props: IWahlhelferPageProps) => (
    <Card title={"WahlhelferInnen Funktionen"} style={{ minHeight: '100%' }} hoverable={true}>
        <Row type={'flex'} gutter={16} justify={'center'} style={{ marginTop: '15px' }}>
            <Col>
                <Button type={"primary"} style={{ float: "right" }} onClick={() => {
                    message.error("Unimplemented");
                }}>
                    Wählen freigeben
                </Button>
            </Col>
            <Col>
                <Button type={'primary'} style={{ float: "right" }} onClick={() => {
                    message.error("Unimplemented");
                }}>
                    Stimmeintragung
                </Button>
            </Col>
        </Row>
    </Card>
);
