// src/components/Receipts.js
import React from 'react';
import { Layout } from 'antd';

const { Content } = Layout;

const Receipts = () => {
  return (
    <Layout>
      <Content style={{ padding: '0 50px' }}>
        <div className="site-layout-content">
          <h2>Receipts Page</h2>
          <p>Placeholder for future Receipts.</p>
        </div>
      </Content>
    </Layout>
  );
};

export default Receipts;
