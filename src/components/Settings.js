import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Layout, message, Modal, Table, Checkbox } from 'antd';
import axios from 'axios';
import './Settings.css';

const { Content } = Layout;

const Settings = () => {
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [serviceModalVisible, setServiceModalVisible] = useState(false);
  const [newServiceModalVisible, setNewServiceModalVisible] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [accessRightsModalVisible, setAccessRightsModalVisible] = useState(false);
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [headerColor, setHeaderColor] = useState('#001529');
  const [sidebarColor, setSidebarColor] = useState('#001529');
  const [accessControls, setAccessControls] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchServices();
    const storedHeaderColor = localStorage.getItem('headerColor');
    const storedSidebarColor = localStorage.getItem('sidebarColor');
    if (storedHeaderColor) setHeaderColor(storedHeaderColor);
    if (storedSidebarColor) setSidebarColor(storedSidebarColor);
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

  const fetchAccessControls = async () => {
    try {
      const response = await axios.get('http://localhost:5001/access-controls');
      setAccessControls(response.data);
    } catch (error) {
      message.error('Failed to load access controls');
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

  const handleChangeColor = () => {
    localStorage.setItem('headerColor', headerColor);
    localStorage.setItem('sidebarColor', sidebarColor);
    window.location.reload();
  };

  const handleResetColors = () => {
    localStorage.removeItem('headerColor');
    localStorage.removeItem('sidebarColor');
    window.location.reload();
  };

  const handleAccessRightChange = (index, field, value) => {
    const newAccessControls = [...accessControls];
    newAccessControls[index][field] = value ? 1 : 0;
    setAccessControls(newAccessControls);
  };

  const handleAccessRightsSave = async () => {
    try {
      await axios.put('http://localhost:5001/access-controls', accessControls);
      message.success('Access rights updated successfully');
      setAccessRightsModalVisible(false);
      fetchAccessControls();
    } catch (error) {
      message.error('Failed to update access rights');
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

  const accessRightColumns = [
    {
      title: 'User Type',
      dataIndex: 'usertype',
      key: 'usertype',
    },
    {
      title: 'Component',
      dataIndex: 'component',
      key: 'component',
    },
    {
      title: 'Can View',
      dataIndex: 'can_view',
      key: 'can_view',
      render: (text, record, index) => (
        <Checkbox
          checked={text === 1}
          onChange={(e) => handleAccessRightChange(index, 'can_view', e.target.checked)}
          disabled={text === 2}
        />
      ),
    },
    {
      title: 'Can Add',
      dataIndex: 'can_add',
      key: 'can_add',
      render: (text, record, index) => (
        <Checkbox
          checked={text === 1}
          onChange={(e) => handleAccessRightChange(index, 'can_add', e.target.checked)}
          disabled={text === 2}
        />
      ),
    },
    {
      title: 'Can Edit',
      dataIndex: 'can_edit',
      key: 'can_edit',
      render: (text, record, index) => (
        <Checkbox
          checked={text === 1}
          onChange={(e) => handleAccessRightChange(index, 'can_edit', e.target.checked)}
          disabled={text === 2}
        />
      ),
    },
    {
      title: 'Can Delete',
      dataIndex: 'can_delete',
      key: 'can_delete',
      render: (text, record, index) => (
        <Checkbox
          checked={text === 1}
          onChange={(e) => handleAccessRightChange(index, 'can_delete', e.target.checked)}
          disabled={text === 2}
        />
      ),
    },
    {
      title: 'Can Approve',
      dataIndex: 'can_approve',
      key: 'can_approve',
      render: (text, record, index) => (
        <Checkbox
          checked={text === 1}
          onChange={(e) => handleAccessRightChange(index, 'can_approve', e.target.checked)}
          disabled={text === 2}
        />
      ),
    },
    {
      title: 'Can Email',
      dataIndex: 'can_email',
      key: 'can_email',
      render: (text, record, index) => (
        <Checkbox
          checked={text === 1}
          onChange={(e) => handleAccessRightChange(index, 'can_email', e.target.checked)}
          disabled={text === 2}
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
          <Button type="primary" onClick={() => setThemeModalVisible(true)} style={{ marginLeft: '10px' }}>
            Change Theme Colors
          </Button>
          <Button type="primary" onClick={() => { setAccessRightsModalVisible(true); fetchAccessControls(); }} style={{ marginLeft: '10px' }}>
            Change Access Rights
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

          <Modal
            title="Change Theme Colors"
            visible={themeModalVisible}
            onCancel={() => setThemeModalVisible(false)}
            footer={[
              <Button key="reset" onClick={handleResetColors}>
                Reset to Default
              </Button>,
              <Button key="submit" type="primary" onClick={handleChangeColor}>
                Change Color
              </Button>,
            ]}
          >
            <Form layout="vertical">
              <Form.Item label="Header Color">
                <Input
                  type="color"
                  value={headerColor}
                  onChange={(e) => setHeaderColor(e.target.value)}
                />
              </Form.Item>
              <Form.Item label="Sidebar Color">
                <Input
                  type="color"
                  value={sidebarColor}
                  onChange={(e) => setSidebarColor(e.target.value)}
                />
              </Form.Item>
            </Form>
          </Modal>

          <Modal
            title="Change Access Rights"
            visible={accessRightsModalVisible}
            onCancel={() => setAccessRightsModalVisible(false)}
            onOk={handleAccessRightsSave}
            width={1000}
          >
            <Table
              columns={accessRightColumns}
              dataSource={accessControls}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Modal>
        </div>
      </Content>
    </Layout>
  );
};

export default Settings;
