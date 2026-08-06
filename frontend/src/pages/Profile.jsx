import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';
import '../App.css';

const Profile = () => {
    const { targetUsername } = useParams();
    const { showToast } = useToast();
    const currentUsername = localStorage.getItem('name');
    const username = targetUsername || currentUsername;
    const isOwnProfile = username === currentUsername;
    
    const [age, setAge] = useState('');
    const [email, setEmail] = useState('');
    const [gender, setGender] = useState('');
    const [bio, setBio] = useState('');
    const [budget, setBudget] = useState('moderate');
    const [pace, setPace] = useState('active');
    const [style, setStyle] = useState('city');
    const [interestsText, setInterestsText] = useState('');
    const [avatar, setAvatar] = useState('');
    const [loading, setLoading] = useState(true);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // Reviews state
    const [reviews, setReviews] = useState([]);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');

    useEffect(() => {
        async function fetchProfile() {
            try {
                const res = await api.get(`/api/users/profile/${username}`);
                const data = res.data;
                if (data) {
                    setAge(data.age || '');
                    setEmail(data.email || '');
                    setGender(data.gender || '');
                    setBio(data.bio || '');
                    setBudget(data.budget || 'moderate');
                    setPace(data.pace || 'active');
                    setStyle(data.style || 'city');
                    const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;
                    setAvatar(data.avatar || defaultAvatar);
                    
                    if (data.interests && Array.isArray(data.interests)) {
                        setInterestsText(data.interests.join(', '));
                    }
                }

                // Fetch reviews
                const reviewsRes = await api.get(`/api/reviews/${username}`);
                setReviews(reviewsRes.data || []);
                
            } catch (error) {
                console.error('Error loading profile or reviews:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchProfile();
    }, [username]);

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await api.post('/api/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.url) {
                setAvatar(res.data.url);
                showToast('Avatar uploaded! Make sure to Save.', 'success');
            }
        } catch (error) {
            console.error('Error uploading avatar:', error);
            showToast('Failed to upload image.', 'danger');
        }
    };

    const handleRemovePhoto = () => {
        setAvatar(`https://api.dicebear.com/7.x/bottts/svg?seed=${username}`);
        showToast('Photo removed! Make sure to Save.', 'success');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Parse comma-separated interests
        const interestsArray = interestsText
            .split(',')
            .map(i => i.trim())
            .filter(i => i.length > 0);

        try {
            const res = await api.post('/api/users/profile', {
                age: Number(age) || '',
                email,
                gender,
                bio,
                budget,
                pace,
                style,
                interests: interestsArray,
                avatar
            });

            if (res.data.status === 'profileupdated') {
                showToast('Profile updated successfully!', 'success');
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            showToast('Failed to update profile.', 'danger');
        }
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/api/reviews', {
                reviewee: username,
                rating,
                comment
            });
            if (res.data.status === 'reviewadded') {
                setReviews([res.data.review, ...reviews]);
                setComment('');
                setRating(5);
                showToast('Review submitted!', 'success');
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            showToast('Failed to submit review.', 'danger');
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            showToast('New passwords do not match.', 'warning');
            return;
        }

        try {
            const res = await api.post('/api/users/change-password', {
                currentPassword,
                newPassword
            });

            if (res.data.status === 'passwordupdated') {
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                showToast('Password changed successfully.', 'success');
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to change password.';
            showToast(message, 'danger');
        }
    };

    if (loading) {
        return (
            <div className="neo-panel neo-pressed" style={{ padding: '40px', textAlign: 'center' }}>
                <p className="noData">Loading profile data...</p>
            </div>
        );
    }

    return (
        <div className="profile-container neo-raised">
            <h1 className="planTripTitle" style={{ marginTop: '1rem', marginBottom: '20px' }}>
                {isOwnProfile ? 'Your Travel Profile' : `${username}'s Travel Profile`}
            </h1>
            {isOwnProfile && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '30px' }}>
                    Declare your styles to find buddies with high matching compatibility
                </p>
            )}

            <div className="profile-avatar-select">
                <img src={avatar} alt="avatar" className="profile-avatar-large" />
                <span className="neo-pressed" style={{ padding: '6px 16px', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold' }}>
                    @{username}
                </span>
                {isOwnProfile && (
                    <div style={{ marginTop: '10px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <label className="neo-btn request-btn-sm" style={{ cursor: 'pointer' }}>
                            {avatar.includes('api.dicebear.com') ? 'Upload Photo' : 'Change Photo'}
                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
                        </label>
                        {!avatar.includes('api.dicebear.com') && (
                            <button 
                                className="neo-btn request-btn-sm" 
                                style={{ background: 'var(--danger)', color: 'white' }}
                                onClick={handleRemovePhoto}
                            >
                                Remove Photo
                            </button>
                        )}
                    </div>
                )}
            </div>

            {isOwnProfile && (
                <form onSubmit={handlePasswordChange} className="neo-panel neo-pressed" style={{ padding: '20px', marginBottom: '30px' }}>
                    <h3 style={{ marginTop: 0 }}>Change Password</h3>
                    <div className="form-group">
                        <label>Current Password</label>
                        <input
                            type="password"
                            className="neo-input"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter current password"
                        />
                    </div>
                    <div className="form-group">
                        <label>New Password</label>
                        <input
                            type="password"
                            className="neo-input"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Confirm New Password</label>
                        <input
                            type="password"
                            className="neo-input"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            required
                        />
                    </div>
                    <button type="submit" className="neo-btn neo-btn-primary" style={{ width: '100%' }}>
                        🔐 Update Password
                    </button>
                </form>
            )}

            <form onSubmit={handleSubmit} className="auth-form" style={{ maxWidth: '100%' }}>
                <div className="profile-grid-fields">
                    <div className="form-group">
                        <label>Age</label>
                        <input
                            type="number"
                            className="neo-input"
                            placeholder="Enter age"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            disabled={!isOwnProfile}
                        />
                    </div>
                    <div className="form-group">
                        <label>Contact Email</label>
                        <input
                            type="email"
                            className="neo-input"
                            placeholder="Enter contact email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={!isOwnProfile}
                        />
                    </div>
                    <div className="form-group">
                        <label>Gender</label>
                        <input
                            type="text"
                            className="neo-input"
                            placeholder="Enter gender"
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            disabled={!isOwnProfile}
                        />
                    </div>
                    <div className="form-group">
                        <label>Travel Budget Level</label>
                        <select
                            className="search-select"
                            value={budget}
                            onChange={(e) => setBudget(e.target.value)}
                            disabled={!isOwnProfile}
                        >
                            <option value="budget">🎒 Budget (backpack/hostels)</option>
                            <option value="moderate">🏢 Moderate (standard hotels/diners)</option>
                            <option value="luxury">🏨 Luxury (resorts/fine-dining)</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Travel Pace</label>
                        <select
                            className="search-select"
                            value={pace}
                            onChange={(e) => setPace(e.target.value)}
                            disabled={!isOwnProfile}
                        >
                            <option value="relaxed">🧘 Relaxed (slow pacing/chill)</option>
                            <option value="active">🏃 Active (moderate sightseeing)</option>
                            <option value="fast">⚡ Fast (cram packing/non-stop)</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Primary Travel Style</label>
                        <select
                            className="search-select"
                            value={style}
                            onChange={(e) => setStyle(e.target.value)}
                            disabled={!isOwnProfile}
                        >
                            <option value="nature">🌲 Nature / Hiking</option>
                            <option value="foodie">🍕 Foodie / Cafe-hopping</option>
                            <option value="backpacking">🥾 Backpacking / Camping</option>
                            <option value="beach">🏖️ Beach / Resorts</option>
                            <option value="city">🏙️ City Sightseeing</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Interests (comma-separated)</label>
                        <input
                            type="text"
                            className="neo-input"
                            placeholder="e.g. Photography, Hiking, Sushi, Museums"
                            value={interestsText}
                            onChange={(e) => setInterestsText(e.target.value)}
                            disabled={!isOwnProfile}
                        />
                    </div>
                    <div className="form-group profile-field-full">
                        <label>Bio (Tell your travel buddies about yourself)</label>
                        <textarea
                            className="neo-input"
                            placeholder="I love taking photographs in old European towns..."
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows={4}
                            disabled={!isOwnProfile}
                            style={{ resize: 'none', borderRadius: '16px' }}
                        />
                    </div>
                </div>

                {isOwnProfile && (
                    <div className="formItem5" style={{ display: 'flex', justifyContent: 'center' }}>
                        <button type="submit" className="neo-btn neo-btn-primary" style={{ width: '250px' }}>
                            💾 Save Profile Settings
                        </button>
                    </div>
                )}
            </form>

            <hr style={{ margin: '40px 0', borderColor: 'var(--border-color)', opacity: 0.3 }} />

            <div className="reviews-section">
                <h2>Reviews ({reviews.length})</h2>
                {reviews.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                        Average Rating: <strong>{parseFloat((reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1))} / 5</strong> ⭐
                    </div>
                )}
                
                {!isOwnProfile && (
                    <form onSubmit={handleReviewSubmit} className="neo-panel neo-pressed" style={{ padding: '20px', marginBottom: '30px' }}>
                        <h3 style={{ marginTop: 0 }}>Leave a Review</h3>
                        <div className="form-group">
                            <label>Rating</label>
                            <select className="search-select" value={rating} onChange={e => setRating(Number(e.target.value))}>
                                <option value="5">5 - Excellent</option>
                                <option value="4">4 - Very Good</option>
                                <option value="3">3 - Average</option>
                                <option value="2">2 - Poor</option>
                                <option value="1">1 - Terrible</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Comment</label>
                            <textarea 
                                className="neo-input" 
                                rows="3" 
                                value={comment} 
                                onChange={e => setComment(e.target.value)}
                                placeholder="How was it traveling with them?"
                                required
                            />
                        </div>
                        <button type="submit" className="neo-btn neo-btn-primary" style={{ marginTop: '10px' }}>Submit Review</button>
                    </form>
                )}

                <div className="reviews-list">
                    {reviews.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)' }}>No reviews yet.</p>
                    ) : (
                        reviews.map((r, idx) => (
                            <div key={idx} className="neo-raised" style={{ padding: '15px', marginBottom: '15px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <strong>{r.reviewer}</strong>
                                    <span>{'⭐'.repeat(r.rating)}</span>
                                </div>
                                <p style={{ margin: 0 }}>{r.comment}</p>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                                    {new Date(r.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
