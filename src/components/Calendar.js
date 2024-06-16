import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Col, Row, Typography, Modal, Input, message, Button, Table } from 'antd';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment-timezone';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './Calendar.css';

const { Title } = Typography;
const { Search } = Input;
const { confirm } = Modal;
const localizer = momentLocalizer(moment);

const Calendar = () => {
  const [activities, setActivities] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(moment().utc().startOf('month'));

  useEffect(() => {
    fetchActivities();
  }, [currentMonth]);

  useEffect(() => {
    handleNavigate(new Date());
    fetchTodaysActivities();
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

  const fetchTodaysActivities = async () => {
    try {
      const today = moment().utc().startOf('day').format('YYYY-MM-DD');
      const response = await axios.get('http://localhost:5001/calendar/activities/range', {
        params: { from: today, to: today }
      });
      const todaysEvents = response.data;
      setSearchResults(todaysEvents); // Set today's events in search results
    } catch (error) {
      console.error('Error fetching today\'s activities:', error);
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

  const handleDateChange = async (date, activityId) => {
    if (!date) {
      message.error('Invalid date selected');
      return;
    }

    try {
      await axios.put(`http://localhost:5001/calendar/activities/${activityId}`, {
        ServiceDate: moment(date).utc().startOf('day').format('YYYY-MM-DD')
      });
      message.success('Service Date updated successfully');
      fetchActivities(); // Re-fetch activities after date change
      fetchTodaysActivities(); // Re-fetch today's activities
    } catch (error) {
      console.error('Error updating Service Date:', error);
      message.error('Failed to update Service Date');
    }
  };

  const handleComplete = async (activityId) => {
    confirm({
      title: 'Are you sure you want to mark this event as complete?',
      onOk: async () => {
        try {
          await axios.put(`http://localhost:5001/calendar/activities/${activityId}/complete`);
          message.success('Event marked as complete');
          fetchActivities(); // Re-fetch activities after completion
          fetchTodaysActivities(); // Re-fetch today's activities
        } catch (error) {
          console.error('Error marking event as complete:', error);
          message.error('Failed to mark event as complete');
        }
      },
      onCancel() {
        console.log('Cancel');
      },
    });
  };

  const handleOk = async () => {
    if (selectedActivity) {
      try {
        await axios.put(`http://localhost:5001/calendar/activities/${selectedActivity.ActivityId}/complete`);
        message.success('Event marked as complete');
        setSelectedActivity(null);
        fetchActivities(); // Re-fetch activities after completion
        fetchTodaysActivities(); // Re-fetch today's activities
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
    setCurrentMonth(moment(date).utc().startOf('month'));
  };

  const events = activities.map(activity => ({
    title: activity.EventName,
    start: moment.utc(activity.ServiceDate).tz('America/Los_Angeles').toDate(),
    end: moment.utc(activity.ServiceDate).tz('America/Los_Angeles').toDate(),
    allDay: true,
    resource: activity,
  }));

  const todaysEvents = activities.filter(activity =>
    moment(activity.ServiceDate).isSame(moment().utc().startOf('day'), 'day')
  );

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
          selected={moment.utc(text).tz('America/Los_Angeles').toDate()}
          onChange={(date) => handleDateChange(date, record.ActivityId)}
          dateFormat="yyyy-MM-dd"
        />
      ),
    },
  ];

  return (
    <div className="calendar-container">
      <Row gutter={[16, 16]} className="calendar-row">
        <Col xs={24} lg={17} className="detail-col order-1 order-lg-1">
          <Card className="section-card detail-card">
            <Title level={3}>Today's Events in Detail</Title>
            <div className="event-details-container">
              {todaysEvents.length === 0 ? (
                <p>No events for today.</p>
              ) : (
                todaysEvents.map(event => (
                  <Card key={event.ActivityId} className="event-detail-card">
                    <p><strong>Event Name:</strong> {event.EventName}</p>
                    <p><strong>Devotee:</strong> {event.DevoteeName}</p>
                    <p><strong>Ph.:</strong> {event.DevoteePhone}</p>
                    <p><strong>Gotra:</strong> {event.Gotra}, <strong>Star:</strong> {event.Star}</p>
                    <p><strong>Family Members:</strong> {event.FamilyMembers.join(', ')}</p>
                    <Button type="primary" onClick={() => handleComplete(event.ActivityId)}>
                      Completed
                    </Button>
                  </Card>
                ))
              )}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={7} className="order-2 order-lg-3">
          <Card className="section-card">
            <Title level={3}>Change Seva Date</Title>
            <Search
              placeholder="Search by name, email, or phone"
              enterButton="Search"
              onSearch={handleSearch}
            />
            <Table
              dataSource={searchResults.length ? searchResults : todaysEvents}
              columns={columns}
              rowKey="ActivityId"
              pagination={false}
              size="small"
              style={{ marginTop: 20 }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={17} className="order-3 order-lg-2">
          <Card className="section-card calendar-card">
            <Title level={3}>Events Calendar</Title>
            <BigCalendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 'calc(50vh - 80px)' }}
              onSelectEvent={(event) => setSelectedActivity(event.resource)}
              onNavigate={handleNavigate}
            />
          </Card>
        </Col>
      </Row>
      <Modal
        title="Event Details"
        visible={!!selectedActivity}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="Completed"
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
