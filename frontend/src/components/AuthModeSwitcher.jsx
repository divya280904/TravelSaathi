import React from 'react';
import { Link } from 'react-router-dom';

const AuthModeSwitcher = ({ active }) => (
    <div className="auth-mode-switcher" role="tablist" aria-label="Authentication modes">
        <Link to="/login" className={`auth-mode-link ${active === 'login' ? 'active' : ''}`}>
            Login
        </Link>
        <Link to="/forgot-password" className={`auth-mode-link ${active === 'reset' ? 'active' : ''}`}>
            Reset Password
        </Link>
        <Link to="/register" className={`auth-mode-link ${active === 'register' ? 'active' : ''}`}>
            Register
        </Link>
    </div>
);

export default AuthModeSwitcher;
