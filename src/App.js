// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';

import Dashboard from './components/Dashboard';
import ForgotPassword from './components/ForgotPassword'; // Import the ForgotPassword component
import TodaysEvents from './components/TodaysEvents'; // Import the TodaysEvents component
import TV from './components/TV'; // Import the TV component
import './App.css';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/" />;
};

const App = () => (
  <Router>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/reset-password/:token" element={<ForgotPassword />} /> {/* Add this route */}
      <Route path="/todays-events" element={<TodaysEvents />} /> {/* Add this route */}
      <Route path="/tv" element={<TV />} /> {/* Add this route */}
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
