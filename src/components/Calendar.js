import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Col, Row, Typography, Modal, Input, Table, message } from 'antd';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './Calendar.css';

const { Title } = Typography;
const { Search } = Input;
const localizer = momentLocalizer(moment);

const Calendar = () => {
  const [activities, setActivities] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(moment().startOf('month'));

  useEffect(() => {
    fetchActivities();
  }, [currentMonth]);

  useEffect(() => {
    // Set current month on initial load
    handleNavigate(new Date());
  }, []);

  const fetchActivities = async () => {
    try {
      const from = currentMonth.format('YYYY-MM-DD');
      const to = currentMonth.endOf('month').format('YYYY-MM-DD');
      const response = await axios.get('http://localhost:5001/calendar/activities/range', {
        params: { from, to }
      });
      setActivities(response.data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const handleSearch = async (value) => {
    try {
      const response = await axios.get('http://localhost:5001/devotees', {
        params: { search: value }
      });
      const devotees = response.data;

      const activities = await Promise.all(devotees.map(async (devotee) => {
        const res = await axios.get(`http://localhost:5001/devotees/${devotee.DevoteeId}/activities`, {
          params: { printDateNull: true } // Only fetch activities with PrintDate as null
        });
        return res.data;
      }));

      setSearchResults(activities.flat());
    } catch (error) {
      console.error('Error searching devotees:', error);
    }
  };

  const handleEventClick = (activity) => {
    setSelectedActivity(activity);
  };

  const handleDateChange = async (date, activityId) => {
    if (!date) {
      message.error('Invalid date selected');
      return;
    }

    try {
      await axios.put(`http://localhost:5001/calendar/activities/${activityId}`, {
        ServiceDate: moment(date).format('YYYY-MM-DD')
      });
      message.success('Service Date updated successfully');
      fetchActivities();
      if (selectedActivity) {
        handleSearch(selectedActivity.DevoteeName);
      }
    } catch (error) {
      console.error('Error updating Service Date:', error);
      message.error('Failed to update Service Date');
    }
  };

  const handleOk = async () => {
    if (selectedActivity) {
      try {
        await axios.put(`http://localhost:5001/calendar/activities/${selectedActivity.ActivityId}/complete`);
        message.success('Event marked as complete');
        setSelectedActivity(null);
        fetchActivities();
      } catch (error) {
        console.error('Error marking event as complete:', error);
        message.error('Failed to mark event as complete');
      }
    }
  };

  const handleCancel = () => {
    setSelectedActivity(null);
  };

  const handleNavigate = (date) => {
    setCurrentMonth(moment(date).startOf('month'));
  };

  const columns = [
    {
      title: 'Devotee Name',
      dataIndex: 'DevoteeName',
      key: 'DevoteeName',
    },
    {
      title: 'Service Name',
      dataIndex: 'EventName',
      key: 'EventName',
    },
    {
      title: 'Service Date',
      dataIndex: 'ServiceDate',
      key: 'ServiceDate',
      render: (text, record) => (
        <DatePicker
          selected={new Date(text)}
          onChange={(date) => handleDateChange(date, record.ActivityId)}
          dateFormat="yyyy-MM-dd"
        />
      ),
    },
  ];

  const events = activities.map(activity => ({
    title: activity.EventName,
    start: new Date(activity.ServiceDate),
    end: new Date(activity.ServiceDate),
    allDay: true,
    resource: activity,
  }));

  return (
    <div className="calendar-container">
      <Row gutter={16}>
        <Col span={17}>
          <Card className="section-card">
            <Title level={3}>Events Calendar</Title>
            <BigCalendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 500 }}
              onSelectEvent={(event) => handleEventClick(event.resource)}
              onNavigate={handleNavigate}
            />
          </Card>
        </Col>
        <Col span={7}>
          <Card className="section-card">
            <Title level={3}>Change Seva Date</Title>
            <Search
              placeholder="Search by name, email, or phone"
              enterButton="Search"
              onSearch={handleSearch}
            />
            <Table
              dataSource={searchResults}
              columns={columns}
              rowKey="ActivityId"
              pagination={false}
              size="small"
              style={{ marginTop: 20 }}
            />
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
