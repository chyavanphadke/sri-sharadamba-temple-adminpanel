// src/components/Settings.js
import React from 'react';
import { Form, Input, Button, Layout, message } from 'antd';
import axios from 'axios';
import './Settings.css'; // Import CSS file for styling

const { Content } = Layout;

const Settings = () => {
  const onFinish = async (values) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5001/change-password', values, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success('Password changed successfully');
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Error changing password');
      }
    }
  };

  return (
    <Layout>
      <Content style={{ padding: '0 50px' }}>
        <div className="site-layout-content">
          <h2>Change Password</h2>
          <Form name="change_password" className="change-password-form" onFinish={onFinish}>
            <Form.Item
              name="currentPassword"
              rules={[{ required: true, message: 'Please input your current password!' }]}
            >
              <Input.Password placeholder="Current Password" className="password-field" />
            </Form.Item>
            <Form.Item
              name="newPassword"
              rules={[{ required: true, message: 'Please input your new password!' }]}
            >
              <Input.Password placeholder="New Password" className="password-field" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" className="change-password-button">
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
