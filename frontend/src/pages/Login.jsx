import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';
import AuthModeSwitcher from '../components/AuthModeSwitcher';
import '../App.css';

const Login = () => {
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    useEffect(() => {
        const token = searchParams.get('token');
        const username = searchParams.get('username');
        const error = searchParams.get('error');
        const requestedMode = searchParams.get('mode');

        if (requestedMode === 'reset') {
            navigate('/forgot-password', { replace: true });
            return;
        }

        if (token && username) {
            localStorage.setItem('name', username);
            localStorage.setItem('token', token);
            localStorage.setItem('userID', searchParams.get('userID') || '');
            navigate('/');
            return;
        }

        if (error) {
            showToast('Social login failed. Please try again.', 'danger');
        }
    }, [navigate, searchParams, showToast]);

    async function submit(e) {
        e.preventDefault();

        try {
            const res = await api.post("/api/users/login", {
                username,
                password
            });
            
            if (res.data.status === "userfound") {
                localStorage.setItem("name", username);
                localStorage.setItem("userID", res.data.userID);
                localStorage.setItem("token", res.data.token);
                navigate("/");
            } else if (res.data === "usernotfound" || res.data.status === "usernotfound") {
                showToast("Invalid login credentials", "warning");
            }
        } catch (error) {
            showToast("Something went wrong", "danger");
            console.log(error);
        }
    }

    const handleGoogleLogin = () => {
        const backendBase = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        window.location.href = `${backendBase}/api/auth/oauth/google`;
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-shell">
                <div className="auth-hero neo-raised">
                    <div className="auth-badge">✈️ Travel planning made easy</div>
                    <h1 className="auth-title">TravelSaathi</h1>
                    <p className="auth-subtitle">Sign in to connect with travel companions, plan memorable trips, and share your next adventure.</p>

                    <div className="auth-visual-card">
                        <div className="auth-visual-glow" />
                        <div className="auth-visual-icon">🧳</div>
                        <div className="auth-visual-title">Plan smarter</div>
                        <div className="auth-visual-text">Find buddies, share itineraries, and make every journey feel effortless.</div>
                        <div className="auth-visual-tags">
                            <span>Trips</span>
                            <span>Friends</span>
                            <span>Moments</span>
                        </div>
                    </div>
                </div>

                <div className="auth-card neo-raised">
                    <AuthModeSwitcher active="login" />

                    <div className="auth-panel-heading">Welcome back</div>
                    <p className="auth-panel-subtitle">Sign in to continue planning your next trip.</p>

                    <form onSubmit={submit} className="auth-form">
                        <div className="form-group">
                            <input
                                type="text"
                                className="neo-input"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Username"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <input
                                type="password"
                                className="neo-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                required
                            />
                        </div>

                        <button type="submit" className="neo-btn neo-btn-primary auth-submit-btn">
                            Login 🔒
                        </button>
                    </form>

                    <div className="auth-divider">
                        <span>or continue with</span>
                    </div>

                    <button type="button" className="neo-btn auth-social-btn" onClick={handleGoogleLogin}>
                        <span className="auth-social-icon">G</span>
                        Continue with Google
                    </button>

                    <div className="auth-footer">
                        <Link to="/forgot-password" className="auth-link">Forgot password?</Link>
                        <span className="auth-footer-separator">•</span>
                        <Link to="/register" className="auth-link">Register</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
