import React, { useState, useEffect } from 'react';
import './TV.css';
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
    <div className="tv-container">
      {!isFullscreen && (
        <button onClick={enterFullscreen} className="fullscreen-button">
          Enter Fullscreen
        </button>
      )}
      <div className="left-section">
        <div className="section">
          <h2>Today's Panchanga</h2>
          <div className="panchanga-content">
            <div className="panchanga-left">
              <p><strong>Sunrise:</strong> {panchanga.Sunrise}</p>
              <p><strong>Sunset:</strong> {panchanga.Sunset}</p>
              <p><strong>Moonrise:</strong> {panchanga.Moonrise}</p>
              <p><strong>Moonset:</strong> {panchanga.Moonset}</p>
              <p><strong>Weekday:</strong> {panchanga.Weekday}</p>
            </div>
            <div className="panchanga-right">
              <p><strong>Shaka Samvat:</strong> {panchanga.ShakaSamvat}</p>
              <p><strong>Purnimanta Month:</strong> {panchanga.PurnimantaMonth}</p>
              <p><strong>Paksha:</strong> {panchanga.Paksha}</p>
              <p><strong>Tithi:</strong> {panchanga.Tithi}</p>
            </div>
          </div>
        </div>
        <div className="section">
          <h2>Events</h2>
          <Timeline mode="alternate">
            {events.map((event, index) => (
              <Timeline.Item
                key={index}
                color={isToday(event.Date) ? 'green' : 'blue'}
                label={<span style={{ fontWeight: isToday(event.Date) ? 'bold' : 'normal' }}>{formatDayDate(event.Date)}</span>}
              >
                <span style={{ fontWeight: isToday(event.Date) ? 'bold' : 'normal' }}>{event.Event}</span>
              </Timeline.Item>
            ))}
          </Timeline>
        </div>
        <div className="section">
          <div className="date-time">
            <h1>{formatDay(dateTime)}</h1>
            <p>{formatDate(dateTime)}</p>
            <p>{new Date(dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
          </div>
        </div>
        <div className="section">
          <h2>Temple Timings</h2>
          <div className="temple-timings-content">
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
      <div className="right-section">
        <div className="slideshow">
          <div
            className="slideshow-background"
            style={{
              backgroundImage: `url(${images[currentImageIndex]})`
            }}
          ></div>
          <div className="slideshow-overlay"></div>
          <img src={images[currentImageIndex]} alt="Slideshow" />
          <div className="progress-bar">
            <div
              className="progress"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TV;
