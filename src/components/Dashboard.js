import React, { useState, useEffect } from 'react';
import { Layout, Menu, Breadcrumb, Button } from 'antd';
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
} from '@ant-design/icons';
import { Route, Routes, Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import Home from './Home';
import SuperAdmin from './SuperAdmin';
import Calendar from './Calendar';
import Reports from './Reports';
import Receipts from './Receipts';
import Settings from './Settings';
import { jwtDecode } from 'jwt-decode'; // Correct the import statement
import './Dashboard.css';
import homeIcon from '../assets/icons/home.png'; // Ensure the correct path to your image
import CalendarIcon from '../assets/icons/calendar.png'; // Ensure the correct path to your image
import ReceiptIcon from '../assets/icons/receipt.png'; // Ensure the correct path to your image
import ReportIcon from '../assets/icons/file.png'; // Ensure the correct path to your image
import LoginAccessIcon from '../assets/icons/log-in.png'; // Ensure the correct path to your image
import SettingIcon from '../assets/icons/cogwheel.png'; // Ensure the correct path to your image

const { Header, Content, Sider } = Layout;

const Dashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [username, setUsername] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = jwtDecode(token);
      setUsername(decodedToken.username);
    }
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  const menuItems = [
    { key: '1', icon: <img src={homeIcon} alt="Home" className="custom-icon" />, label: <Link to="/dashboard/home">Home</Link> },
    { key: '2', icon: <img src={CalendarIcon} alt="Calendar" className="custom-icon" />, label: <Link to="/dashboard/calendar">Calendar</Link> },
    { key: '3', icon: <img src={ReceiptIcon} alt="Receipts" className="custom-icon" />, label: <Link to="/dashboard/receipts">Receipts</Link> },
    { key: '4', icon: <img src={ReportIcon} alt="Reports" className="custom-icon" />, label: <Link to="/dashboard/reports">Reports</Link> },
    { key: '5', icon: <img src={LoginAccessIcon} alt="Login Access" className="custom-icon" />, label: <Link to="/dashboard/login-access">Login Access</Link> },
    { key: '6', icon: <img src={SettingIcon} alt="Settings" className="custom-icon" />, label: <Link to="/dashboard/settings">Settings</Link> },
  ];

  const getBreadcrumbItems = () => {
    const pathSnippets = location.pathname.split('/').filter(i => i);
    const breadcrumbNameMap = {
      '/dashboard': 'Dashboard',
      '/dashboard/home': 'Home',
      '/dashboard/calendar': 'Calendar',
      '/dashboard/receipts': 'Receipts',
      '/dashboard/reports': 'Reports',
      '/dashboard/login-access': 'Login Access',
      '/dashboard/settings': 'Settings'
    };
    const breadcrumbItems = pathSnippets.map((_, index) => {
      const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
      return {
        title: breadcrumbNameMap[url],
      };
    });
    return breadcrumbItems;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header className="header">
        <div className="logo" />
        <Button className="menu-toggle" type="primary" onClick={toggleCollapsed}>
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </Button>
        <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['1']} style={{ flex: 1 }}>
          <Menu.Item key="1">Welcome, {username}</Menu.Item>
          <Menu.Item key="2" style={{ marginLeft: 'auto' }}>
            <Button type="link" onClick={handleSignOut} style={{ color: 'white' }}>
              Sign out
            </Button>
          </Menu.Item>
        </Menu>
      </Header>
      <Layout>
        <Sider
          className="custom-sider"
          width={200}
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
          breakpoint="lg"
          collapsedWidth="0"
        >
          <Menu
            mode="inline"
            defaultSelectedKeys={['1']}
            defaultOpenKeys={['sub1']}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
          />
        </Sider>
        <Layout style={{ padding: '0 24px 24px' }}>
          <Breadcrumb style={{ margin: '16px 0' }} items={getBreadcrumbItems()} />
          <Content
            className="site-layout-background"
            style={{
              padding: 24,
              margin: 0,
              minHeight: 280,
            }}
          >
            <Routes>
              <Route path="home" element={<Home />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="receipts" element={<Receipts />} />
              <Route path="reports" element={<Reports />} />
              <Route path="login-access" element={<SuperAdmin />} /> {/* Rename route path */}
              <Route path="settings" element={<Settings />} />
              <Route path="/" element={<Navigate to="/dashboard/home" />} /> {/* Default route to /dashboard/home */}
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default Dashboard;
