import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../App.css';
import bannerImg from '../assets/banner.png';

// Fix for default leaflet marker icon issue in react
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const Home = () => {
    const { showToast } = useToast();
    const username = localStorage.getItem('name');
    const [tripData, setTripData] = useState([]);
    const [myProfile, setMyProfile] = useState(null);
    const [search, setSearch] = useState('');
    const [budgetFilter, setBudgetFilter] = useState('');
    const [styleFilter, setStyleFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [minDuration, setMinDuration] = useState('');
    const [maxDuration, setMaxDuration] = useState('');
    
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    // Map Modal state
    const [mapModalOpen, setMapModalOpen] = useState(false);
    const [mapLocation, setMapLocation] = useState(null);
    const [mapCoords, setMapCoords] = useState([51.505, -0.09]);

    // Fetch Viewer Profile and Trips
    useEffect(() => {
        async function loadDashboardData() {
            try {
                // Fetch viewer profile for matching calculations
                const profileRes = await api.get(`/api/users/profile/${username}`);
                setMyProfile(profileRes.data);

                // Fetch trips
                const tripResponse = await api.get('/api/trips');
                if (tripResponse.data && Array.isArray(tripResponse.data.trips)) {
                    setTripData(tripResponse.data.trips);
                    setHasMore(tripResponse.data.hasMore);
                } else if (Array.isArray(tripResponse.data)) { // Fallback for any old cached format
                    setTripData(tripResponse.data);
                }
            } catch (error) {
                console.error('Problem loading dashboard:', error);
            }
        }
        loadDashboardData();
    }, [username]);

    // Load More Function
    const loadMoreTrips = async () => {
        if (!hasMore || loadingMore || tripData.length === 0) return;
        setLoadingMore(true);
        const lastDate = tripData[tripData.length - 1].date;
        try {
            const tripResponse = await api.get(`/api/trips?lastTripDate=${lastDate}`);
            if (tripResponse.data && Array.isArray(tripResponse.data.trips)) {
                setTripData(prev => [...prev, ...tripResponse.data.trips]);
                setHasMore(tripResponse.data.hasMore);
            }
        } catch (error) {
            console.error('Error loading more trips:', error);
        } finally {
            setLoadingMore(false);
        }
    };

    // Express Interest (Requests to Join)
    async function handleRequestJoin(e, tripID) {
        e.preventDefault();
        try {
            const res = await api.put('/api/trips', { username, tripID });
            if (res.data.status === 'interestshown') {
                showToast('Request sent! Host has been notified.', 'success');
                // Update local state to show pending status
                setTripData(prevTrips => 
                    prevTrips.map(t => t.tripID === tripID ? { ...t, pendingInterests: [...(t.pendingInterests || []), username] } : t)
                );
            } else if (res.data.status === 'interestnotshown') {
                showToast('You have already requested or been approved.', 'warning');
            }
        } catch (error) {
            showToast('Something went wrong.', 'danger');
            console.error(error);
        }
    }

    // Search Query
    async function handleSearch(e) {
        e.preventDefault();
        try {
            const response = await api.post('/api/trips/search', { 
                location: search,
                startDate,
                endDate,
                minDuration,
                maxDuration
            });
            if (Array.isArray(response.data)) {
                setTripData(response.data);
            }
        } catch (error) {
            console.error('Error searching trips:', error);
        }
    }

    // Matching Compatibility Algorithm
    const calculateCompatibility = (trip) => {
        if (!myProfile || !trip.creatorProfile) return 75; // baseline matching score
        
        let score = 40;

        // 1. Budget Level matching (20 points)
        if (myProfile.budget === trip.creatorProfile.budget) {
            score += 20;
        } else if (
            (myProfile.budget === 'moderate' && (trip.creatorProfile.budget === 'budget' || trip.creatorProfile.budget === 'luxury')) ||
            (trip.creatorProfile.budget === 'moderate' && (myProfile.budget === 'budget' || myProfile.budget === 'luxury'))
        ) {
            score += 10;
        }

        // 2. Pace matching (20 points)
        if (myProfile.pace === trip.creatorProfile.pace) {
            score += 20;
        } else {
            score += 8;
        }

        // 3. Travel Style matching (20 points)
        if (myProfile.style === trip.creatorProfile.style) {
            score += 20;
        } else {
            score += 5;
        }

        // 4. Overlapping Interests (20 points)
        const myInterests = myProfile.interests || [];
        const creatorInterests = trip.creatorProfile.interests || [];
        const overlapping = myInterests.filter(i => creatorInterests.includes(i));
        if (overlapping.length > 0) {
            score += Math.min(20, overlapping.length * 7);
        } else {
            score += 10;
        }

        // Add small unique offset based on trip identifier for variety (10 points)
        score += Math.floor((trip.tripID.charCodeAt(0) || 10) % 10);
        
        return Math.min(100, score);
    };

    // Filter Trips based on selectors
    const filteredTrips = tripData.filter(trip => {
        const matchBudget = budgetFilter ? trip.budget === budgetFilter : true;
        const matchStyle = styleFilter ? trip.style === styleFilter : true;
        return matchBudget && matchStyle;
    });

    // Open map for location
    const handleViewMap = async (locationStr) => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationStr)}&format=json&limit=1`);
            const data = await res.json();
            if (data && data.length > 0) {
                setMapCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
                setMapLocation(locationStr);
                setMapModalOpen(true);
            } else {
                showToast("Could not find location on map", "warning");
            }
        } catch (error) {
            console.error(error);
            showToast("Map service error", "danger");
        }
    };

    return (
        <div className="content">
            <div className="neo-raised" style={{ marginBottom: '30px', borderRadius: '20px', overflow: 'hidden', height: '250px', position: 'relative' }}>
                <img src={bannerImg} alt="Explore the World" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', padding: '40px 20px 20px', color: 'white' }}>
                    <h2 style={{ margin: 0, fontSize: '28px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Explore Buddy Trips</h2>
                    <span style={{ fontSize: '16px', opacity: 0.9, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>Find travel partners matching your style</span>
                </div>
            </div>

            <header className="welcome-header" style={{ display: 'none' }}>
                <div>
                    <h2 className="welcome-title" style={{ textAlign: 'left', margin: 0 }}>Explore Buddy Trips</h2>
                    <span className="welcome-subtitle">Find travel partners matching your style</span>
                </div>
            </header>

            {/* Dashboard Metric Stats */}
            <div className="stats-grid">
                <div className="stats-card neo-raised">
                    <div className="stats-icon neo-pressed">📅</div>
                    <div className="stats-info">
                        <span className="stats-number">{filteredTrips.length}</span>
                        <span className="stats-label">Active Trips</span>
                    </div>
                </div>
                <div className="stats-card neo-raised">
                    <div className="stats-icon neo-pressed">✨</div>
                    <div className="stats-info">
                        <span className="stats-number">
                            {myProfile && myProfile.interests && myProfile.interests.length > 0 ? '98%' : '70%'}
                        </span>
                        <span className="stats-label">Profile Completeness</span>
                    </div>
                </div>
                <div className="stats-card neo-raised">
                    <div className="stats-icon neo-pressed">🤝</div>
                    <div className="stats-info">
                        <span className="stats-number">Active</span>
                        <span className="stats-label">Matching Status</span>
                    </div>
                </div>
            </div>

            {/* Neumorphic Search Filters */}
            <div className="search-container neo-raised">
                <form onSubmit={handleSearch} className="search-form">
                    <div className="search-group">
                        <label>Location Search</label>
                        <input
                            className="neo-input"
                            type="search"
                            placeholder="Where to next?"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="search-group">
                        <label>Budget Level</label>
                        <select 
                            className="search-select"
                            value={budgetFilter}
                            onChange={(e) => setBudgetFilter(e.target.value)}
                        >
                            <option value="">All Budgets</option>
                            <option value="budget">Budget</option>
                            <option value="moderate">Moderate</option>
                            <option value="luxury">Luxury</option>
                        </select>
                    </div>
                    <div className="search-group">
                        <label>Travel Style</label>
                        <select
                            className="search-select"
                            value={styleFilter}
                            onChange={(e) => setStyleFilter(e.target.value)}
                        >
                            <option value="">All Styles</option>
                            <option value="nature">Nature</option>
                            <option value="foodie">Foodie</option>
                            <option value="backpacking">Backpacking</option>
                            <option value="beach">Beach</option>
                            <option value="city">City Walk</option>
                        </select>
                    </div>
                    <div className="search-group search-group-span-2">
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <div style={{ flex: 1 }}>
                                <label>Start Date (From)</label>
                                <input type="date" className="neo-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label>End Date (To)</label>
                                <input type="date" className="neo-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                            </div>
                        </div>
                    </div>
                    <div className="search-group">
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <div style={{ flex: 1 }}>
                                <label>Min Days</label>
                                <input type="number" className="neo-input" placeholder="e.g. 2" value={minDuration} onChange={(e) => setMinDuration(e.target.value)} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label>Max Days</label>
                                <input type="number" className="neo-input" placeholder="e.g. 10" value={maxDuration} onChange={(e) => setMaxDuration(e.target.value)} />
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="neo-btn neo-btn-primary search-btn" style={{ height: '48px', marginTop: '20px' }}>
                        🔍 Search
                    </button>
                </form>
            </div>

            {/* Trips List Feed */}
            <div className="trips-grid">
                {filteredTrips.length > 0 ? (
                    filteredTrips.map((trip) => {
                        // Skip rendering our own trips
                        if (trip.username === username) return null;

                        const isPending = trip.pendingInterests && trip.pendingInterests.includes(username);
                        const isApproved = trip.interested && trip.interested.includes(username);
                        const compatibility = calculateCompatibility(trip);

                        return (
                            <div className="trip-card neo-raised" key={trip.tripID}>
                                <div className="compatibility-badge">
                                    🎯 {compatibility}% Match
                                </div>
                                <div className="trip-header">
                                    <Link to={`/profile/${trip.username}`} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit', width: '100%' }}>
                                        <img 
                                            src={trip.creatorProfile ? trip.creatorProfile.avatar : `https://api.dicebear.com/7.x/bottts/svg?seed=${trip.username}`} 
                                            alt="avatar" 
                                            className="trip-avatar" 
                                        />
                                        <div className="trip-creator-info">
                                            <span className="trip-creator-name">{trip.username}</span>
                                            <span className="trip-creator-pref">
                                                {trip.creatorProfile ? `${trip.creatorProfile.budget} | ${trip.creatorProfile.style}` : 'Explorer'}
                                            </span>
                                        </div>
                                    </Link>
                                </div>

                                <div className="trip-body">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h4 className="trip-location">{trip.location}</h4>
                                        <button 
                                            className="neo-btn request-btn-sm" 
                                            onClick={() => handleViewMap(trip.location)}
                                            title="View on Map"
                                        >
                                            🗺️ Map
                                        </button>
                                    </div>
                                    
                                    <div className="trip-details">
                                        <div className="trip-detail-item">📅 {trip.date}</div>
                                        <div className="trip-detail-item">⏰ {trip.time}</div>
                                        <div className="trip-detail-item">⏳ {trip.duration} Days</div>
                                        <div className="trip-detail-item">🏷️ {trip.style}</div>
                                        
                                        {trip.weather && (
                                            <div className="trip-weather-tag">
                                                <span>🌤️ Temperature: {trip.weather.temp}°C</span>
                                                <span>Condition: {trip.weather.condition}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="trip-footer">
                                    <div className="interested-users-list">
                                        {trip.interested && trip.interested.length > 0 
                                            ? `Joined buddies: ${trip.interested.join(', ')}`
                                            : 'No buddies joined yet'}
                                    </div>
                                    {isApproved ? (
                                        <span className="neo-pressed" style={{ display: 'block', padding: '10px', textAlign: 'center', color: 'var(--success)', fontWeight: 'bold', borderRadius: '12px' }}>
                                            ✅ Trip Match Approved!
                                        </span>
                                    ) : isPending ? (
                                        <span className="neo-pressed" style={{ display: 'block', padding: '10px', textAlign: 'center', color: 'var(--primary)', fontWeight: 'bold', borderRadius: '12px' }}>
                                            ⏳ Request Pending...
                                        </span>
                                    ) : (
                                        <button
                                            className="neo-btn neo-btn-primary"
                                            onClick={(e) => handleRequestJoin(e, trip.tripID)}
                                            style={{ width: '100%' }}
                                        >
                                            🤝 Request to Join
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="neo-panel neo-pressed" style={{ gridColumn: 'span 3', padding: '40px', textAlign: 'center' }}>
                        <p className="noData" style={{ margin: 0 }}>No matching trips available. Try altering search query.</p>
                    </div>
                )}
            </div>

            {hasMore && !search && (
                <div style={{ textAlign: 'center', marginTop: '40px', marginBottom: '20px' }}>
                    <button 
                        className="neo-btn neo-btn-primary" 
                        onClick={loadMoreTrips}
                        disabled={loadingMore}
                        style={{ padding: '12px 30px' }}
                    >
                        {loadingMore ? 'Loading...' : 'Load More Trips'}
                    </button>
                </div>
            )}

            {/* Map Modal */}
            {mapModalOpen && (
                <div className="modal-overlay" onClick={() => setMapModalOpen(false)}>
                    <div className="modal-content neo-raised" onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: '600px' }}>
                        <h3 className="modal-map-title">Map: {mapLocation}</h3>
                        <div className="map-embed" style={{ height: '400px', width: '100%' }}>
                            <MapContainer center={mapCoords} zoom={10} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <Marker position={mapCoords}>
                                    <Popup>{mapLocation}</Popup>
                                </Marker>
                            </MapContainer>
                        </div>
                        <div style={{ textAlign: 'right', marginTop: '15px' }}>
                            <button className="neo-btn neo-btn-danger" onClick={() => setMapModalOpen(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
