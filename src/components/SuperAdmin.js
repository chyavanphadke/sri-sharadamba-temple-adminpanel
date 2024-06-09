// src/components/SuperAdmin.js
import React, { useEffect, useState, useCallback } from 'react';
import { Layout, Table, Button, message, Input } from 'antd';
import axios from 'axios';
import _ from 'lodash';

const { Content } = Layout;

const SuperAdmin = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

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
        message.success(`User usertype updated to ${action}`);
      }
      fetchUsers();
    } catch (error) {
      message.error(`Failed to ${action} user`);
    }
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
    { title: 'Usertype', dataIndex: 'usertype', key: 'usertype' },
    { title: 'Approved', dataIndex: 'approved', key: 'approved', render: (text) => (text ? 'Yes' : 'No') },
    {
      title: 'Actions', key: 'actions', render: (text, record) => (
        <>
          <Button onClick={() => handleAction(record.userid, 'approve')} disabled={record.approved} style={{ marginRight: 8 }}>Approve</Button>
          <Button onClick={() => handleAction(record.userid, 'delete')} danger style={{ marginRight: 8 }}>Delete</Button>
          <Button onClick={() => handleAction(record.userid, 'User')} style={{ marginRight: 8 }}>Make User</Button>
          <Button onClick={() => handleAction(record.userid, 'Admin')} style={{ marginRight: 8 }}>Make Admin</Button>
          <Button onClick={() => handleAction(record.userid, 'Super Admin')}>Make Super Admin</Button>
        </>
      )
    }
  ];

  return (
    <Layout>
      <Content style={{ padding: '0 50px' }}>
        <div className="site-layout-content">
          <h2>Super Admin Page</h2>
          <Input
            placeholder="Search users"
            onChange={handleSearchChange}
            style={{ width: 400, marginBottom: 16 }}
          />
          <Table columns={columns} dataSource={users} loading={loading} rowKey="userid" pagination={{ pageSize: 10 }} />
        </div>
      </Content>
    </Layout>
  );
};

export default SuperAdmin;
