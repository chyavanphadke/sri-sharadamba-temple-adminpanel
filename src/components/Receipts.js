import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, message, Tabs } from 'antd';
import axios from 'axios';
import moment from 'moment';
import { jsPDF } from 'jspdf';
import './Receipts.css';

const { Search } = Input;
const { TabPane } = Tabs;

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
  const [currentRecord, setCurrentRecord] = useState(null);

  const fetchPendingReceipts = async (search = '') => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5001/receipts/pending', {
        params: { search }
      });
      setPendingReceipts(response.data);
    } catch (error) {
      message.error('Failed to load pending receipts');
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovedReceipts = async (search = '') => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5001/receipts/approved', {
        params: { search }
      });
      setApprovedReceipts(response.data);
    } catch (error) {
      message.error('Failed to load approved receipts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingReceipts(pendingSearch);
    fetchApprovedReceipts(approvedSearch);
  }, [pendingSearch, approvedSearch]);

  const handleApprove = async (activityId) => {
    try {
      const token = localStorage.getItem('token'); // Retrieve token from local storage
      await axios.post('http://localhost:5001/receipts/approve', { activityId }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      message.success('Receipt approved successfully');
      fetchPendingReceipts(pendingSearch);
      fetchApprovedReceipts(approvedSearch);
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
    setIsModalVisible(true);
  };

  const handleEditOk = async () => {
    try {
      const updatedData = form.getFieldsValue();
      await axios.put(`http://localhost:5001/activities/${currentActivity.ActivityId}`, updatedData);
      message.success('Activity updated successfully');
      setIsModalVisible(false);
      fetchPendingReceipts(pendingSearch);
      fetchApprovedReceipts(approvedSearch);
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
      fetchPendingReceipts(value);
    } else if (value.length === 0) {
      fetchPendingReceipts('');
    }
  };

  const handleApprovedSearchChange = (e) => {
    const value = e.target.value;
    setApprovedSearch(value);
    if (value.length >= 3) {
      fetchApprovedReceipts(value);
    } else if (value.length === 0) {
      fetchApprovedReceipts('');
    }
  };

  const formatDate = (date) => {
    return moment(date).format('MMM D, YYYY');
  };

  const columnsPending = [
    { title: 'Name', dataIndex: 'Name', key: 'Name' },
    { title: 'Service', dataIndex: 'Service', key: 'Service' },
    { title: 'Date', dataIndex: 'Date', key: 'Date', render: (text) => formatDate(text) },
    { title: 'Check Number', dataIndex: 'CheckNumber', key: 'CheckNumber' },
    { title: 'Amount', dataIndex: 'Amount', key: 'Amount' },
    { title: 'Assisted by', dataIndex: 'AssistedBy', key: 'AssistedBy' },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <>
          <Button className="ant-btn-approve" onClick={() => handleApprove(record.ActivityId)}>Approve</Button>
          <Button className="ant-btn-edit" onClick={() => handleEdit(record)} style={{ marginLeft: 8 }}>Edit</Button>
        </>
      )
    }
  ];

  const columnsApproved = [
    { title: 'Name', dataIndex: 'Name', key: 'Name' },
    { title: 'Service', dataIndex: 'Service', key: 'Service' },
    { title: 'Activity Date', dataIndex: 'ActivityDate', key: 'ActivityDate', render: (text) => formatDate(text) },
    { title: 'Approved Date', dataIndex: 'ApprovedDate', key: 'ApprovedDate', render: (text) => formatDate(text) },
    { title: 'Check Number', dataIndex: 'CheckNumber', key: 'CheckNumber' },
    { title: 'Amount', dataIndex: 'Amount', key: 'Amount' },
    { title: 'Assisted by', dataIndex: 'AssistedBy', key: 'AssistedBy' },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <>
          <Button className="ant-btn-email" onClick={() => message.info(`Send Email to ${record.Name}`)}>Email</Button>
          <Button className="ant-btn-download" onClick={() => {
            setCurrentRecord(record);
            setIsPrintModalVisible(true);
            console.log("Download button clicked for record:", record);
          }} style={{ marginLeft: 8 }}>Download</Button>
          <Button className="ant-btn-print" onClick={() => handlePrint(record)} style={{ marginLeft: 8 }}>Print</Button>
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
    doc.text(`Thank you very much for your generous donation to the Sringeri Education and Vedic Academy.`, 0.5, 4.1);
    doc.text(`Your donation will go a long way in helping us accomplish our goal of creating a modern facility`, 0.5, 4.4);
    doc.text(`to support the religious, social and cultural needs of our community.`, 0.5, 4.7);
    doc.text(`May god blessings always with you and your family.`, 0.5, 5.0);

    doc.text('Sincerely,', 0.5, 5.6);
    doc.text('Sringeri Education and Vedic Academy.', 0.5, 5.9);

    doc.text('No goods or services were provided for this donation.', 4.25, 6.5, { align: 'center' });

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
    doc.text(`Date: ${record ? formatDate(record.Date) : ''}`, 0.5, 9.3);

    return doc;
  };

  const handleDownload = () => {
    setIsPrintModalVisible(false);
    console.log("Download modal confirmed for record:", currentRecord);

    const doc = generatePDF(currentRecord);
    const fileName = `receipt_${currentRecord.ReceiptId}_${currentRecord.Name}.pdf`;
    doc.save(fileName);

    console.log("PDF generated and download triggered");
  };

  const handlePrint = (record) => {
    const doc = generatePDF(record);
    const pdfBlob = doc.output('bloburl');
    window.open(pdfBlob);
    console.log("PDF generated and print dialog opened");
  };

  return (
    <div>
      <h2>Receipts</h2>
      <Tabs defaultActiveKey="1">
        <TabPane tab="Receipts for Approval" key="1">
          <Search
            placeholder="Search by name, phone or email"
            onChange={handlePendingSearchChange}
            style={{ marginBottom: '16px' }}
          />
          <Table
            columns={columnsPending}
            dataSource={pendingReceipts}
            loading={loading}
            rowKey="ActivityId"
            pagination={{ pageSize: 20 }}
          />
        </TabPane>
        <TabPane tab="Approved Receipts" key="2">
          <Search
            placeholder="Search by name, phone or email"
            onChange={handleApprovedSearchChange}
            style={{ marginBottom: '16px' }}
          />
          <Table
            columns={columnsApproved}
            dataSource={approvedReceipts}
            loading={loading}
            rowKey="ReceiptId"
            pagination={{ pageSize: 20 }}
          />
        </TabPane>
      </Tabs>
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
          <Form.Item name="CheckNumber" label="Check Number">
            <Input />
          </Form.Item>
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
    </div>
  );
};

export default Receipts;
