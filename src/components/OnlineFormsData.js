import React, { useEffect, useState } from 'react';
import { Layout, Table, Button, message, Modal, Input, Form, Checkbox, Row, Col } from 'antd';
import axios from 'axios';
import './OnlineFormsData.css'; // Ensure this path is correct

const { Content } = Layout;

const OnlineFormsData = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [amountModalVisible, setAmountModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [form] = Form.useForm();
  const [showAll, setShowAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const sheetServiceMap = {
    '1SBreZNZX4wYViXwvW3IswUamwkgkckPK-ZXjsi6BlU4': 269,
    '1PozePRRuSdileZroTCgZo-BDEhj0auXUgjDLA_uDvVI': 280,
    '16A2Lo0FmRiRBTdch8sB0UyJZlYv85oVANklAgatFTRQ': 270,
    '1_ze8hxIU_anFUZ4w2qsicU80DkxizuMW6KAciGt85eM': 281,
    '1RkYNyuYKL5-w6jyZU6gV5_hPUqGQZSpI4jx5-k_JldM': 51,
    '1fcdLPi-d6CFpnHZXL0ccWuXv-_FgXM-3-YZI92awuOc': 277
  };

  useEffect(() => {
    fetchExcelSevaData();
  }, []);

  const fetchExcelSevaData = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5001/excel-seva-data');
      const dataWithServiceId = response.data.map(entry => ({
        ...entry,
        ServiceId: sheetServiceMap[entry.sheet_name] || null
      }));
      const sortedData = dataWithServiceId.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setData(sortedData);
      filterData(sortedData, showAll, searchQuery);
    } catch (error) {
      console.error('Error fetching ExcelSevaData:', error);
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filterData = (data, showAll, query) => {
    const filtered = data.filter(entry => 
      (showAll || entry.payment_status !== 'Paid') && (
        entry.seva_id.toString().includes(query) ||
        entry.first_name.toLowerCase().includes(query.toLowerCase()) ||
        entry.last_name.toLowerCase().includes(query.toLowerCase()) ||
        entry.email.toLowerCase().includes(query.toLowerCase()) ||
        entry.phone.toLowerCase().includes(query.toLowerCase()) ||
        entry.status.toLowerCase().includes(query.toLowerCase()) ||
        entry.devotee_id.toString().includes(query) ||
        entry.date.toLowerCase().includes(query.toLowerCase()) ||
        entry.amount.toString().includes(query) ||
        entry.payment_status.toLowerCase().includes(query)
      )
    );
    setFilteredData(filtered);
  };

  const fetchSheetsData = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5001/fetch-sheets-data');
      message.success(response.data.message);
      fetchExcelSevaData();
    } catch (error) {
      console.error('Error fetching data from Google Sheets:', error);
      message.error('Error fetching data from Google Sheets');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleChange = (e) => {
    const checked = e.target.checked;
    setShowAll(checked);
    filterData(data, checked, searchQuery);
  };

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    filterData(data, showAll, query);
  };

  const handlePaidAtTemple = (record) => {
    setCurrentRecord(record);
    form.setFieldsValue({ amount: record.amount });
    setAmountModalVisible(true);
  };

  const handleDeleteService = async (record) => {
    try {
      await axios.delete(`http://localhost:5001/delete-entry/${record.id}`);
      message.success('Service deleted successfully');
      fetchExcelSevaData();
    } catch (error) {
      console.error('Error deleting service:', error);
      message.error('Failed to delete service');
    }
  };

  const handleUpdatePaymentStatus = async () => {
    try {
      const values = await form.validateFields();
      await axios.put(`http://localhost:5001/update-payment-status/${currentRecord.id}`, {
        amount: values.amount,
        paymentStatus: 'Paid'
      });
      message.success('Payment status updated successfully');
      setAmountModalVisible(false);
      fetchExcelSevaData();
    } catch (error) {
      console.error('Error updating payment status:', error);
      message.error('Failed to update payment status');
    }
  };

  const columns = [
    { title: 'Status', dataIndex: 'status', key: 'status', align: 'center' },
    { title: 'Devotee ID', dataIndex: 'devotee_id', key: 'devotee_id', align: 'center' },
    { title: 'Seva ID', dataIndex: 'seva_id', key: 'seva_id', align: 'center' },
    { title: 'Name', dataIndex: 'first_name', key: 'name', render: (text, record) => `${record.first_name} ${record.last_name}`, align: 'center' },
    { title: 'Email', dataIndex: 'email', key: 'email', align: 'center' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone', align: 'center' },
    { title: 'Date', dataIndex: 'date', key: 'date', align: 'center' },
    { 
      title: 'Service', 
      dataIndex: 'ServiceId', 
      key: 'service', 
      render: (text) => {
        const serviceMap = {
          269: 'Annadhanam',
          280: 'Pradosham',
          270: 'Rathothsavam',
          281: 'Sankashti',
          51: 'Satyanarayana Puja',
          277: 'Vastra'
        };
        return serviceMap[text] || 'Unknown Service';
      }, 
      align: 'center' 
    },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', align: 'center' },
    { 
      title: 'Payment Status', 
      dataIndex: 'payment_status', 
      key: 'payment_status', 
      render: (text, record) => text === 'Paid' ? 'Paid' : (
        <>
          <Button onClick={() => handlePaidAtTemple(record)} style={{ marginRight: 8 }}>Paid at Temple</Button>
          <Button onClick={() => handleDeleteService(record)} danger>Delete</Button>
        </>
      ),
      align: 'center'
    }
  ];

  return (
    <Layout>
      <Content>
        <div className="site-layout-content">
          <h2>Online Forms Data</h2>
          <Row style={{ marginBottom: 16 }}>
            <Col>
              <Button type="primary" onClick={fetchSheetsData} style={{ marginRight: 8 }}>Fetch Data from Sheets</Button>
              <Checkbox onChange={handleToggleChange}>Show All</Checkbox>
            </Col>
            <Col>
              <Input.Search
                placeholder="Search by any field"
                onChange={handleSearch}
                style={{ width: 400, marginLeft: 16 }}
              />
            </Col>
          </Row>
          <Table 
            columns={columns} 
            dataSource={filteredData} 
            loading={loading} 
            rowKey="id" 
            pagination={{ pageSize: 20 }} 
            scroll={{ x: '100%' }} 
          />
          <Modal
            title="Enter Amount"
            visible={amountModalVisible}
            onOk={handleUpdatePaymentStatus}
            onCancel={() => setAmountModalVisible(false)}
          >
            <Form form={form}>
              <Form.Item name="amount" label="Amount" rules={[{ required: true, message: 'Please enter the amount' }]}>
                <Input type="number" />
              </Form.Item>
            </Form>
          </Modal>
        </div>
      </Content>
    </Layout>
  );
};

export default OnlineFormsData;

