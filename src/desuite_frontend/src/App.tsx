import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import UserManagement from './components/UserManagement';
import Dashboard from './components/Dashboard';
import './animations/animations.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<UserManagement />} />
        <Route path="/login" element={<UserManagement />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* Add more routes as needed */}
      </Routes>
    </Router>
  );
}

export default App;