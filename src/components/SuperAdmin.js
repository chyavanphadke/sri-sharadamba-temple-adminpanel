// src/components/SuperAdmin.js
import React, { useEffect, useState } from 'react';
import { Layout, Table, Button, message } from 'antd';
import axios from 'axios';

const { Content } = Layout;

const SuperAdmin = () => {
  const [user, setUsers] = useState([]);
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
      const sortedUsers = response.data.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      setUsers(sortedUsers);
    } catch (error) {
      message.error('Failed to load user');
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
        await axios.put(`http://localhost:5001/user/${userid}/level`, { level: action }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        message.success(`User level updated to ${action}`);
      }
      fetchUsers();
    } catch (error) {
      message.error(`Failed to ${action} user`);
    }
  };

  const columns = [
    { title: 'Username', dataIndex: 'username', key: 'username' },
    { title: 'Level', dataIndex: 'level', key: 'level' },
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
          <Table columns={columns} dataSource={user} loading={loading} rowKey="userid" pagination={{ pageSize: 10 }} />
        </div>
      </Content>
    </Layout>
  );
};

export default SuperAdmin;