// src/pages/ServicesPage.js
import React, { useEffect, useRef, useState } from 'react';
import { Table, Row, Col, Button, Form, Input, InputNumber, Popconfirm, message, Tooltip, Switch } from 'antd';
import axios from 'axios';
import './Services.css';
import { TimePicker } from 'antd';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);

const ServicesPage = () => {
  /* ------------------------------------------------------------------ *
   *  STATE
   * ------------------------------------------------------------------ */
  const [categories, setCategories]   = useState([]);
  const [services, setServices]       = useState([]);
  const [selectedCatId, setSelectedCatId] = useState(null);
  const [editingCats, setEditingCats] = useState(false);
  const [editingSvcs, setEditingSvcs] = useState(false);

  const catForm  = useRef(null);
  const svcForm  = useRef(null);

  const [newCategories, setNewCategories] = useState([]);
  const [newServices, setNewServices] = useState([]);

  /* ------------------------------------------------------------------ *
   *  DATA FETCH
   * ------------------------------------------------------------------ */
  useEffect(() => {
    fetchCategories();
    fetchServices();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await axios.get('http://localhost:5001/categories');
      setCategories(data);
    } catch {
      message.error('Failed to load categories');
    }
  };

  const fetchServices = async () => {
    try {
      const { data } = await axios.get('http://localhost:5001/services');
      setServices(data);
    } catch {
      message.error('Failed to load services');
    }
  };

  /* ------------------------------------------------------------------ *
   *  HANDLERS – CATEGORIES
   * ------------------------------------------------------------------ */
  const onCatSelect = (record) => {
    setSelectedCatId(record.category_id);
  };

const saveCategories = async () => {
  try {
    const rows = await catForm.current.validateFields();

    const updated = categories.map((cat) => ({
      ...cat,
      ...rows[cat.category_id],
    }));

    // Separate new and existing
    const existing = updated.filter(cat => !String(cat.category_id).startsWith('new'));
    const newlyCreated = updated.filter(cat => String(cat.category_id).startsWith('new'));

    // Update existing
    for (const cat of existing) {
      await axios.put(`http://localhost:5001/categories/${cat.category_id}`, cat);
    }

    // Post new
    for (const newCat of newlyCreated) {
      await axios.post('http://localhost:5001/categories', newCat);
    }

    setEditingCats(false);
    setNewCategories([]);
    fetchCategories();
    message.success('Categories saved');
  } catch (err) {
    if (err.errorFields) message.error('Fix validation errors');
  }
};


  const deleteCategory = async (cat) => {
    const linked = services.some((svc) => svc.category_id === cat.category_id);
    if (linked) {
      message.error('Cannot delete: services still linked to this category');
      return;
    }
    try {
      await axios.delete(`http://localhost:5001/categories/${cat.category_id}`);
      setCategories(categories.filter((c) => c.category_id !== cat.category_id));
      if (selectedCatId === cat.category_id) setSelectedCatId(null);
      message.success('Category deleted');
    } catch {
      message.error('Failed to delete category');
    }
  };

  /* ------------------------------------------------------------------ *
   *  HANDLERS – SERVICES
   * ------------------------------------------------------------------ */
const saveServices = async () => {
  try {
    const rows = await svcForm.current.validateFields();
const updated = services.map((svc) =>
  svc.category_id === selectedCatId
    ? {
        ...svc,
        ...rows[svc.ServiceId],
        time: rows[svc.ServiceId]?.time?.format?.('HH:mm:ss') || svc.time,
      }
    : svc
);


    const existing = updated.filter(svc => !String(svc.ServiceId).startsWith('new'));
    const newlyCreated = updated.filter(svc => String(svc.ServiceId).startsWith('new'));

    // Update existing
    await axios.put('http://localhost:5001/services', existing);

    // Post new
    for (const newSvc of newlyCreated) {
      await axios.post('http://localhost:5001/services', newSvc);
    }

    setEditingSvcs(false);
    setNewServices([]);
    fetchServices();
    message.success('Services saved');
  } catch (err) {
    if (err.errorFields) message.error('Fix validation errors');
  }
};


  const deleteService = async (svc) => {
    try {
      await axios.delete(`http://localhost:5001/services/${svc.ServiceId}`);
      const remaining = services.filter((s) => s.ServiceId !== svc.ServiceId);
      setServices(remaining);
      message.success('Service deleted');
    } catch {
      message.error('Failed to delete service');
    }
  };

  /* ------------------------------------------------------------------ *
   *  COLUMN HELPERS
   * ------------------------------------------------------------------ */
  const ellipsis = (text, width = 150) => (
    <Tooltip title={text}>
      <div style={{ maxWidth: width, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {text}
      </div>
    </Tooltip>
  );

  /* ====================== CATEGORY COLUMNS ========================= */
  const catColumns = [
    {
      title: 'Category',
      dataIndex: 'Category_name',
      width: 150,
      render: (text, record) =>
        editingCats ? (
          <Form.Item
            name={[record.category_id, 'Category_name']}
            initialValue={text}
            rules={[{ required: true, message: 'Required' }]}
            style={{ margin: 0 }}
          >
            <Input />
          </Form.Item>
        ) : (
          ellipsis(text)
        ),
    },
    {
      title: 'Active',
      dataIndex: 'Active',
      width: 80,
      render: (val, record) =>
        editingCats ? (
          <Form.Item
            name={[record.category_id, 'Active']}
            valuePropName="checked"
            initialValue={Boolean(val)}
            rules={[{ required: true, message: ' ' }]}
            style={{ margin: 0 }}
          >
            <Switch size="small" />
          </Form.Item>
        ) : val ? 'Yes' : 'No',
    },
    {
      title: 'Excel Link',
      dataIndex: 'excelSheetLink',
      width: 200,
      render: (text, record) =>
        editingCats ? (
          <Form.Item name={[record.category_id, 'excelSheetLink']} initialValue={text} style={{ margin: 0 }}>
            <Input />
          </Form.Item>
        ) : (
          ellipsis(text, 200)
        ),
    },
    {
      title: 'Poster',
      dataIndex: 'poster',
      width: 200,
      render: (text, record) =>
        editingCats ? (
          <Form.Item name={[record.category_id, 'poster']} initialValue={text} style={{ margin: 0 }}>
            <Input />
          </Form.Item>
        ) : (
          ellipsis(text, 200)
        ),
    },
    {
      title: editingCats ? 'Delete' : '',
      dataIndex: 'action',
      width: 70,
      render: (_, record) =>
        editingCats ? (
          <Popconfirm title="Delete category?" onConfirm={() => deleteCategory(record)}>
            <a>Delete</a>
          </Popconfirm>
        ) : null,
    },
  ];

  /* ====================== SERVICE COLUMNS ========================== */
  const svcColumns = [
    {
      title: 'Service',
      dataIndex: 'Service',
      width: 150,
      render: (text, record) =>
        editingSvcs ? (
          <Form.Item
            name={[record.ServiceId, 'Service']}
            initialValue={text}
            rules={[{ required: true, message: 'Required' }]}
            style={{ margin: 0 }}
          >
            <Input />
          </Form.Item>
        ) : (
          ellipsis(text)
        ),
    },
    {
      title: 'Rate',
      dataIndex: 'Rate',
      width: 100,
      render: (val, record) =>
        editingSvcs ? (
          <Form.Item
            name={[record.ServiceId, 'Rate']}
            initialValue={val}
            rules={[{ required: true, message: 'Required' }]}
            style={{ margin: 0 }}
          >
            <InputNumber min={0} />
          </Form.Item>
        ) : (
          val
        ),
    },
    {
      title: 'Active',
      dataIndex: 'Active',
      width: 80,
      render: (val, record) =>
        editingSvcs ? (
          <Form.Item
            name={[record.ServiceId, 'Active']}
            valuePropName="checked"
            initialValue={Boolean(val)}
            rules={[{ required: true, message: ' ' }]}
            style={{ margin: 0 }}
          >
            <Switch size="small" />
          </Form.Item>
        ) : val ? 'Yes' : 'No',
    },
    {
  title: 'Time',
  dataIndex: 'time',
  width: 120,
  render: (value, record) =>
    editingSvcs ? (
      <Form.Item
        name={[record.ServiceId, 'time']}
        initialValue={value ? dayjs(value, 'HH:mm:ss') : null}
        rules={[{ required: true, message: 'Required' }]}
        style={{ margin: 0 }}
      >
        <TimePicker use12Hours format="h:mm A" />
      </Form.Item>
    ) : (
      value ? dayjs(value, 'HH:mm:ss').format('h:mm A') : ''
    ),
},
    {
      title: 'Excel Link',
      dataIndex: 'excelSheetLink',
      width: 200,
      render: (text, record) =>
        editingSvcs ? (
          <Form.Item name={[record.ServiceId, 'excelSheetLink']} initialValue={text} style={{ margin: 0 }}>
            <Input />
          </Form.Item>
        ) : (
          ellipsis(text, 200)
        ),
    },
    {
      title: 'Cat ID',
      dataIndex: 'category_id',
      width: 80,
    },
    {
      title: editingSvcs ? 'Delete' : '',
      dataIndex: 'action',
      width: 70,
      render: (_, record) =>
        editingSvcs ? (
          <Popconfirm title="Delete service?" onConfirm={() => deleteService(record)}>
            <a>Delete</a>
          </Popconfirm>
        ) : null,
    },
  ];

  /* ------------------------------------------------------------------ *
   *  RENDER
   * ------------------------------------------------------------------ */
  return (
    <Row gutter={16} style={{ padding: 24 }}>
      {/* ================= Category Table ================ */}
      <Col span={10}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 8 }}>
  <h3 style={{ margin: 0 }}>Service Categories</h3>
  <div>
    {editingCats ? (
      <>
        <Button
          size="large"
          onClick={() => {
            const newCatId = `new-${Date.now()}`;
            const newCat = {
              category_id: newCatId,
              Category_name: '',
              Active: true,
              excelSheetLink: '',
              poster: '',
              isNew: true,
            };
            setNewCategories([...newCategories, newCat]);
            setCategories([...categories, newCat]);
          }}
          style={{ marginRight: 8 }}
        >
          Add
        </Button>
        <Button type="primary" size="large" onClick={saveCategories} style={{ marginRight: 8 }}>
          Save
        </Button>
        <Button size="large" onClick={() => { setEditingCats(false); setNewCategories([]); fetchCategories(); }}>
          Cancel
        </Button>
      </>
    ) : (
      <Button size="large" type="primary" onClick={() => setEditingCats(true)}>Modify</Button>
    )}
  </div>
</Row>


        <Form component={false} ref={catForm}>
          <Table
            rowKey="category_id"
            columns={catColumns}
            dataSource={categories}
            size="small"
            bordered
            pagination={false}
            onRow={(rec) => ({
              onClick: () => !editingCats && onCatSelect(rec),
              style: {
                cursor: 'pointer',
                background: rec.category_id === selectedCatId ? '#e6f7ff' : undefined,
              },
            })}
          />
        </Form>
      </Col>

      {/* ================= Service Table ================ */}
      <Col span={14}>
<Row justify="space-between" align="middle" style={{ marginBottom: 8 }}>
  <Col>
    <h3 style={{ margin: 0 }}>
      {selectedCatId
        ? `Services for ${
            categories.find(cat => cat.category_id === selectedCatId)?.Category_name || ''
          }`
        : 'Services'}
    </h3>
  </Col>
  {selectedCatId && (
    <Col>
      <div style={{ display: 'flex', gap: 8 }}>
        {editingSvcs ? (
          <>
            <Button
              size="large"
              onClick={() => {
                const newSvcId = `new-${Date.now()}`;
                const newSvc = {
                  ServiceId: newSvcId,
                  Service: '',
                  Rate: 0,
                  Active: true,
                  time: '',
                  category_id: selectedCatId,
                  excelSheetLink: '',
                  isNew: true,
                };
                setNewServices([...newServices, newSvc]);
                setServices([...services, newSvc]);
              }}
            >
              Add
            </Button>
            <Button type="primary" size="large" onClick={saveServices}>
              Save
            </Button>
            <Button size="large" onClick={() => { setEditingSvcs(false); setNewServices([]); fetchServices(); }}>
              Cancel
            </Button>
          </>
        ) : (
          <Button size="large" type="primary" onClick={() => setEditingSvcs(true)}>
            Modify
          </Button>
        )}
      </div>
    </Col>
  )}
</Row>




        {selectedCatId ? (
          <Form component={false} ref={svcForm}>
            <Table
              rowKey="ServiceId"
              columns={svcColumns}
              dataSource={services.filter((s) => s.category_id === selectedCatId)}
              size="small"
              bordered
              pagination={false}
            />
          </Form>
        ) : (
          <p style={{ padding: 24, background: '#fafafa', border: '1px dashed #ccc' }}>
            Select a category to display the services in it.
          </p>
        )}
      </Col>
    </Row>
  );
};

export default ServicesPage;
