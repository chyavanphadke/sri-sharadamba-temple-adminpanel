// src/components/Settings.js
import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Layout, message, Modal, Table } from 'antd';
import axios from 'axios';
import './Settings.css'; // Import CSS file for styling

const { Content } = Layout;

const Settings = () => {
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [serviceModalVisible, setServiceModalVisible] = useState(false);
  const [services, setServices] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await axios.get('http://localhost:5001/services');
      setServices(response.data);
    } catch (error) {
      message.error('Failed to load services');
    }
  };

  const onFinishPasswordChange = async (values) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5001/change-password', values, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success('Password changed successfully');
      setPasswordModalVisible(false);
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Error changing password');
      }
    }
  };

  const onServiceChange = (index, field, value) => {
    const newServices = [...services];
    newServices[index][field] = value;
    setServices(newServices);
  };

  const handleServiceSave = async () => {
    try {
      await axios.put('http://localhost:5001/services', services);
      message.success('Services updated successfully');
      setServiceModalVisible(false);
      fetchServices();
    } catch (error) {
      message.error('Failed to update services');
    }
  };

  const serviceColumns = [
    {
      title: 'Service',
      dataIndex: 'Service',
      key: 'Service',
      render: (text, record, index) => (
        <Input
          value={text}
          onChange={(e) => onServiceChange(index, 'Service', e.target.value)}
        />
      ),
    },
    {
      title: 'Rate',
      dataIndex: 'Rate',
      key: 'Rate',
      render: (text, record, index) => (
        <Input
          value={text}
          onChange={(e) => onServiceChange(index, 'Rate', e.target.value)}
        />
      ),
    },
    {
      title: 'Active',
      dataIndex: 'Active',
      key: 'Active',
      render: (text, record, index) => (
        <Input
          type="checkbox"
          checked={text}
          onChange={(e) => onServiceChange(index, 'Active', e.target.checked)}
        />
      ),
    },
  ];

  return (
    <Layout>
      <Content >
        <div className="site-layout-content">
          <h2>Settings</h2>
          <Button type="primary" onClick={() => setPasswordModalVisible(true)}>
            Change Password
          </Button>
          <Button type="primary" onClick={() => setServiceModalVisible(true)} style={{ marginLeft: '10px' }}>
            Modify Services
          </Button>

          <Modal
            title="Change Password"
            visible={passwordModalVisible}
            onCancel={() => setPasswordModalVisible(false)}
            footer={null}
          >
            <Form
              name="change_password"
              className="change-password-form"
              onFinish={onFinishPasswordChange}
            >
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
          </Modal>

          <Modal
            title="Modify Services"
            visible={serviceModalVisible}
            onCancel={() => setServiceModalVisible(false)}
            onOk={handleServiceSave}
            width={800}  // Set the width of the modal
          >
            <Table
              columns={serviceColumns}
              dataSource={services}
              rowKey="ServiceId"
              pagination={false}
            />
          </Modal>
        </div>
      </Content>
    </Layout>
  );
};

export default Settings;
