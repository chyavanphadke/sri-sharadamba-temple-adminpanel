import React, { useEffect, useState, useCallback } from 'react';
import { Layout, Table, Button, message, Input, Modal, Select } from 'antd';
import axios from 'axios';
import _ from 'lodash';

const { Content } = Layout;
const { Option } = Select;

const SuperAdmin = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [modalAction, setModalAction] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5001/user', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      const filteredUsers = response.data.filter(user => !user.old_users);
      const sortedUsers = filteredUsers.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      setUsers(sortedUsers);
    } catch (error) {
      message.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (userid, action) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Authentication token not found');
        return;
      }

      if (action === 'approve') {
        await axios.put(`http://localhost:5001/user/${userid}/approve`, {}, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        message.success('User approved');
      } else if (action === 'delete') {
        await axios.delete(`http://localhost:5001/user/${userid}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        message.success('User deleted');
      } else {
        await axios.put(`http://localhost:5001/user/${userid}/usertype`, { usertype: action }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        message.success(`User access level updated to ${action}`);
      }
      fetchUsers();
    } catch (error) {
      message.error(`Failed to ${action} user`);
    }
  };

  const handleAccessLevelChange = (userid, username, accessLevel) => {
    setModalContent(`You want to provide ${accessLevel} access to ${username}?`);
    setModalAction(() => () => handleAction(userid, accessLevel));
    setIsModalVisible(true);
  };

  const handleDeleteUser = (userid, username) => {
    setModalContent(`Are you sure you want to delete user ${username}?`);
    setModalAction(() => () => handleAction(userid, 'delete'));
    setIsModalVisible(true);
  };

  const debounceSearch = useCallback(_.debounce(async (value) => {
    if (value.length >= 3) {
      setLoading(true);
      try {
        const response = await axios.get(`http://localhost:5001/user?search=${value}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        const filteredUsers = response.data.filter(user => !user.old_users);
        const sortedUsers = filteredUsers.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        setUsers(sortedUsers);
      } catch (error) {
        message.error('Failed to search users');
      } finally {
        setLoading(false);
      }
    } else {
      fetchUsers();
    }
  }, 300), []);

  const handleSearchChange = (e) => {
    debounceSearch(e.target.value);
  };

  const columns = [
    { title: 'Username', dataIndex: 'username', key: 'username' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Access Level', dataIndex: 'usertype', key: 'usertype', render: (text, record) => (
        <Select
          defaultValue={text}
          onChange={(value) => handleAccessLevelChange(record.userid, record.username, value)}
        >
          <Option value="User">User</Option>
          <Option value="Admin">Admin</Option>
          <Option value="Super Admin">Super Admin</Option>
        </Select>
      )
    },
    { title: 'Approved By', dataIndex: 'approvedBy', key: 'approvedBy', render: (text) => text || 'N/A' },
    {
      title: 'Actions', key: 'actions', render: (text, record) => (
        <>
          <Button onClick={() => handleAction(record.userid, 'approve')} disabled={record.approved} style={{ marginRight: 8 }}>Approve</Button>
          <Button onClick={() => handleDeleteUser(record.userid, record.username)} danger style={{ marginRight: 8 }}>Delete</Button>
        </>
      )
    }
  ];

  return (
    <Layout>
      <Content>
        <div className="site-layout-content">
          <h2>Super Admin Page</h2>
          <Input
            placeholder="Search users"
            onChange={handleSearchChange}
            style={{ width: 400, marginBottom: 16 }}
          />
          <Table columns={columns} dataSource={users} loading={loading} rowKey="userid" pagination={{ pageSize: 10 }} />
          <Modal
            title="Confirmation"
            visible={isModalVisible}
            onOk={() => {
              modalAction();
              setIsModalVisible(false);
            }}
            onCancel={() => setIsModalVisible(false)}
          >
            <p>{modalContent}</p>
          </Modal>
        </div>
      </Content>
    </Layout>
  );
};

export default SuperAdmin;
