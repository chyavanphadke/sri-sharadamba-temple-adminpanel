// src/components/Dashboard.js
import React, { useState } from 'react';
import { Layout, Menu, Breadcrumb } from 'antd';
import {
  UserOutlined,
  LaptopOutlined,
  NotificationOutlined,
} from '@ant-design/icons';
import { Route, Routes, Link, Navigate } from 'react-router-dom';
import Home from './Home';
import SuperAdmin from './SuperAdmin';
import Reports from './Reports';
import Settings from './Settings';

const { Header, Content, Sider } = Layout;

const Dashboard = () => {
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { key: '1', icon: <UserOutlined />, label: <Link to="/dashboard/home">Home</Link> },
    { key: '2', icon: <LaptopOutlined />, label: <Link to="/dashboard/super-admin">Super Admin</Link> },
    { key: '3', icon: <NotificationOutlined />, label: <Link to="/dashboard/reports">Reports</Link> },
    { key: '4', icon: <NotificationOutlined />, label: <Link to="/dashboard/settings">Settings</Link> },
  ];

  const breadcrumbItems = [
    { title: 'Dashboard' },
    { title: 'Home' },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header className="header">
        <div className="logo" />
        <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['1']}>
          <Menu.Item key="1">Welcome, [Username]</Menu.Item>
          <Menu.Item key="2" style={{ marginLeft: 'auto' }}>Sign out</Menu.Item>
        </Menu>
      </Header>
      <Layout>
        <Sider width={200} className="site-layout-background" collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
          <Menu
            mode="inline"
            defaultSelectedKeys={['1']}
            defaultOpenKeys={['sub1']}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
          />
        </Sider>
        <Layout style={{ padding: '0 24px 24px' }}>
          <Breadcrumb style={{ margin: '16px 0' }} items={breadcrumbItems} />
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
              <Route path="super-admin" element={<SuperAdmin />} />
              <Route path="reports" element={<Reports />} />
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
