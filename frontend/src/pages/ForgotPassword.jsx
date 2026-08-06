import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';
import AuthModeSwitcher from '../components/AuthModeSwitcher';
import '../App.css';

const createCaptchaQuestion = () => {
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 9) + 1;
    return { question: `${a} + ${b}`, answer: a + b };
};

const ForgotPassword = () => {
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [step, setStep] = useState('request');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [captcha, setCaptcha] = useState(createCaptchaQuestion());
    const [captchaAnswer, setCaptchaAnswer] = useState('');

    const requestOtp = async (e) => {
        e.preventDefault();

        try {
            const res = await api.post('/api/users/request-password-reset', {
                email,
                captchaQuestion: captcha.question,
                captchaAnswer: Number(captchaAnswer)
            });

            if (res.data.status === 'otpsent') {
                setStep('verify');
                setCaptcha(createCaptchaQuestion());
                setCaptchaAnswer('');
                showToast('OTP sent to your email.', 'success');
            } else if (res.data.status === 'usernotfound') {
                showToast('No account found for that email.', 'warning');
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to send OTP.';
            showToast(message, 'danger');
        }
    };

    const resetPassword = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            showToast('Passwords do not match.', 'warning');
            return;
        }

        try {
            const res = await api.post('/api/users/forgot-password', {
                email,
                otp,
                newPassword
            });


            if (res.data.status === 'passwordupdated') {
                showToast('Password reset successfully. Please sign in.', 'success');
                navigate('/login');
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to reset password.';
            showToast(message, 'danger');
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-shell">
                <div className="auth-hero neo-raised">
                    <div className="auth-badge">🔐 Account recovery</div>
                    <h1 className="auth-title">TravelSaathi</h1>
                    <p className="auth-subtitle">Set a new password and return to planning your next adventure with confidence.</p>

                    <div className="auth-visual-card">
                        <div className="auth-visual-glow" />
                        <div className="auth-visual-icon">🗺️</div>
                        <div className="auth-visual-title">Secure access</div>
                        <div className="auth-visual-text">Choose a strong password to keep your travel plans, chats, and shared itineraries protected.</div>
                        <div className="auth-visual-tags">
                            <span>Protected</span>
                            <span>Quick</span>
                            <span>Easy</span>
                        </div>
                    </div>
                </div>

                <div className="auth-card neo-raised">
                    <AuthModeSwitcher active="reset" />

                    <div className="auth-panel-heading">Reset your password</div>
                    <p className="auth-panel-subtitle">Enter your email to receive an OTP, verify it, and set a new password.</p>

                    {step === 'request' ? (
                        <form onSubmit={requestOtp} className="auth-form">
                            <div className="form-group">
                                <input
                                    type="email"
                                    className="neo-input"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Email address"
                                    autoComplete="email"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <input
                                    type="number"
                                    className="neo-input"
                                    value={captchaAnswer}
                                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                                    placeholder={captcha.question}
                                    required
                                />
                            </div>

                            <button type="submit" className="neo-btn neo-btn-primary auth-submit-btn">
                                Send OTP
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={resetPassword} className="auth-form">
                            <div className="form-group">
                                <input
                                    type="text"
                                    className="neo-input"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="Enter OTP"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <input
                                    type="password"
                                    className="neo-input"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="New password"
                                    minLength="6"
                                    autoComplete="new-password"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <input
                                    type="password"
                                    className="neo-input"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    minLength="6"
                                    autoComplete="new-password"
                                    required
                                />
                            </div>

                            <button type="submit" className="neo-btn neo-btn-primary auth-submit-btn">
                                Reset Password
                            </button>
                        </form>
                    )}

                    <div className="auth-reset-panel">
                        <div className="auth-reset-title">Password tips</div>
                        <p className="auth-help-text">Use at least 8 characters, mix letters and numbers, and avoid obvious choices.</p>
                    </div>

                    <div className="auth-footer">
                        Remembered your password? <Link to="/login" className="auth-link">Back to login</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
