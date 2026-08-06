import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../utils/api';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const username = localStorage.getItem('name');

        if (!token || !username) return;

        const loadNotifications = async () => {
            try {
                const res = await api.get('/api/notifications');
                const items = Array.isArray(res.data) ? res.data : [];
                setNotifications(items);
                setUnreadCount(items.filter(item => !item.isRead).length);
            } catch (error) {
                console.error('Failed to load notifications:', error);
            }
        };

        loadNotifications();

        const eventSource = new EventSource(`/api/notifications/stream?token=${token}`);
        eventSource.addEventListener('message', (event) => {
            try {
                const payload = JSON.parse(event.data);
                setNotifications(prev => [payload, ...prev]);
                setUnreadCount(prev => prev + 1);
            } catch (error) {
                console.error('Invalid notification payload:', error);
            }
        });

        return () => eventSource.close();
    }, []);

    const markAllAsRead = async () => {
        try {
            await api.put('/api/notifications/read', { ids: [] });
            setNotifications(prev => prev.map(item => ({ ...item, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark notifications as read:', error);
        }
    };

    const value = useMemo(() => ({ notifications, unreadCount, markAllAsRead }), [notifications, unreadCount, markAllAsRead]);

    return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};
