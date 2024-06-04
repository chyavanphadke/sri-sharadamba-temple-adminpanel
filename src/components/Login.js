// src/components/Login.js
import React from 'react';
import { Form, Input, Button, Layout, message, Card } from 'antd'; // Import Card from Ant Design
import { useNavigate } from 'react-router-dom';
import './Login.css';
import axios from 'axios';

const { Content } = Layout;

const Login = () => {
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      const response = await axios.post('http://localhost:5001/login', values);
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
        <Card className="login-card" bordered={true}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2>Welcome to Sharada Temple, Milpitas</h2>
          </div>
          <div className="login-container">
            <div className="login-image" />
            <Form name="login_form" className="login-form" onFinish={onFinish}>
              <Form.Item
                name="username"
                label="Username"
                rules={[{ required: true, message: 'Please input your Username!' }]}
              >
                <Input placeholder="Username" />
              </Form.Item>
              <Form.Item
                name="password"
                label="Password"
                rules={[{ required: true, message: 'Please input your Password!' }]}
              >
                <Input type="password" placeholder="Password" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" className="login-form-button">
                  Log In
                </Button>
              </Form.Item>
              <Form.Item>
                <Button type="link" href="/signup" className="signup-form-button">
                  Sign Up
                </Button>
              </Form.Item>
            </Form>
          </div>
        </Card>
      </Content>
    </Layout>
  );
};

export default Login;
