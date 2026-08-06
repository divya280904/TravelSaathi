import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';
import '../App.css';

const MyTrips = () => {
    const { showToast } = useToast();
    const username = localStorage.getItem("name");
    const [tripData, setTripData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function getMyTrips() {
            try {
                const tripResponse = await api.get(`/api/trips/mytrips/${username}`);
                setTripData(tripResponse.data);
            } catch (error) {
                console.error("Problem fetching trip data:", error);
                setTripData({ error: error.message });
            } finally {
                setLoading(false);
            }
        }
        if (username) {
            getMyTrips();
        }
    }, [username]);

    // Delete trip
    async function removeTrip(e, tripID) {
        e.preventDefault();
        
        try {
            const res = await api.delete("/api/trips/mytrips", {
                data: { tripID }
            });
            
            if (res.data.status === "tripremoved") {
                showToast("Trip removed successfully!", 'success');
                setTripData(prevData => 
                    Array.isArray(prevData) ? prevData.filter(trip => trip.tripID !== tripID) : prevData
                );
            } else {
                showToast("Error removing trip", 'danger');
            }
        } catch (error) {
            showToast("Something went wrong", 'danger');
            console.log(error);
        }
    }

    // Approve join request
    async function handleApprove(tripID, requester) {
        try {
            const res = await api.put('/api/trips/approve', { tripID, username: requester });
            if (res.data.status === 'interestapproved') {
                showToast(`Approved ${requester}! Chat channel initialized.`, 'success');
                // Update local state
                setTripData(prevTrips => 
                    prevTrips.map(t => t.tripID === tripID 
                        ? { 
                            ...t, 
                            pendingInterests: (t.pendingInterests || []).filter(x => x !== requester),
                            interested: [...(t.interested || []), requester]
                          } 
                        : t
                    )
                );
            }
        } catch (error) {
            console.error('Error approving request:', error);
            showToast('Failed to approve request.', 'danger');
        }
    }

    // Reject join request
    async function handleReject(tripID, requester) {
        try {
            const res = await api.put('/api/trips/reject', { tripID, username: requester });
            if (res.data.status === 'interestrejected') {
                showToast(`Rejected request from ${requester}.`, 'warning');
                // Update local state
                setTripData(prevTrips => 
                    prevTrips.map(t => t.tripID === tripID 
                        ? { ...t, pendingInterests: (t.pendingInterests || []).filter(x => x !== requester) } 
                        : t
                    )
                );
            }
        } catch (error) {
            console.error('Error rejecting request:', error);
            showToast('Failed to reject request.', 'danger');
        }
    }

    if (loading) {
        return (
            <div className="neo-panel neo-pressed" style={{ padding: '40px', textAlign: 'center' }}>
                <p className="noData">Loading trips...</p>
            </div>
        );
    }

    return (
        <div className='content'>
            <header className="welcome-header">
                <div>
                    <h2 className="welcome-title" style={{ textAlign: 'left', margin: 0 }}>My Proposed Trips</h2>
                    <span className="welcome-subtitle">Manage journeys you host and approve travel buddies</span>
                </div>
            </header>
            
            {tripData && (
                <>
                    {tripData.error ? (
                        <div className="neo-panel neo-pressed" style={{ padding: '40px', textAlign: 'center' }}>
                            <p className='noData'>Currently have no active trips</p>
                        </div>
                    ) : (
                        <div className='trips-grid'>
                            {Array.isArray(tripData) && tripData.length > 0 ? (
                                tripData.map(trip => (
                                    <div className='trip-card neo-raised' key={trip.tripID} style={{ minHeight: '440px' }}>
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

                                            {/* Requests section */}
                                            <div className="requests-section">
                                                <span className="requests-title">Buddy Match Status:</span>
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                                    Approved: {trip.interested && trip.interested.length > 0 ? trip.interested.join(', ') : 'None yet'}
                                                </div>

                                                {trip.pendingInterests && trip.pendingInterests.length > 0 ? (
                                                    <div>
                                                        <span className="requests-title" style={{ color: 'var(--primary)' }}>Pending Requests:</span>
                                                        {trip.pendingInterests.map(requester => (
                                                            <div className="request-item" key={requester}>
                                                                <span>👤 @{requester}</span>
                                                                <div className="request-actions">
                                                                    <button 
                                                                        onClick={() => handleApprove(trip.tripID, requester)}
                                                                        className="neo-btn request-btn-sm"
                                                                        style={{ color: 'var(--success)', background: 'var(--white)', padding: '3px 8px' }}
                                                                    >
                                                                        Approve
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleReject(trip.tripID, requester)}
                                                                        className="neo-btn request-btn-sm"
                                                                        style={{ color: 'var(--danger)', background: 'var(--white)', padding: '3px 8px' }}
                                                                    >
                                                                        Decline
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>

                                        <div className="trip-footer" style={{ border: 'none', paddingTop: 0 }}>
                                            <button 
                                                type="button" 
                                                className="neo-btn neo-btn-danger"
                                                onClick={(e) => removeTrip(e, trip.tripID)}
                                                style={{ width: '100%' }}
                                            >
                                                🗑️ Remove Trip
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="neo-panel neo-pressed" style={{ gridColumn: 'span 3', padding: '40px', textAlign: 'center' }}>
                                    <p className='noData' style={{ margin: 0 }}>Currently have no trips created.</p>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>  
    );
};

export default MyTrips;
