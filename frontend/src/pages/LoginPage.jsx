import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import bannerImg from '../assets/helpdesk_banner.png';
import { useTheme } from '../context/ThemeContext';

const poppinsStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
  body, input, button, select, textarea {
    font-family: 'Poppins', sans-serif;
  }
`;

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Timer states
  const [timeLeft, setTimeLeft] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 400);
    return () => clearTimeout(timer);
  }, [location.pathname]);
  // Timer effect
  useEffect(() => {
    if (otpSent && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && otpSent) {
      setCanResend(true);
    }
  }, [otpSent, timeLeft]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      setOtpSent(true);
      setTimeLeft(300); // 5 minutes
      setCanResend(false);
      setError('');
      setMessage(data.message || 'A verification code has been sent to your email.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    
    setError('');
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to resend OTP');
      }

      setTimeLeft(300); // Reset timer to 5 minutes
      setCanResend(false);
      setMessage(data.message || 'A new verification code has been sent to your email.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'OTP verification failed');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({
        email: data.email,
        name: data.name,
        role: data.role,
        departmentId: data.departmentId || data.department?.departmentId,
        departmentName: data.departmentName || data.department?.departmentName,
        department: data.department
      }));

      const role = data.role.toUpperCase();
      if (role === 'ADMIN') {
        navigate('/admin');
      } else if (role === 'SUPPORT_ENGINEER' || role === 'ENGINEER') {
        navigate('/engineer');
      } else {
        navigate('/employee');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={`login-page-container ${theme}`}>
      {/* Background blurs */}
      <div className="aurora-container">
        <div className="aurora-blur-1"></div>
        <div className="aurora-blur-2"></div>
        <div className="aurora-blur-3"></div>
      </div>

      {/* Floating Theme Toggler with Professional Icons */}
      <button className="theme-toggle-fab" onClick={toggleTheme} title="Toggle Theme">
        {theme === 'dark' ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
          </svg>
        )}
      </button>

      <style>{poppinsStyle}</style>

      <div  className={`glass-capsule ${isTransitioning ? 'slide-in' : ''}`}>
        {/* Left Side - Hero Image/Branding */}
        <div className="login-hero-section" style={{ backgroundImage: `url(${bannerImg})` }}>
          <div className="hero-overlay">
            <div className="hero-content">
              {/* Logo removed */}
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="login-form-section">
          <div className="form-wrapper">
            
            <h2 className="form-title">Sign In</h2>
            <p className="form-subtitle">Access your workspace</p>

            {error && <div className="alert-box error-alert">{error}</div>}
            {message && <div className="alert-box success-alert">{message}</div>}

            <form onSubmit={otpSent ? handleVerifyOtp : handleLogin} className="login-form">
              <div className="field-group">
                <label>Work Email</label>
                <div className="input-with-icon">
                  <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <input
                    type="email"
                    className="input-premium"
                    placeholder="username@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={otpSent}
                  />
                </div>
              </div>

              {!otpSent && (
                <div className="field-group">
                  <label>Password</label>
                  <div className="input-with-icon">
                    <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="input-premium"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={togglePasswordVisibility}
                      tabIndex="-1"
                    >
                      {showPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {otpSent && (
                <div className="field-group">
                  <label>One-Time Password</label>
                  <div className="input-with-icon">
                    <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                      <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
                    </svg>
                    <input
                      type="text"
                      className="input-premium"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                    />
                  </div>
                  
                  {/* Timer and Resend Section */}
                  <div className="otp-timer-section">
                    {timeLeft > 0 ? (
                      <span className="otp-timer">
                        ⏱️ OTP expires in <strong>{formatTime(timeLeft)}</strong>
                      </span>
                    ) : (
                      <span className="otp-expired">⏰ OTP has expired</span>
                    )}
                    
                    <button
                      type="button"
                      className={`resend-btn ${canResend ? 'active' : 'disabled'}`}
                      onClick={handleResendOtp}
                      disabled={!canResend || loading}
                    >
                      {loading ? 'Sending...' : 'Resend OTP'}
                    </button>
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                className="btn-premium full-width mt-2" 
                disabled={loading}
              >
                {loading ? (otpSent ? 'Verifying OTP...' : 'Sending OTP...') : (otpSent ? 'Verify OTP' : 'Send OTP & Sign In')}
              </button>
            </form>

            <div className="form-footer">
              <p>Don't have an account? <Link to="/register">Register here</Link></p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* Theme Variables */
        .login-page-container {
          --bg-primary: #080c1a;
          --bg-panel: rgba(15, 23, 42, 0.85);
          --bg-card: rgba(255, 255, 255, 0.05);
          --bg-input: rgba(255, 255, 255, 0.08);
          --text-primary: #eef2ff;
          --text-secondary: #b9c8f0;
          --text-muted: #8a9bc0;
          --border: rgba(255, 255, 255, 0.06);
          --border-glow: rgba(56, 189, 248, 0.3);
          --accent-cyan: #7dd3fc;
          --accent-blue: #38bdf8;
          --shadow-neon: 0 0 30px rgba(99, 102, 241, 0.2);
          --radius-sm: 12px;
          --theme-transition: 0.4s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 24px;
          background: var(--bg-primary);
          transition: background var(--theme-transition);
        }

        /* Light Theme */
        .login-page-container.light {
          --bg-primary: #f0f4ff;
          --bg-panel: rgba(255, 255, 255, 0.85);
          --bg-card: rgba(0, 0, 0, 0.03);
          --bg-input: rgba(255, 255, 255, 0.9);
          --text-primary: #0a1628;
          --text-secondary: #2a3a6a;
          --text-muted: #4a5a7a;
          --border: rgba(0, 0, 0, 0.08);
          --border-glow: rgba(37, 99, 235, 0.3);
          --accent-cyan: #2563eb;
          --accent-blue: #3b82f6;
          --shadow-neon: 0 0 30px rgba(37, 99, 235, 0.15);
        }

        .theme-toggle-fab {
          position: fixed;
          top: 24px;
          right: 24px;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--bg-card);
          border: 1px solid var(--border);
          color: var(--text-primary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 100;
          padding: 0;
        }
        .theme-toggle-fab:hover {
          transform: scale(1.1) rotate(15deg);
          border-color: var(--border-glow);
          box-shadow: var(--shadow-neon);
        }

        .theme-toggle-fab svg {
          stroke: currentColor;
          transition: transform 0.3s ease;
        }

        .theme-toggle-fab:hover svg {
          transform: rotate(30deg);
        }

        /* Aurora Background */
        .aurora-container {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
        }

        .aurora-blur-1,
        .aurora-blur-2,
        .aurora-blur-3 {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.3;
          transition: opacity var(--theme-transition);
        }

        .aurora-blur-1 {
          width: 600px;
          height: 600px;
          background: #4f46e5;
          top: -10%;
          left: -5%;
        }
        .aurora-blur-2 {
          width: 500px;
          height: 500px;
          background: #0ea5e9;
          bottom: -10%;
          right: -5%;
        }
        .aurora-blur-3 {
          width: 400px;
          height: 400px;
          background: #8b5cf6;
          top: 50%;
          left: 40%;
        }

        .login-page-container.light .aurora-blur-1,
        .login-page-container.light .aurora-blur-2,
        .login-page-container.light .aurora-blur-3 {
          opacity: 0.1;
        }
        
        .glass-capsule {
          background: var(--bg-panel);
          border: 1px solid var(--border);
          border-radius: 28px;
          width: 100%;
          max-width: 1100px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          overflow: hidden;
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(99, 102, 241, 0.1);
          transition: all var(--theme-transition);
          min-height: 600px;
          position: relative;
          z-index: 1;
        }
        
        /* Left Side - Hero Section */
        .login-hero-section {
          background-size: cover;
          background-position: center;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .hero-overlay {
          background: transparent;
          padding: 0;
          height: 100%;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .login-page-container.light .hero-overlay {
          background: transparent;
        }
        
        .hero-content {
          text-align: center;
          max-width: 400px;
        }
        
        /* Right Side - Login Form */
        .login-form-section {
          padding: 48px 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-left: 1px solid var(--border);
        }
        
        .form-wrapper {
          width: 100%;
          max-width: 380px;
        }
        
        .form-title {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 6px;
          color: var(--text-primary);
        }
        
        .form-subtitle {
          color: var(--text-secondary);
          font-size: 0.95rem;
          margin-bottom: 28px;
        }
        
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .field-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .field-group label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-secondary);
          letter-spacing: 0.02em;
        }
        
        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }
        
        .field-icon {
          position: absolute;
          left: 12px;
          font-size: 1rem;
          pointer-events: none;
          color: var(--text-muted);
          z-index: 2;
        }
        
        .input-premium {
          width: 100%;
          padding: 12px 16px 12px 38px;
          background: var(--bg-input);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          font-size: 0.95rem;
          transition: all 0.3s ease;
          outline: none;
        }

        .input-premium:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Password toggle button */
        .password-toggle-btn {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          transition: color 0.2s ease;
          z-index: 2;
        }

        .password-toggle-btn:hover {
          color: var(--text-primary);
        }

        .password-toggle-btn svg {
          stroke: currentColor;
        }

        /* OTP Timer Section */
        .otp-timer-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 6px;
          padding: 8px 4px;
        }

        .otp-timer {
          color: var(--text-secondary);
          font-size: 0.85rem;
        }

        .otp-timer strong {
          color: var(--accent-cyan);
        }

        .otp-expired {
          color: #f87171;
          font-size: 0.85rem;
        }

        .resend-btn {
          background: none;
          border: none;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          padding: 4px 12px;
          border-radius: 6px;
          transition: all 0.3s ease;
        }

        .resend-btn.active {
          color: var(--accent-cyan);
        }

        .resend-btn.active:hover {
          color: var(--accent-blue);
          text-decoration: underline;
          background: var(--bg-card);
        }

        .resend-btn.disabled {
          color: var(--text-muted);
          cursor: not-allowed;
          opacity: 0.5;
        }

        /* Dark mode input */
        .login-page-container:not(.light) .input-premium {
          background: rgba(255, 255, 255, 0.08);
          color: #eef2ff;
          border-color: rgba(255, 255, 255, 0.1);
        }

        .login-page-container:not(.light) .input-premium:focus {
          border-color: rgba(56, 189, 248, 0.4);
          box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.1);
        }

        .login-page-container:not(.light) .input-premium::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .login-page-container:not(.light) .password-toggle-btn {
          color: rgba(255, 255, 255, 0.4);
        }

        .login-page-container:not(.light) .password-toggle-btn:hover {
          color: rgba(255, 255, 255, 0.8);
        }

        /* Light mode input */
        .login-page-container.light .input-premium {
          background: #ffffff;
          color: #0a1628;
          border-color: rgba(0, 0, 0, 0.1);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .login-page-container.light .input-premium:focus {
          border-color: rgba(37, 99, 235, 0.4);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .login-page-container.light .input-premium::placeholder {
          color: rgba(0, 0, 0, 0.3);
        }

        .login-page-container.light .password-toggle-btn {
          color: rgba(0, 0, 0, 0.3);
        }

        .login-page-container.light .password-toggle-btn:hover {
          color: rgba(0, 0, 0, 0.6);
        }

        /* Dark mode field icon */
        .login-page-container:not(.light) .field-icon {
          color: rgba(255, 255, 255, 0.4);
        }

        /* Light mode field icon */
        .login-page-container.light .field-icon {
          color: rgba(0, 0, 0, 0.3);
        }

        /* Dark mode labels */
        .login-page-container:not(.light) .field-group label {
          color: rgba(255, 255, 255, 0.7);
        }

        /* Light mode labels */
        .login-page-container.light .field-group label {
          color: rgba(0, 0, 0, 0.6);
        }
        
        .btn-premium {
          background: linear-gradient(135deg, var(--accent-purple), var(--accent-cyan));

          color: white;
          font-weight: 600;
          padding: 14px 28px;
          border: none;
          border-radius: 99px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 25px rgba(37, 99, 235, 0.3);
          width: 100%;
        }

        .btn-premium:hover:not(:disabled) {
          transform: scale(1.02);
          box-shadow: 0 8px 35px rgba(37, 99, 235, 0.4);
        }
        
        .full-width {
          width: 100%;
          justify-content: center;
        }
        
        .mt-2 { 
          margin-top: 4px; 
        }
        
        .form-footer {
          margin-top: 28px;
          text-align: center;
          font-size: 0.9rem;
          color: var(--text-secondary);
          padding-top: 20px;
          border-top: 1px solid var(--border);
        }
        
        .form-footer a {
          color: var(--accent-cyan);
          font-weight: 600;
          text-decoration: none;
          transition: color 0.2s ease;
        }
        .form-footer a:hover {
          color: var(--accent-blue);
          text-decoration: underline;
        }
        
        .alert-box {
          padding: 12px 16px;
          border-radius: var(--radius-sm);
          font-size: 0.9rem;
          margin-bottom: 20px;
          border: 1px solid;
        }
        
        .error-alert {
          background: rgba(239, 68, 68, 0.1);
          color: #f87171;
          border-color: rgba(239, 68, 68, 0.2);
        }

        .login-page-container.light .error-alert {
          background: rgba(239, 68, 68, 0.05);
          color: #dc2626;
          border-color: rgba(239, 68, 68, 0.15);
        }

        .success-alert {
          background: rgba(34, 197, 94, 0.1);
          color: #4ade80;
          border-color: rgba(34, 197, 94, 0.2);
        }

        .login-page-container.light .success-alert {
          background: rgba(34, 197, 94, 0.05);
          color: #16a34a;
          border-color: rgba(34, 197, 94, 0.15);
        }
        
        /* Responsive */
        @media (max-width: 992px) {
          .glass-capsule {
            grid-template-columns: 1fr;
            max-width: 500px;
            min-height: auto;
          }
          
          .login-hero-section {
            border-bottom: 1px solid var(--border);
            min-height: 250px;
          }
          
          .login-form-section {
            padding: 32px 24px;
            border-left: none;
          }
        }
        
        @media (max-width: 480px) {
          .login-page-container {
            padding: 16px;
          }
          
          .glass-capsule {
            border-radius: 20px;
          }
          
          .login-hero-section {
            min-height: 200px;
          }
          
          .login-form-section {
            padding: 24px 16px;
          }
          
          .form-title {
            font-size: 1.6rem;
          }
          
          .theme-toggle-fab {
            width: 40px;
            height: 40px;
            font-size: 1rem;
            top: 16px;
            right: 16px;
          }

          .otp-timer-section {
            flex-direction: column;
            gap: 6px;
            align-items: flex-start;
          }
        }
        
        /* Disabled button state */
        .btn-premium:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none !important;
        }
        
        /* Input autofill styles */
        .input-premium:-webkit-autofill,
        .input-premium:-webkit-autofill:hover,
        .input-premium:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px var(--bg-input) inset !important;
          -webkit-text-fill-color: var(--text-primary) !important;
          transition: background-color 5000s ease-in-out 0s;
        }

        .login-page-container.light .input-premium:-webkit-autofill,
        .login-page-container.light .input-premium:-webkit-autofill:hover,
        .login-page-container.light .input-premium:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #ffffff inset !important;
          -webkit-text-fill-color: #0a1628 !important;
        }

        .glass-capsule.slide-in {
  animation: slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
      `}</style>
    </div>
  );
}