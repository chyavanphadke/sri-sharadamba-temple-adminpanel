import React, { useState, useEffect } from 'react';
import styles from './TV.module.css';
import { Timeline } from 'antd';
import axios from 'axios';
import image1 from '../assets/image1.jpg';
import image2 from '../assets/image2.jpg';

const TV = () => {
  const [dateTime, setDateTime] = useState(new Date());
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [events, setEvents] = useState([]);
  const [panchanga, setPanchanga] = useState({});
  const images = [image1, image2];

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

    fetchEvents();
    fetchPanchanga();
    const interval = setInterval(() => {
      fetchEvents();
      fetchPanchanga();
    }, 60000); // Fetch events and panchanga every minute

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
      const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
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
        <h2 className={styles.welcomeText}>Welcome to Sri Sharadamba Temple</h2> {/* Centered and colored welcome text */}
        <div className={styles.section}>
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
        <div className={styles.section}>
          <h2>Temple Events</h2> {/* Changed "Events" to "Temple Events" */}
          <Timeline mode="alternate" className={styles.timeline}> {/* Moved timeline to the left */}
            {events.map((event, index) => (
              <Timeline.Item
                key={index}
                color={isToday(event.Date) ? 'green' : 'blue'}
                label={<span style={{ fontWeight: isToday(event.Date) ? 'bold' : 'normal', fontSize: isToday(event.Date) ? '24px' : '18px' }}>{formatDayDate(event.Date)}</span>}
              >
                <span style={{ fontWeight: isToday(event.Date) ? 'bold' : 'normal', fontSize: isToday(event.Date) ? '24px' : '18px' }}>{event.Event}</span>
              </Timeline.Item>
            ))}
          </Timeline>
        </div>
        <div className={styles.section}>
          <div className={styles.dateTime}>
            <h1>{formatDay(dateTime)}</h1>
            <p>{formatDate(dateTime)}</p>
            <p>{new Date(dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
          </div>
        </div>
        <div className={styles.section}>
          <h2>Temple Timings</h2>
          <div className={styles.templeTimingsContent}>
            <div className="weekday">
              <p>Weekdays</p>
              <p>6:00 PM – 8:00 PM</p>
            </div>
            <div className="separator"></div>
            <div className="weekend">
              <p>Weekends</p>
              <p>5:30 PM – 8:30 PM</p>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.rightSection}>
        <div className={styles.slideshow}>
          <div
            className={styles.slideshowBackground}
            style={{
              backgroundImage: `url(${images[currentImageIndex]})`
            }}
          ></div>
          <div className={styles.slideshowOverlay}></div>
          <img src={images[currentImageIndex]} alt="Slideshow" />
          <div className={styles.progressBar}>
            <div
              className={styles.progress}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TV;
