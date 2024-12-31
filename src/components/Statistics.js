// Statistics.js
import React, { useState, useEffect } from 'react';
import { Button, Table, Slider, Row, Col, Typography, Card, Space } from 'antd';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { startOfYear, endOfYear, subMonths } from 'date-fns';
import './Statistics.css';

const { Title } = Typography;

const Statistics = () => {
  const [data, setData] = useState([]);
  const [serviceData, setServiceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(startOfYear(new Date()));
  const [endDate, setEndDate] = useState(new Date());
  const [priceRange, setPriceRange] = useState([1, 10000]);
  const [maxAmount, setMaxAmount] = useState(10000);
  const [selectedButton, setSelectedButton] = useState('thisYear');

  const columns = [
    {
      title: 'Devotee ID',
      dataIndex: 'DevoteeId',
      key: 'DevoteeId',
    },
    {
      title: 'Devotee Name',
      dataIndex: 'DevoteeName',
      key: 'DevoteeName',
    },
    {
      title: 'Total Contribution',
      dataIndex: 'TotalAmount',
      key: 'TotalAmount',
    },
  ];

  const serviceColumns = [
    {
      title: 'Service',
      dataIndex: 'Service',
      key: 'Service',
    },
    {
      title: 'Count',
      dataIndex: 'Count',
      key: 'Count',
      sorter: (a, b) => a.Count - b.Count,
    },
  ];

  useEffect(() => {
    fetchData();
    fetchServiceData();
    fetchMaxAmount();
  }, [startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5001/statistics', {
        params: {
          from: startDate.toISOString().split('T')[0],
          to: endDate.toISOString().split('T')[0],
          minAmount: priceRange[0],
          maxAmount: priceRange[1],
        },
      });
      setData(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchServiceData = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5001/statistics/most-done-services', {
        params: {
          from: startDate.toISOString().split('T')[0],
          to: endDate.toISOString().split('T')[0],
        },
      });
      setServiceData(response.data);
    } catch (error) {
      console.error('Error fetching most done services:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMaxAmount = async () => {
    try {
      const response = await axios.get('http://localhost:5001/statistics/max-contribution', {
        params: {
          from: startDate.toISOString().split('T')[0],
          to: endDate.toISOString().split('T')[0],
        },
      });
      const max = response.data || 10000;
      setMaxAmount(max);
      setPriceRange([1, max]);
    } catch (error) {
      console.error('Error fetching max contribution:', error);
    }
  };

  const handlePriceRangeChange = (value) => {
    setPriceRange(value);
    fetchData();
  };

  const setDateRange = (months) => {
    const start = subMonths(new Date(), months);
    const end = new Date();
    setStartDate(start);
    setEndDate(end);
    setSelectedButton(months === 1 ? 'lastMonth' : 'lastSixMonths');
  };

  const setThisYearDateRange = () => {
    const start = startOfYear(new Date());
    const end = endOfYear(new Date());
    setStartDate(start);
    setEndDate(end);
    setSelectedButton('thisYear');
  };

  return (
    <div className="statistics-container">
      <Title level={2} className="statistics-title">Statistics Dashboard</Title>
      <Card className="filters-card">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} lg={6}>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              className="date-picker"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              className="date-picker"
            />
          </Col>
          <Col xs={24} lg={12}>
            <Space>
              <Button type={selectedButton === 'lastMonth' ? 'primary' : 'default'} onClick={() => setDateRange(1)}>Last Month</Button>
              <Button type={selectedButton === 'lastSixMonths' ? 'primary' : 'default'} onClick={() => setDateRange(6)}>Last 6 Months</Button>
              <Button type={selectedButton === 'thisYear' ? 'primary' : 'default'} onClick={setThisYearDateRange}>This Year</Button>
            </Space>
          </Col>
        </Row>
        <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
          <Col span={12}>
            <Slider
              range
              min={1}
              max={maxAmount}
              step={10}
              value={priceRange}
              onChange={handlePriceRangeChange}
              className="price-slider"
              tooltip={{ open: true, formatter: (value) => `$${value}` }}
            />
          </Col>
        </Row>
      </Card>
      <Row gutter={[24, 24]} style={{ marginTop: 20 }}>
        <Col xs={24} md={12}>
          <Card title="Top 10 Contributions" className="data-card">
            <Table
              columns={columns}
              dataSource={data}
              loading={loading}
              rowKey="DevoteeId"
              pagination={{ pageSize: 10 }}
              className="modern-table"
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Most Done Services" className="data-card">
            <Table
              columns={serviceColumns}
              dataSource={serviceData}
              loading={loading}
              rowKey="Service"
              pagination={{ pageSize: 10 }}
              className="modern-table"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Statistics;
