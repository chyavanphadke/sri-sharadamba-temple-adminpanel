import React, { useEffect, useState } from 'react';
import { Card, Input, Button, Typography, message, Divider, Space, Row, Col } from 'antd';
import axios from 'axios';
import BACKEND_BASE_URL from '../ipConfiguration';

const { Title, Text } = Typography;

const WebHost = () => {
  const PIN_SECRET = 'sringer1';

  const [ngrokPinArray, setNgrokPinArray] = useState(new Array(8).fill(''));
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [isServerRunning, setIsServerRunning] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [emailToSend, setEmailToSend] = useState('');
  const [ngrokUrl, setNgrokUrl] = useState('');
  const [hostStartTime, setHostStartTime] = useState('');
  const [hostStopIn, setHostStopIn] = useState('');
  const [stopInInput, setStopInInput] = useState('');

  useEffect(() => {
    checkServerStatus();
  }, []);

  const checkServerStatus = async () => {
    setLoadingStatus(true);
    try {
      const statusRes = await axios.get(`${BACKEND_BASE_URL}/ngrok-status`);
      setIsServerRunning(statusRes.data.status);

      if (statusRes.data.status) {
        const [urlRes, startTimeRes, stopInRes] = await Promise.all([
          axios.get(`${BACKEND_BASE_URL}/general-configurations/hostServerUrl`),
          axios.get(`${BACKEND_BASE_URL}/general-configurations/hostServerStartTime`),
          axios.get(`${BACKEND_BASE_URL}/general-configurations/hostServerStopIn`)
        ]);

        setNgrokUrl(urlRes.data.value);
        setHostStartTime(startTimeRes.data.value);
        setHostStopIn(stopInRes.data.value);
        setStopInInput(stopInRes.data.value);
      }
    } catch (err) {
      message.error('Failed to fetch server status or configuration.');
    }
    setLoadingStatus(false);
  };

  const handlePinChange = (value, index) => {
    const newPin = [...ngrokPinArray];
    newPin[index] = value.slice(-1);
    setNgrokPinArray(newPin);

    if (value && index < 7) {
      const next = document.getElementById(`pin-input-${index + 1}`);
      next && next.focus();
    }

    const isFull = newPin.every((c) => c.length === 1);
    if (isFull && newPin.join('').toLowerCase() === PIN_SECRET.toLowerCase()) {
      setIsPinVerified(true);
    }
  };

  const handleStartNgrok = async () => {
    try {
      const res = await axios.post(`${BACKEND_BASE_URL}/start-ngrok`);
      message.success(`Ngrok started at: ${res.data.url}`);
      setNgrokUrl(res.data.url);
      setIsServerRunning(true);
      setNgrokPinArray(new Array(8).fill(''));
      setIsPinVerified(false);
      checkServerStatus();
    } catch {
      message.error('Failed to start server');
    }
  };

  const handleStopNgrok = async () => {
    try {
      await axios.post(`${BACKEND_BASE_URL}/stop-ngrok`);
      message.success('Server stopped');
      setIsServerRunning(false);
      setNgrokUrl('');
      setEmailToSend('');
    } catch {
      message.error('Failed to stop server');
    }
  };

  const handleSendNgrokEmail = async () => {
    try {
      if (!emailToSend.trim()) {
        return message.warning('Please enter an email address.');
      }
      const res = await axios.post(`${BACKEND_BASE_URL}/send-ngrok-url`, { email: emailToSend });
      message.success(res.data);
      setEmailToSend('');
    } catch {
      message.error('Failed to send URL');
    }
  };

  const updateStopIn = async () => {
    const hrs = parseInt(stopInInput, 10);
    if (isNaN(hrs) || hrs < 1 || hrs > 10) {
      return message.warning('Stop time must be between 1–10 hours');
    }

    try {
      await axios.put(`${BACKEND_BASE_URL}/update-stop-in`, { hours: hrs });
      setHostStopIn(hrs.toString());
      message.success('Updated stop time');
    } catch {
      message.error('Failed to update stop time');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}>
      <Card
        style={{
          width: 520,
          padding: 24,
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}
        bordered={false}
        title={<Title level={4} style={{ textAlign: 'center', marginBottom: 0 }}>Temporary Web Host (BETA)</Title>}
      >
        {loadingStatus ? (
          <Text>Checking server status...</Text>
        ) : isServerRunning ? (
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Button danger type="primary" onClick={handleStopNgrok} style={{ width: 160 }}>
              Stop Server
            </Button>

            {ngrokUrl && (
              <Text>
                Access URL: <a href={ngrokUrl} target="_blank" rel="noopener noreferrer">{ngrokUrl}</a>
              </Text>
            )}

            <Divider style={{ margin: '10px 0' }} />

            <Text strong>Started At:</Text>
            <Text type="secondary" style={{ marginBottom: 6 }}>
              {new Date(hostStartTime).toLocaleString()}
            </Text>

            <Row gutter={8} align="middle">
              <Col><Text strong>Auto Stop (hrs):</Text></Col>
              <Col>
                <Input
                  type="number"
                  value={stopInInput}
                  onChange={(e) => setStopInInput(e.target.value)}
                  min={1}
                  max={10}
                  style={{ width: 80 }}
                />
              </Col>
              <Col>
                <Button size="small" onClick={updateStopIn}>Update</Button>
              </Col>
            </Row>

            <Divider style={{ margin: '10px 0' }} />

            <Text strong>Send the URL to your email</Text>
            <Input
              placeholder="example@email.com"
              value={emailToSend}
              onChange={(e) => setEmailToSend(e.target.value)}
              style={{ marginTop: 4 }}
            />
            <Button onClick={handleSendNgrokEmail} type="default" size="small" style={{ marginTop: 6 }}>
              Send Link
            </Button>
          </Space>
        ) : !isPinVerified ? (
          <div style={{ textAlign: 'center' }}>
            <Text strong>Please enter 8-digit access PIN</Text>
            <Row justify="center" gutter={6} style={{ marginTop: 14 }}>
              {ngrokPinArray.map((char, index) => (
                <Col key={index}>
                  <Input.Password
                    id={`pin-input-${index}`}
                    maxLength={1}
                    value={char}
                    onChange={(e) => handlePinChange(e.target.value, index)}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !char && index > 0) {
                        const prev = document.getElementById(`pin-input-${index - 1}`);
                        prev && prev.focus();
                      }
                    }}
                    style={{
                      width: 38,
                      height: 40,
                      textAlign: 'center',
                      fontSize: 16,
                      borderRadius: 6,
                    }}
                    autoComplete="off"
                    visibilityToggle={false}
                  />
                </Col>
              ))}
            </Row>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
            <Button type="primary" onClick={handleStartNgrok} style={{ width: 180 }}>
              Start Server
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default WebHost;
