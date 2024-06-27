import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Layout, message, Modal, Table, Checkbox } from 'antd';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import './Settings.css'; // Import CSS file for styling

const { Content } = Layout;

const Settings = () => {
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [serviceModalVisible, setServiceModalVisible] = useState(false);
  const [newServiceModalVisible, setNewServiceModalVisible] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [accessRightsModalVisible, setAccessRightsModalVisible] = useState(false);
  const [emailCredentialsModalVisible, setEmailCredentialsModalVisible] = useState(false);
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [headerColor, setHeaderColor] = useState('#001529');
  const [sidebarColor, setSidebarColor] = useState('#001529');
  const [accessRights, setAccessRights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [emailCredentials, setEmailCredentials] = useState({ email: '', appPassword: '' });
  const [emailText, setEmailText] = useState([]);
  const [autoApprove, setAutoApprove] = useState(false);
  const [form] = Form.useForm();

  const token = localStorage.getItem('token');
  const decodedToken = jwtDecode(token);
  const userType = decodedToken.usertype;

  useEffect(() => {
    fetchServices();
    const storedHeaderColor = localStorage.getItem('headerColor');
    const storedSidebarColor = localStorage.getItem('sidebarColor');
    if (storedHeaderColor) setHeaderColor(storedHeaderColor);
    if (storedSidebarColor) setSidebarColor(storedSidebarColor);
    fetchEmailText();
    fetchAutoApprove();
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

  const fetchEmailText = async () => {
    try {
      const response = await axios.get('http://localhost:5001/email-text');
      setEmailText(response.data);
      form.setFieldsValue({ emailText: response.data.join('\n') });
    } catch (error) {
      message.error('Failed to load email text');
    }
  };

  const fetchAutoApprove = async () => {
    try {
      const response = await axios.get('http://localhost:5001/general-configurations');
      setAutoApprove(response.data.autoApprove);
    } catch (error) {
      message.error('Failed to load auto approve setting');
    }
  };

  const saveAutoApprove = async (value) => {
    try {
      await axios.put('http://localhost:5001/general-configurations', { autoApprove: value });
      setAutoApprove(value);
      message.success(value ? 'Auto approve on sign up GRANTED (Access: User)' : 'Auto approve on sign up REMOVED');
    } catch (error) {
      message.error('Failed to update general configurations');
    }
  };

  const onFinishPasswordChange = async (values) => {
    try {
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
      const newService = {
        Service: values.Service,
        Rate: parseFloat(values.Rate),
        Comments: ' ',
        Active: true,
        DisplayFamily: false,
        Temple: 0,
        SvcCategoryId: 0,
      };
  
      await axios.post('http://localhost:5001/services', newService);
      message.success('Service added successfully');
      setNewServiceModalVisible(false);
      fetchServices();
    } catch (error) {
      message.error('Failed to add service');
    }
  };
  
  



  const handleNewServiceModalOpen = () => {
    form.resetFields();
    setNewServiceModalVisible(true);
  };

  const handleNewServiceModalCancel = () => {
    setNewServiceModalVisible(false);
    form.resetFields();
  };

  const handleClearForm = () => {
    form.resetFields();
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

  const handleAccessRightsSave = async () => {
    try {
      await axios.put('http://localhost:5001/access-control', accessRights);
      message.success('Access rights updated successfully');
      setAccessRightsModalVisible(false);
    } catch (error) {
      message.error('Failed to update access rights');
    }
  };

  const handleAccessChange = (record, field, value) => {
    const updatedRights = accessRights.map((item) => {
      if (item.id === record.id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setAccessRights(updatedRights);
  };

  const fetchAccessControlData = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5001/access-control');
      setAccessRights(response.data);
    } catch (error) {
      message.error('Failed to load access control data');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmailCredentials = async () => {
    try {
      const response = await axios.get('http://localhost:5001/email-credentials');
      setEmailCredentials(response.data);
    } catch (error) {
      message.error('Failed to load email credentials');
    }
  };

  const handleOpenAccessRightsModal = () => {
    fetchAccessControlData();
    setAccessRightsModalVisible(true);
  };

  const handleOpenEmailCredentialsModal = () => {
    fetchEmailCredentials();
    setEmailCredentialsModalVisible(true);
  };

  const handleEmailCredentialsSave = async () => {
    try {
      await axios.put('http://localhost:5001/email-credentials', emailCredentials);
      message.success('Email credentials updated successfully');
      setEmailCredentialsModalVisible(false);
    } catch (error) {
      message.error('Failed to update email credentials');
    }
  };

  const handleEmailChange = (field, value) => {
    setEmailCredentials({ ...emailCredentials, [field]: value });
  };

  const handleSaveEmailText = async () => {
    try {
      const updatedText = form.getFieldValue('emailText').split('\n');
      await axios.put('http://localhost:5001/email-text', updatedText);
      message.success('Email text updated successfully');
      setEmailModalVisible(false);
      fetchEmailText(); // Refresh the text after saving
    } catch (error) {
      message.error('Failed to update email text');
    }
  };

  const handleResetEmailText = async () => {
    try {
      await axios.put('http://localhost:5001/email-text/reset');
      message.success('Email text reset to default');
      fetchEmailText(); // Refresh the text after resetting
    } catch (error) {
      message.error('Failed to reset email text');
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
          {(userType === 'Admin' || userType === 'Super Admin') && (
            <Button type="primary" onClick={() => setServiceModalVisible(true)} style={{ marginLeft: '10px' }}>
              Modify Services
            </Button>
          )}
          <Button type="primary" onClick={() => setThemeModalVisible(true)} style={{ marginLeft: '10px' }}>
            Change Theme Colors
          </Button>
          {userType === 'Super Admin' && (
            <>
              <Button type="primary" onClick={handleOpenAccessRightsModal} style={{ marginLeft: '10px' }}>
                Change Access Rights
              </Button>
              <Button type="primary" onClick={handleOpenEmailCredentialsModal} style={{ marginLeft: '10px' }}>
                Email Credentials
              </Button>
              <Button type="primary" onClick={() => setEmailModalVisible(true)} style={{ marginLeft: '10px' }}>
                Edit Email Text
              </Button>
            </>
          )}
          <h3 style={{ marginTop: '20px' }}>General Configurations</h3>
          <Checkbox
            checked={autoApprove}
            onChange={(e) => saveAutoApprove(e.target.checked)}
            style={{ marginTop: '10px' }}
          >
            Auto Approve users on Signup
          </Checkbox>

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
            <Button type="primary" onClick={handleNewServiceModalOpen} style={{ marginBottom: '10px', marginLeft: '10px' }}>
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
            onCancel={handleNewServiceModalCancel}
            footer={null}
          >
            <Form
              name="add_service"
              className="add-service-form"
              onFinish={handleAddService}
              form={form}
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
                <Button type="default" onClick={handleClearForm} style={{ marginRight: '10px' }}>
                  Clear
                </Button>
                <Button type="primary" htmlType="submit" style={{ marginRight: '10px' }}>
                  Add Service
                </Button>
                <Button type="default" onClick={handleNewServiceModalCancel}>
                  Cancel
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
            width={800}
          >
            <Table
              columns={[
                {
                  title: 'Pages',
                  dataIndex: 'component',
                  key: 'component',
                },
                {
                  title: 'User Type',
                  dataIndex: 'usertype',
                  key: 'usertype',
                },
                {
                  title: 'View',
                  dataIndex: 'can_view',
                  key: 'can_view',
                  render: (value, record) => (
                    <Checkbox
                      checked={value === 1}
                      onChange={(e) => handleAccessChange(record, 'can_view', e.target.checked ? 1 : 0)}
                      disabled={value === 2}
                    />
                  ),
                },
                {
                  title: 'Add',
                  dataIndex: 'can_add',
                  key: 'can_add',
                  render: (value, record) => (
                    <Checkbox
                      checked={value === 1}
                      onChange={(e) => handleAccessChange(record, 'can_add', e.target.checked ? 1 : 0)}
                      disabled={value === 2}
                    />
                  ),
                },
                {
                  title: 'Edit',
                  dataIndex: 'can_edit',
                  key: 'can_edit',
                  render: (value, record) => (
                    <Checkbox
                      checked={value === 1}
                      onChange={(e) => handleAccessChange(record, 'can_edit', e.target.checked ? 1 : 0)}
                      disabled={value === 2}
                    />
                  ),
                },
                {
                  title: 'Delete',
                  dataIndex: 'can_delete',
                  key: 'can_delete',
                  render: (value, record) => (
                    <Checkbox
                      checked={value === 1}
                      onChange={(e) => handleAccessChange(record, 'can_delete', e.target.checked ? 1 : 0)}
                      disabled={value === 2}
                    />
                  ),
                },
                {
                  title: 'Approve',
                  dataIndex: 'can_approve',
                  key: 'can_approve',
                  render: (value, record) => (
                    <Checkbox
                      checked={value === 1}
                      onChange={(e) => handleAccessChange(record, 'can_approve', e.target.checked ? 1 : 0)}
                      disabled={value === 2}
                    />
                  ),
                },
                {
                  title: 'Email',
                  dataIndex: 'can_email',
                  key: 'can_email',
                  render: (value, record) => (
                    <Checkbox
                      checked={value === 1}
                      onChange={(e) => handleAccessChange(record, 'can_email', e.target.checked ? 1 : 0)}
                      disabled={value === 2}
                    />
                  ),
                },
              ]}
              dataSource={accessRights}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Modal>

          <Modal
            title="Email Credentials"
            visible={emailCredentialsModalVisible}
            onCancel={() => setEmailCredentialsModalVisible(false)}
            onOk={handleEmailCredentialsSave}
          >
            <Form layout="vertical">
              <Form.Item label="Email">
                <Input
                  value={emailCredentials.email}
                  onChange={(e) => handleEmailChange('email', e.target.value)}
                />
              </Form.Item>
              <Form.Item label="App Password">
                <Input.Password
                  value={emailCredentials.appPassword}
                  onChange={(e) => handleEmailChange('appPassword', e.target.value)}
                />
              </Form.Item>
            </Form>
          </Modal>

          <Modal
            title="Edit Email Text"
            visible={emailModalVisible}
            onOk={handleSaveEmailText}
            onCancel={() => setEmailModalVisible(false)}
            footer={[
              <Button key="reset" onClick={handleResetEmailText}>
                Reset to Default
              </Button>,
              <Button key="submit" type="primary" onClick={handleSaveEmailText}>
                Save
              </Button>,
            ]}
          >
            <Form form={form} layout="horizontal">
              <Form.Item name="emailText" label="Email Text">
                <Input.TextArea rows={10} style={{ width: '100%' }} /> 
              </Form.Item>
            </Form>
          </Modal>
        </div>
      </Content>
    </Layout>
  );
};

export default Settings;
