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
      message.success('Signup successful. Waiting for Admin approval.', 2, () => {
        navigate('/'); // This callback will be executed after the message duration
      });
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
              <h2>Sign Up for Sri Sharadamba Temple, Milpitas</h2>
            </div>
            <Form name="signup_form" className="signup-form" onFinish={onFinish}>
              <Form.Item name="email" rules={[{ required: true, message: 'Please input your Email!' }]}>
                <Input placeholder="Email" />
              </Form.Item>
              <Form.Item name="username" rules={[{ required: true, message: 'Please input your Username!' }]}>
                <Input placeholder="Username" />
              </Form.Item>
              <Form.Item name="password" rules={[{ required: true, message: 'Please input your Password!' }]}>
                <Input type="password" placeholder="Password" />
              </Form.Item>
              <Form.Item
                name="confirmPassword"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Please confirm your Password!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('The two passwords do not match!'));
                    },
                  }),
                ]}
              >
                <Input type="password" placeholder="Confirm Password" />
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
