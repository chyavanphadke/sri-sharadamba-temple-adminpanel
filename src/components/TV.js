import React, { useState, useEffect } from 'react';
import styles from './TV.module.css';
import axios from 'axios';
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
import qrCodeImage from '../assets/qr-code.png';
import BACKEND_BASE_URL from '../ipConfiguration';

const TV = () => {
  // State management
  const [dateTime, setDateTime] = useState(new Date());
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [events, setEvents] = useState([]);
  const [panchanga, setPanchanga] = useState({});
  const [images, setImages] = useState([]);
  const [activities, setActivities] = useState([]);
  const [showActivities, setShowActivities] = useState(false);
  const [currentMode, setCurrentMode] = useState('slideshow'); // 'slideshow' or 'activities'

  // Update date and time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch data from API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get(`${BACKEND_BASE_URL}/api/events`);
        setEvents(response.data);
        //console.log('Fetched events:', response.data);
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    const fetchPanchanga = async () => {
      try {
        const response = await axios.get(`${BACKEND_BASE_URL}/api/panchanga`);
        setPanchanga(response.data);
        //console.log('Fetched Panchanga:', response.data);
      } catch (error) {
        console.error('Error fetching Panchanga:', error);
      }
    };

    const fetchImages = async () => {
      try {
        const response = await axios.get(`${BACKEND_BASE_URL}/api/images`);
        const imageUrls = response.data.map(url => `${BACKEND_BASE_URL}:5001${url}`);
        setImages(imageUrls);
        //console.log('Fetched images:', response.data);
      } catch (error) {
        console.error('Error fetching images:', error);
      }
    };

    const fetchActivities = async () => {
      try {
        const response = await axios.get(`${BACKEND_BASE_URL}/api/today-activities`);
        const filteredActivities = response.data.filter(activity => activity.Service.ServiceId !== 2 && activity.Service.ServiceId !== 268);
        setActivities(filteredActivities);
        setShowActivities(filteredActivities.length > 0);
        //console.log('Fetched activities:', response.data);
      } catch (error) {
        console.error('Error fetching today\'s activities:', error);
      }
    };

    fetchEvents();
    fetchPanchanga();
    fetchImages();
    fetchActivities();

    const interval = setInterval(() => {
      fetchEvents();
      fetchPanchanga();
      fetchImages();
      fetchActivities();
    }, 60000); // Fetch data every minute

    return () => clearInterval(interval);
  }, []);

  // Handle slideshow and activity display
  useEffect(() => {
    let imageTimer;
    let activityTimer;
    let progressTimer;

    if (images.length > 0) {
      progressTimer = setInterval(() => {
        setProgress((prevProgress) => (prevProgress < 100 ? prevProgress + 6.67 : 0));
      }, 1000);

      imageTimer = setInterval(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
        setProgress(0);
      }, 15000); // Change image every 15 seconds
    }

    if (showActivities) {
      activityTimer = setTimeout(() => {
        setCurrentMode((prevMode) => (prevMode === 'slideshow' ? 'activities' : 'slideshow'));
      }, currentMode === 'slideshow' ? images.length * 15000 : 15000); // Switch mode every 15 seconds if activities are present
    }

    return () => {
      clearInterval(imageTimer);
      clearTimeout(activityTimer);
      clearInterval(progressTimer);
    };
  }, [currentMode, images.length, showActivities]);

  // Format date for display
  const formatDate = (date) => {
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    return new Date(date).toLocaleDateString(undefined, options);
  };

  // Format day and date for display
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

  // Check if the given date is today
  const isToday = (date) => {
    const today = resetTime(new Date());
    const eventDate = resetTime(new Date(date));
    return eventDate.toDateString() === today.toDateString();
  };

  // Reset time to midnight for date comparison
  const resetTime = (date) => {
    date.setHours(0, 0, 0, 0);
    return date;
  };

  // Format day for display
  const formatDay = (date) => {
    return new Date(date).toLocaleDateString(undefined, { weekday: 'long' });
  };

  // Group activities by service
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

  // Get service image based on service ID
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
    <div className={styles.tvContainer}>
      <div className={styles.leftSection}>
        <h2 className={styles.welcomeText}>Welcome to Sri Sharadamba Temple</h2>
        <div className={`${styles.section} ${styles.eventsSection}`}>
          <h2>Temple Events</h2>
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
        <div className={`${styles.sectionQr} ${styles.panchangaCard}`}>
          <h2>Announcements</h2>
          <div className={styles.qrCodeWrapper}>
            <p className={styles.qrText}>Scan and Join the Whatsapp group to get all the event updates.</p>
            <div className={styles.qrCodeContainer}>
              <img src={qrCodeImage} alt="QR Code" className={styles.qrCode} />
            </div>
          </div>
        </div>
      </div>
      <div className={styles.rightSection}>
        {currentMode === 'slideshow' || activities.length === 0 ? (
          <div className={styles.slideshow}>
          {images.length > 0 && (
            <>
              <div
                className={styles.slideshowBackground}
                style={{
                  backgroundImage: images[currentImageIndex].match(/\.(mp4|avi|mov|mkv)$/i) ? 'none' : `url(${images[currentImageIndex]})`,
                }}
              ></div>
              <div className={styles.slideshowOverlay}></div>
              {images[currentImageIndex].match(/\.(mp4|avi|mov|mkv)$/i) ? (
                <video
                  src={images[currentImageIndex]}
                  autoPlay
                  loop
                  className={styles.video}
                  onError={(e) => {
                    console.error('Video load error:', e);
                    console.log('Failed URL:', images[currentImageIndex]);
                  }}
                />
              ) : (
                <img
                  src={images[currentImageIndex]}
                  alt="Slideshow"
                  className={styles.image}
                  onError={(e) => {
                    console.error('Image load error:', e);
                    console.log('Failed URL:', images[currentImageIndex]);
                  }}
                />
              )}
              <div className={styles.progressBar}>
                <div
                  className={styles.progress}
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </>
          )}
        </div>               
        ) : (
          <div className={`${styles.sectionActivity} ${styles.activitiesSection}`} style={{ height: '90%' }}>
            <h2 style={{ fontWeight: 'bold', fontSize: '30px' }}>Today's Sevas</h2>
            <div className={styles.activitiesContainer}>
              {Object.keys(groupedActivities).map((service, index) => (
                <div key={index} className={styles.serviceWrapper}>
                  <div className={styles.serviceSection}>
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
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TV;
