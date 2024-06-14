// src/components/Login.js
import React, { useState } from 'react';
import { Form, Input, Button, Layout, message, Card, Modal } from 'antd';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import axios from 'axios';

const { Content } = Layout;

const Login = () => {
  const navigate = useNavigate();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const onFinish = async (values) => {
    try {
      const response = await axios.post('http://localhost:5001/login', values);
      localStorage.setItem('token', response.data.token);
      message.success('Login successful');
      navigate('/dashboard/home');
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Uh oh. Something went wrong...');
      }
    }
  };

  const handleForgotPassword = async () => {
    try {
      const response = await axios.post('http://localhost:5001/forgot-password', { email: forgotPasswordEmail });
      message.success(response.data.message);
      setIsModalVisible(false);
      setEmailError('');
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        setEmailError(error.response.data.message);
      } else {
        message.error('Uh oh. Something went wrong...');
      }
    }
  };

  return (
    <Layout>
      <Content className="login-content">
        <Card className="login-card" bordered={true}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2>Welcome to Sri Sharadamba Temple, Milpitas</h2>
          </div>
          <div className="login-container">
            <div className="login-image" />
            <Form name="login_form" className="login-form" onFinish={onFinish}>
              <Form.Item
                name="usernameOrEmail"
                label="Username"
                rules={[{ required: true, message: 'Please input your Username or Email!' }]}
              >
                <Input placeholder="Username or Email" />
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
                <div className="extra-buttons">
                  <Button type="link" onClick={() => setIsModalVisible(true)} className="forgot-password-button">
                    Forgot Password
                  </Button>
                  <Button type="link" href="/signup" className="signup-form-button">
                    Sign Up
                  </Button>
                </div>
              </Form.Item>
            </Form>
          </div>
        </Card>

        <Modal
          title="Forgot Password"
          visible={isModalVisible}
          onOk={handleForgotPassword}
          onCancel={() => setIsModalVisible(false)}
        >
          <Form layout="vertical">
            <Form.Item label="Email" validateStatus={emailError ? 'error' : ''} help={emailError || ''}>
              <Input
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" onClick={handleForgotPassword}>
                Reset
              </Button>
              <Button style={{ marginLeft: '10px' }} onClick={() => setIsModalVisible(false)}>
                Cancel
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default Login;
