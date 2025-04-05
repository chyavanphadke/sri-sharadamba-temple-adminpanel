const { createEvent } = require('ics');

function createICalEvent({ service, date, location }) {
  const additionalServices = [
    "Annadanam",
    "Gana Yajamana",
    "Girija Kalyana",
    "Kalasa Sponsor",
    "Maha Poshaka",
    "Mangalyam Sponsor",
    "One day sponsor",
    "Pradhana Yajamana",
    "Pushpam (Flower) Sponsor",
    "Rudra Homam",
    "Rudra Kramarchana",
    "Rudrabhishekam",
    "Sri Sri Mahasannidhanam Pada Pooja",
    "Vastra Samarpana"
  ];

  let startTime, endTime;

  if (additionalServices.includes(service)) {
    // Fixed time for additional services
    startTime = new Date(2025, 3, 18, 18, 0); // April is month 3 (0-indexed)
    endTime = new Date(2025, 3, 20, 14, 0);   // April 20, 2:00 PM
  } else {
    // Dynamic time based on provided date
    startTime = new Date(date);
    endTime = new Date(startTime);

    if (service === "Lalitha Sahasranama Laksharchana") {
      endTime.setHours(startTime.getHours() + 3);
    } else {
      endTime.setHours(startTime.getHours() + 1);
    }
  }

  const event = {
    start: [startTime.getFullYear(), startTime.getMonth() + 1, startTime.getDate(), startTime.getHours(), startTime.getMinutes()],
    end: [endTime.getFullYear(), endTime.getMonth() + 1, endTime.getDate(), endTime.getHours(), endTime.getMinutes()],
    title: `${service} Scheduled`,
    description: `You have a scheduled seva: ${service}`,
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
