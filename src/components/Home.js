import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Layout, Input, Button, Form, message, Row, Col, DatePicker } from 'antd';
import axios from 'axios';
import moment from 'moment';
import {jwtDecode} from 'jwt-decode';
import './Home.css';

const { Content } = Layout;

const Home = () => {
  const [currentDevotee, setCurrentDevotee] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [form] = Form.useForm();
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

  useEffect(() => {
    if (token) {
      const decodedToken = jwtDecode(token);
      fetchAccessControl(decodedToken.usertype);
    }
  }, [token]);

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
      form.resetFields();
      setCurrentDevotee(null);
      setFamilyMembers([]);
    } catch (error) {
      if (error.response && error.response.data && error.response.data.error === 'The email is already registered') {
        message.error('Email already registered');
      } else if (error.response && error.response.data && error.response.data.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Failed to save devotee');
      }
    }
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

  return (
    <Layout>
      <Content>
        <div className="site-layout-content">
          <h2>New Devotee</h2>
          <div className="responsive-container">
            <div className="form-section">
              <Form
                form={form}
                initialValues={currentDevotee || { FirstName: '', LastName: '', Phone: '', AltPhone: '', Address: '', City: '', State: '', Zip: '', Email: '', Gotra: '', Star: '', DOB: null }}
                onFinish={handleOk}
                labelCol={{ span: 24 }}
                wrapperCol={{ span: 24 }}
              >
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="FirstName"
                      label="First Name"
                      rules={[{ required: true, message: 'Please input the first name!' }]}
                    >
                      <Input placeholder="First Name" style={{ height: 50 }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
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
                  <Col xs={24} sm={12}>
                    <Form.Item name="Phone" label="Phone Number">
                      <Input placeholder="Phone Number" style={{ height: 50 }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="AltPhone" label="Alternate Phone Number">
                      <Input placeholder="Alternate Phone Number" style={{ height: 50 }} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item name="Address" label="Address">
                      <Input placeholder="Address" style={{ height: 50 }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="City" label="City">
                      <Input placeholder="City" style={{ height: 50 }} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item name="State" label="State">
                      <Input placeholder="State" style={{ height: 50 }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="Zip" label="Zip Code">
                      <Input placeholder="Zip Code" style={{ height: 50 }} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item name="Email" label="Email">
                      <Input placeholder="Email" style={{ height: 50 }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="DOB" label="Date of Birth">
                      <DatePicker style={{ width: '100%', height: 50 }} placeholder="Date of Birth" />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item name="Gotra" label="Gotra">
                      <Input placeholder="Gotra" style={{ height: 50 }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="Star" label="Star">
                      <Input placeholder="Star" style={{ height: 50 }} />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item>
                  <Button type="primary" htmlType="submit" style={{ height: 50, width: '100%', fontSize: '18px' }}>
                    {currentDevotee ? "Update" : "Add"}
                  </Button>
                </Form.Item>
              </Form>
            </div>
            <div className="divider"></div>
            <div className="family-section">
              <h3>Family Members</h3>
              {familyMembers.map((member, index) => (
                <div key={index} style={{ marginBottom: 16 }}>
                  <Row gutter={16}>
                    <Col span={20}>
                      <h4>Family member {index + 1}</h4>
                    </Col>
                    <Col span={4}>
                      <Button type="primary" danger onClick={() => removeFamilyMember(index)} style={{ width: '100%' }}>
                        Remove
                      </Button>
                    </Col>
                  </Row>
                  <Form layout="vertical">
                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Form.Item label="First Name">
                          <Input
                            placeholder="First Name"
                            value={member.FirstName}
                            onChange={(e) => handleFamilyChange(index, 'FirstName', e.target.value)}
                            style={{ height: 50 }}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item label="Last Name">
                          <Input
                            placeholder="Last Name"
                            value={member.LastName}
                            onChange={(e) => handleFamilyChange(index, 'LastName', e.target.value)}
                            style={{ height: 50 }}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Form.Item label="Date of Birth">
                          <DatePicker
                            style={{ width: '100%', height: 50 }}
                            placeholder="Date of Birth"
                            value={member.DOB ? moment(member.DOB) : null}
                            onChange={(date) => handleFamilyChange(index, 'DOB', date)}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
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
                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Form.Item label="Gothra">
                          <Input
                            placeholder="Gothra"
                            value={member.Gotra}
                            onChange={(e) => handleFamilyChange(index, 'Gotra', e.target.value)}
                            style={{ height: 50 }}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
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
                  </Form>
                </div>
              ))}
              <Button type="dashed" onClick={addFamilyMember} style={{ width: '100%', height: 50, fontSize: '18px' }}>
                + Add Family Member
              </Button>
            </div>
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default Home;
