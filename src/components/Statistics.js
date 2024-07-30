import React, { useState, useEffect } from 'react';
import { Button, Table, Slider, Row, Col, Typography, Card } from 'antd';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { startOfYear, endOfYear, subMonths } from 'date-fns';
import './Statistics.css'; // Assuming you create this CSS file for custom styles

const { Title } = Typography;

const Statistics = () => {
  const [data, setData] = useState([]);
  const [serviceData, setServiceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(startOfYear(new Date()));
  const [endDate, setEndDate] = useState(new Date());
  const [priceRange, setPriceRange] = useState([1, 10000]);
  const [maxAmount, setMaxAmount] = useState(10000);

  const columns = [
    {
      title: 'Devotee ID',
      dataIndex: 'DevoteeId',
      key: 'DevoteeId',
      align: 'center',
    },
    {
      title: 'Devotee Name',
      dataIndex: 'DevoteeName',
      key: 'DevoteeName',
      align: 'center',
    },
    {
      title: 'Total Contribution',
      dataIndex: 'TotalAmount',
      key: 'TotalAmount',
      align: 'center',
    },
  ];

  const serviceColumns = [
    {
      title: 'Service',
      dataIndex: 'Service',
      key: 'Service',
      align: 'center',
    },
    {
      title: 'Count',
      dataIndex: 'Count',
      key: 'Count',
      align: 'center',
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
    fetchData(); // Fetch data based on the new price range
  };

  const setDateRange = (months) => {
    const start = subMonths(new Date(), months);
    const end = new Date();
    setStartDate(start);
    setEndDate(end);
  };

  const setThisYearDateRange = () => {
    const start = startOfYear(new Date());
    const end = endOfYear(new Date());
    setStartDate(start);
    setEndDate(end);
  };

  return (
    <div style={{ padding: 24, minHeight: 280, background: '#f0f2f5' }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: 20 }}>Statistics</Title>
      <Row gutter={16} justify="center" style={{ marginBottom: 20 }}>
        <Col>
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            className="custom-date-picker"
          />
        </Col>
        <Col>
          <span>to</span>
        </Col>
        <Col>
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            className="custom-date-picker"
          />
        </Col>
      </Row>
      <Row gutter={16} justify="center" style={{ marginBottom: 20 }}>
        <Col>
          <Button type="primary" onClick={() => setDateRange(1)}>Last Month</Button>
        </Col>
        <Col>
          <Button type="primary" onClick={() => setDateRange(6)}>Last 6 Months</Button>
        </Col>
        <Col>
          <Button type="primary" onClick={setThisYearDateRange}>This Year</Button>
        </Col>
      </Row>
      <Row gutter={16} justify="center" style={{ marginBottom: 20 }}>
        <Col span={12}>
          <Slider
            range
            min={1}
            max={maxAmount}
            step={10}
            value={priceRange}
            onChange={handlePriceRangeChange}
            style={{ width: '100%' }}
            tooltip={{ open: true, formatter: (value) => `$${value}` }}
          />
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Card title="Top 10 Contributions" bordered={false}>
            <Table columns={columns} dataSource={data} loading={loading} rowKey="DevoteeId" pagination={false} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Most Done Services" bordered={false}>
            <Table columns={serviceColumns} dataSource={serviceData} loading={loading} rowKey="Service" pagination={false} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Statistics;
