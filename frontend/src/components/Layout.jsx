import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import NotificationPanel from './NotificationPanel';
import '../App.css';

const Layout = () => {
    const navigate = useNavigate();
    const username = localStorage.getItem("name");
    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!username || !token) {
            navigate('/login');
        }
    }, [username, token, navigate]);

    if (!username || !token) {
        return null; // Prevents layout flashing during redirect
    }

    return (
        <div className="app-container">
            <Sidebar />
            <NotificationPanel />
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
