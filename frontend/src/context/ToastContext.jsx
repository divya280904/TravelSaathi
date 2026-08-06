import React, { createContext, useContext, useState, useEffect } from 'react';
import '../App.css';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
    };

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => {
                setToast(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const getIcon = (type) => {
        switch (type) {
            case 'success': return '✅';
            case 'danger': return '❌';
            case 'warning': return '⚠️';
            default: return 'ℹ️';
        }
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toast && (
                <div className={`toast-banner neo-raised ${toast.type}`}>
                    <span style={{ fontSize: '18px' }}>{getIcon(toast.type)}</span>
                    <span className="toast-message">{toast.message}</span>
                    <button className="toast-close" onClick={() => setToast(null)}>×</button>
                </div>
            )}
        </ToastContext.Provider>
    );
};
