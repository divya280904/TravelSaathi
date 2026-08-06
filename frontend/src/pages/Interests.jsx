import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';
import '../App.css';

const Interests = () => {
    const { showToast } = useToast();
    const username = localStorage.getItem("name");
    const userID = localStorage.getItem("userID");
    const [tripData, setTripData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function getInterests() {
            try {
                const tripResponse = await api.get(`/api/trips/interests/${username}`);
                setTripData(tripResponse.data);
            } catch (error) {
                console.error("Problem fetching trip data:", error);
                setTripData({ error: error.message });
            } finally {
                setLoading(false);
            }
        }
        if (username) {
            getInterests();
        }
    }, [username]);

    // Delete request/interest
    async function removeInterest(e, tripID) {
        e.preventDefault();
        
        try {
            const res = await api.delete("/api/trips/interests", {
                data: { username, tripID, userID }
            });
            
            if (res.data.status === "interestremoved") {
                showToast("Request removed successfully!", 'success');
                // Update local state
                setTripData(prevData => 
                    Array.isArray(prevData) ? prevData.filter(trip => trip.tripID !== tripID) : prevData
                );
            } else {
                showToast("Error removing request", 'danger');
            }
        } catch (error) {
            showToast("Something went wrong", 'danger');
            console.log(error);
        }
    }

    if (loading) {
        return (
            <div className="neo-panel neo-pressed" style={{ padding: '40px', textAlign: 'center' }}>
                <p className="noData">Loading requests...</p>
            </div>
        );
    }

    return (
        <div className='content'>
            <header className="welcome-header">
                <div>
                    <h2 className="welcome-title" style={{ textAlign: 'left', margin: 0 }}>My Trip Requests</h2>
                    <span className="welcome-subtitle">Track status of trips you've requested to join</span>
                </div>
            </header>

            {tripData && (
                <>
                    {tripData.error ? (
                        <div className="neo-panel neo-pressed" style={{ padding: '40px', textAlign: 'center' }}>
                            <p className="noData">Trips you've expressed interest in will show here. Go explore some trips!</p>
                        </div>            
                    ) : (
                        <div className='trips-grid'>
                            {Array.isArray(tripData) && tripData.length > 0 ? (
                                tripData.map(trip => (
                                    <div className='trip-card neo-raised' key={trip.tripID}>
                                        <div className="trip-header">
                                            <img 
                                                src={trip.creatorProfile ? trip.creatorProfile.avatar : `https://api.dicebear.com/7.x/bottts/svg?seed=${trip.username}`} 
                                                alt="avatar" 
                                                className="trip-avatar" 
                                            />
                                            <div className="trip-creator-info">
                                                <span className="trip-creator-name">{trip.username}</span>
                                                <span className="trip-creator-pref">
                                                    {trip.status === 'approved' ? (
                                                        <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✅ Approved Buddy</span>
                                                    ) : (
                                                        <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>⏳ Pending Host Approval</span>
                                                    )}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="trip-body">
                                            <h4 className="trip-location">{trip.location}</h4>
                                            
                                            <div className="trip-details">
                                                <div className="trip-detail-item">📅 {trip.date}</div>
                                                <div className="trip-detail-item">⏰ {trip.time}</div>
                                                <div className="trip-detail-item">⏳ {trip.duration} Days</div>
                                                <div className="trip-detail-item">🏷️ {trip.style}</div>
                                                
                                                {trip.weather && (
                                                    <div className="trip-weather-tag">
                                                        <span>🌤️ {trip.weather.temp}°C</span>
                                                        <span>{trip.weather.condition}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="trip-footer">
                                            <button 
                                                type="button" 
                                                className="neo-btn neo-btn-danger"
                                                onClick={(e) => removeInterest(e, trip.tripID)}
                                                style={{ width: '100%' }}
                                            >
                                                ❌ Cancel Request
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="neo-panel neo-pressed" style={{ gridColumn: 'span 3', padding: '40px', textAlign: 'center' }}>
                                    <p className='noData' style={{ margin: 0 }}>Trips you've expressed interest in will show here. Go explore some trips!</p>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Interests;
