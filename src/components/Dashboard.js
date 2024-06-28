import React, { useState, useEffect, useRef } from 'react';
import { Layout, Menu, Breadcrumb, Button } from 'antd';
import { MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons';
import { Route, Routes, Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import Home from './Home';
import DevoteeList from './DevoteeList';
import SuperAdmin from './SuperAdmin';
import Calendar from './Calendar';
import Reports from './Reports';
import Receipts from './Receipts';
import Settings from './Settings';
//import ListOfSevas from './ListOfSevas';
import {jwtDecode} from 'jwt-decode';
import './Dashboard.css';
import homeIcon from '../assets/icons/add-user.png';
import DevoteeListIcon from '../assets/icons/devotee_list.png';
import CalendarIcon from '../assets/icons/calendar.png';
import ReceiptIcon from '../assets/icons/receipt.png';
import ReportIcon from '../assets/icons/file.png';
import LoginAccessIcon from '../assets/icons/log-in.png';
import SettingIcon from '../assets/icons/cogwheel.png';
//import ListOfSevasIcon from '../assets/icons/cogwheel.png';

const { Header, Content, Sider } = Layout;

const Dashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [username, setUsername] = useState('');
  const [headerColor, setHeaderColor] = useState('#001529');
  const [sidebarColor, setSidebarColor] = useState('#001529');
  const [accessControl, setAccessControl] = useState({});
  const navigate = useNavigate();
  const location = useLocation();
  const timeoutRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedHeaderColor = localStorage.getItem('headerColor');
    const storedSidebarColor = localStorage.getItem('sidebarColor');
    if (token) {
      const decodedToken = jwtDecode(token);
      setUsername(capitalizeFirstLetter(decodedToken.username));
      fetchAccessControl(decodedToken.usertype);
    }
    if (storedHeaderColor) setHeaderColor(storedHeaderColor);
    if (storedSidebarColor) setSidebarColor(storedSidebarColor);
    startInactivityTimeout();

    // Clean up the timeout on component unmount
    return () => {
      clearInactivityTimeout();
    };
  }, []);

  const startInactivityTimeout = () => {
    clearInactivityTimeout();
    timeoutRef.current = setTimeout(() => {
      handleSignOut();
    }, 15 * 60 * 1000); // 15 minutes
  };

  const clearInactivityTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleUserActivity = () => {
    startInactivityTimeout();
  };

  useEffect(() => {
    // Add event listeners for user activity
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('click', handleUserActivity);

    // Clean up event listeners on component unmount
    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
    };
  }, []);

  const fetchAccessControl = async (userType) => {
    try {
      const response = await fetch(`http://localhost:5001/access-control/${encodeURIComponent(userType)}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await response.json();
        setAccessControl(data);
      } else {
        const text = await response.text();
        console.error('Response is not JSON:', text);
        throw new Error('Response is not JSON');
      }
    } catch (error) {
      console.error('Failed to fetch access control data:', error);
    }
  };  
  
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

  const handleMenuClick = () => {
    if (window.innerWidth <= 992) {
      setCollapsed(true);
    }
  };

  const menuItems = [
    { key: '/dashboard/home', icon: <img src={homeIcon} alt="New Devotee" className="custom-icon" />, label: <Link to="/dashboard/home" onClick={handleMenuClick}>New Devotee</Link>, access: accessControl.Home?.can_view },
    { key: '/dashboard/devotee-list', icon: <img src={DevoteeListIcon} alt="Devotee List" className="custom-icon" />, label: <Link to="/dashboard/devotee-list" onClick={handleMenuClick}>Devotee List</Link>, access: accessControl.DevoteeList?.can_view },
    { key: '/dashboard/calendar', icon: <img src={CalendarIcon} alt="Calendar" className="custom-icon" />, label: <Link to="/dashboard/calendar" onClick={handleMenuClick}>Calendar</Link>, access: accessControl.Calendar?.can_view },
    { key: '/dashboard/receipts', icon: <img src={ReceiptIcon} alt="Receipts" className="custom-icon" />, label: <Link to="/dashboard/receipts" onClick={handleMenuClick}>Receipts</Link>, access: accessControl.Receipts?.can_view },
    { key: '/dashboard/reports', icon: <img src={ReportIcon} alt="Reports" className="custom-icon" />, label: <Link to="/dashboard/reports" onClick={handleMenuClick}>Reports</Link>, access: accessControl.Reports?.can_view },
    { key: '/dashboard/login-access', icon: <img src={LoginAccessIcon} alt="Login Access" className="custom-icon" />, label: <Link to="/dashboard/login-access" onClick={handleMenuClick}>Login Access</Link>, access: accessControl['Login Access']?.can_view },
    { key: '/dashboard/settings', icon: <img src={SettingIcon} alt="Settings" className="custom-icon" />, label: <Link to="/dashboard/settings" onClick={handleMenuClick}>Settings</Link>, access: accessControl.Settings?.can_view },
    //{ key: '/dashboard/list-of-sevas', icon: <img src={ListOfSevasIcon} alt="List of Sevas" className="custom-icon" />, label: <Link to="/dashboard/list-of-sevas" onClick={handleMenuClick}>List of Sevas</Link>, access: accessControl.ListOfSevas?.can_view },
  ].filter(item => item.access);

  const getBreadcrumbItems = () => {
    const pathSnippets = location.pathname.split('/').filter(i => i);
    const breadcrumbNameMap = {
      '/dashboard': 'Dashboard',
      '/dashboard/home': 'New Devotee',
      '/dashboard/devotee-list': 'Devotee List',
      '/dashboard/calendar': 'Calendar',
      '/dashboard/receipts': 'Receipts',
      '/dashboard/reports': 'Reports',
      '/dashboard/login-access': 'Login Access',
      '/dashboard/settings': 'Settings',
      '/dashboard/list-of-sevas': 'List of Sevas',
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
              <Route path="devotee-list" element={<DevoteeList />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="receipts" element={<Receipts />} />
              <Route path="reports" element={<Reports />} />
              <Route path="login-access" element={<SuperAdmin />} />
              <Route path="settings" element={<Settings />} />
              <Route path="/" element={<Navigate to="/dashboard/home" />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

//<Route path="list-of-sevas" element={<ListOfSevas />} />
export default Dashboard;
