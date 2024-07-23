import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './TV1.module.css';

import rathotsavaImage from '../assets/tv_sevas/Rathotsava.webp';
import annadanImage from '../assets/tv_sevas/Annadan.webp';
import vastraImage from '../assets/tv_sevas/Vastra.webp';
import flowerImage from '../assets/tv_sevas/Flower.webp';
import satyanarayanaPoojaImage from '../assets/tv_sevas/Satyanarayana_Pooja.webp';
import pradoshaImage from '../assets/tv_sevas/Pradosha.webp';
import sankataHaraChaturthiImage from '../assets/tv_sevas/Sankata_Hara_ChaturthiI.webp';
import sarvaSevaImage from '../assets/tv_sevas/sarva_seva.webp';
import nityaPoojaImage from '../assets/tv_sevas/nitya_pooja.webp';
import generalImage from '../assets/tv_sevas/general.webp';

const TV1 = () => {
  const [dateTime, setDateTime] = useState(new Date());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [events, setEvents] = useState([]);
  const [images, setImages] = useState([]);
  const [activities, setActivities] = useState([]);
  const [showContent, setShowContent] = useState(true); // Toggle between image and tables

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/events');
        setEvents(response.data);
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    const fetchImages = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/images');
        const imageUrls = response.data.map(url => `http://localhost:5001${url}`);
        setImages(imageUrls);
      } catch (error) {
        console.error('Error fetching images:', error);
      }
    };

    const fetchActivities = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/today-activities');
        const filteredActivities = response.data.filter(activity => activity.Service.ServiceId !== 2 && activity.Service.ServiceId !== 268);
        setActivities(filteredActivities);
      } catch (error) {
        console.error('Error fetching today\'s activities:', error);
      }
    };

    fetchEvents();
    fetchImages();
    fetchActivities();

    const interval = setInterval(() => {
      fetchEvents();
      fetchImages();
      fetchActivities();
    }, 60000); // Fetch data every minute

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let contentTimer;
    let progressTimer;

    if (images.length > 0) {
      progressTimer = setInterval(() => {
        setProgress((prevProgress) => (prevProgress < 100 ? prevProgress + 6.67 : 0));
      }, 1000);

      contentTimer = setInterval(() => {
        setShowContent((prevShowContent) => !prevShowContent);
        if (!showContent) {
          setCurrentIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
        }
        setProgress(0);
      }, 15000); // Switch between image and tables every 15 seconds
    }

    return () => {
      clearInterval(contentTimer);
      clearInterval(progressTimer);
    };
  }, [images.length, showContent]);

  const formatDate = (date) => {
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    return new Date(date).toLocaleDateString(undefined, options);
  };

  const formatDayDate = (date) => {
    const today = resetTime(new Date());
    const eventDate = resetTime(new Date(date));
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (eventDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (eventDate.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      const options = { weekday: 'short', month: 'long', day: 'numeric' };
      return eventDate.toLocaleDateString(undefined, options);
    }
  };

  const isToday = (date) => {
    const today = resetTime(new Date());
    const eventDate = resetTime(new Date(date));
    return eventDate.toDateString() === today.toDateString();
  };

  const resetTime = (date) => {
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const groupActivitiesByService = () => {
    const grouped = activities.reduce((acc, activity) => {
      const service = activity.Service.Service;
      if (!acc[service]) {
        acc[service] = [];
      }
      acc[service].push(activity);
      return acc;
    }, {});
    return grouped;
  };

  const groupedActivities = groupActivitiesByService();

  const getServiceImage = (serviceId) => {
    switch (serviceId) {
      case 270:
        return rathotsavaImage;
      case 269:
        return annadanImage;
      case 277:
        return vastraImage;
      case 278:
        return flowerImage;
      case 279:
        return satyanarayanaPoojaImage;
      case 280:
        return pradoshaImage;
      case 281:
        return sankataHaraChaturthiImage;
      case 282:
        return sarvaSevaImage;
      case 284:
        return nityaPoojaImage;
      default:
        return generalImage;
    }
  };

  return (
    <div className={styles.tv1Container}>
      {images.length > 0 && showContent && (
        <div className={styles.slideshow}>
          <div className={styles.slideshowBackground} style={{ backgroundImage: `url(${images[currentIndex]})` }}></div>
          <img src={images[currentIndex]} alt="Slideshow" className={styles.slideshowImage} />
          <div className={styles.progressBar}>
            <div className={styles.progress} style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}
      {!showContent && (
        <div className={styles.tableSection}>
          <div className={styles.card} style={{ width: '70%' }}>
            <h2>Upcoming Temple Events</h2>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Event</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event, index) => (
                    <tr key={index} className={isToday(event.Date) ? `${styles.highlight} ${styles.boldRow}` : ''}>
                      <td>{formatDayDate(event.Date)}</td>
                      <td>{event.Time}</td>
                      <td>{event.Event}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {activities.length > 0 && (
            <div className={styles.card} style={{ width: '30%' }}>
              <h2>Today's Sevas</h2>
              <div className={styles.activitiesContainer}>
                {Object.keys(groupedActivities).map((service, index) => (
                  <div key={index} className={styles.serviceSection}>
                    <h3 className={styles.serviceHeading}>{service}</h3>
                    <div className={styles.serviceContent}>
                      <img src={getServiceImage(groupedActivities[service][0].Service.ServiceId)} alt={`${service}`} className={styles.serviceImage} />
                      <ul className={styles.serviceList}>
                        {groupedActivities[service].map((activity, idx) => (
                          <li key={idx}>{`${activity.Devotee.FirstName} ${activity.Devotee.LastName}`}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TV1;
