import React, { useState, useEffect } from 'react';
import { Layout, Menu, Breadcrumb, Button } from 'antd';
import { MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons';
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
  const [headerColor, setHeaderColor] = useState('#001529');
  const [sidebarColor, setSidebarColor] = useState('#001529');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedHeaderColor = localStorage.getItem('headerColor');
    const storedSidebarColor = localStorage.getItem('sidebarColor');
    if (token) {
      const decodedToken = jwtDecode(token);
      setUsername(capitalizeFirstLetter(decodedToken.username));
    }
    if (storedHeaderColor) setHeaderColor(storedHeaderColor);
    if (storedSidebarColor) setSidebarColor(storedSidebarColor);
  }, []);

  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  const menuItems = [
    { key: '/dashboard/home', icon: <img src={homeIcon} alt="Home" className="custom-icon" />, label: <Link to="/dashboard/home">Home</Link> },
    { key: '/dashboard/calendar', icon: <img src={CalendarIcon} alt="Calendar" className="custom-icon" />, label: <Link to="/dashboard/calendar">Calendar</Link> },
    { key: '/dashboard/receipts', icon: <img src={ReceiptIcon} alt="Receipts" className="custom-icon" />, label: <Link to="/dashboard/receipts">Receipts</Link> },
    { key: '/dashboard/reports', icon: <img src={ReportIcon} alt="Reports" className="custom-icon" />, label: <Link to="/dashboard/reports">Reports</Link> },
    { key: '/dashboard/login-access', icon: <img src={LoginAccessIcon} alt="Login Access" className="custom-icon" />, label: <Link to="/dashboard/login-access">Login Access</Link> },
    { key: '/dashboard/settings', icon: <img src={SettingIcon} alt="Settings" className="custom-icon" />, label: <Link to="/dashboard/settings">Settings</Link> },
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
      <Header className="header" style={{ backgroundColor: headerColor }}>
        <Button className="menu-toggle" type="primary" onClick={toggleCollapsed}>
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </Button>
        <div className="header-left">
          <span className="welcome-text">Welcome, {username}</span>
        </div>
        <div className="title">
          Sri Sharadamba Temple, Milpitas
        </div>
        <div className="header-right">
          <Button type="primary" onClick={handleSignOut} className="sign-out-button">
            Sign out
          </Button>
        </div>
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
          style={{ backgroundColor: sidebarColor }}
        >
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            defaultOpenKeys={['sub1']}
            style={{ height: '100%', borderRight: 0, backgroundColor: sidebarColor }}
            items={menuItems.map((item) => ({ ...item, style: { color: 'white' } }))}
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
