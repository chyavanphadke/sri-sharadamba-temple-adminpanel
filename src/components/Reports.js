import React, { useState, useEffect } from 'react';
import { Layout, Select, Button, Table, message, Statistic, Row, Col, AutoComplete, Modal, Input, Tooltip } from 'antd';
import axios from 'axios';
import moment from 'moment';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import banner from '../assets/banner.webp'; // Adjust the path as needed
import './Reports.css'; // Import the CSS file

const { Content } = Layout;
const { Option } = Select;

const Reports = () => {
  const [services, setServices] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedService, setSelectedService] = useState('All');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('All');
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1)); // Jan 1st of current year
  const [endDate, setEndDate] = useState(new Date()); // Today
  const [reportData, setReportData] = useState([]);
  const [totalDevoteeCount, setTotalDevoteeCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [devoteeOptions, setDevoteeOptions] = useState([]);
  const [selectedDevoteeId, setSelectedDevoteeId] = useState(null);
  const [selectedDevoteeName, setSelectedDevoteeName] = useState(''); // New state for selected devotee's name
  const [isEmailModalVisible, setIsEmailModalVisible] = useState(false); // State for email modal
  const [currentRecord, setCurrentRecord] = useState(null); // State for current record
  const [email, setEmail] = useState(''); // State for email
  const [name, setName] = useState(''); // State for name
  const [isEmailAllModalVisible, setIsEmailAllModalVisible] = useState(false); // State for email all modal
  const [emailAll, setEmailAll] = useState(''); // State for email all
  const [emailAllDevoteeName, setEmailAllDevoteeName] = useState(''); // State for email all devotee name

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
    generateReport();
  }, [startDate, endDate, selectedService, selectedPaymentMethod, selectedDevoteeId]);

  const fetchServices = async () => {
    try {
      const response = await axiosInstance.get('/services');
      setServices(response.data);
    } catch (error) {
      message.error('Error fetching services');
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await axiosInstance.get('/payment-methods');
      setPaymentMethods(response.data);
    } catch (error) {
      message.error('Error fetching payment methods');
    }
  };

  const generateReport = async () => {
    try {
      let serviceParam = selectedService !== 'All' ? selectedService : null;
      let paymentMethodParam = selectedPaymentMethod !== 'All' ? selectedPaymentMethod : null;

      const params = {
        startDate: moment(startDate).format('YYYY-MM-DD'),
        endDate: moment(endDate).format('YYYY-MM-DD'),
        service: serviceParam,
        paymentMethod: paymentMethodParam,
        devoteeId: selectedDevoteeId
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

  const handleServiceChange = (value) => {
    setSelectedService(value);
  };

  const handlePaymentMethodChange = (value) => {
    setSelectedPaymentMethod(value);
  };

  const handleSearchChange = async (value) => {
    setSearchQuery(value);
    setSelectedDevoteeName(value); // Update selected devotee name on search change
    if (value) {
      try {
        const response = await axiosInstance.get('/devotees/search', { params: { query: value } });
        const options = response.data.map(devotee => ({
          value: devotee.DevoteeId,
          label: `${devotee.FirstName} ${devotee.LastName}`
        }));
        setDevoteeOptions(options);
      } catch (error) {
        message.error('Error fetching devotee names');
      }
    } else {
      setDevoteeOptions([]);
      setSelectedDevoteeId(null); // Reset selected devotee ID when search is cleared
      generateReport(); // Regenerate report to default state
    }
  };

  const handleDevoteeSelect = (value, option) => {
    setSelectedDevoteeId(value);
    setSelectedDevoteeName(option.label); // Update selected devotee name on selection
  };

  const handleRePrint = (record) => {
    const doc = new jsPDF();
    const totalAmount = record.Amount;

    const img = new Image();
    img.src = banner;
    img.onload = () => {
      doc.addImage(img, 'WEBP', 10, 10, 190, 30); // Adjust the size and position as needed

      // Add header text
      doc.setFontSize(18);
      doc.text('All Transactions', 14, 48);
      doc.setFontSize(10);
      doc.text(`Date From: ${moment(startDate).format('MMMM D, YYYY')} To: ${moment(endDate).format('MMMM D, YYYY')}`, 14, 55);

      // Add transaction details
      doc.setFontSize(14);
      doc.text('Transaction Details', 14, 70);

      doc.setFontSize(10);
      doc.autoTable({
        startY: 80,
        head: [['Name', 'Phone', 'Service', 'Amount', 'Date', 'Payment Method']],
        body: [
          [record.Name, record.Phone, record.Service, `$${record.Amount}`, moment(record.Date).format('MMMM D, YYYY'), record['Payment Method']],
        ],
      });

      // Add totals
      const finalY = doc.lastAutoTable.finalY || 70;
      doc.setFontSize(10);
      doc.text(`Total Amount: $${totalAmount}`, 14, finalY + 10);

      // Add footer with date and page number
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
        doc.text(`Date: ${moment().format('MMMM D, YYYY')}`, 14, doc.internal.pageSize.height - 10);
      }

      const pdfURL = doc.output('bloburl');
      window.open(pdfURL);
    };
  };

  const handlePrintAll = () => {
    const doc = new jsPDF();
    const totalAmount = reportData.reduce((sum, record) => sum + record.Amount, 0);

    const img = new Image();
    img.src = banner;
    img.onload = () => {
      doc.addImage(img, 'WEBP', 10, 10, 190, 30); // Adjust the size and position as needed

      // Add header text
      doc.setFontSize(18);
      doc.text('All Transactions', 14, 48);
      doc.setFontSize(10);
      doc.text(`Date From: ${moment(startDate).format('MMMM D, YYYY')} To: ${moment(endDate).format('MMMM D, YYYY')}`, 14, 55);

      // Add transaction details
      doc.setFontSize(14);
      doc.text('Transaction Details', 14, 70);

      doc.setFontSize(10);
      doc.autoTable({
        startY: 80,
        head: [['Name', 'Phone', 'Service', 'Amount', 'Date', 'Payment Method']],
        body: reportData.map(record => [
          record.Name,
          record.Phone,
          record.Service,
          `$${record.Amount}`,
          moment(record.Date).format('MMMM D, YYYY'),
          record['Payment Method']
        ]),
        theme: 'striped',
        styles: { fontSize: 10 }
      });

      // Add totals
      const finalY = doc.lastAutoTable.finalY || 70;
      doc.setFontSize(10);
      doc.text(`Total Amount: $${totalAmount}`, 14, finalY + 10);

      // Add footer with date and page number
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 20, { align: 'center' });
        doc.text(`Date: ${moment().format('MMMM D, YYYY')}`, 14, doc.internal.pageSize.height - 20);
      }

      const pdfURL = doc.output('bloburl');
      window.open(pdfURL);
    };
  };

  const handlePrintByName = () => {
    const groupedData = reportData.reduce((acc, record) => {
      if (!acc[record.Name]) acc[record.Name] = [];
      acc[record.Name].push(record);
      return acc;
    }, {});

    const sortedNames = Object.keys(groupedData).sort();

    const doc = new jsPDF();
    const img = new Image();
    img.src = banner;

    img.onload = () => {
      doc.addImage(img, 'WEBP', 10, 10, 190, 30); // Adjust the size and position as needed

      // Add header text only on the first page
      doc.setFontSize(18);
      doc.text('All Transactions', 14, 48);
      doc.setFontSize(10);
      doc.text(`Date From: ${moment(startDate).format('MMMM D, YYYY')} To: ${moment(endDate).format('MMMM D, YYYY')}`, 14, 55);

      let finalY = 70; // Start position after banner and header text

      sortedNames.forEach((name, index) => {
        const records = groupedData[name];
        const totalAmount = records.reduce((sum, record) => sum + record.Amount, 0);

        // Ensure devotee details fit on one page, start on a new page if not
        const pageHeight = doc.internal.pageSize.height;
        const startY = finalY + 10;
        const tableHeight = records.length * 10 + 10; // Approximate height calculation

        if (startY + tableHeight > pageHeight - 30) { // Ensure there's space for footer
          doc.addPage();
          finalY = 30; // Reset Y position for new page
        }

        doc.setFontSize(10);
        
        doc.autoTable({
          startY: finalY,
          head: [['Name', 'Phone', 'Service', 'Amount', 'Date', 'Payment Method']],
          body: records.map(record => [
            record.Name,
            record.Phone,
            record.Service,
            `$${record.Amount}`,
            moment(record.Date).format('MMMM D, YYYY'),
            record['Payment Method']
          ]),
          theme: 'striped',
          styles: { fontSize: 10 },
          margin: { top: 10 },
        });

        finalY = doc.lastAutoTable.finalY + 5;

        // Add totals and horizontal line
        doc.setFontSize(10);
        doc.text(`Total Amount: $${totalAmount}`, 14, finalY + 5);
        finalY += 10;

        doc.setDrawColor(192, 192, 192); // Gray color
        doc.setLineWidth(0.5);
        doc.line(14, finalY, 196, finalY); // Adjusted horizontal line to match table width
        finalY += 10;
      });

      // Add footer with date and page number
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 20, { align: 'center' });
        doc.text(`Date: ${moment().format('MMMM D, YYYY')}`, 14, doc.internal.pageSize.height - 20);
      }

      const pdfURL = doc.output('bloburl');
      window.open(pdfURL);
    };
  };

  const handleReEmail = async (record) => {
    try {
      const response = await axiosInstance.get(`/devotee/${record.DevoteeId}`);
      const { FirstName, LastName, Email } = response.data;
      setName(`${FirstName} ${LastName}`);
      setEmail(Email);
      setCurrentRecord(record);
      setIsEmailModalVisible(true);
    } catch (error) {
      message.error('Error fetching devotee details');
    }
  };

  const handleEmailSend = async () => {
    const doc = new jsPDF();
    const totalAmount = currentRecord.Amount;

    const img = new Image();
    img.src = banner;
    img.onload = async () => {
      doc.addImage(img, 'WEBP', 10, 10, 190, 30); // Adjust the size and position as needed

      // Add header text
      doc.setFontSize(18);
      doc.text('All Transactions', 14, 48);
      doc.setFontSize(10);
      doc.text(`Date From: ${moment(startDate).format('MMMM D, YYYY')} To: ${moment(endDate).format('MMMM D, YYYY')}`, 14, 55);

      // Add transaction details
      doc.setFontSize(14);
      doc.text('Transaction Details', 14, 70);

      doc.setFontSize(10);
      doc.autoTable({
        startY: 80,
        head: [['Name', 'Phone', 'Service', 'Amount', 'Date', 'Payment Method']],
        body: [
          [currentRecord.Name, currentRecord.Phone, currentRecord.Service, `$${currentRecord.Amount}`, moment(currentRecord.Date).format('MMMM D, YYYY'), currentRecord['Payment Method']],
        ],
      });

      // Add totals
      const finalY = doc.lastAutoTable.finalY || 70;
      doc.setFontSize(10);
      doc.text(`Total Amount: $${totalAmount}`, 14, finalY + 10);

      const pdfBlob = doc.output('blob');

      const formData = new FormData();
      formData.append('email', email);
      formData.append('Name', currentRecord.Name);
      formData.append('startDate', moment(startDate).format('MMMM D, YYYY'));
      formData.append('endDate', moment(endDate).format('MMMM D, YYYY'));
      formData.append('pdf', new Blob([pdfBlob], { type: 'application/pdf' }), `report_${currentRecord.DevoteeId}_${currentRecord.Name}.pdf`);

      try {
        await axiosInstance.post('/send-report-email', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        message.success(`Email sent to ${name}`);
      } catch (error) {
        message.error('Failed to send report via email');
      }

      setIsEmailModalVisible(false);
    };
  };

  const handleEmailAll = () => {
    const groupedData = reportData.reduce((acc, record) => {
      if (!acc[record.DevoteeId]) acc[record.DevoteeId] = [];
      acc[record.DevoteeId].push(record);
      return acc;
    }, {});

    const devoteeIds = Object.keys(groupedData);
    if (devoteeIds.length === 1) {
      // Single devotee case
      const singleDevoteeData = groupedData[devoteeIds[0]];
      const { Name, DevoteeId } = singleDevoteeData[0];

      axiosInstance.get(`/devotee/${DevoteeId}`).then(response => {
        const { Email } = response.data;
        setEmailAll(Email);
        setEmailAllDevoteeName(Name);
        setIsEmailAllModalVisible(true);
      }).catch(error => {
        message.error('Error fetching devotee details');
      });
    } else {
      // Multiple devotees case
      setEmailAll('');
      setIsEmailAllModalVisible(true);
    }
  };

  const handleEmailAllSend = async () => {
    const doc = new jsPDF();
    const img = new Image();
    img.src = banner;

    img.onload = async () => {
      doc.addImage(img, 'WEBP', 10, 10, 190, 30); // Adjust the size and position as needed

      // Add header text
      doc.setFontSize(18);
      doc.text('All Transactions', 14, 48);
      doc.setFontSize(10);
      doc.text(`Date From: ${moment(startDate).format('MMMM D, YYYY')} To: ${moment(endDate).format('MMMM D, YYYY')}`, 14, 55);

      doc.setFontSize(14);
      doc.text('Transaction Details', 14, 70);

      doc.setFontSize(10);
      doc.autoTable({
        startY: 80,
        head: [['Name', 'Phone', 'Service', 'Amount', 'Date', 'Payment Method']],
        body: reportData.map(record => [
          record.Name,
          record.Phone,
          record.Service,
          `$${record.Amount}`,
          moment(record.Date).format('MMMM D, YYYY'),
          record['Payment Method']
        ]),
        theme: 'striped',
        styles: { fontSize: 10 }
      });

      // Add totals
      const finalY = doc.lastAutoTable.finalY || 70;
      doc.setFontSize(10);
      doc.text(`Total Amount: $${totalAmount}`, 14, finalY + 10);

      const pdfBlob = doc.output('blob');

      const formData = new FormData();
      formData.append('email', emailAll);
      formData.append('Name', emailAllDevoteeName || 'Recipient');
      formData.append('startDate', moment(startDate).format('MMMM D, YYYY'));
      formData.append('endDate', moment(endDate).format('MMMM D, YYYY'));
      formData.append('pdf', new Blob([pdfBlob], { type: 'application/pdf' }), `report_all_transactions.pdf`);

      try {
        await axiosInstance.post('/send-report-email', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        message.success('Email sent');
      } catch (error) {
        message.error('Failed to send report via email');
      }

      setIsEmailAllModalVisible(false);
    };
  };

  const columns = [
    { title: 'Name', dataIndex: 'Name', key: 'name' },
    { title: 'Phone', dataIndex: 'Phone', key: 'phone' },
    { title: 'Service', dataIndex: 'Service', key: 'service' },
    { 
      title: 'Amount', 
      dataIndex: 'Amount', 
      key: 'amount',
      render: (text) => `$${text}` // Format the amount
    },
    { 
      title: 'Date', 
      dataIndex: 'Date', 
      key: 'date',
      render: (text) => moment(text).format('MMMM D, YYYY') // Format the date
    },
    { title: 'Payment Method', dataIndex: 'Payment Method', key: 'paymentMethod' },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <>
          <Tooltip title="Print">
            <Button onClick={() => handleRePrint(record)}>Print</Button>
          </Tooltip>
          <Tooltip title="Email">
            <Button onClick={() => handleReEmail(record)}>Email</Button>
          </Tooltip>
        </>
      )
    }
  ];

  return (
    <Layout>
      <Content>
        <div className="site-layout-content">
          <h2>Reports Page</h2>
          <Row gutter={16}>
            <Col>
              <div>Start Date</div>
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                dateFormat="yyyy-MM-dd"
                style={{ marginRight: 10, width: 250 }}
              />
            </Col>
            <Col>
              <div>End Date</div>
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                dateFormat="yyyy-MM-dd"
                minDate={startDate}
                style={{ marginRight: 10, width: 250 }}
              />
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 20 }}>
            <Col>
              <div>Service</div>
              <Select
                defaultValue="All"
                style={{ width: 200, marginRight: 10, marginTop: 10 }}
                onChange={handleServiceChange}
                value={selectedService} // Add value to control the component
              >
                <Option value="All">All</Option>
                {services.map(service => (
                  <Option 
                    key={service.ServiceId} 
                    value={service.ServiceId}
                  >
                    {service.Service}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col>
              <div>Payment Method</div>
              <Select
                defaultValue="All"
                style={{ width: 200, marginRight: 10, marginTop: 10 }}
                value={selectedPaymentMethod} // Add value to control the component
                onChange={handlePaymentMethodChange}
              >
                <Option value="All">All</Option>
                {paymentMethods.map(method => (
                  <Option 
                    key={method.PaymentMethodId} 
                    value={method.PaymentMethodId}
                  >
                    {method.MethodName}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col>
              <div>Search by Name</div>
              <AutoComplete
                style={{ width: 300, marginRight: 10, marginTop: 10 }}
                options={devoteeOptions}
                onSelect={handleDevoteeSelect}
                onSearch={handleSearchChange}
                placeholder="Search by Name"
                value={selectedDevoteeName} // Update to show selected devotee's name
                onChange={handleSearchChange}
              />
            </Col>
            <Col>
              <Tooltip title="Print All">
                <Button style={{ marginLeft: 10, marginTop: 10 }} onClick={handlePrintAll}>Print All</Button>
              </Tooltip>
              <Tooltip title="Email All">
                <Button style={{ marginLeft: 10, marginTop: 10 }} onClick={handleEmailAll}>Email All</Button>
              </Tooltip>
              <Tooltip title="Sorted Print">
                <Button style={{ marginLeft: 10, marginTop: 10 }} onClick={handlePrintByName}>Print by Name</Button>
              </Tooltip>
            </Col>
          </Row>
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
        </div>
        <Modal
          title={`Do you want to send email to ${name}?`}
          visible={isEmailModalVisible}
          onOk={handleEmailSend}
          onCancel={() => setIsEmailModalVisible(false)}
        >
          <Input value={email} onChange={(e) => setEmail(e.target.value)} />
        </Modal>
        <Modal
          title={`Send email to:`}
          visible={isEmailAllModalVisible}
          onOk={handleEmailAllSend}
          onCancel={() => setIsEmailAllModalVisible(false)}
        >
          <Input value={emailAll} onChange={(e) => setEmailAll(e.target.value)} />
        </Modal>
      </Content>
    </Layout>
  );
};

export default Reports;
