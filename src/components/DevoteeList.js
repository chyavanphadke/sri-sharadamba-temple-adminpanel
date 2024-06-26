import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Layout, Table, Input, message, Button, Modal, Form, DatePicker, Select, Row, Col } from 'antd';
import axios from 'axios';
import _ from 'lodash';
import moment from 'moment';
import { jwtDecode } from 'jwt-decode';
import './DevoteeList.css';

const { Content } = Layout;
const { Option } = Select;
const { confirm } = Modal;

const DevoteeList = () => {
  const [devotees, setDevotees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalDevotees, setTotalDevotees] = useState(0);
  const [currentDevotee, setCurrentDevotee] = useState(null);
  const [isSevaModalVisible, setIsSevaModalVisible] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [services, setServices] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [sevaForm] = Form.useForm();
  const [form] = Form.useForm();
  const [familyMembers, setFamilyMembers] = useState([{ FirstName: '', LastName: '', RelationShip: '', Gotra: '', Star: '', DOB: null }]);
  const [accessControl, setAccessControl] = useState({});

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

  const handleDeleteDevotee = async (id) => {
    try {
      const response = await axiosInstance.get(`/devotees/${id}/related-count`);
      const { activityCount, familyMemberCount } = response.data;

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

  const handleOk = async (values) => {
    try {
      const filteredFamilyMembers = familyMembers.filter(member => 
        member.FirstName || member.LastName || member.RelationShip || member.Gotra || member.Star || member.DOB
      );

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
        family: filteredFamilyMembers
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
      form.resetFields();
      setIsModalVisible(false);
      fetchDevotees();
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

  const columns = [
    { title: 'First Name', dataIndex: 'FirstName', key: 'FirstName' },
    { title: 'Last Name', dataIndex: 'LastName', key: 'LastName' },
    { title: 'Phone', dataIndex: 'Phone', key: 'Phone' },
    { title: 'Email', dataIndex: 'Email', key: 'Email' },
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

  return (
    <Layout>
      <Content>
        <div className="site-layout-content">
          <h2>Devotee List</h2>
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}>
            <Input
              placeholder="Search devotees"
              onChange={handleSearchChange}
              style={{ width: 400, marginRight: 16, height: 40 }}
            />
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
              pagination={{ pageSize: 12 }}
              scroll={{ x: 'max-content' }}
            />
          </div>
        </div>
      </Content>
      <Modal
        title={<span style={{ fontSize: '24px' }}>Add Seva</span>}
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
        >
          <div>
            <p style={{ fontWeight: 'bold', fontStyle: 'italic' }}>
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
                    sevaForm.setFieldsValue({ Rate: service.Rate, AmountPaid: service.Rate });
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
              <Form.Item name="Expected Donation" label="Expected Donation">
                <Input disabled />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="AmountPaid" label="Amount Paid" rules={[{ required: true, message: 'Please input the amount paid!' }]}>
                <Input type="number" />
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
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="CheckNumber" label="Check Number">
                <Input disabled={!sevaForm.getFieldValue('PaymentMethod') || sevaForm.getFieldValue('PaymentMethod') !== 'Check'} />
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
        title={currentDevotee ? "Edit Devotee" : "Add Devotee"}
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          initialValues={currentDevotee || { FirstName: '', LastName: '', Phone: '', AltPhone: '', Address: '', City: '', State: '', Zip: '', Email: '', Gotra: '', Star: '', DOB: null }}
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
              <Form.Item name="Email" label="Email">
                <Input placeholder="Email" style={{ height: 50 }} />
              </Form.Item>
            </Col>
            {/* <Col span={12}>
              <Form.Item name="DOB" label="Date of Birth">
                <DatePicker style={{ width: '100%', height: 50 }} placeholder="Date of Birth" />
              </Form.Item>
            </Col> */}
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
                    <Form.Item label="Gothra">
                      <Input
                        placeholder="Gothra"
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
                  <Col span={8}>
                    <Form.Item label="Date of Birth">
                      <DatePicker
                        style={{ width: '100%', height: 50 }}
                        placeholder="Date of Birth"
                        value={member.DOB ? moment(member.DOB) : null}
                        onChange={(date) => handleFamilyChange(index, 'DOB', date)}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </div>
            ))}
            <Button type="dashed" onClick={addFamilyMember} style={{ width: '50%' }}>
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
    </Layout>
  );
};

export default DevoteeList;
