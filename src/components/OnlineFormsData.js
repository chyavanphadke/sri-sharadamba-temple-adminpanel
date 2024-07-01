import React, { useState, useEffect } from 'react';
import { Layout, Table, Button, message, Popconfirm, Modal, Input } from 'antd';
import axios from 'axios';

const { Content } = Layout;

const OnlineFormsData = () => {
  const [rowData, setRowData] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [amount, setAmount] = useState('');

  const fetchAndStoreData = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/fetch-data');
      const { newEntriesCount } = response.data;
      if (newEntriesCount === 0) {
        message.success('Fetched Successfully, No new Entries');
      } else {
        message.success(`${newEntriesCount} entries fetched Successfully`);
      }
      fetchDataFromSQL();
    } catch (error) {
      console.error('Error fetching data from Google Sheets:', error);
      message.error('Error fetching data from Google Sheets.');
    }
  };

  const fetchDataFromSQL = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/excel-seva-data');
      setRowData(response.data);
    } catch (error) {
      console.error('Error fetching data from SQL:', error);
      message.error('Error fetching data from SQL.');
    }
  };

  const handlePaid = (record) => {
    setSelectedRecord(record);
    setIsModalVisible(true);
  };

  const handlePaidSubmit = async () => {
    try {
      await axios.put(`http://localhost:5001/api/update-payment-status/${selectedRecord.id}`, { status: `Paid ($${amount})` });
      message.success('Payment status updated to Paid');
      setIsModalVisible(false);
      setAmount('');
      fetchDataFromSQL();
    } catch (error) {
      console.error('Error updating payment status:', error);
      message.error('Error updating payment status.');
    }
  };

  const handleDelete = async (record) => {
    try {
      await axios.delete(`http://localhost:5001/api/delete-entry/${record.id}`);
      message.success('Entry deleted successfully');
      fetchDataFromSQL();
    } catch (error) {
      console.error('Error deleting entry:', error);
      message.error('Error deleting entry.');
    }
  };

  useEffect(() => {
    fetchDataFromSQL();
  }, []);

  const columns = [
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'Devotee Id',
      dataIndex: 'devotee_id',
      key: 'devotee_id',
    },
    {
      title: 'Seva Id',
      dataIndex: 'seva_id',
      key: 'seva_id',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => `${record.first_name} ${record.last_name}`,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Seva',
      dataIndex: 'sheet_name',
      key: 'sheet_name',
    },
    {
      title: 'Seva Date',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Message to Priest',
      dataIndex: 'message',
      key: 'message',
    },
    {
      title: 'Payment Status',
      dataIndex: 'payment_status',
      key: 'payment_status',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <div>
          {record.payment_status === 'Pay at the Temple' && (
            <Button
              style={{ marginRight: '8px', backgroundColor: '#1890ff', color: '#fff' }}
              onClick={() => handlePaid(record)}
            >
              Paid
            </Button>
          )}
          <Popconfirm
            title="Are you sure you want to delete this entry?"
            onConfirm={() => handleDelete(record)}
            okText="Yes"
            cancelText="No"
          >
            <Button style={{ backgroundColor: '#ff4d4f', color: '#fff' }}>Delete</Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <Content style={{ padding: '0 24px', minHeight: 280 }}>
      <h1>Online Forms Data</h1>
      <Button onClick={fetchAndStoreData} style={{ marginBottom: '16px' }}>Fetch Data</Button>
      <Table columns={columns} dataSource={rowData} rowKey={(record, index) => index} />

      <Modal
        title="Enter Payment Amount"
        visible={isModalVisible}
        onOk={handlePaidSubmit}
        onCancel={() => setIsModalVisible(false)}
      >
        <Input
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </Modal>
    </Content>
  );
};

export default OnlineFormsData;
