// src/components/Reports.js

import React, { useState, useEffect } from 'react';
import { Layout, DatePicker, Select, Button, Table, message, Statistic, Row, Col } from 'antd';
import axios from 'axios';
import moment from 'moment';
import './Reports.css'; // Import the CSS file

const { Content } = Layout;
const { Option } = Select;

const Reports = () => {
  const [services, setServices] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedService, setSelectedService] = useState('All');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('All');
  const [startDate, setStartDate] = useState(moment().startOf('month'));
  const [endDate, setEndDate] = useState(moment().endOf('month'));
  const [reportData, setReportData] = useState([]);
  const [totalDevoteeCount, setTotalDevoteeCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isDonationToggled, setIsDonationToggled] = useState(false); // State to track donation button toggle
  const [isChecksToggled, setIsChecksToggled] = useState(false); // State to track checks button toggle
  const [activeFutureButton, setActiveFutureButton] = useState(null); // State to track active future use button
  const [donationServiceId, setDonationServiceId] = useState(null); // State to store donation service id
  const [checkPaymentMethodId, setCheckPaymentMethodId] = useState(null); // State to store check payment method id

  const token = localStorage.getItem('token');
  
  const axiosInstance = axios.create({
    baseURL: 'http://localhost:5001',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  useEffect(() => {
    fetchServices();
    fetchPaymentMethods();
    generateReport();
  }, []);

  useEffect(() => {
    console.log('Selected service:', isDonationToggled ? 'DONATION' : selectedService);
    console.log('Selected payment method:', isChecksToggled ? 'CHECKS' : selectedPaymentMethod);
    generateReport();
  }, [startDate, endDate, selectedService, selectedPaymentMethod, isDonationToggled, isChecksToggled]);

  const fetchServices = async () => {
    try {
      console.log('Fetching services...');
      const response = await axiosInstance.get('/services');
      console.log('Services response:', response.data);
      const servicesData = response.data;
      const donationService = servicesData.find(service => service.Service === 'DONATION');
      if (donationService) {
        setDonationServiceId(donationService.ServiceId);
      }
      setServices(servicesData.filter(service => service.Service !== 'DONATION'));
    } catch (error) {
      console.error('Error fetching services:', error);
      message.error('Error fetching services');
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      console.log('Fetching payment methods...');
      const response = await axiosInstance.get('/payment-methods');
      console.log('Payment methods response:', response.data);
      const paymntData = response.data;
      const checkMethod = paymntData.find(method => method.MethodName === 'Check');
      if (checkMethod) {
        setCheckPaymentMethodId(checkMethod.PaymentMethodId);
      }
      setPaymentMethods(paymntData.filter(method => method.MethodName !== 'Check'));
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      message.error('Error fetching payment methods');
    }
  };

  const generateReport = async () => {
    try {
      let serviceParam = null;
      let excludeDonations = false;
      let paymentMethodParam = null;
      let excludeChecks = false;

      if (isDonationToggled) {
        serviceParam = donationServiceId;
      } else if (selectedService === 'All but Donations') {
        excludeDonations = true;
      } else if (selectedService !== 'All') {
        serviceParam = selectedService;
      }

      if (isChecksToggled) {
        paymentMethodParam = checkPaymentMethodId;
      } else if (selectedPaymentMethod === 'All but Checks') {
        excludeChecks = true;
      } else if (selectedPaymentMethod !== 'All') {
        paymentMethodParam = selectedPaymentMethod;
      }

      const params = {
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
        service: serviceParam,
        excludeDonations: excludeDonations,
        paymentMethod: paymentMethodParam,
        excludeChecks: excludeChecks
      };

      const response = await axiosInstance.get('/reports', { params });
      setReportData(response.data);

      // Calculate totals
      const totalDevotees = response.data.length;
      const totalAmt = response.data.reduce((sum, record) => sum + record.Amount, 0);
      setTotalDevoteeCount(totalDevotees);
      setTotalAmount(totalAmt);
    } catch (error) {
      message.error('Error generating report');
    }
  };

  const handleDonationToggle = () => {
    setIsDonationToggled(!isDonationToggled); // Toggle Donation button
  };

  const handleChecksToggle = () => {
    setIsChecksToggled(!isChecksToggled); // Toggle Checks button
  };

  const handleServiceChange = (value) => {
    if (isDonationToggled) {
      setIsDonationToggled(false); // Turn off donation toggle if a service is selected
    }
    setSelectedService(value);
  };

  const handlePaymentMethodChange = (value) => {
    if (isChecksToggled) {
      setIsChecksToggled(false); // Turn off checks toggle if a payment method is selected
    }
    setSelectedPaymentMethod(value);
  };

  const handleButtonClick = (buttonName) => {
    if (buttonName === 'Donations') {
      handleDonationToggle();
      setActiveFutureButton(null); // Reset active future button state
    } else if (buttonName === 'Checks') {
      handleChecksToggle();
      setActiveFutureButton(null); // Reset active future button state
    } else {
      setActiveFutureButton(prevState => (prevState === buttonName ? null : buttonName)); // Toggle future button state
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'Name', key: 'name' },
    { title: 'Phone', dataIndex: 'Phone', key: 'phone' },
    { title: 'Service', dataIndex: 'Service', key: 'service' },
    { title: 'Amount', dataIndex: 'Amount', key: 'amount' },
    { title: 'Date', dataIndex: 'Date', key: 'date' },
    { title: 'Payment Method', dataIndex: 'Payment Method', key: 'paymentMethod' },
    { title: 'Check Number', dataIndex: 'Check Number', key: 'CheckNumber' },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <>
          <Button onClick={() => message.info('Re-print button is clicked')}>Re-print</Button>
          <Button onClick={() => message.info('Re-email button is clicked')}>Re-email</Button>
        </>
      )
    }
  ];

  const disabledEndDate = (current) => {
    return current && current < startDate.startOf('day');
  };

  // Highlight conditions
  const isServiceHighlighted = !isDonationToggled && activeFutureButton === null;
  const isPaymentMethodHighlighted = !isChecksToggled && activeFutureButton === null;

  return (
    <Layout>
      <Content >
        <div className="site-layout-content">
          <h2>Reports Page</h2>
          <Row gutter={16}>
            <Col>
              <div>Start Date</div>
              <DatePicker
                defaultValue={startDate}
                onChange={(date) => setStartDate(date)}
                style={{ marginRight: 10, width: 250 }}
              />
            </Col>
            <Col>
              <div>End Date</div>
              <DatePicker
                defaultValue={endDate}
                onChange={(date) => setEndDate(date)}
                disabledDate={disabledEndDate}
                style={{ marginRight: 10, width: 250 }}
              />
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 20 }}>
            <Col>
              <div className={isServiceHighlighted ? 'highlight-label' : ''}>Service</div>
              <Select
                className={isServiceHighlighted ? 'highlight-dropdown' : ''}
                defaultValue="All"
                style={{ width: 200, marginRight: 10, marginTop: 10 }}
                onChange={handleServiceChange}
                value={selectedService} // Add value to control the component
                disabled={activeFutureButton !== null} // Disable if any future button is active
              >
                <Option value="All">All</Option>
                <Option value="All but Donations">All but Donations</Option>
                {services.map(service => (
                  <Option 
                    key={service.ServiceId} 
                    value={service.ServiceId} 
                    className={isServiceHighlighted && selectedService === service.ServiceId ? 'highlight-value' : ''}
                  >
                    {service.Service}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col>
              <Button 
                onClick={() => handleButtonClick('Donations')}
                className={isDonationToggled ? 'toggle-button' : ''} // Apply CSS class if toggled
                style={{ marginTop: 28 }} // Align with dropdowns
                disabled={activeFutureButton !== null} // Disable if any future button is active
              >
                Donations
              </Button>
            </Col>
            <Col>
              <div className={isPaymentMethodHighlighted ? 'highlight-label' : ''}>Payment Method</div>
              <Select
                className={isPaymentMethodHighlighted ? 'highlight-dropdown' : ''}
                defaultValue="All"
                style={{ width: 200, marginRight: 10, marginTop: 10 }}
                value={selectedPaymentMethod} // Add value to control the component
                onChange={handlePaymentMethodChange}
                disabled={activeFutureButton !== null} // Disable if any future button is active
              >
                <Option value="All">All</Option>
                <Option value="All but Checks">All but Checks</Option>
                {paymentMethods.map(method => (
                  <Option 
                    key={method.PaymentMethodId} 
                    value={method.PaymentMethodId}
                    className={isPaymentMethodHighlighted && selectedPaymentMethod === method.PaymentMethodId ? 'highlight-value' : ''}
                  >
                    {method.MethodName}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col>
              <Button 
                onClick={() => handleButtonClick('Checks')} 
                className={isChecksToggled ? 'toggle-button' : ''} // Apply CSS class if toggled
                style={{ marginTop: 28 }} // Align with dropdowns
                disabled={activeFutureButton !== null} // Disable if any future button is active
              >
                Checks
              </Button>
            </Col>
            <Col>
              <Button 
                onClick={() => handleButtonClick('Memberships')} 
                className={activeFutureButton === 'Memberships' ? 'toggle-button' : ''} 
                style={{ marginTop: 28 }}
              >
                Memberships
              </Button>
            </Col>
            <Col>
              <Button 
                onClick={() => handleButtonClick('Pledges')} 
                className={activeFutureButton === 'Pledges' ? 'toggle-button' : ''} 
                style={{ marginTop: 28 }}
              >
                Pledges
              </Button>
            </Col>
            <Col>
              <Button 
                onClick={() => handleButtonClick('Sales')} 
                className={activeFutureButton === 'Sales' ? 'toggle-button' : ''} 
                style={{ marginTop: 28 }}
              >
                Sales
              </Button>
            </Col>
          </Row>
          {activeFutureButton ? (
            <div className="message-placeholder">
              This feature is coming soon! Currently, no data is available.
            </div>
          ) : (
            <>
              <Row gutter={16} style={{ marginTop: 20 }}>
                <Col span={12}>
                  <Statistic title="Total Devotee Count" value={totalDevoteeCount} />
                </Col>
                <Col span={12}>
                  <Statistic title="Total Amount" value={totalAmount} precision={2} />
                </Col>
              </Row>
              <Table
                columns={columns}
                dataSource={reportData}
                rowKey={record => record.id}
                style={{ marginTop: 20 }}
              />
            </>
          )}
        </div>
      </Content>
    </Layout>
  );
};

export default Reports;
