// src/components/CustomTimeGrid.js
import React from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import styled from 'styled-components';
import { Layout } from 'antd';

const localizer = momentLocalizer(moment);

const CustomTimeGrid = ({ events }) => {
  const allViews = {
    week: true,
  };

  const CustomWrapper = styled.div`
    .rbc-time-header {
      display: none;
    }

    .rbc-time-content {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .rbc-time-content > * + * {
      margin-top: 8px;
    }

    .rbc-time-slot {
      display: none;
    }

    .rbc-day-bg + .rbc-day-bg {
      border-left: 1px solid #e6e6e6;
    }

    .rbc-event {
      background-color: #007bff;
      color: white;
      border-radius: 4px;
      padding: 5px;
    }

    .rbc-event:hover {
      background-color: #0056b3;
    }

    .rbc-time-content > * {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
  `;

  return (
    <Layout.Content>
      <CustomWrapper>
        <Calendar
          localizer={localizer}
          events={events}
          views={allViews}
          defaultView="week"
          step={60}
          showMultiDayTimes
          style={{ height: 600 }}
        />
      </CustomWrapper>
    </Layout.Content>
  );
};

export default CustomTimeGrid;
