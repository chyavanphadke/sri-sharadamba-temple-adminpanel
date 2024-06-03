// src/components/Settings.js
import React from 'react';
import { Layout, Form, Input, Button, message } from 'antd';
import axios from 'axios';

const { Content } = Layout;

const Settings = () => {
  const onFinish = async (values) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/change-password',
        values,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success(response.data.message);
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Failed to change password');
      }
    }
  };

  return (
    <Layout>
      <Content style={{ padding: '0 50px' }}>
        <div className="site-layout-content">
          <h2>Settings Page</h2>
          <Form name="change_password" onFinish={onFinish}>
            <Form.Item
              name="currentPassword"
              rules={[{ required: true, message: 'Please input your current password!' }]}
            >
              <Input.Password placeholder="Current Password" />
            </Form.Item>
            <Form.Item
              name="newPassword"
              rules={[{ required: true, message: 'Please input your new password!' }]}
            >
              <Input.Password placeholder="New Password" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Change Password
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Content>
    </Layout>
  );
};

export default Settings;
