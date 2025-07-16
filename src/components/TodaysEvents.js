import React, { useState, useEffect } from 'react';
import { Layout, Row, Col, Card, Typography, Button } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import './TodaysEvents.css';
import BACKEND_BASE_URL from '../ipConfiguration';

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
      const response = await axios.get(`${BACKEND_BASE_URL}todays-events?date=${date.format('YYYY-MM-DD')}`);
      setEvents(response.data);
      //console.log('Events fetched:', response.data);
    } catch (error) {
      console.error('Failed to fetch events', error);
    }
  };

  // Fetch Panchanga details for the selected date
  const fetchPanchanga = async (date) => {
    try {
      const response = await axios.get(`${BACKEND_BASE_URL}api/panchanga?date=${date.format('M/D/YYYY')}`);
      setPanchanga(response.data);
      //console.log('Panchanga fetched:', response.data);
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

  // Place this inside your TodaysEvents component, but outside renderPanchanga
  const formatEventWithTime = (raw) => {
    if (!raw) return { name: "Unknown", till: "" };

    const [name, tillRaw] = raw.split("till");
    const cleanName = name.trim();
    if (!tillRaw) return { name: cleanName, till: "" };

    const tillMoment = moment(tillRaw.trim(), ["MMM/DD HH:mm:ss", "HH:mm:ss"]);
    const formattedTime = tillMoment.isValid()
      ? tillMoment.format(tillRaw.includes("/") ? "MMM DD hh:mm:ss A" : "hh:mm:ss A")
      : tillRaw.trim();

    return {
      name: cleanName,
      till: formattedTime
    };
  };

  // Updated renderPanchanga function
  const renderPanchanga = () => {
    const tithi = formatEventWithTime(panchanga.Tithi);
    const nakshatra = formatEventWithTime(panchanga.Nakshatra);

    return (
      <Card title="Panchanga" className="panchanga-card">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <div className="panchang-item"><b>{panchanga.Samvatsara}</b> Samvatsare</div>
            <div className="panchang-item"><b>{panchanga.Ayana}</b></div>
            <div className="panchang-item"><b>{panchanga.Ritu}</b> Ruthow</div>
            <div className="panchang-item"><b>{panchanga.Paksha}</b></div>

            <div className="panchang-item">
              {tithi.name} <b>Thithou</b>
              {tithi.till && ` till ${tithi.till}`}
            </div>

            <div className="panchang-item"><b>{panchanga.Vaasara}</b> Vaasara</div>

            <div className="panchang-item">
              {nakshatra.name} <b>Nakshatre</b>
              {nakshatra.till && ` till ${nakshatra.till}`}
            </div>
          </Col>
        </Row>
      </Card>
    );
  };

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
