import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DatePicker, Card, Col, Row, Table, Typography, Modal, Button, message } from 'antd';
import moment from 'moment';
import './Calendar.css';

const { RangePicker } = DatePicker;
const { Title } = Typography;

const Calendar = () => {
  const [activities, setActivities] = useState([]);
  const [pastActivities, setPastActivities] = useState([]);
  const [todayActivities, setTodayActivities] = useState([]);
  const [servicesCounts, setServicesCounts] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [dateRange, setDateRange] = useState([moment(), moment().add(15, 'days')]);

  useEffect(() => {
    fetchActivities();
    fetchPastActivities();
    fetchTodayActivities();
    fetchServicesCounts();
  }, [dateRange]);

  const fetchActivities = async () => {
    try {
      const response = await axios.get('http://localhost:5001/calendar/activities/range', {
        params: { from: dateRange[0].format('YYYY-MM-DD'), to: dateRange[1].format('YYYY-MM-DD') }
      });
      setActivities(response.data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const fetchPastActivities = async () => {
    try {
      const from = moment().subtract(1, 'month').format('YYYY-MM-DD');
      const to = moment().subtract(1, 'days').format('YYYY-MM-DD');
      const response = await axios.get('http://localhost:5001/calendar/activities/range', {
        params: { from, to }
      });
      setPastActivities(response.data.slice(0, 4)); // Limit to 4 past events
    } catch (error) {
      console.error('Error fetching past activities:', error);
    }
  };

  const fetchTodayActivities = async () => {
    try {
      const response = await axios.get('http://localhost:5001/calendar/activities/range', {
        params: { from: moment().startOf('day').format('YYYY-MM-DD'), to: moment().endOf('day').format('YYYY-MM-DD') }
      });
      setTodayActivities(response.data);
    } catch (error) {
      console.error('Error fetching today activities:', error);
    }
  };

  const fetchServicesCounts = async () => {
    try {
      const response = await axios.get('http://localhost:5001/services/upcoming-count');
      const filteredServices = response.data.filter(service =>
        ['Archana', 'Rathotsava Seva', 'Vastra Sponsor', 'Flower Sponsor', 'Sarva Seva', 'Satyanarana Pooja'].includes(service.Service)
      );
      setServicesCounts(filteredServices);
    } catch (error) {
      console.error('Error fetching services and upcoming counts:', error);
    }
  };

  const handleEventClick = (activity) => {
    setSelectedActivity(activity);
  };

  const handleOk = async () => {
    if (selectedActivity) {
      try {
        await axios.put(`http://localhost:5001/calendar/activities/${selectedActivity.ActivityId}/complete`);
        message.success('Event marked as complete');
        setSelectedActivity(null);
        fetchActivities();
        fetchPastActivities();
        fetchTodayActivities();
        fetchServicesCounts();
      } catch (error) {
        console.error('Error marking event as complete:', error);
        message.error('Failed to mark event as complete');
      }
    }
  };

  const handleCancel = () => {
    setSelectedActivity(null);
  };

  const columns = [
    {
      title: 'Service',
      dataIndex: 'Service',
      key: 'Service',
    },
    {
      title: 'Upcoming Events Count',
      dataIndex: 'Count',
      key: 'Count',
    },
  ];

  const renderEvents = (events) => {
    return (
      <Row gutter={[16, 16]}>
        {events.map((activity) => (
          <Col span={12} key={activity.ActivityId}>
            <Card className="event-card compact" onClick={() => handleEventClick(activity)}>
              <div className="event-info">
                <Title level={4} className="event-title">{activity.EventName}</Title>
                <span className="event-date">{moment(activity.ServiceDate).format('MMMM Do')}</span>
              </div>
              <p className="event-devotee">{activity.DevoteeName}</p>
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  return (
    <div className="calendar-container">
      <Row gutter={16}>
        <Col span={12}>
          <Card className="section-card">
            <Title level={3}>Today's Events</Title>
            {todayActivities.length > 0 ? (
              renderEvents(todayActivities)
            ) : (
              <Card className="event-card">
                <p>No SEVA today</p>
              </Card>
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card className="section-card">
            <Title level={3}>Service Counts</Title>
            <Table
              dataSource={servicesCounts}
              columns={columns}
              pagination={false}
              rowKey="ServiceId"
              size="small"
            />
          </Card>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Card className="section-card">
            <Title level={3}>Upcoming Events</Title>
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates)}
              style={{ marginBottom: '20px' }}
            />
            {renderEvents(activities)}
          </Card>
        </Col>
        <Col span={12}>
          <Card className="section-card">
            <Title level={3}>Past Events</Title>
            {renderEvents(pastActivities)}
          </Card>
        </Col>
      </Row>
      <Modal
        title="Event Details"
        visible={!!selectedActivity}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        {selectedActivity && (
          <div>
            <p><strong>Event Name:</strong> {selectedActivity.EventName}</p>
            <p><strong>Service Date:</strong> {moment(selectedActivity.ServiceDate).format('MMMM Do YYYY')}</p>
            <p><strong>Devotee Name:</strong> {selectedActivity.DevoteeName}</p>
            <p><strong>Devotee Email:</strong> {selectedActivity.DevoteeEmail}</p>
            <p><strong>Devotee Phone:</strong> {selectedActivity.DevoteePhone}</p>
            <p><strong>Family Members:</strong> {selectedActivity.FamilyMembers.join(', ')}</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Calendar;
