// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import TodaysEvents from './components/TodaysEvents';
import TV from './components/TV';
import TV1 from './components/TV1'; // Import the TV1 component
import './App.css';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/" />;
};

const App = () => (
  <Router>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/todays-events" element={<TodaysEvents />} />
      <Route path="/tv" element={<TV />} />
      <Route path="/tv1" element={<TV1 />} /> {/* Add this route */}
      <Route
        path="/dashboard/*"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
    </Routes>
  </Router>
);

export default App;
