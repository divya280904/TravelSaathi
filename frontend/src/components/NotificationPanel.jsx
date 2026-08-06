import React, { useMemo, useState } from 'react';
import { useNotifications } from '../context/NotificationContext';

const NotificationPanel = () => {
    const { notifications, unreadCount, markAllAsRead } = useNotifications();
    const [open, setOpen] = useState(false);

    const formattedNotifications = useMemo(() => {
        return [...notifications].slice(0, 8).map((item) => ({
            ...item,
            timeLabel: item.createdAt
                ? new Date(item.createdAt).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                })
                : 'Just now'
        }));
    }, [notifications]);

    return (
        <div className="notification-shell">
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className={`neo-btn neo-btn-primary notification-toggle ${open ? 'is-open' : ''}`}
                aria-label={open ? 'Close notifications' : 'Open notifications'}
            >
                <span className="notification-icon">{open ? '✕' : '🔔'}</span>
                {!open && unreadCount > 0 && (
                    <span className="notification-badge">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            <div className={`notification-overlay ${open ? 'visible' : ''}`} onClick={() => setOpen(false)} />

            <div
                className={`neo-raised notification-panel ${open ? 'open' : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="notification-header">
                    <div>
                        <div className="notification-title">Notifications</div>
                        <div className="notification-subtitle">Stay updated with your latest activity</div>
                    </div>
                    {notifications.length > 0 && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                markAllAsRead();
                            }}
                            className="neo-btn notification-action-btn"
                        >
                            Mark all read
                        </button>
                    )}
                </div>

                {formattedNotifications.length === 0 ? (
                    <div className="notification-empty">
                        <div className="notification-empty-icon">✉️</div>
                        <div>No notifications yet.</div>
                        <p>New updates will appear here.</p>
                    </div>
                ) : (
                    <div className="notification-list">
                        {formattedNotifications.map((item) => (
                            <div
                                key={item.id || `${item.title}-${item.createdAt}`}
                                className={`notification-item ${!item.isRead ? 'unread' : ''}`}
                            >
                                <div className="notification-item-top">
                                    <div className="notification-item-title">{item.title}</div>
                                    <div className="notification-time">{item.timeLabel}</div>
                                </div>
                                <div className="notification-message">{item.message}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationPanel;
