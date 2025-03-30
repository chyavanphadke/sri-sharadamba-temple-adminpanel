const { createEvent } = require('ics');

function createICalEvent({ service, date, location }) {
  const startTime = new Date(date);
  const endTime = new Date(startTime);

  if (service === "Lalitha Sahasranama Laksharchana") {
    endTime.setHours(startTime.getHours() + 3);
  } else {
    endTime.setHours(startTime.getHours() + 1);
  }

  const event = {
    start: [startTime.getFullYear(), startTime.getMonth() + 1, startTime.getDate(), startTime.getHours(), startTime.getMinutes()],
    end: [endTime.getFullYear(), endTime.getMonth() + 1, endTime.getDate(), endTime.getHours(), endTime.getMinutes()],
    title: `${service} Scheduled`,
    description: `You have a scheduled seva: ${service} at Sri Sharadamba Temple`,
    location: location || 'Sri Sharadamba Temple, 1635 S Main St, Milpitas, CA 95035',
    url: 'https://sharadaseva.org',

    organizer: {
      name: 'Sri Sharadamba Temple (SEVA)',
      email: 'noreply@sharadaseva.org'
    }
  };

  return new Promise((resolve, reject) => {
    createEvent(event, (error, value) => {
      if (error) {
        reject(error);
      } else {
        resolve(value);
      }
    });
  });
}

module.exports = {
  createICalEvent
};
