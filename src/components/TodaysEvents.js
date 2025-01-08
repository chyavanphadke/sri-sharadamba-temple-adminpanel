import React, { useState, useEffect } from 'react';
import { Layout, Row, Col, Card, Typography, Button } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import './TodaysEvents.css';

const { Content } = Layout;
const { Title, Text } = Typography;

const TodaysEvents = () => {
  // State management
  const [events, setEvents] = useState({});
  const [selectedDate, setSelectedDate] = useState(moment());
  const [panchanga, setPanchanga] = useState({});

  // Fetch events and Panchanga on component mount and date change
  useEffect(() => {
    fetchEvents(selectedDate);
    fetchPanchanga(selectedDate);
  }, [selectedDate]);

  // Fetch events for the selected date
  const fetchEvents = async (date) => {
    try {
      const response = await axios.get(`http://localhost:5001/todays-events?date=${date.format('YYYY-MM-DD')}`);
      setEvents(response.data);
      console.log('Events fetched:', response.data);
    } catch (error) {
      console.error('Failed to fetch events', error);
    }
  };

  // Fetch Panchanga details for the selected date
  const fetchPanchanga = async (date) => {
    try {
      const response = await axios.get(`http://localhost:5001/api/panchanga?date=${date.format('M/D/YYYY')}`);
      setPanchanga(response.data);
      console.log('Panchanga fetched:', response.data);
    } catch (error) {
      console.error('Failed to fetch Panchanga', error);
    }
  };

  // Handle previous day navigation
  const handlePreviousDay = () => {
    setSelectedDate(selectedDate.clone().subtract(1, 'days'));
  };

  // Handle next day navigation
  const handleNextDay = () => {
    setSelectedDate(selectedDate.clone().add(1, 'days'));
  };

  // Render an event card
  const renderEventCard = (service, activities) => {
    if (service === "DONATION") return null;
    return (
      <Col xs={24} sm={12} md={8} key={service}>
        <Card title={service} className="event-card">
          {activities.map((item, index) => (
            <div key={index} className="event-detail">
              <Text strong>{index + 1}. Name: </Text><Text>{item.FirstName} {item.LastName}</Text><br />
              <Text style={{ marginLeft: '12px' }} strong>Gotra: </Text><Text>{item.Gotra}</Text><br />
              <Text style={{ marginLeft: '12px' }} strong>Star: </Text><Text>{item.Star}</Text><br />
              <Text style={{ marginLeft: '12px' }} strong>Family Members:</Text><br />
              {item.FamilyMembers.map((member, memberIndex) => (
                <div key={memberIndex} style={{ marginLeft: '24px' }}>
                  <Text>{memberIndex + 1}. Relation: {member.RelationShip || 'N/A'}, </Text><br />
                  <Text style={{ marginLeft: '12px' }}>Name: {member.FirstName || 'N/A'} {member.LastName || 'N/A'}, </Text><br />
                  <Text style={{ marginLeft: '12px' }}>Gotra: {member.Gotra || 'N/A'}, </Text><br />
                  <Text style={{ marginLeft: '12px' }}>Star: {member.Star || 'N/A'}</Text><br />
                </div>
              ))}
            </div>
          ))}
        </Card>
      </Col>
    );
  };

  // Render Panchanga details
  const renderPanchanga = () => (
    <Card title="Panchanga" className="panchanga-card">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Text><strong>Samvatsara:</strong> {panchanga.Samvatsara}</Text><br />
          <Text><strong>Ayana:</strong> {panchanga.Ayana}</Text><br />
          <Text><strong>Ritu:</strong> {panchanga.Ritu}</Text><br />
          <Text><strong>Paksha:</strong> {panchanga.Paksha}</Text><br />
          <Text><strong>Tithi:</strong> {panchanga.Tithi}</Text><br />
          <Text><strong>Vaasara:</strong> {panchanga.Vaasara}</Text><br />
          <Text><strong>Nakshatra:</strong> {panchanga.Nakshatra}</Text><br />
        </Col>
      </Row>
    </Card>
  );  

  return (
    <Layout className="todays-events-container">
      <Content style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px' }}>
          <Button icon={<LeftOutlined />} onClick={handlePreviousDay} />
          <Title level={3} style={{ margin: '0 16px' }}>{selectedDate.format('MMMM Do YYYY')}</Title>
          <Button icon={<RightOutlined />} onClick={handleNextDay} />
        </div>
        {renderPanchanga()}
        {Object.keys(events).length === 0 ? (
          <Title level={4} style={{ textAlign: 'center' }}>No Seva for Today</Title>
        ) : (
          <Row gutter={[16, 16]}>
            {Object.entries(events).map(([service, activities]) => renderEventCard(service, activities))}
          </Row>
        )}
      </Content>
    </Layout>
  );
};

export default TodaysEvents;
