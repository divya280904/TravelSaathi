import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import axios from 'axios'; // We keep standard axios for public WorldWeatherOnline API lookup
import { useToast } from '../context/ToastContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../App.css';

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

const ProposeTrip = () => {
    const { showToast } = useToast();
    const [location, setLocation] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [duration, setDuration] = useState("");
    const [budget, setBudget] = useState("moderate");
    const [style, setStyle] = useState("city");
    const [weather, setWeather] = useState(null);
    const [mapCoords, setMapCoords] = useState(null);
    const username = localStorage.getItem("name");
    const weatherAPIKey = "e9522cc09ce444238ff202255240209";

    useEffect(() => {
        if (location) {
            async function fetchLocationCoords() {
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`);
                    const data = await res.json();
                    if (data && data.length > 0) {
                        setMapCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
                    } else {
                        setMapCoords(null);
                    }
                } catch (error) {
                    console.error("Geocoding error", error);
                    setMapCoords(null);
                }
            }
            // Debounce lightly
            const timeoutId = setTimeout(() => {
                fetchLocationCoords();
            }, 800);
            return () => clearTimeout(timeoutId);
        } else {
            setMapCoords(null);
        }
    }, [location]);

    useEffect(() => {
        if (location && date) {
            async function generateWeather() {
                try {
                    const response = await axios.get(`https://api.worldweatheronline.com/premium/v1/weather.ashx?key=${weatherAPIKey}&q=${location}&date=${date}&format=json`);
                    setWeather(response.data);
                } catch (error) {
                    console.error("Error whilst fetching weather data:", error);
                    setWeather({ error: "Failed to fetch weather preview data." });
                }
            }
            generateWeather();
        } else {
            setWeather(null);
        }
    }, [location, date]);

    async function submit(e) {
        e.preventDefault();

        try {
            let weatherPayload = null;
            if (weather && weather.data && weather.data.current_condition && weather.data.current_condition[0]) {
                weatherPayload = {
                    temp: weather.data.current_condition[0].temp_C,
                    condition: weather.data.current_condition[0].weatherDesc[0].value
                };
            }

            const res = await api.post("/api/trips/propose", {
                location, 
                date, 
                time, 
                duration, 
                username, 
                budget,
                style,
                weather: weatherPayload
            });

            if (res.data.status === "tripcreated") {
                showToast("Trip created successfully!", 'success');
                // Clear fields
                setLocation("");
                setDate("");
                setTime("");
                setDuration("");
            } else {
                showToast("Trip was not created.", 'warning');
            }
        } catch (error) {
            showToast("Something went wrong", 'danger');
            console.log(error);
        }
    }

    return (
        <div className="profile-container neo-raised">
            <h1 className="planTripTitle" style={{ marginTop: '1rem', marginBottom: '20px' }}>Plan a Trip</h1>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '30px' }}>
                Propose a new trip layout to recruit compatible travel partners
            </p>

            <form onSubmit={submit} className="auth-form" style={{ maxWidth: '100%' }}>
                <div className="profile-grid-fields">
                    <div className="form-group">
                        <label>Trip Location</label>
                        <input 
                            type="text" 
                            className="neo-input"
                            value={location}
                            placeholder="e.g. Tokyo, Paris, Iceland" 
                            onChange={(e) => setLocation(e.target.value)} 
                            required 
                        />
                    </div>

                    <div className="form-group">
                        <label>Trip Date</label>
                        <input 
                            type="date" 
                            className="neo-input"
                            value={date}
                            onChange={(e) => setDate(e.target.value)} 
                            required 
                        />
                    </div>

                    <div className="form-group">
                        <label>Arrival Time</label>
                        <input 
                            type="time" 
                            className="neo-input"
                            value={time}
                            onChange={(e) => setTime(e.target.value)} 
                            required 
                        />
                    </div>

                    <div className="form-group">
                        <label>Duration (Days)</label>
                        <input 
                            type="number" 
                            className="neo-input"
                            placeholder="e.g. 5, 10" 
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)} 
                            required 
                        />
                    </div>

                    <div className="form-group">
                        <label>Target Budget Bracket</label>
                        <select
                            className="search-select"
                            value={budget}
                            onChange={(e) => setBudget(e.target.value)}
                        >
                            <option value="budget">🎒 Budget (backpack/hostels)</option>
                            <option value="moderate">🏢 Moderate (standard hotels/diners)</option>
                            <option value="luxury">🏨 Luxury (resorts/fine-dining)</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Travel Style Category</label>
                        <select
                            className="search-select"
                            value={style}
                            onChange={(e) => setStyle(e.target.value)}
                        >
                            <option value="nature">🌲 Nature / Hiking</option>
                            <option value="foodie">🍕 Foodie / Cafe-hopping</option>
                            <option value="backpacking">🥾 Backpacking / Camping</option>
                            <option value="beach">🏖️ Beach / Resorts</option>
                            <option value="city">🏙️ City Sightseeing</option>
                        </select>
                    </div>
                </div>

                <div className="formItem5" style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                    <button type="submit" className="neo-btn neo-btn-primary" style={{ width: '250px' }}>
                        ✈️ Post Trip Proposal
                    </button>
                </div>
            </form>

            {weather && (
                <div className="weather neo-pressed" style={{ marginTop: '30px', padding: '20px', borderRadius: '16px' }}>
                    {weather.error ? (
                        <p className="noData" style={{ margin: 0 }}>{weather.error}</p>
                    ) : (
                        <>
                            <h2 style={{ fontSize: '18px', textAlign: 'left', padding: 0, marginBottom: '10px' }}>Live Weather Preview:</h2>
                            {weather.data && weather.data.current_condition && weather.data.current_condition.length > 0 ? (
                                <>
                                    <p className="weatherDesc" style={{ textAlign: 'left', fontSize: '16px' }}>Temperature: {weather.data.current_condition[0].temp_C}°C</p>
                                    <p className="weatherDesc" style={{ textAlign: 'left', fontSize: '16px' }}>Condition: {weather.data.current_condition[0].weatherDesc[0].value}</p>
                                </>
                            ) : (
                                <p className="noData" style={{ margin: 0 }}>Weather data not available past 14 days from today.</p>
                            )}
                        </>
                    )}
                </div>
            )}

            {mapCoords && (
                <div className="neo-pressed" style={{ marginTop: '30px', padding: '10px', borderRadius: '16px' }}>
                    <h2 className="map-section-title">Location Preview</h2>
                    <div className="map-embed" style={{ height: '300px', width: '100%' }}>
                        <MapContainer key={mapCoords[0]} center={mapCoords} zoom={10} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <Marker position={mapCoords}>
                                <Popup>{location}</Popup>
                            </Marker>
                        </MapContainer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProposeTrip;
