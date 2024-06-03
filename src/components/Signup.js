// src/components/Signup.js
import React, { useState } from 'react';
import { Form, Input, Button, Row, Col, Layout, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import axios from 'axios';

const { Content } = Layout;

const Signup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/signup', values);
      if (response.status === 200) {
        message.success(response.data.message);
        navigate('/');
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Error signing up');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Content className="login-content">
        <Row justify="center" align="middle" style={{ height: '100vh' }}>
          <Col span={8}>
            <div className="login-image" />
          </Col>
          <Col span={8}>
            <Form name="signup_form" className="login-form" onFinish={onFinish}>
              <Form.Item name="username" rules={[{ required: true, message: 'Please input your Username!' }]}>
                <Input placeholder="Username" />
              </Form.Item>
              <Form.Item name="password" rules={[{ required: true, message: 'Please input your Password!' }]}>
                <Input type="password" placeholder="Password" />
              </Form.Item>
              <Form.Item name="reason_for_access" rules={[{ required: true, message: 'Please input your Reason for Access!' }]}>
                <Input placeholder="Reason for Access" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" className="login-form-button" loading={loading}>
                  Sign Up
                </Button>
              </Form.Item>
            </Form>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default Signup;
