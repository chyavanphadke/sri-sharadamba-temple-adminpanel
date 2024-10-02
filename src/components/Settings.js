import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Layout, message, Modal, Table, Checkbox, Select, Dropdown, Menu } from 'antd';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import './Settings.css';

const { Content } = Layout;
const { Option } = Select;

const Settings = () => {
  const [accessRights, setAccessRights] = useState([]);
  const [originalAccessRights, setOriginalAccessRights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [accessRightsModalVisible, setAccessRightsModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [serviceModalVisible, setServiceModalVisible] = useState(false);
  const [newServiceModalVisible, setNewServiceModalVisible] = useState(false);
  const [newCategoryModalVisible, setNewCategoryModalVisible] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [emailCredentialsModalVisible, setEmailCredentialsModalVisible] = useState(false);
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [services, setServices] = useState([]);
  const [originalServices, setOriginalServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [headerColor, setHeaderColor] = useState('#001529');
  const [sidebarColor, setSidebarColor] = useState('#001529');
  const [emailCredentials, setEmailCredentials] = useState({ email: '', appPassword: '' });
  const [autoApprove, setAutoApprove] = useState(false);
  const [excelSevaEmailConformation, setExcelSevaEmailConformation] = useState(false);
  const [tempServices, setTempServices] = useState([]);
  const [form] = Form.useForm();
  const [categoryForm] = Form.useForm();

  const token = localStorage.getItem('token');
  const decodedToken = jwtDecode(token);
  const userType = decodedToken.usertype;

  useEffect(() => {
    fetchServices();
    fetchCategories();
    const storedHeaderColor = localStorage.getItem('headerColor');
    const storedSidebarColor = localStorage.getItem('sidebarColor');
    if (storedHeaderColor) setHeaderColor(storedHeaderColor);
    if (storedSidebarColor) setSidebarColor(storedSidebarColor);
    fetchEmailText();
    fetchGeneralConfigurations();
  }, []);

  const sortServices = (services, categories) => {
    return services.sort((a, b) => {
      const categoryA = categories.find(cat => cat.category_id === a.category_id)?.Category_name || '';
      const categoryB = categories.find(cat => cat.category_id === b.category_id)?.Category_name || '';
      if (categoryA < categoryB) return -1;
      if (categoryA > categoryB) return 1;
      if (a.Service < b.Service) return -1;
      if (a.Service > b.Service) return 1;
      return 0;
    });
  };

  // Fetch services
  const fetchServices = async () => {
    try {
      const response = await axios.get('http://localhost:5001/services');
      const sortedServices = response.data.sort((a, b) => b.Active - a.Active);
      setServices(sortedServices);
      setOriginalServices(sortedServices);
      setFilteredServices(sortedServices);
      setTempServices(sortedServices);
    } catch (error) {
      message.error('Failed to load services');
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:5001/categories');
      setCategories(response.data);
    } catch (error) {
      message.error('Failed to load categories');
    }
  };

  // Fetch email text
  const fetchEmailText = async () => {
    try {
      const response = await axios.get('http://localhost:5001/email-text');
      form.setFieldsValue({ emailText: response.data.join('\n') });
    } catch (error) {
      message.error('Failed to load email text');
    }
  };

  // Fetch general configurations
  const fetchGeneralConfigurations = async () => {
    try {
      const response = await axios.get('http://localhost:5001/general-configurations');
      setAutoApprove(response.data.autoApprove);
      setExcelSevaEmailConformation(response.data.excelSevaEmailConformation);
    } catch (error) {
      message.error('Failed to load general configurations');
    }
  };

  // Save general configurations
  const saveGeneralConfigurations = async (newConfigurations) => {
    try {
      await axios.put('http://localhost:5001/general-configurations', newConfigurations);
      message.success('General configurations updated successfully');
    } catch (error) {
      message.error('Failed to update general configurations');
    }
  };

  // Save auto approve setting
  const saveAutoApprove = async (value) => {
    const newConfigurations = {
      autoApprove: value,
      excelSevaEmailConformation,
    };
    setAutoApprove(value);
    saveGeneralConfigurations(newConfigurations);
  };

  // Save Excel Seva email confirmation setting
  const saveExcelSevaEmailConformation = async (value) => {
    const newConfigurations = {
      autoApprove,
      excelSevaEmailConformation: value,
    };
    setExcelSevaEmailConformation(value);
    saveGeneralConfigurations(newConfigurations);
  };

  // Change password
  const onFinishPasswordChange = async (values) => {
    try {
      await axios.post('http://localhost:5001/change-password', values, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success('Password changed successfully');
      setPasswordModalVisible(false);
    } catch (error) {
      message.error('Error changing password');
    }
  };

  // Handle service change
  const onTempServiceChange = (index, field, value) => {
    const serviceId = filteredServices[index].ServiceId;
    const updatedServices = services.map(service => {
      if (service.ServiceId === serviceId) {
        return { ...service, [field]: value };
      }
      return service;
    });

    const updatedFilteredServices = filteredServices.map((service, idx) => {
      if (index === idx) {
        return { ...service, [field]: value };
      }
      return service;
    });

    setServices(updatedServices);
    setFilteredServices(updatedFilteredServices);
  };

  // Change category active status
  const onCategoryActiveChange = async (index, isActive) => {
    const categoryId = filteredServices[index].category_id;

    const updatedCategories = categories.map(cat => {
      if (cat.category_id === categoryId) {
        return { ...cat, Active: isActive };
      }
      return cat;
    });

    const updatedServices = services.map(service => {
      if (service.category_id === categoryId) {
        return { ...service, Active: isActive };
      }
      return service;
    });

    const updatedFilteredServices = filteredServices.map(service => {
      if (service.category_id === categoryId) {
        return { ...service, Active: isActive };
      }
      return service;
    });

    setCategories(updatedCategories);
    setServices(updatedServices);
    setFilteredServices(updatedFilteredServices);

    try {
      await axios.put(`http://localhost:5001/categories/${categoryId}`, {
        Category_name: updatedCategories.find(cat => cat.category_id === categoryId).Category_name,
        Active: isActive,
      });
      await axios.put('http://localhost:5001/services', updatedServices);
      message.success('Category and associated services updated successfully');
    } catch (error) {
      message.error('Failed to update category and services');
    }
  };

  // Save services
const handleServiceSave = async () => {
  try {
    // Update categories
    for (const category of categories) {
      await axios.put(`http://localhost:5001/categories/${category.category_id}`, category);
    }

    // Update services
    await axios.put('http://localhost:5001/services', services);
    
    message.success('Services and categories updated successfully');
    setServiceModalVisible(false);
    fetchServices();
    fetchCategories();
  } catch (error) {
    message.error('Failed to update services or categories');
  }
};

  // Handle search
  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    if (term.length >= 3) {
      const filtered = services.filter(service =>
        service.Service.toLowerCase().includes(term) ||
        categories.find(category => category.Category_name.toLowerCase().includes(term) && category.category_id === service.category_id)
      );
      setFilteredServices(filtered);
    } else {
      setFilteredServices(services);
    }
  };

  // Add new service
  const handleAddService = async (values) => {
    try {
      const newService = {
        Service: values.Service,
        Rate: parseFloat(values.Rate),
        Comments: ' ',
        Active: true,
        DisplayFamily: false,
        Temple: 0,
        category_id: values.category_id,
        time: values.time,
      };

      await axios.post('http://localhost:5001/services', newService);
      message.success('Service added successfully');
      setNewServiceModalVisible(false);
      fetchServices();
    } catch (error) {
      message.error('Failed to add service');
    }
  };

  // Add new category
  const handleAddCategory = async (values) => {
    try {
      const existingCategory = categories.find(category => category.Category_name.toLowerCase() === values.Category_name.toLowerCase());
      if (existingCategory) {
        message.error('Category already exists');
        return;
      }

      const newCategory = {
        Category_name: values.Category_name,
        Active: true,
      };

      await axios.post('http://localhost:5001/categories', newCategory);
      message.success('Category added successfully');
      setNewCategoryModalVisible(false);
      fetchCategories();
    } catch (error) {
      message.error('Failed to add category');
    }
  };

  // Open new service modal
  const handleNewServiceModalOpen = () => {
    form.resetFields();
    setNewServiceModalVisible(true);
  };

  // Close new service modal
  const handleNewServiceModalCancel = () => {
    setNewServiceModalVisible(false);
    form.resetFields();
  };

  // Open new category modal
  const handleNewCategoryModalOpen = () => {
    categoryForm.resetFields();
    setNewCategoryModalVisible(true);
  };

  // Close new category modal
  const handleNewCategoryModalCancel = () => {
    setNewCategoryModalVisible(false);
    categoryForm.resetFields();
  };

  // Clear forms
  const handleClearForm = () => {
    form.resetFields();
  };

  const handleClearCategoryForm = () => {
    categoryForm.resetFields();
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchTerm('');
    setFilteredServices(services);
  };

  // Clear changes
  const handleClearChanges = () => {
    setServices(originalServices);
    setFilteredServices(originalServices);
  };

  // Change theme colors
  const handleChangeColor = () => {
    localStorage.setItem('headerColor', headerColor);
    localStorage.setItem('sidebarColor', sidebarColor);
    window.location.reload();
  };

  // Reset theme colors
  const handleResetColors = () => {
    localStorage.removeItem('headerColor');
    localStorage.removeItem('sidebarColor');
    window.location.reload();
  };

  // Access Control Functionality
  const handleAccessRightsSave = async () => {
    try {
      await axios.put('http://localhost:5001/access-control', accessRights);
      message.success('Access rights updated successfully');
      setAccessRightsModalVisible(false);
    } catch (error) {
      message.error('Failed to update access rights');
    }
  };

  const handleAccessChange = (index, field, value) => {
    const updatedRights = [...accessRights];
    updatedRights[index][field] = value;
    setAccessRights(updatedRights);
  };

  const handleResetChanges = () => {
    setAccessRights(JSON.parse(JSON.stringify(originalAccessRights))); // Reset to the original state with a deep copy
  };

  const handleCancel = () => {
    setAccessRightsModalVisible(false);
  };

  const renderCheckbox = (value, index, field) => (
    <Checkbox
      checked={value === 1}
      disabled={value === 2}
      onChange={(e) => handleAccessChange(index, field, e.target.checked ? 1 : 0)}
    />
  );

  const accessColumns = [
    { title: 'Component', dataIndex: 'component', key: 'component' },
    { title: 'User Type', dataIndex: 'usertype', key: 'usertype' },
    {
      title: 'Can View',
      dataIndex: 'can_view',
      key: 'can_view',
      render: (value, record, index) => renderCheckbox(value, index, 'can_view'),
    },
    {
      title: 'Can Add',
      dataIndex: 'can_add',
      key: 'can_add',
      render: (value, record, index) => renderCheckbox(value, index, 'can_add'),
    },
    {
      title: 'Can Edit',
      dataIndex: 'can_edit',
      key: 'can_edit',
      render: (value, record, index) => renderCheckbox(value, index, 'can_edit'),
    },
    {
      title: 'Can Delete',
      dataIndex: 'can_delete',
      key: 'can_delete',
      render: (value, record, index) => renderCheckbox(value, index, 'can_delete'),
    },
    {
      title: 'Can Approve',
      dataIndex: 'can_approve',
      key: 'can_approve',
      render: (value, record, index) => renderCheckbox(value, index, 'can_approve'),
    },
    {
      title: 'Can Email',
      dataIndex: 'can_email',
      key: 'can_email',
      render: (value, record, index) => renderCheckbox(value, index, 'can_email'),
    },
  ];

  // Fetch access control data
  const fetchAccessControlData = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5001/access-control');
      const accessRightsData = response.data;
      setAccessRights([...accessRightsData]); // Shallow copy for current state
      setOriginalAccessRights(JSON.parse(JSON.stringify(accessRightsData))); // Deep copy for reset state
    } catch (error) {
      message.error('Failed to load access control data');
    } finally {
      setLoading(false);
    }
  };

  // Open access rights modal
  const handleOpenAccessRightsModal = () => {
    fetchAccessControlData(); // Fetch fresh data each time modal is opened
    setAccessRightsModalVisible(true);
  };

  // Fetch email credentials
  const fetchEmailCredentials = async () => {
    try {
      const response = await axios.get('http://localhost:5001/email-credentials');
      setEmailCredentials(response.data);
    } catch (error) {
      message.error('Failed to load email credentials');
    }
  };

  // Open email credentials modal
  const handleOpenEmailCredentialsModal = () => {
    fetchEmailCredentials();
    setEmailCredentialsModalVisible(true);
  };

  // Save email credentials
  const handleEmailCredentialsSave = async () => {
    try {
      await axios.put('http://localhost:5001/email-credentials', emailCredentials);
      message.success('Email credentials updated successfully');
      setEmailCredentialsModalVisible(false);
    } catch (error) {
      message.error('Failed to update email credentials');
    }
  };

  // Change email credentials
  const handleEmailChange = (field, value) => {
    setEmailCredentials({ ...emailCredentials, [field]: value });
  };

  // Save email text
  const handleSaveEmailText = async () => {
    try {
      const updatedText = form.getFieldValue('emailText').split('\n');
      await axios.put('http://localhost:5001/email-text', updatedText);
      message.success('Email text updated successfully');
      setEmailModalVisible(false);
      fetchEmailText();
    } catch (error) {
      message.error('Failed to update email text');
    }
  };

  // Reset email text
  const handleResetEmailText = async () => {
    try {
      await axios.put('http://localhost:5001/email-text/reset');
      message.success('Email text reset to default');
      fetchEmailText();
    } catch (error) {
      message.error('Failed to reset email text');
    }
  };

  const handleCategoryExcelSheetChange = (index, value) => {
    const updatedCategories = [...categories];
    updatedCategories[index].excelSheetLink = value;
    setCategories(updatedCategories);
  };  

  // Handle search select
  const handleSearchSelect = (value) => {
    const selectedCategory = categories.find(category => category.Category_name === value);
    if (selectedCategory) {
      setFilteredServices(services.filter(service => service.category_id === selectedCategory.category_id));
    } else {
      const selectedService = services.find(service => service.Service === value);
      if (selectedService) {
        setFilteredServices([selectedService]);
      }
    }
    setSearchTerm(value);
  };

  const getDropdownMenu = () => {
    const matchedCategories = categories.filter(category => category.Category_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchedServices = tempServices.filter(service => service.Service.toLowerCase().includes(searchTerm.toLowerCase()));

    const menuItems = [
      ...matchedCategories.map(category => ({ key: `category-${category.category_id}`, label: category.Category_name })),
      ...matchedServices.map(service => ({ key: `service-${service.ServiceId}`, label: service.Service }))
    ];

    return (
      <Menu onClick={({ key }) => handleSearchSelect(menuItems.find(item => item.key === key).label)}>
        {menuItems.map(item => (
          <Menu.Item key={item.key}>{item.label}</Menu.Item>
        ))}
      </Menu>
    );
  };

  // Open service modal
  const handleOpenServiceModal = () => {
    setOriginalServices([...services]);
    setSearchTerm('');
    setFilteredServices(services);
    setServiceModalVisible(true);
  };

  // Close service modal
  const handleCloseServiceModal = () => {
    setServiceModalVisible(false);
    setServices(originalServices);
    setFilteredServices(originalServices);
  };

  // Run gear functions
  const handleEditEmailText = async () => {
    try {
      const response = await axios.post('http://localhost:5001/run-gear-functions');
      message.success(response.data.message);
    } catch (error) {
      message.error('Error running gear functions');
    }
  };

  const serviceColumns = [
    {
      title: 'Category Active?',
      dataIndex: 'category_id',
      key: 'category_active',
      render: (text, record, index) => {
        const category = categories.find(cat => cat.category_id === text);
        const isFirstRow = index === 0 || services[index - 1].category_id !== text;
        return {
          children: isFirstRow && category ? (
            <Checkbox
              checked={category.Active}
              onChange={(e) => onCategoryActiveChange(index, e.target.checked)}
            />
          ) : null,
          props: {
            rowSpan: isFirstRow ? services.filter(service => service.category_id === text).length : 0,
          },
        };
      },
    },
    {
      title: 'Category',
      dataIndex: 'category_id',
      key: 'category_id',
      render: (text, record, index) => (
        <Select
          value={text}
          onChange={(value) => onTempServiceChange(index, 'category_id', value)}
          style={{ width: '100%' }}
        >
          {categories.map(category => (
            <Option key={category.category_id} value={category.category_id}>
              {category.Category_name}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'Seva',
      dataIndex: 'Service',
      key: 'Service',
      width: 250,
      render: (text, record, index) => (
        <Input
          value={text}
          onChange={(e) => onTempServiceChange(index, 'Service', e.target.value)}
          style={{ width: '100%' }}
        />
      ),
      onCell: (record, rowIndex) => ({
        style: {
          whiteSpace: 'nowrap',
          maxWidth: `${Math.max(...tempServices.map(service => service.Service.length))}ch`,
        },
      }),
    },
    {
      title: 'Time',
      dataIndex: 'time',
      key: 'time',
      render: (text, record, index) => (
        <Input
          type="time"
          value={text}
          onChange={(e) => onTempServiceChange(index, 'time', e.target.value)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Seva Active?',
      dataIndex: 'Active',
      key: 'Active',
      render: (text, record, index) => {
        const category = categories.find(cat => cat.category_id === record.category_id);
        return (
          <Checkbox
            checked={text}
            disabled={!category || !category.Active}
            onChange={(e) => onTempServiceChange(index, 'Active', e.target.checked)}
          />
        );
      },
    },
    {
      title: 'Amount',
      dataIndex: 'Rate',
      key: 'Rate',
      width: 100,
      render: (text, record, index) => (
        <Input
          value={text}
          onChange={(e) => onTempServiceChange(index, 'Rate', e.target.value)}
          style={{ width: '100%' }}
        />
      ),
      onCell: (record, rowIndex) => ({
        style: {
          whiteSpace: 'nowrap',
          maxWidth: `${Math.max(...tempServices.map(service => String(service.Rate).length))}ch`,
        },
      }),
    },
    {
      title: 'Excel Sheet',
      dataIndex: 'excelSheetLink',
      key: 'excelSheetLink',
      render: (text, record, index) => (
        <Input
          value={record.excelSheetLink || ''}
          onChange={(e) => onTempServiceChange(index, 'excelSheetLink', e.target.value)}
          style={{ width: '150px' }}
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
          <Button type="primary" onClick={handleEditEmailText} style={{ marginLeft: '10px' }}>
            Refresh TV Data
          </Button>
          {(userType === 'Admin' || userType === 'Super Admin') && (
            <Button type="primary" onClick={handleOpenServiceModal} style={{ marginLeft: '10px' }}>
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

          {userType === 'Super Admin' && (
            <>
              <h2 style={{ marginTop: '40px' }}>General Configurations</h2>
              <div className="general-configurations-container">
                <Checkbox
                  checked={autoApprove}
                  onChange={(e) => saveAutoApprove(e.target.checked)}
                  style={{ marginTop: '10px', fontSize: '20px'}}
                >
                  Auto Approve users on Signup
                </Checkbox>
                <Checkbox
                  checked={excelSevaEmailConformation}
                  onChange={(e) => saveExcelSevaEmailConformation(e.target.checked)}
                  style={{ marginTop: '10px', fontSize: '20px'}}
                >
                  Send Email Confirmation for entrees from Website
                </Checkbox>
              </div>
            </>
          )}

          <Modal
            title="Change Password"
            visible={passwordModalVisible}
            onCancel={() => setPasswordModalVisible(false)}
            footer={null}
          >
            <Form name="change_password" className="change-password-form" onFinish={onFinishPasswordChange}>
              <Form.Item name="currentPassword" rules={[{ required: true, message: 'Please input your current password!' }]}>
                <Input.Password placeholder="Current Password" />
              </Form.Item>
              <Form.Item name="newPassword" rules={[{ required: true, message: 'Please input your new password!' }]}>
                <Input.Password placeholder="New Password" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit">Change Password</Button>
              </Form.Item>
            </Form>
          </Modal>

          <Modal
            title="Modify Services"
            visible={serviceModalVisible}
            onCancel={handleCloseServiceModal}
            onOk={handleServiceSave}
            width={1100}
            footer={[
              <Button key="cancel" onClick={handleCloseServiceModal}>Cancel</Button>,
              <Button key="clear" onClick={handleClearChanges}>Clear</Button>,
              <Button key="modify" type="primary" onClick={handleServiceSave}>Modify</Button>,
            ]}
          >
            <div>
              <Dropdown overlay={getDropdownMenu()} trigger={['click']}>
                <Input.Search
                  placeholder="Search services or categories"
                  value={searchTerm}
                  onChange={handleSearch}
                  style={{ marginBottom: '10px', width: '300px' }}
                />
              </Dropdown>
              <Button type="primary" onClick={handleNewServiceModalOpen} style={{ marginBottom: '10px', marginLeft: '10px' }}>
                Add New Service
              </Button>
              <Button type="primary" onClick={handleNewCategoryModalOpen} style={{ marginBottom: '10px', marginLeft: '10px' }}>
                Add New Category
              </Button>
            </div>
            <div>
              <Button type="default" onClick={handleClearSearch} style={{ marginBottom: '10px', marginLeft: '10px' }}>
                Clear Search
              </Button>
            </div>

            {/* Section for listing and editing ServiceCategories */}
            <div style={{ marginBottom: '20px' }}>
              <h3>Service Categories</h3>
              {categories.map((category, index) => (
                <div key={category.category_id} style={{ display: 'flex', marginBottom: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <Input
                      value={category.Category_name}
                      disabled // You can choose to make it editable if needed
                    />
                  </div>
                  <div style={{ flex: 3 }}>
                    <Input
                      placeholder="Excel Sheet Link"
                      value={category.excelSheetLink || ''}
                      onChange={(e) => handleCategoryExcelSheetChange(index, e.target.value)}
                      style={{ marginLeft: '10px' }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Existing Services Table */}
            <Table
              columns={serviceColumns}
              dataSource={sortServices(filteredServices, categories)}
              rowKey="ServiceId"
              pagination={false}
              size="small"
              scroll={{ x: true }}
              rowClassName={(record, index) => {
                const category = categories.find(cat => cat.category_id === record.category_id);
                const isFirstRow = index === 0 || services[index - 1].category_id !== record.category_id;
                const isLastRow = index === services.length - 1 || services[index + 1].category_id !== record.category_id;
                return isFirstRow ? 'category-group category-group-first' : (isLastRow ? 'category-group category-group-last' : 'category-group');
              }}
            />
          </Modal>

          <Modal
            title="Add New Service"
            visible={newServiceModalVisible}
            onCancel={handleNewServiceModalCancel}
            footer={[
              <Button key="cancel" onClick={handleNewServiceModalCancel}>Cancel</Button>,
              <Button key="clear" onClick={handleClearForm}>Clear</Button>,
              <Button key="submit" type="primary" form="add_service" htmlType="submit">Add Service</Button>,
            ]}
          >
            <Form name="add_service" className="add-service-form" onFinish={handleAddService} form={form}>
              <Form.Item name="Service" rules={[{ required: true, message: 'Please input the service name!' }]}>
                <Input placeholder="Service Name" />
              </Form.Item>
              <Form.Item name="Rate" rules={[{ required: true, message: 'Please input the rate!' }]}>
                <Input placeholder="Rate" />
              </Form.Item>
              <Form.Item name="category_id" rules={[{ required: true, message: 'Please select a category!' }]}>
                <Select placeholder="Select Category">
                  {categories.map(category => (
                    <Option key={category.category_id} value={category.category_id}>
                      {category.Category_name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="time" rules={[{ required: true, message: 'Please select a time!' }]}>
                <Input type="time" placeholder="Select Time" />
              </Form.Item>
            </Form>
          </Modal>

          <Modal
            title="Add New Category"
            visible={newCategoryModalVisible}
            onCancel={handleNewCategoryModalCancel}
            footer={[
              <Button key="cancel" onClick={handleNewCategoryModalCancel}>Cancel</Button>,
              <Button key="clear" onClick={handleClearCategoryForm}>Clear</Button>,
              <Button key="submit" type="primary" form="add_category" htmlType="submit">Add Category</Button>,
            ]}
          >
            <Form name="add_category" className="add-category-form" onFinish={handleAddCategory} form={categoryForm}>
              <Form.Item
                name="Category_name"
                rules={[
                  { required: true, message: 'Please input the category name!' },
                  {
                    validator: (_, value) => {
                      if (categories.find(category => category.Category_name.toLowerCase() === value.toLowerCase())) {
                        return Promise.reject('Category already exists');
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <Input placeholder="Category Name" />
              </Form.Item>
            </Form>
          </Modal>

          <Modal
            title="Change Theme Colors"
            visible={themeModalVisible}
            onCancel={() => setThemeModalVisible(false)}
            footer={null}
          >
            <div>
              <label>Header Color: </label>
              <Input
                type="color"
                value={headerColor}
                onChange={(e) => setHeaderColor(e.target.value)}
                style={{ width: '100px', marginRight: '10px' }}
              />
            </div>
            <div>
              <label>Sidebar Color: </label>
              <Input
                type="color"
                value={sidebarColor}
                onChange={(e) => setSidebarColor(e.target.value)}
                style={{ width: '100px', marginRight: '10px' }}
              />
            </div>
            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <Button type="default" onClick={handleResetColors} style={{ marginRight: '10px' }}>
                Reset to Default
              </Button>
              <Button type="primary" onClick={handleChangeColor}>
                Change Colors
              </Button>
            </div>
          </Modal>

          <Modal
            title="Change Access Rights"
            visible={accessRightsModalVisible}
            onCancel={handleCancel}
            footer={[
              <Button key="cancel" onClick={handleCancel}>Cancel</Button>,
              <Button key="reset" onClick={handleResetChanges}>Reset</Button>,
              <Button key="save" type="primary" onClick={handleAccessRightsSave}>Modify</Button>,
            ]}
            className="access-rights-modal" // This is important to apply the CSS
          >
            <Table
              dataSource={accessRights}
              rowKey="id"
              pagination={false}
              loading={loading}
              columns={accessColumns}
            />
          </Modal>

          <Modal
            title="Email Credentials"
            visible={emailCredentialsModalVisible}
            onCancel={() => setEmailCredentialsModalVisible(false)}
            footer={[
              <Button key="cancel" onClick={() => setEmailCredentialsModalVisible(false)}>Cancel</Button>,
              <Button key="save" type="primary" onClick={handleEmailCredentialsSave}>Save</Button>,
            ]}
          >
            <Form>
              <Form.Item label="Email">
                <Input
                  value={emailCredentials.email}
                  onChange={(e) => handleEmailChange('email', e.target.value)}
                />
              </Form.Item>
              <Form.Item label="App Password">
                <Input
                  type="password"
                  value={emailCredentials.appPassword}
                  onChange={(e) => handleEmailChange('appPassword', e.target.value)}
                />
              </Form.Item>
            </Form>
          </Modal>

          <Modal
            title="Edit Email Text"
            visible={emailModalVisible}
            onCancel={() => setEmailModalVisible(false)}
            footer={[
              <Button key="cancel" onClick={() => setEmailModalVisible(false)}>Cancel</Button>,
              <Button key="save" type="primary" onClick={handleSaveEmailText}>Save</Button>,
            ]}
          >
            <Form form={form}>
              <Form.Item name="emailText">
                <Input.TextArea rows={10} />
              </Form.Item>
            </Form>
            <Button onClick={handleResetEmailText}>Reset to Default</Button>
          </Modal>
        </div>
      </Content>
    </Layout>
  );
};

export default Settings;
