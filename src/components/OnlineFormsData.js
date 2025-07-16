import React, { useEffect, useState } from 'react';
import { Layout, Table, Button, message, Modal, Input, Form, Checkbox, Row, Col, Select } from 'antd';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import './OnlineFormsData.css'; // Ensure this path is correct
import BACKEND_BASE_URL from '../ipConfiguration';

const { Content } = Layout;

const OnlineFormsData = () => {
  // State to store fetched data and filtered data
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false); // State to manage loading indicator
  const [amountModalVisible, setAmountModalVisible] = useState(false); // State to control the visibility of the amount modal
  const [currentRecord, setCurrentRecord] = useState(null); // State to store the currently selected record for payment status update
  const [form] = Form.useForm(); // Ant Design form instance
  const [showAll, setShowAll] = useState(false); // State to toggle showing all records or only unpaid records
  const [searchQuery, setSearchQuery] = useState(''); // State to store the search query
  const [sheetServiceMap, setSheetServiceMap] = useState({}); // State to store the service map
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(3); // Default to PaymentMethodId = 3
  
  // Fetch service map and Excel Seva data on component mount
  useEffect(() => {
    fetchServiceMap();
    fetchExcelSevaData();
    fetchPaymentMethods();
  }, []);

  // Fetch the service map data from the server
  const fetchServiceMap = async () => {
    try {
      const response = await axios.get(`${BACKEND_BASE_URL}/services`);
      const serviceMap = response.data.reduce((map, service) => {
        if (service.excelSheetLink) {
          map[service.excelSheetLink] = service.ServiceId;
        }
        return map;
      }, {});
      setSheetServiceMap(serviceMap);
    } catch (error) {
      message.error('Failed to load service map');
    }
  };

  // Fetch Excel Seva data from the server
  const fetchExcelSevaData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BACKEND_BASE_URL}/excel-seva-data`);
      const dataWithServiceName = response.data.map(entry => ({
        ...entry,
        serviceName: entry.Service ? entry.Service.Service : 'Unknown Service'
        
      }));
      const sortedData = dataWithServiceName.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setData(sortedData);
      filterData(sortedData, showAll, searchQuery);
      console.log('Fetched Excel Seva data');
    } catch (error) {
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Filter the data based on search query and showAll flag
  const filterData = (data, showAll, query) => {
    const lowerCaseQuery = query.toLowerCase();
    const filtered = data.filter(entry => 
      (showAll || (entry.payment_status.toLowerCase() !== 'paid at temple' && entry.payment_status.toLowerCase() !== 'paid' && entry.payment_status.toLowerCase() !== 'benevity')) && (
        entry.seva_id.toString().includes(lowerCaseQuery) ||
        `${entry.first_name.toLowerCase()} ${entry.last_name.toLowerCase()}`.includes(lowerCaseQuery) ||
        entry.email.toLowerCase().includes(lowerCaseQuery) ||
        entry.phone.toLowerCase().includes(lowerCaseQuery) ||
        entry.status.toLowerCase().includes(lowerCaseQuery) ||
        entry.devotee_id.toString().includes(lowerCaseQuery) ||
        entry.date.toLowerCase().includes(lowerCaseQuery) ||
        entry.amount.toString().includes(lowerCaseQuery) ||
        entry.payment_status.toLowerCase().includes(lowerCaseQuery)
      )
    );
    setFilteredData(filtered);
  };

  // Fetch data from Google Sheets
  const fetchSheetsData = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${BACKEND_BASE_URL}/fetch-sheets-data`);
      message.success(response.data.message);
      fetchExcelSevaData();
      console.log('Fetched data from Google Sheets');
    } catch (error) {
      message.error('Error fetching data from Google Sheets');
    } finally {
      setLoading(false);
    }
  };

  // Handle the toggle change for showing all records
  const handleToggleChange = (e) => {
    const checked = e.target.checked;
    setShowAll(checked);
    filterData(data, checked, searchQuery);
  };

  // Handle the search input change
  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    filterData(data, showAll, query);
  };

  // Handle the action of marking a service as paid at the temple
  const handlePaidAtTemple = (record) => {
    setCurrentRecord(record);
    form.setFieldsValue({ amount: record.amount });
    setAmountModalVisible(true);
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await axios.get(`${BACKEND_BASE_URL}/payment-methods`);
      setPaymentMethods(response.data);
    } catch (error) {
      message.error('Failed to load payment methods');
    }
  };  

  // Handle the deletion of a service entry
  const handleDeleteService = (record) => {
    Modal.confirm({
      title: 'Confirm Deletion',
      content: 'Are you sure you want to delete this service?',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await axios.delete(`${BACKEND_BASE_URL}/delete-entry/${record.id}`);
          message.success('Service deleted successfully');
          fetchExcelSevaData();
          console.log('Deleted service and refreshed data');
        } catch (error) {
          message.error('Failed to delete service');
        }
      }
    });
  };

  // Handle the update of payment status
  const handleUpdatePaymentStatus = async () => {
    try {
      const values = await form.validateFields();
  
      const token = localStorage.getItem('token');
      const decodedToken = jwtDecode(token);
      const userId = decodedToken.userid;
  
      // Find the selected payment method name
      const selectedMethod = paymentMethods.find(method => method.PaymentMethodId === selectedPaymentMethod);
      const paymentMethodName = selectedMethod ? selectedMethod.MethodName : 'Unknown';
  
      await axios.put(`${BACKEND_BASE_URL}/update-payment-status/${currentRecord.id}`, {
        amount: values.amount,
        paymentStatus: 'Paid at temple',
        userId: userId,
        createdAt: currentRecord.createdAt,
        paymentStatusReal: paymentMethodName,
        checkNumber: selectedPaymentMethod === 2 ? values.checkNumber : null, // Pass CheckNumber if applicable
      });
  
      message.success('Payment status updated successfully');
      setAmountModalVisible(false);
      fetchExcelSevaData();
    } catch (error) {
      message.error('Failed to update payment status');
    }
  };  

  // Define the columns for the data table
  const columns = [
    { title: 'Status', dataIndex: 'status', key: 'status', align: 'center' },
    { title: 'Devotee ID', dataIndex: 'devotee_id', key: 'devotee_id', align: 'center' },
    { title: 'Seva ID', dataIndex: 'seva_id', key: 'seva_id', align: 'center' },
    { title: 'Name', dataIndex: 'first_name', key: 'name', render: (text, record) => `${record.first_name} ${record.last_name}`, align: 'center' },
    { title: 'Email', dataIndex: 'email', key: 'email', align: 'center' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone', align: 'center' },
    { title: 'Date', dataIndex: 'date', key: 'date', align: 'center' },
    { title: 'Service', dataIndex: 'serviceName', key: 'service', align: 'center' },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', align: 'center' },
    { 
      title: 'Payment Status', 
      dataIndex: 'payment_status', 
      key: 'payment_status', 
      align: 'center',
      render: (text, record) => {
        if (record.payment_status === 'Paid') {
          return 'Paid Online';
        } else if (record.payment_status === 'At-Temple') {
          return 'To be Paid';
        } else if (record.payment_status === 'Benevity') {
          return 'Paid via Benevity';
        } else {
          return record.payment_status;
        }
      },
    },
    { 
      title: 'Actions', 
      key: 'actions', 
      render: (text, record) => (record.payment_status === 'Paid at temple' || record.payment_status === 'Paid' || record.payment_status === 'Benevity') ? 'Paid' : (
        <>
          <Button onClick={() => handlePaidAtTemple(record)} style={{ marginRight: 8 }}>Confirm Payment</Button>
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
              <Form.Item 
                name="amount" 
                label="Amount" 
                rules={[{ required: true, message: 'Please enter the amount' }]}
              >
                <Input type="number" />
              </Form.Item>
              <Form.Item 
                name="paymentMethod" 
                label="Mode of Payment" 
                initialValue={3} // Default PaymentMethodId = 3
                rules={[{ required: true, message: 'Please select a payment method' }]}
              >
                <Select 
                  onChange={(value) => setSelectedPaymentMethod(value)} 
                  options={paymentMethods.map(method => ({ value: method.PaymentMethodId, label: method.MethodName }))}
                />
              </Form.Item>
              {selectedPaymentMethod === 2 && ( // Show Check Number field only if PaymentMethodId is 2
                <Form.Item
                  name="checkNumber"
                  label="Check Number"
                  rules={[{ required: true, message: 'Please enter the check number' }]}
                >
                  <Input placeholder="Enter Check Number" />
                </Form.Item>
              )}
            </Form>
          </Modal>
        </div>
      </Content>
    </Layout>
  );
};

export default OnlineFormsData;
