import React from 'react';
import ReactDOM from 'react-dom';
import { Input,Row, Col } from 'antd';
import 'antd/dist/antd.css'

// Render the main component into the dom
ReactDOM.render(
    <div>
        <Input/>
        <div>
            <Row>
                <Col span={12}>col-12</Col>
                <Col span={12}>col-12</Col>
            </Row>
            <Row>
                <Col span={8}>col-8</Col>
                <Col span={8}>col-8</Col>
                <Col span={8}>col-8</Col>
            </Row>
            <Row>
                <Col span={6}>col-6</Col>
                <Col span={6}>col-6</Col>
                <Col span={6}>col-6</Col>
                <Col span={6}>col-6</Col>
            </Row>
        </div>
    </div>, document.getElementById('app'));
