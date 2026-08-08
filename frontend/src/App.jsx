import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ProposeTrip from './pages/ProposeTrip';
import Interests from './pages/Interests';
import MyTrips from './pages/MyTrips';
import Inbox from './pages/Inbox';
import Profile from './pages/Profile';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <ToastProvider>
      <NotificationProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="proposetrip" element={<ProposeTrip />} />
            <Route path="interests" element={<Interests />} />
            <Route path="mytrips" element={<MyTrips />} />
            <Route path="inbox" element={<Inbox />} />
            <Route path="profile" element={<Profile />} />
            <Route path="profile/:targetUsername" element={<Profile />} />
          </Route>
          <Route path="register" element={<Register />} />
          <Route path="login" element={<Login />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
        </Routes>
      </BrowserRouter>
      </NotificationProvider>
    </ToastProvider>
  );
}
