import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Layout, Input, Button, Table, Modal, Form, message, Row, Col, DatePicker, Select, AutoComplete } from 'antd';
import axios from 'axios';
import _ from 'lodash';
import moment from 'moment';
import 'moment-timezone';
import { jwtDecode } from 'jwt-decode';
import './Home.css';

const { Content } = Layout;
const { Option } = Select;
const { confirm } = Modal;

const emailDomains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "aol.com"];

const maskPhoneNumber = (phone) => {
  if (!phone) return '';
  return phone.replace(/.(?=.{4})/g, 'X');
};

const maskEmailAddress = (email) => {
  if (!email) return '';
  const [localPart, domainPart] = email.split('@');
  const maskedLocalPart = localPart.slice(0, 3) + '****';
  return `${maskedLocalPart}@${domainPart}`;
};

const Home = () => {
  const [devotees, setDevotees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalDevotees, setTotalDevotees] = useState(0);
  const [currentDevotee, setCurrentDevotee] = useState(null);
  const [isSevaModalVisible, setIsSevaModalVisible] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [services, setServices] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [sevaForm] = Form.useForm();
  const [form] = Form.useForm();
  const [familyMembers, setFamilyMembers] = useState([{ FirstName: '', LastName: '', RelationShip: '', Gotra: '', Star: '', DOB: null }]);
  const [accessControl, setAccessControl] = useState({});
  const [formKey, setFormKey] = useState(0); // Add a unique key for the form
  const [formData, setFormData] = useState({
    FirstName: '',
    LastName: '',
    Phone: '',
    AltPhone: '',
    Address: '',
    City: '',
    State: '',
    Zip: '',
    Email: '',
    Gotra: '',
    Star: '',
    DOB: null,
  });
  const [emailOptions, setEmailOptions] = useState([]);

  const [isDeleteErrorModalVisible, setIsDeleteErrorModalVisible] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState('');

  const token = localStorage.getItem('token');

  const axiosInstance = useMemo(() => axios.create({
    baseURL: 'http://localhost:5001',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }), [token]);

  const fetchAccessControl = async (userType) => {
    try {
      const response = await axiosInstance.get(`/access-control/${userType}`);
      setAccessControl(response.data);
    } catch (error) {
      console.error('Failed to fetch access control data:', error);
    }
  };

  const fetchDevotees = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/devotees');
      const sortedDevotees = response.data.sort((a, b) => new Date(b.LastModified) - new Date(a.LastModified));
      setDevotees(sortedDevotees);
      setTotalDevotees(sortedDevotees.length);
    } catch (error) {
      message.error('Failed to load devotees');
    } finally {
      setLoading(false);
    }
  }, [axiosInstance]);

  const fetchServices = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/services');
      setServices(response.data);
    } catch (error) {
      message.error('Failed to load services');
    }
  }, [axiosInstance]);

  const fetchPaymentMethods = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/payment-methods');
      console.log('Fetched payment methods:', response.data);
      setPaymentMethods(response.data);
    } catch (error) {
      message.error('Failed to load payment methods');
    }
  }, [axiosInstance]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = jwtDecode(token);
      fetchAccessControl(decodedToken.usertype);
    }
    fetchDevotees();
    fetchServices();
    fetchPaymentMethods();
  }, [fetchDevotees, fetchServices, fetchPaymentMethods]);

  const handleAddDevotee = () => {
    setCurrentDevotee(null);
    setFamilyMembers([]); // Start with no family members
    setFormData({
      FirstName: '',
      LastName: '',
      Phone: '',
      AltPhone: '',
      Address: '',
      City: '',
      State: '',
      Zip: '',
      Email: '',
      Gotra: '',
      Star: '',
      DOB: null,
    });
    setFormKey(prevKey => prevKey + 1); // Force form re-render by changing key
    setIsModalVisible(true);
  };

  const handleEditDevotee = async (devotee) => {
    try {
      const familyResponse = await axiosInstance.get(`/devotees/${devotee.DevoteeId}/family`);
      const familyMembersData = familyResponse.data.map(member => ({
        ...member,
        DOB: member.DOB ? moment(member.DOB) : null
      }));
      setFamilyMembers(familyMembersData);
    } catch (error) {
      message.error('Failed to load family members');
    }
    setCurrentDevotee({
      ...devotee,
      DOB: devotee.DOB ? moment(devotee.DOB) : null
    });
    form.setFieldsValue({
      ...devotee,
      DOB: devotee.DOB ? moment(devotee.DOB) : null
    });
    setIsModalVisible(true);
  };

  const handleDeleteDevotee = async (id) => {
    try {
      const response = await axiosInstance.get(`/devotees/${id}/related-count`);
      const { activityCount, familyMemberCount } = response.data;

      confirm({
        title: 'Are you sure you want to delete this devotee?',
        content: `There are ${activityCount} activities and ${familyMemberCount} family members related to this devotee.`,
        onOk: async () => {
          if (activityCount > 0) {
            setDeleteErrorMessage(`Devotee cannot be deleted since ${activityCount} activities are present.`);
            setIsDeleteErrorModalVisible(true);
          } else {
            try {
              await axiosInstance.delete(`/devotees/${id}`);
              message.success('Devotee deleted');
              fetchDevotees();
            } catch (error) {
              message.error('Failed to delete devotee');
            }
          }
        },
        onCancel() {
          message.info('Delete operation cancelled');
        },
      });
    } catch (error) {
      message.error('Failed to fetch related counts');
    }
  };

  const handleSeva = (devotee) => {
    setCurrentDevotee(devotee);
    sevaForm.resetFields();
    sevaForm.setFieldsValue({
      Name: `${devotee.FirstName} ${devotee.LastName}`,
      // AmountPaid: 0,
    });
    setSelectedPaymentMethod('');
    setIsSevaModalVisible(true);
  };

  const handleSevaOk = async (values) => {
    try {
      const service = services.find(s => s.Service === values.Service);
      const paymentMethod = paymentMethods.find(pm => pm.MethodName === values.PaymentMethod);

      if (!service) {
        message.error('Selected service not found');
        return;
      }

      if (!paymentMethod) {
        message.error('Selected payment method not found');
        return;
      }

      const token = localStorage.getItem('token');
      const decodedToken = jwtDecode(token);
      const userId = decodedToken.userid;

      const payload = {
        DevoteeId: currentDevotee.DevoteeId,
        ServiceId: service.ServiceId,
        PaymentMethod: paymentMethod.PaymentMethodId,
        Amount: values.AmountPaid,
        CheckNumber: values.CheckNumber,
        Comments: values.Comments,
        UserId: userId,
        ServiceDate: moment(values.ServiceDate).tz('America/Los_Angeles').format('YYYY-MM-DD HH:mm:ss'), // Convert to PST
      };

      await axiosInstance.post('/activities', payload);
      message.success('Seva added successfully');
      setIsSevaModalVisible(false);
      sevaForm.resetFields();
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Failed to add seva');
      }
    }
  };

  const handleSevaCancel = () => {
    setIsSevaModalVisible(false);
    sevaForm.resetFields();
  };

  const handleOk = async (values) => {
    try {
      const payload = {
        FirstName: values.FirstName,
        LastName: values.LastName,
        Phone: values.Phone || null,
        AltPhone: values.AltPhone || null,
        Address: values.Address || null,
        City: values.City || null,
        State: values.State || null,
        Zip: values.Zip || null,
        Email: values.Email || null,
        Gotra: values.Gotra || null,
        Star: values.Star || null,
        DOB: values.DOB ? values.DOB.format('YYYY-MM-DD') : null,
        family: familyMembers
      };
      if (currentDevotee) {
        await axiosInstance.put(`/devotees/${currentDevotee.DevoteeId}`, payload);
        message.success('Devotee updated');
      } else {
        const response = await axiosInstance.post('/devotees', payload);
        if (response.data.error) {
          message.error(response.data.error);
        } else {
          message.success('Devotee added');
        }
      }
      fetchDevotees();
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Failed to save devotee');
      }
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleFamilyChange = (index, field, value) => {
    const newFamilyMembers = [...familyMembers];
    if (field === 'DOB') {
      newFamilyMembers[index][field] = value ? moment(value) : null;
    } else {
      newFamilyMembers[index][field] = value;
    }
    setFamilyMembers(newFamilyMembers);
  };

  const addFamilyMember = () => {
    setFamilyMembers([...familyMembers, { FirstName: '', LastName: '', RelationShip: '', Gotra: '', Star: '', DOB: null }]);
  };

  const removeFamilyMember = (index) => {
    const newFamilyMembers = familyMembers.filter((_, idx) => idx !== index);
    setFamilyMembers(newFamilyMembers);
  };

  const debounceSearch = useCallback(_.debounce(async (value) => {
    if (value.length >= 3) {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/devotees?search=${value}`);
        const sortedDevotees = response.data.sort((a, b) => new Date(b.LastModified) - new Date(a.LastModified));
        setDevotees(sortedDevotees);
      } catch (error) {
        message.error('Failed to search devotees');
      } finally {
        setLoading(false);
      }
    } else {
      fetchDevotees();
    }
  }, 300), [axiosInstance, fetchDevotees]);

  const handleSearchChange = (e) => {
    debounceSearch(e.target.value);
  };

  const handleEmailChange = (value) => {
    if (value.includes('@')) {
      const [localPart, domainPart] = value.split('@');
      setEmailOptions(
        emailDomains
          .filter(domain => domain.includes(domainPart))
          .map(domain => `${localPart}@${domain}`)
      );
    } else {
      setEmailOptions([]);
    }
  };

  const disabledDate = (current) => {
    // Disable all dates except Saturdays if selected service is "Annadan"
    if (selectedService === 'Annadan') {
      return current && current.day() !== 6;
    }
    return false;
  };

  const columns = [
    { title: 'First Name', dataIndex: 'FirstName', key: 'FirstName' },
    { title: 'Last Name', dataIndex: 'LastName', key: 'LastName' },
    { title: 'Phone', dataIndex: 'Phone', key: 'Phone', render: (text) => maskPhoneNumber(text) },
    { title: 'Email', dataIndex: 'Email', key: 'Email', render: (text) => maskEmailAddress(text) },
    {
      title: 'Actions', key: 'actions', render: (text, record) => (
        <>
          {accessControl.Home?.can_add === 1 && <Button onClick={() => handleSeva(record)} type="primary">SEVA</Button>}
          {accessControl.Home?.can_edit === 1 && <Button onClick={() => handleEditDevotee(record)} style={{ marginLeft: 8 }}>Edit</Button>}
          {accessControl.Home?.can_delete === 1 && <Button onClick={() => handleDeleteDevotee(record.DevoteeId)} danger style={{ marginLeft: 8 }}>Delete</Button>}
        </>
      )
    }
  ];

  return (
    <Layout>
      <Content>
        <div className="site-layout-content">
          <h2>Home Page</h2>
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}>
            <Input
              placeholder="Search devotees"
              onChange={handleSearchChange}
              style={{ width: 400, marginRight: 16, height: 40 }}
            />
            {accessControl.Home?.can_add === 1 && <Button type="primary" onClick={handleAddDevotee} style={{ height: 40 }}>Add Devotee</Button>}
          </div>
          <div style={{ marginTop: 16 }}>
            <p>Total Devotees in the Database: {totalDevotees}</p>
          </div>
          <div className="custom-table">
            <Table
              columns={columns}
              dataSource={devotees}
              loading={loading}
              rowKey="DevoteeId"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 'max-content' }}
            />
          </div>
        </div>
      </Content>
      <Modal
        title={currentDevotee ? "Edit Devotee" : "Add Devotee"}
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={800}
        key={formKey} // Add the key to force remount
      >
        <Form
          form={form}
          initialValues={formData}
          onFinish={handleOk}
          labelCol={{ span: 24 }}
          wrapperCol={{ span: 24 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="FirstName"
                label="First Name"
                rules={[{ required: true, message: 'Please input the first name!' }]}
              >
                <Input placeholder="First Name" style={{ height: 50 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="LastName"
                label="Last Name"
                rules={[{ required: true, message: 'Please input the last name!' }]}
              >
                <Input placeholder="Last Name" style={{ height: 50 }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="Phone" label="Phone Number">
                <Input placeholder="Phone Number" style={{ height: 50 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="AltPhone" label="Alternate Phone Number">
                <Input placeholder="Alternate Phone Number" style={{ height: 50 }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="Address" label="Address">
                <Input placeholder="Address" style={{ height: 50 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="City" label="City">
                <Input placeholder="City" style={{ height: 50 }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="State" label="State">
                <Input placeholder="State" style={{ height: 50 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="Zip" label="Zip Code">
                <Input placeholder="Zip Code" style={{ height: 50 }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="Gotra" label="Gotra">
                <Input placeholder="Gotra" style={{ height: 50 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="Star" label="Star">
                <Input placeholder="Star" style={{ height: 50 }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="Email"
                label="Email"
                rules={[
                  { 
                    type: 'email', 
                    message: 'The input is not valid E-mail!' 
                  },
                  { 
                    required: true, 
                    message: 'Please input your E-mail!' 
                  }
                ]}
              >
                <AutoComplete
                  options={emailOptions.map(email => ({ value: email }))}
                  onChange={handleEmailChange}
                  placeholder="Email"
                  style={{ height: 50 }}
                />
              </Form.Item>
            </Col>
          </Row>
          <div style={{ marginTop: 16 }}>
            <h3>Family Members</h3>
            {familyMembers.length === 0 && ( // Check if there are no family members
              <Button type="dashed" onClick={addFamilyMember} style={{ width: '100%' }}>
                + Add Family Member
              </Button>
            )}
            {familyMembers.map((member, index) => (
              <div key={index} style={{ marginBottom: 16 }}>
                <Row gutter={16}>
                  <Col span={20}>
                    <h4>Family member {index + 1}</h4>
                  </Col>
                  <Col span={4}>
                    <Button type="danger" onClick={() => removeFamilyMember(index)}>
                      Remove
                    </Button>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item label="First Name">
                      <Input
                        placeholder="First Name"
                        value={member.FirstName}
                        onChange={(e) => handleFamilyChange(index, 'FirstName', e.target.value)}
                        style={{ height: 50 }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="Last Name">
                      <Input
                        placeholder="Last Name"
                        value={member.LastName}
                        onChange={(e) => handleFamilyChange(index, 'LastName', e.target.value)}
                        style={{ height: 50 }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="Relation">
                      <Input
                        placeholder="Relation"
                        value={member.RelationShip}
                        onChange={(e) => handleFamilyChange(index, 'RelationShip', e.target.value)}
                        style={{ height: 50 }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16} style={{ marginTop: 16 }}>
                  <Col span={8}>
                    <Form.Item label="Gotra">
                      <Input
                        placeholder="Gotra"
                        value={member.Gotra}
                        onChange={(e) => handleFamilyChange(index, 'Gotra', e.target.value)}
                        style={{ height: 50 }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="Star">
                      <Input
                        placeholder="Star"
                        value={member.Star}
                        onChange={(e) => handleFamilyChange(index, 'Star', e.target.value)}
                        style={{ height: 50 }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </div>
            ))}
            {familyMembers.length > 0 && ( // Show the button only if there are family members
              <Button type="dashed" onClick={addFamilyMember} style={{ width: '100%' }}>
                + Add Family Member
              </Button>
            )}
          </div>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ height: 50 }}>
              {currentDevotee ? "Update" : "Add"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title={<span style={{ fontSize: '24px', fontWeight: 'bold' }}>Add Seva</span>}
        visible={isSevaModalVisible}
        onCancel={handleSevaCancel}
        footer={null}
        width={800}
      >
        <Form
          form={sevaForm}
          onFinish={handleSevaOk}
          labelCol={{ span: 24 }}
          wrapperCol={{ span: 24 }}
          onValuesChange={(changedValues, allValues) => {
            if (changedValues.PaymentMethod) {
              setSelectedPaymentMethod(allValues.PaymentMethod);
            }
          }}
        >
          <div>
            <p style={{ fontSize: '20px' }}>
              Adding Seva for {currentDevotee ? `${currentDevotee.FirstName} ${currentDevotee.LastName}` : ''}
            </p>
          </div>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="Service" label="Service" rules={[{ required: true, message: 'Please select a service!' }]}>
                <Select
                  placeholder="Select a service"
                  onChange={(value) => {
                    const service = services.find(s => s.Service === value);
                    sevaForm.setFieldsValue({ Expected_Donation: service.Rate, AmountPaid: service.Rate });
                    setSelectedService(value);
                  }}
                  showSearch
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {services.map(service => (
                    <Option key={service.ServiceId} value={service.Service}>{service.Service}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="Expected_Donation" label="Expected Donation">
                <Input disabled />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="AmountPaid" label="Amount Paid" rules={[{ required: true, message: 'Please input the amount paid!' }]}>
                  <Input placeholder="Select a payment method" type="number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="PaymentMethod" label="Payment Method" rules={[{ required: true, message: 'Please select a payment method!' }]}>
                <Select placeholder="Select a payment method">
                  {paymentMethods.map(method => (
                    <Option key={method.PaymentMethodId} value={method.MethodName}>{method.MethodName}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="ServiceDate" label="Service Date" rules={[{ required: true, message: 'Please select a service date!' }]}>
                <DatePicker style={{ width: '100%' }} disabledDate={disabledDate} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="CheckNumber" label="Check Number">
                <Input disabled={selectedPaymentMethod !== 'Check'} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="Comments" label="Comments">
            <Input.TextArea />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Add Seva
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Delete Devotee"
        visible={isDeleteErrorModalVisible}
        onOk={() => setIsDeleteErrorModalVisible(false)}
        onCancel={() => setIsDeleteErrorModalVisible(false)}
        footer={[
          <Button key="ok" type="primary" onClick={() => setIsDeleteErrorModalVisible(false)}>
            OK
          </Button>,
        ]}
      >
        <p>{deleteErrorMessage}</p>
      </Modal>
    </Layout>
  );
};

export default Home;
