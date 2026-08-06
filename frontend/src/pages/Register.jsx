import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../utils/api";
import { useToast } from "../context/ToastContext";
import { Turnstile } from "@marsidev/react-turnstile";
import AuthModeSwitcher from "../components/AuthModeSwitcher";
import "../App.css";

const Register = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");

  const allFieldsFilled = username.trim() !== "" && email.trim() !== "" && password !== "" && confirmPassword !== "" && password === confirmPassword;

  async function submit(e) {
    e.preventDefault();

    if (password !== confirmPassword) {
      showToast("Passwords do not match", "warning");
      return;
    }

    if (password.length < 8) {
      showToast("Password must be at least 8 characters", "warning");
      return;
    }

    if (!captchaToken) {
      showToast("Please verify that you're human.", "warning");
      return;
    }

    try {
      const res = await api.post("/api/users/register", {
        username,
        email,
        password,
        confirmPassword,
        captchaToken,
      });

      if (res.data === "userexists" || res.data.status === "userexists") {
        showToast("User already exists", "warning");
        return;
      } else if (res.data.status === "otpSent") {
        localStorage.setItem("verifyEmail", email);
        showToast("OTP sent successfully", "success");
        navigate("/verify-otp");
        return;
      } else if (res.data.status === "accountcreated") {
        localStorage.setItem("name", username);
        localStorage.setItem("userID", res.data.userID);
        localStorage.setItem("token", res.data.token);
        showToast("Registration Successful!", "success");
        navigate("/");
        return;
      }
    } catch (error) {
      showToast(
        error.response?.data?.message || "Something went wrong",
        "danger",
      );
      console.log(error);
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-shell">
        <div className="auth-hero neo-raised">
          <div className="auth-badge">🌍 Join the journey</div>
          <h1 className="auth-title">TravelSaathi</h1>
          <p className="auth-subtitle">
            Create a free explorer account and start finding companions for your
            next trip, stay, and adventure.
          </p>

          <div className="auth-visual-card">
            <div className="auth-visual-glow" />
            <div className="auth-visual-icon">🗺️</div>
            <div className="auth-visual-title">Start exploring</div>
            <div className="auth-visual-text">
              Create your profile and discover people who love the same places
              and experiences.
            </div>
            <div className="auth-visual-tags">
              <span>New friends</span>
              <span>Shared plans</span>
              <span>Memories</span>
            </div>
          </div>
        </div>

        <div className="auth-card neo-raised">
          <AuthModeSwitcher active="register" />

          <div className="auth-panel-heading">Create your account</div>
          <p className="auth-panel-subtitle">
            Join TravelSaathi and start planning seamless journeys with other
            travelers.
          </p>

          <form onSubmit={submit} className="auth-form">
            <div className="form-group">
              <input
                type="text"
                className="neo-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose Username"
                required
              />
            </div>

            <div className="form-group">
              <input
                type="email"
                className="neo-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
              />
            </div>

            <div className="form-group">
              <input
                type="password"
                className="neo-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create Password"
                required
              />
            </div>

            <div className="form-group">
              <input
                type="password"
                className="neo-input"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {allFieldsFilled ? (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                <Turnstile
                  siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                  onSuccess={(token) => {
                    setCaptchaToken(token);
                  }}
                  options={{
                    theme: "light",
                  }}
                />
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', padding: '15px', border: '1px dashed var(--border-color)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '13px' }}>
                {password && confirmPassword && password !== confirmPassword 
                  ? "Passwords do not match" 
                  : "Please fill all details above to verify"}
              </div>
            )}

            <button
              type="submit"
              className="neo-btn neo-btn-primary auth-submit-btn"
              disabled={!captchaToken}
              style={{ opacity: captchaToken ? 1 : 0.6 }}
            >
              Register 🚀
            </button>
          </form>

          <div className="auth-footer">
            Already have an account?{" "}
            <Link to="/login" className="auth-link">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
