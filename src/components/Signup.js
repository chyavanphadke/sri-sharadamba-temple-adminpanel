// src/components/Signup.js
import React from 'react';
import { Form, Input, Button, Row, Col, Layout, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import './Signup.css';
import axios from 'axios';

const { Content } = Layout;

const Signup = () => {
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      await axios.post('http://localhost:5001/signup', values);
      message.success('Signup successful. Waiting for Admin approval.');
      navigate('/');
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Error signing up');
      }
    }
  };

  return (
    <Layout>
      <Content className="signup-content">
        <Row justify="center" align="middle" style={{ height: '100vh' }}>
          <Col>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h2>Sign Up for Sharada Temple, Milpitas</h2>
            </div>
            <Form name="signup_form" className="signup-form" onFinish={onFinish}>
              <Form.Item name="username" rules={[{ required: true, message: 'Please input your Username!' }]}>
                <Input placeholder="Username" />
              </Form.Item>
              <Form.Item name="password" rules={[{ required: true, message: 'Please input your Password!' }]}>
                <Input type="password" placeholder="Password" />
              </Form.Item>
              <Form.Item name="confirmPassword" rules={[{ required: true, message: 'Please confirm your Password!' }]}>
                <Input type="password" placeholder="Confirm Password" />
              </Form.Item>
              <Form.Item name="reason_for_access" rules={[{ required: true, message: 'Please input your Reason for Access!' }]}>
                <Input placeholder="Reason for Access" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" className="signup-form-button">
                  Sign Up
                </Button>
              </Form.Item>
              <Form.Item>
                <Button type="default" onClick={() => navigate('/')} className="back-button">
                  Back to Login
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
