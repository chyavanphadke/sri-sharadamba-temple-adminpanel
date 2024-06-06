import React, { useEffect, useState, useCallback } from 'react';
import { Layout, Input, Button, Table, Modal, Form, message, Row, Col, DatePicker } from 'antd';
import axios from 'axios';
import _ from 'lodash';
import moment from 'moment';
import './Home.css';

const { Content } = Layout;

const Home = () => {
  const [devotees, setDevotees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [totalDevotees, setTotalDevotees] = useState(0);
  const [currentDevotee, setCurrentDevotee] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([{ FirstName: '', LastName: '', RelationShip: '', Gotra: '', Star: '', DOB: null }]);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchDevotees();
  }, []);

  const fetchDevotees = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5001/devotees');
      const sortedDevotees = response.data.sort((a, b) => new Date(b.LastModified) - new Date(a.LastModified));
      setDevotees(sortedDevotees);
      setTotalDevotees(sortedDevotees.length);
    } catch (error) {
      message.error('Failed to load devotees');
    } finally {
      setLoading(false);
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
      const familyResponse = await axios.get(`http://localhost:5001/devotees/${devotee.DevoteeId}/family`);
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
      await axios.delete(`http://localhost:5001/devotees/${id}`);
      message.success('Devotee deleted');
      fetchDevotees();
    } catch (error) {
      message.error('Failed to delete devotee');
    }
  };

  const handleOk = async (values) => {
    try {
      const payload = { ...values, family: familyMembers };
      if (currentDevotee) {
        await axios.put(`http://localhost:5001/devotees/${currentDevotee.DevoteeId}`, payload);
        message.success('Devotee updated');
      } else {
        const response = await axios.post('http://localhost:5001/devotees', payload);
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

  const debounceSearch = useCallback(_.debounce(async (value) => {
    if (value.length >= 3) {
      setLoading(true);
      try {
        const response = await axios.get(`http://localhost:5001/devotees?search=${value}`);
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
          <Button onClick={() => handleEditDevotee(record)}>Edit</Button>
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
                <h4>Family member {index + 1}</h4>
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
    </Layout>
  );
};

export default Home;
