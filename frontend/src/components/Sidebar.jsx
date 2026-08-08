import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const username = localStorage.getItem('name');
    const [profile, setProfile] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        async function fetchProfile() {
            if (username) {
                try {
                    const res = await api.get(`/api/users/profile/${username}`);
                    setProfile(res.data);
                } catch (error) {
                    console.error('Error loading sidebar profile:', error);
                }
            }
        }
        fetchProfile();
    }, [username]);

    const handleLogout = () => {
        localStorage.removeItem('name');
        localStorage.removeItem('userID');
        localStorage.removeItem('token');
        navigate('/login');
    };

    if (!username) return null;

    const isActive = (path) => location.pathname === path ? 'active' : '';

    return (
        <>
            <div className="mobile-top-bar">
                <div className="sidebar-logo" style={{ paddingBottom: 0, marginBottom: 0, borderBottom: 'none' }}>
                    <Link to="/">TravelSaathi</Link>
                </div>
            </div>
            
            <aside className="sidebar neo-raised">
                <div className="sidebar-header desktop-only">
                    <div className="sidebar-logo">
                        <Link to="/">TravelSaathi</Link>
                    </div>
                </div>
            
            <div className={`sidebar-content ${isMobileMenuOpen ? 'open' : ''}`}>
                <nav className="sidebar-nav">
                    <Link to="/" className={`sidebar-link ${isActive('/')}`} onClick={() => setIsMobileMenuOpen(false)}>
                        <span>🌍</span> Explore Trips
                    </Link>
                    <Link to="/proposetrip" className={`sidebar-link ${isActive('/proposetrip')}`} onClick={() => setIsMobileMenuOpen(false)}>
                        <span>✈️</span> Plan a Trip
                    </Link>
                    <Link to="/interests" className={`sidebar-link ${isActive('/interests')}`} onClick={() => setIsMobileMenuOpen(false)}>
                        <span>❤️</span> My Interests
                    </Link>
                    <Link to="/mytrips" className={`sidebar-link ${isActive('/mytrips')}`} onClick={() => setIsMobileMenuOpen(false)}>
                        <span>🧳</span> My Trips
                    </Link>
                    <Link to="/inbox" className={`sidebar-link ${isActive('/inbox')}`} onClick={() => setIsMobileMenuOpen(false)}>
                        <span>💬</span> Inbox Chats
                    </Link>
                    <Link to="/profile" className={`sidebar-link ${isActive('/profile')}`} onClick={() => setIsMobileMenuOpen(false)}>
                        <span>👤</span> Edit Profile
                    </Link>
                </nav>
                
                <div className="sidebar-profile">
                    {profile && (
                        <div className="sidebar-profile-card neo-pressed">
                            <img src={profile.avatar} alt="avatar" className="sidebar-avatar" />
                            <div className="sidebar-profile-info">
                                <span className="sidebar-profile-name">{username}</span>
                                <span className="sidebar-profile-role">{profile.style ? `${profile.style.charAt(0).toUpperCase() + profile.style.slice(1)} Explorer` : 'Explorer'}</span>
                            </div>
                        </div>
                    )}
                    <button onClick={handleLogout} className="neo-btn neo-btn-danger" style={{ width: '100%' }}>
                        🚪 Logout
                    </button>
                </div>
            </div>
            </aside>
        </>
    );
};

export default Sidebar;
