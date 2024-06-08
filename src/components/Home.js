import React, { useEffect, useState, useCallback } from 'react';
import { Layout, Input, Button, Table, Modal, Form, message, Row, Col, DatePicker, Select } from 'antd';
import axios from 'axios';
import _ from 'lodash';
import moment from 'moment';
import './Home.css';

const { Content } = Layout;
const { Option } = Select;
const { confirm } = Modal;

const Home = () => {
  const [devotees, setDevotees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSevaModalVisible, setIsSevaModalVisible] = useState(false);
  const [totalDevotees, setTotalDevotees] = useState(0);
  const [currentDevotee, setCurrentDevotee] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([{ FirstName: '', LastName: '', RelationShip: '', Gotra: '', Star: '', DOB: null }]);
  const [form] = Form.useForm();
  const [sevaForm] = Form.useForm();
  const [services, setServices] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);

  const token = localStorage.getItem('token');

  const axiosInstance = axios.create({
    baseURL: 'http://localhost:5001',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  useEffect(() => {
    fetchDevotees();
    fetchServices();
    fetchPaymentMethods();
  }, []);

  const fetchDevotees = async () => {
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
  };

  const fetchServices = async () => {
    try {
      const response = await axiosInstance.get('/services');
      setServices(response.data);
    } catch (error) {
      message.error('Failed to load services');
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await axiosInstance.get('/payment-methods');
      setPaymentMethods(response.data);
    } catch (error) {
      message.error('Failed to load payment methods');
    }
  };

  const handleAddDevotee = () => {
    setCurrentDevotee(null);
    form.resetFields();
    setFamilyMembers([{ FirstName: '', LastName: '', RelationShip: '', Gotra: '', Star: '', DOB: null }]);
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
      // Fetch the number of related activities and family members
      const response = await axiosInstance.get(`/devotees/${id}/related-count`);
      const { activityCount, familyMemberCount } = response.data;

      // Show confirmation modal
      confirm({
        title: 'Are you sure you want to delete this devotee?',
        content: `There are ${activityCount} activities and ${familyMemberCount} family members related to this devotee.`,
        onOk: async () => {
          try {
            await axiosInstance.delete(`/devotees/${id}`);
            message.success('Devotee deleted');
            fetchDevotees();
          } catch (error) {
            message.error('Failed to delete devotee');
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
      AmountPaid: 0,
    });
    setIsSevaModalVisible(true);
  };

  const handleSevaOk = async (values) => {
    try {
      const service = services.find(s => s.Service === values.Service);
      const paymentMethod = paymentMethods.find(pm => pm.MethodName === values.PaymentMethod);
      const payload = {
        DevoteeId: currentDevotee.DevoteeId,
        ServiceId: service.ServiceId,
        PaymentMethod: paymentMethod.PaymentMethodId,
        Amount: values.AmountPaid,
        CheckNumber: values.CheckNumber,
        Comments: values.Comments,
        UserId: 1, // Assuming current logged in user ID
        ServiceDate: values.ServiceDate,
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
      const payload = { ...values, family: familyMembers };
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
  }, 300), []);

  const handleSearchChange = (e) => {
    debounceSearch(e.target.value);
  };

  const columns = [
    { title: 'First Name', dataIndex: 'FirstName', key: 'FirstName' },
    { title: 'Last Name', dataIndex: 'LastName', key: 'LastName' },
    { title: 'Phone', dataIndex: 'Phone', key: 'Phone' },
    { title: 'Email', dataIndex: 'Email', key: 'Email' },
    {
      title: 'Actions', key: 'actions', render: (text, record) => (
        <>
          <Button onClick={() => handleSeva(record)}>SEVA</Button>
          <Button onClick={() => handleEditDevotee(record)} style={{ marginLeft: 8 }}>Edit</Button>
          <Button onClick={() => handleDeleteDevotee(record.DevoteeId)} danger style={{ marginLeft: 8 }}>Delete</Button>
        </>
      )
    }
  ];

  return (
    <Layout>
      <Content style={{ padding: '0 50px' }}>
        <div className="site-layout-content">
          <h2>Home Page</h2>
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}>
            <Input
              placeholder="Search devotees"
              onChange={handleSearchChange}
              style={{ width: 400, marginRight: 16, height: 40 }}
            />
            <Button type="primary" onClick={handleAddDevotee} style={{ height: 40 }}>Add Devotee</Button>
          </div>
          <div style={{ marginTop: 16 }}>
            <p>Total Devotees in the Database: {totalDevotees}</p>
          </div>
          <Table
            columns={columns}
            dataSource={devotees}
            loading={loading}
            rowKey="DevoteeId"
            pagination={{ pageSize: 10 }}
            className="custom-table"
          />
        </div>
      </Content>
      <Modal
        title={currentDevotee ? "Edit Devotee" : "Add Devotee"}
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={800} // Increased width
      >
        <Form
          form={form}
          initialValues={currentDevotee || { FirstName: '', LastName: '', Phone: '', AltPhone: '', Address: '', City: '', State: '', Zip: '', Email: '', Gotra: '', Star: '', DOB: null }}
          onFinish={handleOk}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="FirstName" rules={[{ required: true, message: 'Please input the first name!' }]}>
                <Input placeholder="First Name" style={{ height: 50 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="LastName" rules={[{ required: true, message: 'Please input the last name!' }]}>
                <Input placeholder="Last Name" style={{ height: 50 }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="Phone" rules={[{ required: true, message: 'Please input the phone number!' }]}>
                <Input placeholder="Phone Number" style={{ height: 50 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="AltPhone">
                <Input placeholder="Alternate Phone Number" style={{ height: 50 }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="Address">
                <Input placeholder="Address" style={{ height: 50 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="City">
                <Input placeholder="City" style={{ height: 50 }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="State">
                <Input placeholder="State" style={{ height: 50 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="Zip">
                <Input placeholder="Zip Code" style={{ height: 50 }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="Email" rules={[{ required: true, message: 'Please input the email!' }]}>
                <Input placeholder="Email" style={{ height: 50 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="DOB">
                <DatePicker style={{ width: '100%', height: 50 }} placeholder="Date of Birth" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="Gotra">
                <Input placeholder="Gotra" style={{ height: 50 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="Star">
                <Input placeholder="Star" style={{ height: 50 }} />
              </Form.Item>
            </Col>
          </Row>
          <div style={{ marginTop: 16 }}>
            <h3>Family Members</h3>
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
                    <Input
                      placeholder="First Name"
                      value={member.FirstName}
                      onChange={(e) => handleFamilyChange(index, 'FirstName', e.target.value)}
                      style={{ height: 50 }}
                    />
                  </Col>
                  <Col span={8}>
                    <Input
                      placeholder="Last Name"
                      value={member.LastName}
                      onChange={(e) => handleFamilyChange(index, 'LastName', e.target.value)}
                      style={{ height: 50 }}
                    />
                  </Col>
                  <Col span={8}>
                    <Input
                      placeholder="Relation"
                      value={member.RelationShip}
                      onChange={(e) => handleFamilyChange(index, 'RelationShip', e.target.value)}
                      style={{ height: 50 }}
                    />
                  </Col>
                </Row>
                <Row gutter={16} style={{ marginTop: 16 }}>
                  <Col span={8}>
                    <Input
                      placeholder="Gothra"
                      value={member.Gotra}
                      onChange={(e) => handleFamilyChange(index, 'Gotra', e.target.value)}
                      style={{ height: 50 }}
                    />
                  </Col>
                  <Col span={8}>
                    <Input
                      placeholder="Star"
                      value={member.Star}
                      onChange={(e) => handleFamilyChange(index, 'Star', e.target.value)}
                      style={{ height: 50 }}
                    />
                  </Col>
                  <Col span={8}>
                    <DatePicker
                      style={{ width: '100%', height: 50 }}
                      placeholder="Date of Birth"
                      value={member.DOB ? moment(member.DOB) : null}
                      onChange={(date) => handleFamilyChange(index, 'DOB', date)}
                    />
                  </Col>
                </Row>
              </div>
            ))}
            <Button type="dashed" onClick={addFamilyMember} style={{ width: '100%' }}>
              + Add Family Member
            </Button>
          </div>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ height: 50 }}>
              {currentDevotee ? "Update" : "Add"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Add Seva"
        visible={isSevaModalVisible}
        onCancel={handleSevaCancel}
        footer={null}
        width={800} // Increased width
      >
        <Form
          form={sevaForm}
          onFinish={handleSevaOk}
        >
          <Form.Item name="Name" label="Name">
            <Input disabled />
          </Form.Item>
          <Form.Item name="Service" label="Service" rules={[{ required: true, message: 'Please select a service!' }]}>
            <Select placeholder="Select a service" onChange={(value) => {
              const service = services.find(s => s.Service === value);
              sevaForm.setFieldsValue({ Rate: service.Rate, AmountPaid: service.Rate });
            }}>
              {services.map(service => (
                <Option key={service.ServiceId} value={service.Service}>{service.Service}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="Rate" label="Rate">
            <Input disabled />
          </Form.Item>
          <Form.Item name="ServiceDate" label="Service Date" rules={[{ required: true, message: 'Please select a service date!' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="AmountPaid" label="Amount Paid" rules={[{ required: true, message: 'Please input the amount paid!' }]}>
            <Input type="number" />
          </Form.Item>
          <Form.Item name="PaymentMethod" label="Payment Method" rules={[{ required: true, message: 'Please select a payment method!' }]}>
            <Select placeholder="Select a payment method">
              {paymentMethods.map(method => (
                <Option key={method.PaymentMethodId} value={method.PaymentMethodId}>{method.MethodName}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="CheckNumber" label="Check Number">
            <Input disabled={!sevaForm.getFieldValue('PaymentMethod') || sevaForm.getFieldValue('PaymentMethod') !== 'Check'} />
          </Form.Item>
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
    </Layout>
  );
};

export default Home;
