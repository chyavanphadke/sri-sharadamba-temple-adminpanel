import React, { useState, useEffect } from 'react';
import { Button, Table, Slider, Row, Col, Typography, Card, Space, Tabs, Select } from 'antd';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { startOfYear, endOfYear, subMonths, format } from 'date-fns';
import './Statistics.css';

const { Title } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

const Statistics = () => {
  const [data, setData] = useState([]);
  const [serviceData, setServiceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(startOfYear(new Date()));
  const [endDate, setEndDate] = useState(new Date());
  const [priceRange, setPriceRange] = useState([1, 10000]);
  const [maxAmount, setMaxAmount] = useState(10000);
  const [selectedButton, setSelectedButton] = useState('thisYear');
  const [serviceCategories, setServiceCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(1); // Default category_id = 1
  const [selectedService, setSelectedService] = useState(2); // Default ServiceId = 2
  const [devoteeData, setDevoteeData] = useState([]);
  const [resultCount, setResultCount] = useState(0);

  const columns = [
    { title: 'Devotee ID', dataIndex: 'DevoteeId', key: 'DevoteeId' },
    { title: 'Devotee Name', dataIndex: 'DevoteeName', key: 'DevoteeName' },
    { title: 'Total Contribution', dataIndex: 'TotalAmount', key: 'TotalAmount' },
  ];

  const serviceColumns = [
    { title: 'Service', dataIndex: 'Service', key: 'Service' },
    { title: 'Count', dataIndex: 'Count', key: 'Count', sorter: (a, b) => a.Count - b.Count },
  ];

  const devoteeColumns = [
    { title: 'Devotee Name', dataIndex: 'DevoteeName', key: 'DevoteeName' },
    {
      title: 'Service Date',
      dataIndex: 'ServiceDate',
      key: 'ServiceDate',
      render: (text) => format(new Date(text), "MMM do, yyyy"),
    },
  ];

  useEffect(() => {
    // Fetch initial data
    fetchData();
    fetchServiceData();
    fetchMaxAmount();
    fetchServiceCategories();
    fetchServices(1); // Default to servicecategory.category_id = 1
  }, []);

  useEffect(() => {
    // Fetch data when startDate or endDate changes
    fetchData();
    fetchServiceData();
  }, [startDate, endDate]);

  useEffect(() => {
    if (selectedService) {
      fetchDevotees();
    }
  }, [selectedService, startDate, endDate]);

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
        params: { from: startDate.toISOString().split('T')[0], to: endDate.toISOString().split('T')[0] },
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
        params: { from: startDate.toISOString().split('T')[0], to: endDate.toISOString().split('T')[0] },
      });
      const max = response.data || 10000;
      setMaxAmount(max);
      setPriceRange([1, max]);
    } catch (error) {
      console.error('Error fetching max contribution:', error);
    }
  };

  const fetchServiceCategories = async () => {
    try {
      const response = await axios.get('http://localhost:5001/servicecategoriesStat');
      setServiceCategories(response.data);
    } catch (error) {
      console.error('Error fetching service categories:', error);
    }
  };

  const fetchServices = async (categoryId) => {
    try {
      const response = await axios.get('http://localhost:5001/servicesStat', { params: { categoryId } });
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchDevotees = async () => {
    try {
      const response = await axios.get('http://localhost:5001/activitiesStat', {
        params: { serviceId: selectedService, from: startDate, to: endDate },
      });
      setDevoteeData(response.data);
      setResultCount(response.data.length);
    } catch (error) {
      console.error('Error fetching devotees:', error);
    }
  };

  const setDateRange = (months) => {
    const start = subMonths(new Date(), months);
    const end = new Date();
    setStartDate(start);
    setEndDate(end);
    setSelectedButton(months === 1 ? 'lastMonth' : months === 6 ? 'lastSixMonths' : 'lastYear');
  };

  const setThisYearDateRange = () => {
    const start = startOfYear(new Date());
    const end = endOfYear(new Date());
    setStartDate(start);
    setEndDate(end);
    setSelectedButton('thisYear');
  };

  const setLastYearDateRange = () => {
    const start = startOfYear(new Date().setFullYear(new Date().getFullYear() - 1));
    const end = endOfYear(new Date().setFullYear(new Date().getFullYear() - 1));
    setStartDate(start);
    setEndDate(end);
    setSelectedButton('lastYear');
  };

  const handlePriceRangeChange = (value) => {
    setPriceRange(value);
    fetchData();
  };

  return (
    <div className="statistics-container">
      <Title level={2} className="statistics-title">Statistics Dashboard</Title>
      <Card className="filters-card">
        <Title level={4} style={{ marginBottom: 16, fontSize: '18px' }}>Filter Options</Title>
        <Row gutter={[16, 16]} align="middle">
          {/* Date Range Selectors */}
          <Col xs={12} sm={6} md={4}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Typography.Text strong style={{ fontSize: '14px' }}>Start Date</Typography.Text>
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                className="date-picker compact-date-picker"
              />
            </Space>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Typography.Text strong style={{ fontSize: '14px' }}>End Date</Typography.Text>
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                className="date-picker compact-date-picker"
              />
            </Space>
          </Col>

          {/* Quick Date Range Buttons */}
          <Col xs={24} sm={12} md={10}>
            <Typography.Text strong style={{ fontSize: '14px' }}>Quick Date Ranges</Typography.Text>
            <Space size="small" wrap>
              <Button
                type={selectedButton === 'lastMonth' ? 'primary' : 'default'}
                onClick={() => setDateRange(1)}
              >
                Last Month
              </Button>
              <Button
                type={selectedButton === 'lastSixMonths' ? 'primary' : 'default'}
                onClick={() => setDateRange(6)}
              >
                Last 6 Months
              </Button>
              <Button
                type={selectedButton === 'thisYear' ? 'primary' : 'default'}
                onClick={setThisYearDateRange}
              >
                This Year
              </Button>
              <Button
                type={selectedButton === 'lastYear' ? 'primary' : 'default'}
                onClick={setLastYearDateRange}
              >
                Last Year
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Price Range Selector */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={8}>
            <Typography.Text strong style={{ fontSize: '14px' }}>Price Range</Typography.Text>
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
          <Card className="data-card">
            <Tabs defaultActiveKey="1">
              <TabPane tab="Top 10 Contributions" key="1">
                <Table columns={columns} dataSource={data} loading={loading} rowKey="DevoteeId" pagination={{ pageSize: 10 }} />
              </TabPane>
              <TabPane tab="Most Done Services" key="2">
                <Table columns={serviceColumns} dataSource={serviceData} loading={loading} rowKey="Service" pagination={{ pageSize: 10 }} />
              </TabPane>
            </Tabs>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card className="data-card">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Typography.Text strong>Service Category</Typography.Text>
                <Select
                  placeholder="Select Service Category"
                  value={selectedCategory}
                  onChange={(value) => {
                    setSelectedCategory(value);
                    fetchServices(value);
                  }}
                  style={{ width: '100%' }}
                >
                  {serviceCategories.map((cat) => (
                    <Option key={cat.category_id} value={cat.category_id}>
                      {cat.Category_name}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col span={12}>
                <Typography.Text strong>Service</Typography.Text>
                <Select
                  placeholder="Select Service"
                  value={selectedService}
                  onChange={setSelectedService}
                  style={{ width: '100%' }}
                  disabled={!selectedCategory}
                >
                  {services.map((service) => (
                    <Option key={service.ServiceId} value={service.ServiceId}>
                      {service.Service}
                    </Option>
                  ))}
                </Select>
              </Col>
            </Row>
            {selectedService && (
              <Typography.Text style={{ marginTop: 20 }} strong>
                Total Results: {resultCount}
              </Typography.Text>
            )}
            <Table
              style={{ marginTop: 20 }}
              columns={devoteeColumns}
              dataSource={devoteeData}
              loading={loading}
              rowKey="DevoteeId"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Statistics;
