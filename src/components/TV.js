import React, { useState, useEffect } from 'react';
import styles from './TV.module.css';
import axios from 'axios';

const TV = () => {
  const [dateTime, setDateTime] = useState(new Date());
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [events, setEvents] = useState([]);
  const [panchanga, setPanchanga] = useState({});
  const [images, setImages] = useState([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const slideTimer = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
      setProgress(0); // Reset progress bar
    }, 10000); // Change image every 10 seconds

    return () => clearInterval(slideTimer);
  }, [images.length]);

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress((prevProgress) => (prevProgress < 100 ? prevProgress + 1 : 0));
    }, 100); // Update progress every 100ms

    return () => clearInterval(progressTimer);
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

    const fetchPanchanga = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/panchanga');
        setPanchanga(response.data);
      } catch (error) {
        console.error('Error fetching Panchanga:', error);
      }
    };

    const fetchImages = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/images');
        console.log('Fetched images:', response.data); // Log fetched images
        // Transform the URLs to use the proxy route
        const imageUrls = response.data.map(url => `http://localhost:5001${url}`);
        setImages(imageUrls);
      } catch (error) {
        console.error('Error fetching images:', error);
      }
    };

    fetchEvents();
    fetchPanchanga();
    fetchImages();
    const interval = setInterval(() => {
      fetchEvents();
      fetchPanchanga();
      fetchImages();
    }, 60000); // Fetch events, panchanga, and images every minute

    return () => clearInterval(interval);
  }, []);

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

  const formatDay = (date) => {
    return new Date(date).toLocaleDateString(undefined, { weekday: 'long' });
  };

  const enterFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) { // Firefox
      elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) { // Chrome, Safari and Opera
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { // IE/Edge
      elem.msRequestFullscreen();
    }
    setIsFullscreen(true);
  };

  return (
    <div className={styles.tvContainer}>
      {!isFullscreen && (
        <button onClick={enterFullscreen} className={styles.fullscreenButton}>
          Enter Fullscreen
        </button>
      )}
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
        <div className={`${styles.section} ${styles.panchangaCard}`}>
          <h2>Today's Panchanga</h2>
          <div className={styles.panchangaContent}>
            <div className={styles.panchangaLeft}>
              <p><strong>Sunrise:</strong> {panchanga.Sunrise}</p>
              <p><strong>Sunset:</strong> {panchanga.Sunset}</p>
              <p><strong>Moonrise:</strong> {panchanga.Moonrise}</p>
              <p><strong>Moonset:</strong> {panchanga.Moonset}</p>
            </div>
            <div className={styles.panchangaRight}>
              <p><strong>Weekday:</strong> {panchanga.Weekday}</p>
              <p><strong>Yoga:</strong> {panchanga.Yoga}</p>
              <p><strong>Tithi:</strong> {panchanga.Tithi}</p>
              <p><strong>Nakshatra:</strong> {panchanga.Nakshatra}</p>
              <p><strong>Karana:</strong> {panchanga.Karana}</p>
            </div>
          </div>
        </div>
        <div className={styles.cardsContainer}>
          <div className={`${styles.card} ${styles.dateTimeCard}`}>
            <h2> </h2>
            <div className={styles.dateTime}>
              <h1>{formatDay(dateTime)}</h1>
              <p>{formatDate(dateTime)}</p>
              <p>{new Date(dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</p>
            </div>
          </div>
          <div className={`${styles.cardTimings} ${styles.timingsCard}`}>
            <h2>Temple Timings</h2>
            <div className={styles.templeTimingsContent}>
              <div className="weekday">
                <p><strong>Weekdays  | 6:00 PM – 8:00 PM</strong></p>
                <p><strong>Weekends | 5:30 PM – 8:30 PM</strong></p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.rightSection}>
        <div className={styles.slideshow}>
          {images.length > 0 && (
            <>
              <div
                className={styles.slideshowBackground}
                style={{
                  backgroundImage: `url(${images[currentImageIndex]})`
                }}
              ></div>
              <div className={styles.slideshowOverlay}></div>
              <img 
                src={images[currentImageIndex]} 
                alt="Slideshow" 
                onError={(e) => {
                  console.error('Image load error:', e);
                  console.log('Failed URL:', images[currentImageIndex]);
                }} 
              />
              <div className={styles.progressBar}>
                <div
                  className={styles.progress}
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TV;