// src/components/ForgotPassword.js
import React, { useState } from 'react';
import { Form, Input, Button, Layout, message, Card } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const { Content } = Layout;

const ForgotPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');

  const handleResetPassword = async () => {
    try {
      const response = await axios.post(`http://10.0.0.204:5001/reset-password/${token}`, { newPassword });
      message.success(response.data.message);
      navigate('/login');
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Uh oh. Something went wrong...');
      }
    }
  };

  return (
    <Layout>
      <Content className="forgot-password-content">
        <Card className="forgot-password-card" bordered={true}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2>Reset Your Password</h2>
          </div>
          <Form layout="vertical">
            <Form.Item label="New Password">
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter your new password"
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" onClick={handleResetPassword}>
                Reset Password
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Content>
    </Layout>
  );
};

export default ForgotPassword;
