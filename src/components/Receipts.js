import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, message, Tabs } from 'antd';
import axios from 'axios';
import moment from 'moment';
import './Receipts.css'; // Add this line to import the CSS file

const { Search } = Input;
const { TabPane } = Tabs;

const Receipts = () => {
  const [pendingReceipts, setPendingReceipts] = useState([]);
  const [approvedReceipts, setApprovedReceipts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [pendingSearch, setPendingSearch] = useState('');
  const [approvedSearch, setApprovedSearch] = useState('');
  const [form] = Form.useForm();

  const fetchPendingReceipts = async (search = '') => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5001/receipts/pending', {
        params: { search }
      });
      setPendingReceipts(response.data);
    } catch (error) {
      message.error('Failed to load pending receipts');
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovedReceipts = async (search = '') => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5001/receipts/approved', {
        params: { search }
      });
      setApprovedReceipts(response.data);
    } catch (error) {
      message.error('Failed to load approved receipts');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5001/user');
      setUsers(response.data);
    } catch (error) {
      message.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingReceipts(pendingSearch);
    fetchApprovedReceipts(approvedSearch);
    fetchUsers();
  }, [pendingSearch, approvedSearch]);

  const handleApprove = async (activityId) => {
    try {
      const token = localStorage.getItem('token'); // Retrieve token from local storage
      await axios.post('http://localhost:5001/receipts/approve', { activityId }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      message.success('Receipt approved successfully');
      fetchPendingReceipts(pendingSearch);
      fetchApprovedReceipts(approvedSearch);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        message.error('You are not authorized to perform this action');
      } else {
        message.error('Failed to approve receipt');
      }
    }
  };

  const handleEdit = (activity) => {
    setCurrentActivity(activity);
    form.setFieldsValue(activity);
    setIsModalVisible(true);
  };

  const handleEditOk = async () => {
    try {
      const updatedData = form.getFieldsValue();
      await axios.put(`http://localhost:5001/activities/${currentActivity.ActivityId}`, updatedData);
      message.success('Activity updated successfully');
      setIsModalVisible(false);
      fetchPendingReceipts(pendingSearch);
      fetchApprovedReceipts(approvedSearch);
    } catch (error) {
      message.error('Failed to update activity');
    }
  };

  const handleEditCancel = () => {
    setIsModalVisible(false);
  };

  const handlePendingSearchChange = (e) => {
    const value = e.target.value;
    setPendingSearch(value);
    if (value.length >= 3) {
      fetchPendingReceipts(value);
    } else if (value.length === 0) {
      fetchPendingReceipts('');
    }
  };

  const handleApprovedSearchChange = (e) => {
    const value = e.target.value;
    setApprovedSearch(value);
    if (value.length >= 3) {
      fetchApprovedReceipts(value);
    } else if (value.length === 0) {
      fetchApprovedReceipts('');
    }
  };

  const formatDate = (date) => {
    return moment(date).format('MMM D, YYYY');
  };

  const columnsPending = [
    { title: 'Name', dataIndex: 'Name', key: 'Name' },
    { title: 'Service', dataIndex: 'Service', key: 'Service' },
    { title: 'Date', dataIndex: 'Date', key: 'Date', render: (text) => formatDate(text) },
    { title: 'Check Number', dataIndex: 'CheckNumber', key: 'CheckNumber' },
    { title: 'Amount', dataIndex: 'Amount', key: 'Amount' },
    { title: 'Assisted by', dataIndex: 'AssistedBy', key: 'AssistedBy' },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <>
          <Button className="ant-btn-approve" onClick={() => handleApprove(record.ActivityId)}>Approve</Button>
          <Button className="ant-btn-edit" onClick={() => handleEdit(record)} style={{ marginLeft: 8 }}>Edit</Button>
        </>
      )
    }
  ];

  const columnsApproved = [
    { title: 'Name', dataIndex: 'Name', key: 'Name' },
    { title: 'Service', dataIndex: 'Service', key: 'Service' },
    { title: 'Activity Date', dataIndex: 'ActivityDate', key: 'ActivityDate', render: (text) => formatDate(text) },
    { title: 'Approved Date', dataIndex: 'ApprovedDate', key: 'ApprovedDate', render: (text) => formatDate(text) },
    { title: 'Check Number', dataIndex: 'CheckNumber', key: 'CheckNumber' },
    { title: 'Amount', dataIndex: 'Amount', key: 'Amount' },
    { title: 'Assisted by', dataIndex: 'AssistedBy', key: 'AssistedBy' },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <>
          <Button className="ant-btn-email" onClick={() => message.info(`Send Email to ${record.Name}`)}>Email</Button>
          <Button className="ant-btn-print" onClick={() => message.info('Print receipt')} style={{ marginLeft: 8 }}>Print</Button>
        </>
      )
    }
  ];

  return (
    <div>
      <h2>Receipts</h2>
      <Tabs defaultActiveKey="1">
        <TabPane tab="Receipts for Approval" key="1">
          <Search
            placeholder="Search by name, phone or email"
            onChange={handlePendingSearchChange}
            style={{ width: '80%', marginBottom: '16px' }}
          />
          <Table
            columns={columnsPending}
            dataSource={pendingReceipts}
            loading={loading}
            rowKey="ActivityId"
            pagination={{ pageSize: 20 }}
            style={{ width: '80%' }}
          />
        </TabPane>
        <TabPane tab="Approved Receipts" key="2">
          <Search
            placeholder="Search by name, phone or email"
            onChange={handleApprovedSearchChange}
            style={{ width: '80%', marginBottom: '16px' }}
          />
          <Table
            columns={columnsApproved}
            dataSource={approvedReceipts}
            loading={loading}
            rowKey="ReceiptId"
            pagination={{ pageSize: 20 }}
            style={{ width: '80%' }}
          />
        </TabPane>
      </Tabs>
      <Modal
        title="Edit Activity"
        visible={isModalVisible}
        onOk={handleEditOk}
        onCancel={handleEditCancel}
      >
        <Form form={form}>
          <Form.Item name="Service" label="Service">
            <Input />
          </Form.Item>
          <Form.Item name="Amount" label="Amount">
            <Input />
          </Form.Item>
          <Form.Item name="CheckNumber" label="Check Number">
            <Input />
          </Form.Item>
          <Form.Item name="Comments" label="Comments">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Receipts;
