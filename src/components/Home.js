// src/components/Home.js
import React, { useEffect, useState } from 'react';
import { Layout, Input, Button, Table, Modal, Form, message, Row, Col, DatePicker } from 'antd';
import axios from 'axios';

const { Content } = Layout;
const { Search } = Input;

const Home = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [totalContacts, setTotalContacts] = useState(0);
  const [currentContact, setCurrentContact] = useState(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/contacts');
      setContacts(response.data);
      setTotalContacts(response.data.length);
    } catch (error) {
      message.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = () => {
    setCurrentContact(null);
    setIsModalVisible(true);
  };

  const handleEditContact = (contact) => {
    setCurrentContact(contact);
    setIsModalVisible(true);
  };

  const handleDeleteContact = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/contacts/${id}`);
      message.success('Contact deleted');
      fetchContacts();
    } catch (error) {
      message.error('Failed to delete contact');
    }
  };

  const handleOk = async (values) => {
    try {
      if (currentContact) {
        await axios.put(`http://localhost:5000/contacts/${currentContact.id}`, values);
        message.success('Contact updated');
      } else {
        await axios.post('http://localhost:5000/contacts', values);
        message.success('Contact added');
      }
      fetchContacts();
      setIsModalVisible(false);
    } catch (error) {
      message.error('Failed to save contact');
    }
  };

  const columns = [
    { title: 'First Name', dataIndex: 'first_name', key: 'first_name' },
    { title: 'Last Name', dataIndex: 'last_name', key: 'last_name' },
    { title: 'Phone Number', dataIndex: 'phone_number', key: 'phone_number' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Actions', key: 'actions', render: (text, record) => (
        <>
          <Button onClick={() => handleEditContact(record)}>Edit</Button>
          <Button onClick={() => handleDeleteContact(record.id)} danger style={{ marginLeft: 8 }}>Delete</Button>
        </>
      )
    }
  ];

  const handleSearch = async (value) => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/contacts?search=${value}`);
      setContacts(response.data);
    } catch (error) {
      message.error('Failed to search contacts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Content style={{ padding: '0 50px' }}>
        <div className="site-layout-content">
          <h2>Home Page</h2>
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}>
            <Search
              placeholder="Search contacts"
              onSearch={handleSearch}
              style={{ width: 400, marginRight: 16, height: 40 }} // Set height to match button
            />
            <Button type="primary" onClick={handleAddContact} style={{ height: 40 }}>Add Contact</Button> {/* Set height to match search bar */}
          </div>
          <div style={{ marginTop: 16 }}>
            <p>Total Contacts in the Database: {totalContacts}</p>
          </div>
          <Table columns={columns} dataSource={contacts} loading={loading} rowKey="id" pagination={{ pageSize: 10 }} />
        </div>
      </Content>
      <Modal
        title={currentContact ? "Edit Contact" : "Add Contact"}
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form
          initialValues={currentContact || { first_name: '', last_name: '', phone_number: '', alternate_phone_number: '', address: '', city: '', state: '', zip_code: '', email: '', gothra: '', star: '', dob: null }}
          onFinish={handleOk}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="first_name" rules={[{ required: true, message: 'Please input the first name!' }]}>
                <Input placeholder="First Name" style={{ height: 50 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="last_name" rules={[{ required: true, message: 'Please input the last name!' }]}>
                <Input placeholder="Last Name" style={{ height: 50 }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="phone_number" rules={[{ required: true, message: 'Please input the phone number!' }]}>
                <Input placeholder="Phone Number" style={{ height: 50 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="alternate_phone_number">
                <Input placeholder="Alternate Phone Number" style={{ height: 50 }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="address">
                <Input placeholder="Address" style={{ height: 50 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="city">
                <Input placeholder="City" style={{ height: 50 }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="state">
                <Input placeholder="State" style={{ height: 50 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="zip_code">
                <Input placeholder="Zip Code" style={{ height: 50 }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="email">
            <Input placeholder="Email" style={{ height: 50 }} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="gothra">
                <Input placeholder="Gothra" style={{ height: 50 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="star">
                <Input placeholder="Star" style={{ height: 50 }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="dob">
            <DatePicker style={{ width: '100%', height: 50 }} placeholder="Date of Birth" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ height: 50 }}>
              {currentContact ? "Update" : "Add"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default Home;
