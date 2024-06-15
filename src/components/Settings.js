// src/components/Settings.js
import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Layout, message, Modal, Table, Checkbox } from 'antd';
import axios from 'axios';
import './Settings.css'; // Import CSS file for styling

const { Content } = Layout;

const Settings = () => {
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [serviceModalVisible, setServiceModalVisible] = useState(false);
  const [newServiceModalVisible, setNewServiceModalVisible] = useState(false);
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [form] = Form.useForm();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await axios.get('http://localhost:5001/services');
      const sortedServices = response.data.sort((a, b) => b.Active - a.Active);
      setServices(sortedServices);
      setFilteredServices(sortedServices);
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

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (term.length >= 3) {
      const filtered = services.filter(service =>
        service.Service.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredServices(filtered);
    } else {
      setFilteredServices(services);
    }
  };

  const handleAddService = async (values) => {
    try {
      await axios.post('http://localhost:5001/services', values);
      message.success('Service added successfully');
      setNewServiceModalVisible(false);
      fetchServices();
    } catch (error) {
      message.error('Failed to add service');
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
          style={{ width: '80%' }}
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
          style={{ width: '80%' }}
        />
      ),
    },
    {
      title: 'Active',
      dataIndex: 'Active',
      key: 'Active',
      render: (text, record, index) => (
        <Checkbox
          checked={text}
          onChange={(e) => onServiceChange(index, 'Active', e.target.checked)}
        />
      ),
    },
  ];

  return (
    <Layout>
      <Content>
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
            width={800}
          >
            <Input.Search
              placeholder="Search services"
              value={searchTerm}
              onChange={handleSearch}
              style={{ marginBottom: '10px', width: '300px' }}
            />
            <Button type="primary" onClick={() => setNewServiceModalVisible(true)} style={{ marginBottom: '10px', marginLeft: '10px' }}>
              Add New Service
            </Button>
            <Table
              columns={serviceColumns}
              dataSource={filteredServices}
              rowKey="ServiceId"
              pagination={false}
              size="small"
            />
          </Modal>

          <Modal
            title="Add New Service"
            visible={newServiceModalVisible}
            onCancel={() => setNewServiceModalVisible(false)}
            footer={null}
          >
            <Form
              name="add_service"
              className="add-service-form"
              onFinish={handleAddService}
            >
              <Form.Item
                name="Service"
                rules={[{ required: true, message: 'Please input the service name!' }]}
              >
                <Input placeholder="Service Name" />
              </Form.Item>
              <Form.Item
                name="Rate"
                rules={[{ required: true, message: 'Please input the rate!' }]}
              >
                <Input placeholder="Rate" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  Add Service
                </Button>
              </Form.Item>
            </Form>
          </Modal>
        </div>
      </Content>
    </Layout>
  );
};

export default Settings;
