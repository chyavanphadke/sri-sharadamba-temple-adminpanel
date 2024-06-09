// src/components/Calendar.js
import React from 'react';
import { Layout } from 'antd';

const { Content } = Layout;

const Calendar = () => {
  return (
    <Layout>
      <Content style={{ padding: '0 50px' }}>
        <div className="site-layout-content">
          <h2>Calendar Page</h2>
          <p>Placeholder for future Calendar.</p>
        </div>
      </Content>
    </Layout>
  );
};

export default Calendar;
