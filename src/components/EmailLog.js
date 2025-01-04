import React, { useEffect, useState } from 'react';
import { Table, Spin, Alert } from 'antd';

const EmailLog = () => {
  const [emailLogs, setEmailLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEmailLogs = async () => {
      try {
        const response = await fetch('http://localhost:5001/email-logs');
        if (!response.ok) {
          throw new Error('Failed to fetch email logs.');
        }
        const data = await response.json();
        setEmailLogs(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEmailLogs();
  }, []);

  const formatDate = (dateString) => {
    const logDate = new Date(dateString);
    const today = new Date();

    // Check if logDate is today's date
    if (
      logDate.getDate() === today.getDate() &&
      logDate.getMonth() === today.getMonth() &&
      logDate.getFullYear() === today.getFullYear()
    ) {
      return 'Today';
    }

    // Format date as "Dec 31, 2024"
    return logDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'log_datetime',
      key: 'log_datetime',
      render: (text) => formatDate(text),
      sorter: (a, b) => new Date(b.log_datetime) - new Date(a.log_datetime),
      align: 'center',
    },
    {
      title: 'Time',
      dataIndex: 'log_datetime',
      key: 'time',
      render: (text) => new Date(text).toLocaleTimeString(),
      align: 'center',
    },
    {
      title: 'Module',
      dataIndex: 'module',
      key: 'Module',
      align: 'center',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (text) => (text === 'Sent' ? '✅ Sent' : '❌ Error'),
      align: 'center',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => (text ? text : 'N/A'),
      align: 'center',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      align: 'center',
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      align: 'center',
    },
  ];

  return (
    <div>
      <h2>Email Log</h2>
      {error && <Alert type="error" message={error} />}
      {loading ? (
        <Spin size="large" />
      ) : (
        <Table
          dataSource={emailLogs}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 50 }}
        />
      )}
    </div>
  );
};

export default EmailLog;
