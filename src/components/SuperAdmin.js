// src/components/SuperAdmin.js
import React, { useEffect, useState } from 'react';
import { Layout, Table, Button, message } from 'antd';
import axios from 'axios';

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
          <Table columns={columns} dataSource={users} loading={loading} rowKey="id" />
        </div>
      </Content>
    </Layout>
  );
};

export default SuperAdmin;
