import React, { useState, useEffect } from 'react';
import { Table, message, Modal, Form, Input, DatePicker, Select, Button } from 'antd';
import axios from 'axios';
import moment from 'moment';

const { Option } = Select;

const ListOfSevas = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [form] = Form.useForm();
  const [services, setServices] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [activitiesResponse, devoteesResponse, servicesResponse, paymentMethodsResponse] = await Promise.all([
        axios.get('http://localhost:5001/activities'),
        axios.get('http://localhost:5001/devotees'),
        axios.get('http://localhost:5001/services'),
        axios.get('http://localhost:5001/payment-methods')
      ]);

      setServices(servicesResponse.data);
      setPaymentMethods(paymentMethodsResponse.data);

      const devoteeMap = new Map();
      devoteesResponse.data.forEach(devotee => {
        devoteeMap.set(devotee.DevoteeId, devotee);
      });

      const serviceMap = new Map();
      servicesResponse.data.forEach(service => {
        serviceMap.set(service.ServiceId, service);
      });

      const paymentMethodMap = new Map();
      paymentMethodsResponse.data.forEach(method => {
        paymentMethodMap.set(method.PaymentMethodId, method.MethodName);
      });

      const activityData = activitiesResponse.data.map(activity => {
        const devotee = devoteeMap.get(activity.DevoteeId);
        const service = serviceMap.get(activity.ServiceId);
        const paymentMethod = paymentMethodMap.get(activity.PaymentMethod);
        return {
          ...activity,
          DevoteeName: devotee ? `${devotee.FirstName} ${devotee.LastName}` : 'Unknown',
          PhoneNumber: devotee ? devotee.Phone : 'Unknown',
          Service: service ? service.Service : 'Unknown',
          PaymentMethod: paymentMethod || 'Unknown',
          PaymentMethodId: activity.PaymentMethod // Added PaymentMethodId for form initial value
        };
      });

      setActivities(activityData.reverse()); // Reverse to show the last one on top
    } catch (error) {
      message.error('Failed to load activities');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    setCurrentActivity(record);
    form.setFieldsValue({
      ServiceId: record.ServiceId,
      ActivityDate: moment(record.ActivityDate),
      Amount: record.Amount,
      PaymentMethod: record.PaymentMethodId, // Update this to use the ID
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (activityId) => {
    try {
      await axios.delete(`http://localhost:5001/activities/${activityId}`);
      message.success('Activity deleted successfully');
      fetchAllData();
    } catch (error) {
      message.error('Failed to delete activity');
      console.error('Error deleting activity:', error);
    }
  };

  const handleOk = async () => {
    try {
      const values = form.getFieldsValue();
      await axios.put(`http://localhost:5001/activities/${currentActivity.ActivityId}`, {
        ...values,
        ActivityDate: values.ActivityDate.format('YYYY-MM-DD HH:mm:ss')
      });
      message.success('Activity updated successfully');
      setIsModalVisible(false);
      fetchAllData();
    } catch (error) {
      message.error('Failed to update activity');
      console.error('Error updating activity:', error);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const columns = [
    { title: 'Devotee Name', dataIndex: 'DevoteeName', key: 'DevoteeName' },
    { title: 'Phone Number', dataIndex: 'PhoneNumber', key: 'PhoneNumber' },
    { title: 'Seva', dataIndex: 'Service', key: 'Service' },
    { title: 'Activity Date', dataIndex: 'ActivityDate', key: 'ActivityDate', render: (text) => moment(text).format('MMM D, YYYY') },
    { title: 'Amount Paid', dataIndex: 'Amount', key: 'Amount' },
    { title: 'Payment Method', dataIndex: 'PaymentMethod', key: 'PaymentMethod' },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <>
          <Button type="link" style={{border: '1px solid'}} onClick={() => handleEdit(record)}>Edit</Button>
          <Button type="link" danger style={{border: '1px solid'}} onClick={() => handleDelete(record.ActivityId)}>Delete</Button>
        </>
      )
    }
  ];

  return (
    <div>
      <h2>List of Sevas</h2>
      <Table
        columns={columns}
        dataSource={activities}
        loading={loading}
        rowKey="ActivityId"
        pagination={{ pageSize: 20 }}
      />
      <Modal
        title="Edit Activity"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="ServiceId" label="Service">
            <Select>
              {services.map(service => (
                <Option key={service.ServiceId} value={service.ServiceId}>{service.Service}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="ActivityDate" label="Activity Date">
            <DatePicker showTime />
          </Form.Item>
          <Form.Item name="Amount" label="Amount">
            <Input />
          </Form.Item>
          <Form.Item name="PaymentMethod" label="Payment Method">
            <Select>
              {paymentMethods.map(method => (
                <Option key={method.PaymentMethodId} value={method.PaymentMethodId}>{method.MethodName}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ListOfSevas;
