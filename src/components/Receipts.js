import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Table, Button, Modal, Form, Input, message } from 'antd';
import axios from 'axios';
import moment from 'moment';
import { jsPDF } from 'jspdf';
import './Receipts.css';
import { jwtDecode } from 'jwt-decode';

const { Search } = Input;

const Receipts = () => {
  const [pendingReceipts, setPendingReceipts] = useState([]);
  const [approvedReceipts, setApprovedReceipts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [pendingSearch, setPendingSearch] = useState('');
  const [approvedSearch, setApprovedSearch] = useState('');
  const [form] = Form.useForm();
  const [isPrintModalVisible, setIsPrintModalVisible] = useState(false);
  const [isEmailModalVisible, setIsEmailModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [originalPaymentMethod, setOriginalPaymentMethod] = useState('');
  const [accessControl, setAccessControl] = useState({});
  const [pdfText, setPdfText] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [pageSize, setPageSize] = useState(12);

  const token = localStorage.getItem('token');

  const axiosInstance = useMemo(() => axios.create({
    baseURL: 'http://localhost:5001',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }), [token]);

  const fetchAccessControl = async (userType) => {
    try {
      const response = await axiosInstance.get(`/access-control/${userType}`);
      if (response.status !== 200) {
        throw new Error('Network response was not ok');
      }
      const data = await response.data;
      setAccessControl(data);
    } catch (error) {
      console.error('Failed to fetch access control data:', error);
    }
  };

  const fetchEmailText = async () => {
    try {
      const response = await axiosInstance.get('/email-text');
      setPdfText(response.data);
    } catch (error) {
      message.error('Failed to load email text');
    }
  };

  const fetchPendingReceipts = useCallback(async (search = '', pageSize) => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/receipts/pending', {
        params: { search, pageSize }
      });
      setPendingReceipts(response.data);
    } catch (error) {
      message.error('Failed to load pending receipts');
    } finally {
      setLoading(false);
    }
  }, [axiosInstance]);

  const fetchApprovedReceipts = useCallback(async (search = '', pageSize) => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/receipts/approved', {
        params: { search, pageSize }
      });
      setApprovedReceipts(response.data);
    } catch (error) {
      message.error('Failed to load approved receipts');
    } finally {
      setLoading(false);
    }
  }, [axiosInstance]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = jwtDecode(token);
      fetchAccessControl(decodedToken.usertype);
    }
    fetchEmailText();
  }, []);

  useEffect(() => {
    if (activeTab === 'pending') {
      fetchPendingReceipts(pendingSearch, pageSize);
    } else if (activeTab === 'approved') {
      fetchApprovedReceipts(approvedSearch, pageSize);
    }
  }, [activeTab, fetchPendingReceipts, fetchApprovedReceipts, pendingSearch, approvedSearch, pageSize]);

  const handleApprove = async (activityId) => {
    try {
      await axiosInstance.post('/receipts/approve', { activityId });
      message.success('Receipt approved successfully');
      fetchPendingReceipts(pendingSearch, pageSize);
      fetchApprovedReceipts(approvedSearch, pageSize);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        message.error('You are not authorized to perform this action');
      } else {
        message.error('Failed to approve receipt');
      }
    }
  };

  const handleEdit = (activity) => {
    setCurrentActivity(activity);
    form.setFieldsValue(activity);
    setOriginalPaymentMethod(activity.PaymentMethod); // Store original payment method
    setIsModalVisible(true);
  };

  const handleEditOk = async () => {
    try {
      const updatedData = form.getFieldsValue();
      await axiosInstance.put(`/activities/${currentActivity.ActivityId}`, updatedData);
      message.success('Activity updated successfully');
      setIsModalVisible(false);
      fetchPendingReceipts(pendingSearch, pageSize);
      fetchApprovedReceipts(approvedSearch, pageSize);
    } catch (error) {
      message.error('Failed to update activity');
    }
  };

  const handleEditCancel = () => {
    setIsModalVisible(false);
  };

  const handlePendingSearchChange = (e) => {
    const value = e.target.value;
    setPendingSearch(value);
    if (value.length >= 3) {
      fetchPendingReceipts(value, pageSize);
    } else if (value.length === 0) {
      fetchPendingReceipts('', pageSize);
    }
  };

  const handleApprovedSearchChange = (e) => {
    const value = e.target.value;
    setApprovedSearch(value);
    if (value.length >= 3) {
      fetchApprovedReceipts(value, pageSize);
    } else if (value.length === 0) {
      fetchApprovedReceipts('', pageSize);
    }
  };

  const handleClearPendingSearch = () => {
    setPendingSearch('');
    fetchPendingReceipts('', pageSize);
  };

  const handleClearApprovedSearch = () => {
    setApprovedSearch('');
    fetchApprovedReceipts('', pageSize);
  };

  const handlePageSizeChange = (current, size) => {
    setPageSize(size);
    if (activeTab === 'pending') {
      fetchPendingReceipts(pendingSearch, size);
    } else if (activeTab === 'approved') {
      fetchApprovedReceipts(approvedSearch, size);
    }
  };

  const formatDate = (date) => {
    return moment(date).format('MMM D, YYYY');
  };

  const columnsPending = [
    { title: 'Name', dataIndex: 'Name', key: 'Name' },
    { title: 'Service', dataIndex: 'Service', key: 'Service' },
    { title: 'Date', dataIndex: 'Date', key: 'Date', render: (text) => formatDate(text) },
    { title: 'Mode of Payment', dataIndex: 'PaymentMethod', key: 'PaymentMethod' },
    { title: 'Amount', dataIndex: 'Amount', key: 'Amount' },
    { title: 'Assisted by', dataIndex: 'AssistedBy', key: 'AssistedBy' },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <>
          {accessControl.Receipts?.can_approve === 1 && (
            <Button className="ant-btn-approve" onClick={() => handleApprove(record.ActivityId)}>Approve</Button>
          )}
          {accessControl.Receipts?.can_edit === 1 && (
            <Button className="ant-btn-edit" onClick={() => handleEdit(record)} style={{ marginLeft: 8 }}>Edit</Button>
          )}
        </>
      )
    }
  ];

  const columnsApproved = [
    { title: 'Name', dataIndex: 'Name', key: 'Name' },
    { title: 'Service', dataIndex: 'Service', key: 'Service' },
    { title: 'Activity Date', dataIndex: 'ActivityDate', key: 'ActivityDate', render: (text) => formatDate(text) },
    { title: 'Approved Date', dataIndex: 'ApprovedDate', key: 'ApprovedDate', render: (text) => formatDate(text) },
    { title: 'Mode of Payment', dataIndex: 'PaymentMethod', key: 'PaymentMethod' },
    { title: 'Amount', dataIndex: 'Amount', key: 'Amount' },
    { title: 'Assisted by', dataIndex: 'AssistedBy', key: 'AssistedBy' },
    { title: 'Email', dataIndex: 'Email', key: 'Email' },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <>
          {accessControl.Receipts?.can_email === 1 && (
            <>
              <Button className="ant-btn-email" onClick={() => {
                setCurrentRecord(record);
                setIsEmailModalVisible(true);
              }}>
                {record.emailsentcount > 0 ? 'Re-Email' : 'Email'}
              </Button>
              <Button className="ant-btn-download" onClick={() => {
                setCurrentRecord(record);
                setIsPrintModalVisible(true);
              }} style={{ marginLeft: 8 }}>Download</Button>
              <Button className="ant-btn-print" onClick={() => handlePrint(record)} style={{ marginLeft: 8 }}>Print</Button>
            </>
          )}
        </>
      )
    }
  ];

  const generatePDF = (record) => {
    const doc = new jsPDF({
      unit: 'in',
      format: 'letter',
      orientation: 'portrait'
    });

    doc.setFont('Helvetica');

    const imgData = '/banner.webp'; // Ensure this path is correct and accessible
    doc.addImage(imgData, 'WEBP', 0.5, 0.5, 7.5, 1.5);

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.02);
    doc.rect(0.25, 0.25, 8, 10.5); // Adding border to entire content

    doc.setFontSize(12);
    doc.setFont('Helvetica', 'bold');
    doc.text(`Name: ${record ? record.Name : ''}`, 0.5, 2.3);
    doc.text(`Address: ${record && record.Address ? record.Address : 'N/A'}`, 0.5, 2.5);

    doc.setFontSize(16);
    doc.setFont('Helvetica', 'normal');
    doc.text('A Note of Appreciation', 4.25, 3, { align: 'center' });

    doc.setFontSize(12);
    doc.text(`Dear ${record ? record.Name : ''},`, 0.5, 3.8);

    pdfText.forEach((line, index) => {
      doc.text(line, 0.5, 4.1 + index * 0.3); // Adjust the y-coordinate as needed
    });

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.04);
    doc.line(0.5, 6.8, 7.5, 6.8);

    doc.setFontSize(16);
    doc.text('Receipt', 4.25, 7.2, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('Helvetica', 'bold');
    doc.text(`Received from: ${record ? record.Name : ''}`, 0.5, 7.8);
    doc.text(`Donation: $${record ? record.Amount : ''} only`, 0.5, 8.1);
    doc.text(`Receipt No: ${record ? record.ReceiptId : ''}`, 0.5, 8.4);
    doc.text(`Your Check No: ${record ? record.CheckNumber : ''}`, 0.5, 9);

    return doc;
  };

  const handleDownload = () => {
    setIsPrintModalVisible(false);
    const doc = generatePDF(currentRecord);
    const fileName = `receipt_${currentRecord.ReceiptId}_${currentRecord.Name}.pdf`;
    doc.save(fileName);
  };

  const handlePrint = (record) => {
    const doc = generatePDF(record);
    const pdfBlob = doc.output('bloburl');
    window.open(pdfBlob);
  };

  const handleEmail = async () => {
    setIsEmailModalVisible(false);
    const doc = generatePDF(currentRecord);
    const pdfBlob = doc.output('blob');

    const formData = new FormData();
    formData.append('email', currentRecord.Email);
    formData.append('Name', currentRecord.Name);
    formData.append('ActivityDate', formatDate(currentRecord.ActivityDate));
    formData.append('pdf', new Blob([pdfBlob], { type: 'application/pdf' }), `receipt_${currentRecord.ReceiptId}_${currentRecord.Name}.pdf`);
    formData.append('receiptid', currentRecord.ReceiptId);

    try {
      await axiosInstance.post('/send-receipt-email', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      message.success(`Email sent to ${currentRecord.Name}`);
      fetchApprovedReceipts(approvedSearch, pageSize);
    } catch (error) {
      message.error('Failed to send receipt via email');
    }
  };

  return (
    <div>
      <h2>Receipts</h2>
      <div style={{ marginBottom: '16px' }}>
        <Button type={activeTab === 'pending' ? 'primary' : 'default'} onClick={() => setActiveTab('pending')}>
          Receipts for Approval
        </Button>
        <Button type={activeTab === 'approved' ? 'primary' : 'default'} onClick={() => setActiveTab('approved')} style={{ marginLeft: '8px' }}>
          Approved Receipts
        </Button>
      </div>
      {activeTab === 'pending' && (
        <>
          <div style={{ display: 'flex', marginBottom: '16px' }}>
            <Search
              placeholder="Search by name, phone or email"
              value={pendingSearch}
              onChange={handlePendingSearchChange}
              style={{ width: '30%' }}
            />
            <Button onClick={handleClearPendingSearch} style={{ marginLeft: '8px', borderColor: 'red', color: 'red' }}>
              Clear
            </Button>
          </div>
          <Table
            columns={columnsPending}
            dataSource={pendingReceipts}
            loading={loading}
            rowKey="ActivityId"
            pagination={{ 
              pageSize: pageSize, 
              pageSizeOptions: ['10', '20', '50', '100'], 
              showSizeChanger: true, 
              onShowSizeChange: handlePageSizeChange 
            }}
          />
        </>
      )}
      {activeTab === 'approved' && (
        <>
          <div style={{ display: 'flex', marginBottom: '16px' }}>
            <Search
              placeholder="Search by name, phone or email"
              value={approvedSearch}
              onChange={handleApprovedSearchChange}
              style={{ width: '30%' }}
            />
            <Button onClick={handleClearApprovedSearch} style={{ marginLeft: '8px', borderColor: 'red', color: 'red' }}>
              Clear
            </Button>
          </div>
          <Table
            columns={columnsApproved}
            dataSource={approvedReceipts}
            loading={loading}
            rowKey="ReceiptId"
            pagination={{ 
              pageSize: pageSize, 
              pageSizeOptions: ['10', '20', '50', '100'], 
              showSizeChanger: true, 
              onShowSizeChange: handlePageSizeChange 
            }}
          />
        </>
      )}
      <Modal
        title="Edit Activity"
        visible={isModalVisible}
        onOk={handleEditOk}
        onCancel={handleEditCancel}
      >
        <Form form={form}>
          <Form.Item name="Service" label="Service">
            <Input />
          </Form.Item>
          <Form.Item name="Amount" label="Amount">
            <Input />
          </Form.Item>
          {originalPaymentMethod === 'Check' && (
            <Form.Item name="CheckNumber" label="Check Number">
              <Input />
            </Form.Item>
          )}
          <Form.Item name="Comments" label="Comments">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Generate Receipt"
        visible={isPrintModalVisible}
        onOk={handleDownload}
        onCancel={() => setIsPrintModalVisible(false)}
      >
        <p>Generate a receipt for {currentRecord ? currentRecord.Name : ''}?</p>
      </Modal>
      <Modal
        title="Send Receipt"
        visible={isEmailModalVisible}
        onOk={handleEmail}
        onCancel={() => setIsEmailModalVisible(false)}
      >
        <p>Send receipt to {currentRecord ? currentRecord.Email : ''}?</p>
      </Modal>
    </div>
  );
};

export default Receipts;
