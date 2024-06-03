// src/components/SuperAdmin.js
import React, { useEffect, useState } from 'react';
import { Layout, Table, Button, Input, message } from 'antd';
import axios from 'axios';

const { Content } = Layout;
const { Search } = Input;

const SuperAdmin = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/users');
      setUsers(response.data);
    } catch (error) {
      message.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (id) => {
    try {
      await axios.put(`http://localhost:5000/users/${id}/approve`);
      message.success('User approved');
      fetchUsers();
    } catch (error) {
      message.error('Failed to approve user');
    }
  };

  const handleChangeUserLevel = async (id, level) => {
    try {
      await axios.put(`http://localhost:5000/users/${id}/level`, { level });
      message.success('User level updated');
      fetchUsers();
    } catch (error) {
      message.error('Failed to update user level');
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/users/${id}`);
      message.success('User deleted');
      fetchUsers();
    } catch (error) {
      message.error('Failed to delete user');
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { title: 'Username', dataIndex: 'username', key: 'username' },
    { title: 'Level', dataIndex: 'level', key: 'level' },
    {
      title: 'Approved', dataIndex: 'approved', key: 'approved',
      render: (text, record) => (
        record.approved ? 'Yes' : 'No'
      )
    },
    {
      title: 'Actions', key: 'actions',
      render: (text, record) => (
        <>
          {!record.approved && (
            <Button onClick={() => handleApproveUser(record.id)}>Approve</Button>
          )}
          {record.approved && (
            <Button onClick={() => handleDeleteUser(record.id)} danger style={{ marginLeft: 8 }}>Delete</Button>
          )}
          <Button onClick={() => handleChangeUserLevel(record.id, 'Admin')} style={{ marginLeft: 8 }}>Make Admin</Button>
          <Button onClick={() => handleChangeUserLevel(record.id, 'Super Admin')} style={{ marginLeft: 8 }}>Make Super Admin</Button>
        </>
      )
    }
  ];

  return (
    <Layout>
      <Content style={{ padding: '0 50px' }}>
        <div className="site-layout-content">
          <h2>Super Admin Page</h2>
          <div style={{ marginBottom: 16 }}>
            <Search
              placeholder="Search users"
              onSearch={handleSearch}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ width: 200, marginRight: 16 }}
            />
          </div>
          <Table columns={columns} dataSource={filteredUsers} loading={loading} rowKey="id" />
        </div>
      </Content>
    </Layout>
  );
};

export default SuperAdmin;
