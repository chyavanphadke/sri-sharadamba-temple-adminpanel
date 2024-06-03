// src/components/Settings.js
import React from 'react';
import { Layout } from 'antd';

const { Content } = Layout;

const Settings = () => {
  return (
    <Layout>
      <Content style={{ padding: '0 50px' }}>
        <div className="site-layout-content">
          <h2>Settings Page</h2>
          <p>Placeholder for future settings.</p>
        </div>
      </Content>
    </Layout>
  );
};

export default Settings;
