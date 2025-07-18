import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Card, Col, Row, Typography, Modal, Input, message, Button, Table } from 'antd';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './Calendar.css';
import { jwtDecode } from 'jwt-decode';
import BACKEND_BASE_URL from '../ipConfiguration';

const { Title } = Typography;
const { Search } = Input;
const { confirm } = Modal;
const localizer = momentLocalizer(moment);

const Calendar = () => {
  const [activities, setActivities] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(moment().startOf('month'));
  const [accessControl, setAccessControl] = useState({});
  const [searchPerformed, setSearchPerformed] = useState(false);
  
  const token = localStorage.getItem('token');

  const axiosInstance = useMemo(() => axios.create({
    baseURL: `${BACKEND_BASE_URL}`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }), [token]);

  useEffect(() => {
    if (token) {
      const decodedToken = jwtDecode(token);
      fetchAccessControl(decodedToken.usertype);
    }
  }, [token]);

  // Fetch access control settings based on user type
  const fetchAccessControl = async (userType) => {
    try {
      const response = await axiosInstance.get(`/access-control/${userType}`);
      const data = await response.data;
      setAccessControl(data);
    } catch (error) {
      console.error('Failed to fetch access control data:', error);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [currentMonth]);

  useEffect(() => {
    handleNavigate(new Date());
    fetchTodaysActivities();
  }, []);

  // Fetch activities for the current month
  const fetchActivities = async () => {
    try {
      const from = currentMonth.startOf('month').format('YYYY-MM-DD');
      const to = currentMonth.endOf('month').format('YYYY-MM-DD');
      const response = await axiosInstance.get('/calendar/activities/range', {
        params: { from, to }
      });
      const filteredActivities = response.data.filter(activity => activity.EventName !== 'DONATION');
      setActivities(filteredActivities);
      //console.log('Fetched activities from server');
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  // Fetch today's activities
  const fetchTodaysActivities = async () => {
    try {
      const today = moment().startOf('day').format('YYYY-MM-DD');
      const response = await axiosInstance.get('/calendar/activities/range', {
        params: { from: today, to: today }
      });
      const todaysEvents = response.data.filter(activity => activity.EventName !== 'DONATION');
      setSearchResults(todaysEvents);
      console.log('Fetched today\'s activities from server');
    } catch (error) {
      console.error('Error fetching today\'s activities:', error);
    }
  };

  // Handle search input and perform search
  const handleSearch = async (value) => {
    try {
      const response = await axiosInstance.get('/devotees', {
        params: { search: value }
      });
      const devotees = response.data;

      const activities = await Promise.all(devotees.map(async (devotee) => {
        const res = await axiosInstance.get(`/devotees/${devotee.DevoteeId}/activities`, {
          params: { printDateNull: true }
        });
        return res.data.filter(activity => activity.EventName !== 'DONATION');
      }));

      setSearchResults(activities.flat());
      setSearchPerformed(true);
      console.log('Performed search and fetched results');
    } catch (error) {
      console.error('Error searching devotees:', error);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    if (value.length >= 3) {
      handleSearch(value);
    } else {
      setSearchResults([]);
      setSearchPerformed(false);
    }
  };

  // Handle date change for activities
  const handleDateChange = async (date, activityId) => {
    if (!date) {
      message.error('Invalid date selected');
      return;
    }
  
    try {
      await axiosInstance.put(`/calendar/activities/${activityId}`, {
        ServiceDate: date
      });
      message.success('Service Date updated successfully');
      await fetchActivities();
      await fetchTodaysActivities();
      console.log('Updated service date and refreshed data');
    } catch (error) {
      console.error('Error updating Service Date:', error);
      message.error('Failed to update Service Date');
    }
  };

  // Handle marking an event as complete
  const handleComplete = async (activityId) => {
    confirm({
      title: 'Are you sure you want to mark this event as complete?',
      onOk: async () => {
        try {
          await axiosInstance.put(`/calendar/activities/${activityId}/complete`);
          message.success('Event marked as complete');
          await fetchActivities();
          await fetchTodaysActivities();
          console.log('Marked event as complete and refreshed data');
        } catch (error) {
          console.error('Error marking event as complete:', error);
          message.error('Failed to mark event as complete');
        }
      },
      onCancel() {
        console.log('Cancelled marking event as complete');
      },
    });
  };

  const handleOk = async () => {
    if (selectedActivity) {
      try {
        await axiosInstance.put(`/calendar/activities/${selectedActivity.ActivityId}/complete`);
        message.success('Event marked as complete');
        setSelectedActivity(null);
        await fetchActivities();
        await fetchTodaysActivities();
        console.log('Marked event as complete from modal and refreshed data');
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

  const events = activities
    .filter(activity => activity.EventName !== 'DONATION')
    .map(activity => ({
      title: activity.EventName,
      start: moment(activity.ServiceDate).toDate(),
      end: moment(activity.ServiceDate).toDate(),
      allDay: true,
      resource: activity,
    }));

  const todaysEvents = activities
    .filter(activity => 
      activity.EventName !== 'DONATION' && 
      moment(activity.ServiceDate).isSame(moment().startOf('day'), 'day')
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
          selected={moment(text).toDate()}
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
                    {accessControl.Calendar?.can_edit === 1 && (
                      <Button type="primary" onClick={() => handleComplete(event.ActivityId)}>
                        Mark Seva as Completed
                      </Button>
                    )}
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
              placeholder="Search by Name, Phone, or Email"
              enterButton="Search"
              onChange={handleInputChange}
            />
            <Table
              dataSource={searchPerformed ? searchResults : todaysEvents}
              columns={columns}
              rowKey="ActivityId"
              pagination={false}
              size="small"
              locale={{ emptyText: searchPerformed ? 'No match' : 'No data' }}
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
        okButtonProps={{ style: { display: accessControl.Calendar?.can_edit === 1 ? 'inline-block' : 'none' } }}
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
