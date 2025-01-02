import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Table, Button, Modal, Form, Input, message } from 'antd';
import axios from 'axios';
import moment from 'moment';
import { jsPDF } from 'jspdf';
import './Receipts.css';
import { jwtDecode } from 'jwt-decode';

const { Search } = Input;
const { confirm } = Modal;

const Receipts = () => {
  const [pendingReceipts, setPendingReceipts] = useState([]);
  const [approvedReceipts, setApprovedReceipts] = useState([]);
  const [editedReceipts, setEditedReceipts] = useState([]);
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
  
  const [activeTab, setActiveTab] = useState('pending');
  const [pageSize, setPageSize] = useState(12);
  const [userType, setUserType] = useState('');

  const token = localStorage.getItem('token');

  // Create axios instance with authorization headers
  const axiosInstance = useMemo(() => axios.create({
    baseURL: 'http://localhost:5001',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }), [token]);

  // Fetch access control data based on user type
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

  // Fetch pending receipts from the server
  const fetchPendingReceipts = useCallback(async (search = '', pageSize) => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/receipts/pending', { params: { search, pageSize } });
      setPendingReceipts(response.data);
    } catch (error) {
      message.error('Failed to load pending receipts');
    } finally {
      setLoading(false);
    }
  }, [axiosInstance]);

  // Fetch approved receipts from the server
  const fetchApprovedReceipts = useCallback(async (search = '', pageSize) => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/receipts/approved', {
        params: { search, pageSize }
      });
      setApprovedReceipts(response.data.map(receipt => ({
        ...receipt,
        ReceiptId: receipt.receiptid // Ensure ReceiptId is included
      })));
    } catch (error) {
      message.error('Failed to load approved receipts');
    } finally {
      setLoading(false);
    }
  }, [axiosInstance]);  

  // Fetch edited receipts from the server
  const fetchEditedReceipts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/edited-receipts');
      setEditedReceipts(response.data);
    } catch (error) {
      message.error('Failed to load edited receipts');
    } finally {
      setLoading(false);
    }
  }, [axiosInstance]);

  // Initial data fetch on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = jwtDecode(token);
      setUserType(decodedToken.usertype);
      fetchAccessControl(decodedToken.usertype);
    }
  }, []);

  // Fetch data based on the active tab
  useEffect(() => {
    if (activeTab === 'pending') {
      fetchPendingReceipts(pendingSearch, pageSize);
    } else if (activeTab === 'approved') {
      fetchApprovedReceipts(approvedSearch, pageSize);
    } else if (activeTab === 'edited') {
      fetchEditedReceipts();
    }
  }, [activeTab, fetchPendingReceipts, fetchApprovedReceipts, fetchEditedReceipts, pendingSearch, approvedSearch, pageSize]);

  // Handle receipt approval
  const handleApprove = async (activityId) => {
    try {
      await axiosInstance.post('/receipts/approve', { activityId });
      message.success('Receipt approved successfully');
      console.log('Approved receipt:', activityId);
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

  // Handle editing a receipt
  const handleEdit = (activity) => {
    setCurrentActivity(activity);
    form.setFieldsValue(activity);
    setOriginalPaymentMethod(activity.PaymentMethod);
    setIsModalVisible(true);
  };

  const showDeleteConfirm = (activityId) => {
    confirm({
      title: 'Are you sure you want to delete this receipt?',
      content: 'This action cannot be undone.',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk() {
        handleDelete(activityId);
      },
      onCancel() {
        console.log('Cancel');
      },
    });
  };
  
  const handleDelete = async (activityId) => {
    try {
      const activityToDelete = pendingReceipts.find(receipt => receipt.ActivityId === activityId) || approvedReceipts.find(receipt => receipt.ActivityId === activityId);
      
      if (!activityToDelete) {
        message.error('Activity not found');
        return;
      }
      
      await axiosInstance.delete(`/receipts/${activityId}`);
      
      // Log the deletion in editedreceipts table
      await axiosInstance.post('/edited-receipts', {
        ActivityId: activityToDelete.ActivityId,
        Name: activityToDelete.Name,
        OldService: activityToDelete.Service,
        NewService: activityToDelete.Service,
        OldAmount: activityToDelete.Amount,
        NewAmount: activityToDelete.Amount,
        EditedBy: jwtDecode(localStorage.getItem('token')).username,
        Status: 'Deleted'
      });
  
      message.success('Receipt deleted successfully');
      fetchPendingReceipts(pendingSearch, pageSize);
      fetchApprovedReceipts(approvedSearch, pageSize);
    } catch (error) {
      message.error('Failed to delete receipt');
    }
  };  

  const handleEditOk = async () => {
    try {
      const updatedData = form.getFieldsValue();
      const originalData = currentActivity;
  
      await axiosInstance.put(`/activities/${currentActivity.ActivityId}`, updatedData);
  
      // Log the edited receipt
      await axiosInstance.post('/edited-receipts', {
        ActivityId: currentActivity.ActivityId,
        Name: currentActivity.Name,
        OldService: originalData.Service,
        NewService: updatedData.Service,
        OldAmount: originalData.Amount,
        NewAmount: updatedData.Amount,
        EditedBy: jwtDecode(localStorage.getItem('token')).username,
        Status: 'Edited'
      });
  
      message.success('Activity updated successfully');
      console.log('Updated activity:', currentActivity.ActivityId);
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
    { title: 'Activity ID', dataIndex: 'ActivityId', key: 'ActivityId', align: 'center' },
    { title: 'Name', dataIndex: 'Name', key: 'Name', align: 'center'},
    { title: 'Service', dataIndex: 'Service', key: 'Service', align: 'center' },
    { title: 'Activity Date', dataIndex: 'Date', key: 'Date', render: (text) => formatDate(text), align: 'center' },
    { title: 'Service Date', dataIndex: 'ServiceDate', key: 'ServiceDate', render: (text) => formatDate(text), align: 'center' },
    { title: 'Mode of Payment', dataIndex: 'PaymentMethod', key: 'PaymentMethod', align: 'center' },
    { title: 'Amount', dataIndex: 'Amount', key: 'Amount', align: 'center' },
    { title: 'Assisted by', dataIndex: 'AssistedBy', key: 'AssistedBy', align: 'center' },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <>
          {accessControl.Receipts?.can_approve === 1 && (
            <Button className="ant-btn-approve" onClick={() => handleApprove(record.ActivityId)}>Approve</Button>
          )}
          {accessControl.Receipts?.can_edit === 1 && (
            <>
              <Button className="ant-btn-edit" onClick={() => handleEdit(record)} style={{ marginLeft: 8 }}>Edit</Button>
              <Button className="ant-btn-delete" onClick={() => showDeleteConfirm(record.ActivityId)} danger style={{ marginLeft: 8 }}>Delete</Button>
            </>
          )}
        </>
      ), align: 'center'
    }
  ];

  const columnsApproved = [
    { title: 'Receipt ID', dataIndex: 'receiptid', key: 'receiptid', align: 'center' },
    { title: 'Name', dataIndex: 'Name', key: 'Name', align: 'center' },
    { title: 'Service', dataIndex: 'Service', key: 'Service', align: 'center' },
    { title: 'Activity Date', dataIndex: 'ActivityDate', key: 'ActivityDate', render: (text) => formatDate(text), align: 'center' },
    { title: 'Service Date', dataIndex: 'ServiceDate', key: 'ServiceDate', render: (text) => formatDate(text), align: 'center' },
    { title: 'Approved Date', dataIndex: 'ApprovedDate', key: 'ApprovedDate', render: (text) => formatDate(text), align: 'center' },
    { title: 'Mode of Payment', dataIndex: 'PaymentMethod', key: 'PaymentMethod', align: 'center' },
    { title: 'Amount', dataIndex: 'Amount', key: 'Amount', align: 'center' },
    { title: 'Assisted by', dataIndex: 'AssistedBy', key: 'AssistedBy', align: 'center' },
    { title: 'Email', dataIndex: 'Email', key: 'Email', align: 'center' },
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
      ), align: 'center'
    }
  ];

  const columnsEdited = [
    { title: 'Status', dataIndex: 'Status', key: 'Status', align: 'center' },
    { title: 'Activity ID', dataIndex: 'ActivityId', key: 'ActivityId', align: 'center' },
    { title: 'Name', dataIndex: 'Name', key: 'Name', align: 'center' },
    { 
      title: 'Service', 
      dataIndex: 'OldService', 
      key: 'OldService', 
      render: (text, record) => (
        <span style={{ color: record.OldService !== record.NewService ? 'red' : 'inherit', fontWeight: record.OldService !== record.NewService ? 'bold' : 'normal' }}>
          {text}
        </span>
      ), align: 'center'
    },
    { 
      title: 'Old Amount', 
      dataIndex: 'OldAmount', 
      key: 'OldAmount', 
      render: (text, record) => (
        <span style={{ color: record.OldAmount !== record.NewAmount ? 'red' : 'inherit', fontWeight: record.OldAmount !== record.NewAmount ? 'bold' : 'normal' }}>
          {text}
        </span>
      ) , align: 'center'
    },
    { 
      title: 'New Amount', 
      dataIndex: 'NewAmount', 
      key: 'NewAmount', 
      render: (text, record) => (
        <span style={{ color: record.OldAmount !== record.NewAmount ? 'red' : 'inherit', fontWeight: record.OldAmount !== record.NewAmount ? 'bold' : 'normal' }}>
          {text}
        </span>
      ) , align: 'center'
    },
    { title: 'Edited By', dataIndex: 'EditedBy', key: 'EditedBy', align: 'center' },
    { 
      title: 'Edited On', 
      dataIndex: 'EditedOn', 
      key: 'EditedOn', 
      render: (text) => moment(text).format('MMM D, YYYY h:mm A'), align: 'center'
    },
  ];  
  
  // Generate PDF for a given record
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
    doc.text(`Name:     ${record ? record.Name : ''}`, 0.5, 2.3);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Address: ${record && record.Address1 ? record.Address1 : 'NA'}`, 0.5, 2.5);
    doc.text(`                ${record && record.Address2 ? record.Address2 : 'NA'}`, 0.5, 2.7);

    doc.setFontSize(16);
    doc.setFont('Helvetica', 'bold');
    doc.text('A Note of Appreciation', 4.25, 3.8, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Dear ${record ? record.Name : ''},`, 0.5, 4.2);

    const pdfText = [
      "Thank you very much for your generous donation to the Sringeri Education and Vedic Academy. Your",
      "donation will go a long way in helping us accomplish our goal of creating a modern facility to support",
      "the religious, social, and cultural needs of our community. ",
      "No goods or services were provided in exchange for this donation.",
      "",
      "May God's blessings always be with you and your family.",
      "",
      "Sincerely,",
      "Sringeri Education and Vedic Academy."
    ];

    pdfText.forEach((line, index) => {
      doc.text(line, 0.5, 4.6 + index * 0.3); // Adjust the y-coordinate as needed
    });

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.04);
    doc.line(0.5, 7.4, 7.5, 7.4); // Adjusted y-coordinate for the line

    doc.setFontSize(16);
    doc.setFont('Helvetica', 'bold');
    doc.text('Receipt', 4.25, 7.9, { align: 'center' }); // Adjusted y-coordinate for 'Receipt' title

    doc.setFontSize(12);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Received from: ${record ? record.Name : ''}`, 0.5, 8.3);
    doc.text(`Donation: $${record ? record.Amount : ''} only`, 0.5, 8.6);
    doc.text(`Receipt No: ${record ? record.receiptid : ''}`, 0.5, 8.9);
    doc.text(`Mode of Payment: ${record ? record.PaymentMethod : ''}`, 0.5, 9.2);

    if (record && record.PaymentMethod === 'Check') {
      doc.text(`Check Number: ${record.CheckNumber ? record.CheckNumber : 'NA'}`, 0.5, 9.5);
      doc.text(
        `Payment Date: ${record ? new Date(record.ActivityDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}`,
        0.5,
        9.8
      );
    } else {
      doc.text(
        `Payment Date: ${record ? new Date(record.ActivityDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}`,
        0.5,
        9.5
      );
    }    

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
        {userType === 'Super Admin' && (
        <Button type={activeTab === 'edited' ? 'primary' : 'default'} onClick={() => setActiveTab('edited')} style={{ marginLeft: '8px' }}>
          Edited Receipts Log
        </Button>
        )}
      </div>
      {activeTab === 'pending' && (
        <>
          <div style={{ display: 'flex', marginBottom: '16px' }}>
            <Search
              placeholder="Search by Devotee Name, Phone, Email or Receipt ID"
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
              placeholder="Search by Devotee Name, Phone, Email or Receipt ID"
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
      {activeTab === 'edited' && (
        <Table
          columns={columnsEdited}
          dataSource={editedReceipts}
          loading={loading}
          rowKey="EditId"
          pagination={{ 
            pageSize: pageSize, 
            pageSizeOptions: ['10', '20', '50', '100'], 
            showSizeChanger: true, 
            onShowSizeChange: handlePageSizeChange 
          }}
        />
      )}
      <Modal
        title="Edit Activity"
        visible={isModalVisible}
        onOk={handleEditOk}
        onCancel={handleEditCancel}
      >
        <Form form={form}>
          <Form.Item name="Service" label="Service">
            <Input disabled/>
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