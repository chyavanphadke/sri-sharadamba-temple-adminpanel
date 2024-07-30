import React, { useEffect, useState, useCallback } from 'react';
import { Layout, Table, Button, message, Input, Modal, Select, Row, Col } from 'antd';
import axios from 'axios';
import _ from 'lodash';
import { jwtDecode } from 'jwt-decode';
import './SuperAdmin.css'; // Ensure this is the correct path to your CSS file

const { Content } = Layout;
const { Option } = Select;

const SuperAdmin = () => {
  // State management
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [modalAction, setModalAction] = useState(null);
  const [userMap, setUserMap] = useState({});
  const [loggedInUsername, setLoggedInUsername] = useState('');

  // Initial data fetch on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = jwtDecode(token);
      setLoggedInUsername(decodedToken.username.toLowerCase());
    }
    fetchUsers();
    fetchUserMap();
  }, []);

  // Fetch users from the server
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
      console.log('Users fetched successfully');
    } catch (error) {
      message.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user map (mapping of user IDs to usernames)
  const fetchUserMap = async () => {
    try {
      console.log('Fetching user map...');
      const response = await axios.get('http://localhost:5001/users', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      console.log('User map response:', response.data);
      const userMap = response.data.reduce((acc, user) => {
        acc[user.userid] = user.username;
        return acc;
      }, {});
      setUserMap(userMap);
    } catch (error) {
      console.error('Failed to load user map:', error);
      message.error('Failed to load user map');
    }
  };

  // Handle user actions (approve, disapprove, delete, update access level)
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
      } else if (action === 'disapprove') {
        await axios.put(`http://localhost:5001/user/${userid}/disapprove`, {}, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        message.success('User disapproved');
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

  // Handle access level change
  const handleAccessLevelChange = (userid, username, accessLevel) => {
    setModalContent(`You want to provide ${accessLevel} access to ${username}?`);
    setModalAction(() => () => handleAction(userid, accessLevel));
    setIsModalVisible(true);
  };

  // Handle user deletion
  const handleDeleteUser = (userid, username) => {
    setModalContent(`Are you sure you want to delete user ${username}?`);
    setModalAction(() => () => handleAction(userid, 'delete'));
    setIsModalVisible(true);
  };

  // Debounced search for users
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
        console.log('Users searched successfully');
      } catch (error) {
        message.error('Failed to search users');
      } finally {
        setLoading(false);
      }
    } else {
      fetchUsers();
    }
  }, 300), []);

  // Handle search input change
  const handleSearchChange = (e) => {
    debounceSearch(e.target.value);
  };

  // Table columns definition
  const columns = [
    { title: 'Username', dataIndex: 'username', key: 'username', align: 'center' },
    { title: 'Email', dataIndex: 'email', key: 'email', align: 'center' },
    {
      title: 'Access Level',
      dataIndex: 'usertype',
      key: 'usertype',
      render: (text, record) => (
        <Select
          defaultValue={text}
          onChange={(value) => handleAccessLevelChange(record.userid, record.username, value)}
          dropdownClassName="custom-dropdown"
          dropdownStyle={{ minWidth: '150px' }} // Ensuring dropdown width to avoid truncation
        >
          <Option value="User">User</Option>
          <Option value="Admin">Admin</Option>
          {(loggedInUsername === 'nb' || loggedInUsername === 'aghamya') && <Option value="Super Admin">Super Admin</Option>}
        </Select>
      ),
      align: 'center'
    },
    {
      title: 'Approved By',
      dataIndex: 'approvedBy',
      key: 'approvedBy',
      render: (text) => text === 'Auto Approved' ? 'Auto Approved' : (userMap[text] || 'N/A'),
      align: 'center'
    },
    { title: 'Approved', dataIndex: 'approved', key: 'approved', render: (text) => text ? 'Yes' : 'No', align: 'center' },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <>
          {record.approved ? (
            <Button onClick={() => handleAction(record.userid, 'disapprove')} style={{ marginRight: 8 }}>Disapprove</Button>
          ) : (
            <Button onClick={() => handleAction(record.userid, 'approve')} style={{ marginRight: 8 }} disabled={record.approved}>Approve</Button>
          )}
          <Button onClick={() => handleDeleteUser(record.userid, record.username)} danger style={{ marginRight: 8 }}>Delete</Button>
        </>
      ),
      align: 'center'
    }
  ];

  return (
    <Layout>
      <Content>
        <div className="site-layout-content">
          <h2>Super Admin Page</h2>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Input
                placeholder="Search users"
                onChange={handleSearchChange}
                style={{ width: '100%' }}
              />
            </Col>
          </Row>
          <Table 
            columns={columns} 
            dataSource={users} 
            loading={loading} 
            rowKey="userid" 
            pagination={{ pageSize: 10 }} 
            scroll={{ x: '100%' }} // Make table horizontally scrollable on smaller screens
          />
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
