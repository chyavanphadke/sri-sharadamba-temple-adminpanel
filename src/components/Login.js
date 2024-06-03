// src/components/Login.js
import React from 'react';
import { Form, Input, Button, Row, Col, Layout, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import axios from 'axios';

const { Content } = Layout;

const Login = () => {
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      const response = await axios.post('http://localhost:5000/login', values);
      localStorage.setItem('token', response.data.token);
      message.success('Login successful');
      navigate('/dashboard/home'); // Navigate to /dashboard/home after login
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Invalid credentials');
      }
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
            <Form name="login_form" className="login-form" onFinish={onFinish}>
              <Form.Item name="username" rules={[{ required: true, message: 'Please input your Username!' }]}>
                <Input placeholder="Username" />
              </Form.Item>
              <Form.Item name="password" rules={[{ required: true, message: 'Please input your Password!' }]}>
                <Input type="password" placeholder="Password" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" className="login-form-button">
                  Log In
                </Button>
                <Button type="link" href="/signup">
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

export default Login;
