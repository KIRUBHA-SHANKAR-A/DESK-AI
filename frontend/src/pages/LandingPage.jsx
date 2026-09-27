import React from 'react';
import { Link } from 'react-router-dom';
import logoImg from '../assets/desk_ai.png';
import { useTheme } from '../context/ThemeContext';
import ChatbotAssistant from '../components/common/ChatbotAssistant';

// Import images - you'll need to add these images to your assets folder
import featureImage1 from '../assets/feature1.png';
import featureImage2 from '../assets/feature2.png';
import featureImage3 from '../assets/feature3.png';
import dashboardImg from '../assets/dashboard.png';
import analyticsImg from '../assets/analytics.png';
import supportImg from '../assets/support.png';
import heroMainImg from '../assets/helpdesk_banner.png'; // Add this image to your assets

const poppinsStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
  * { font-family: 'Poppins', sans-serif; }
`;

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={`landing-wrapper ${theme}`}>
      <style>{poppinsStyle}</style>

      {/* Theme Toggle Button */}
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

      {/* Aurora Background */}
      <div className="aurora-container">
        <div className="aurora-blur-1"></div>
        <div className="aurora-blur-2"></div>
        <div className="aurora-blur-3"></div>
      </div>

      {/* Main Content */}
      <div className="landing-content">
        <div className="content-inner">
          {/* Hero Section with Image Left & Text Right */}
          <div className="hero-section">
            <div className="hero-left">
              <img src={heroMainImg} alt="DESK AI Dashboard Preview" className="hero-main-image" />
            </div>
            <div className="hero-right">
              {/* Logo */}
              <div className="logo-wrapper-full">
                {/* <img src={logoImg} alt="DESK AI" className="logo-img-full" /> */}
              </div>

              {/* Main Title */}
              <h1 className="hero-title-full">
                <span className="gradient-text-full">DESK AI</span>
              </h1>
              <p className="hero-subtitle-full">
                Intelligent Helpdesk &amp; Ticket Resolution System
              </p>

              {/* Description */}
              <p className="hero-description-full">
                AI-powered centralized helpdesk solution that automates ticket classification,
                detects duplicates, and provides intelligent knowledge recommendations.
              </p>

              {/* Feature Grid - Larger Cards */}
              <div className="feature-grid-full">
                <div className="feature-card-full">
                  <div className="feature-content">
                    <img src={featureImage1} alt="Duplicate Detection" className="feature-img" />
                    <div className="feature-text">
                      <h4>Duplicate Detection</h4>
                      <p>Sentence-BERT similarity analysis</p>
                    </div>
                  </div>
                </div>
                <div className="feature-card-full">
                  <div className="feature-content">
                    <img src={featureImage2} alt="Auto Classification" className="feature-img" />
                    <div className="feature-text">
                      <h4>Auto-Classification</h4>
                      <p>Smart routing &amp; SLA alerts</p>
                    </div>
                  </div>
                </div>
                <div className="feature-card-full">
                  <div className="feature-content">
                    <img src={featureImage3} alt="Knowledge Base" className="feature-img" />
                    <div className="feature-text">
                      <h4>Knowledge Base</h4>
                      <p>Self-generating articles</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Showcase */}
          <div className="showcase-section">
            <h2 className="section-heading">Powerful Dashboard</h2>
            <div className="showcase-grid">
              <div className="showcase-card">
                <img src={dashboardImg} alt="Dashboard" className="showcase-img" />
                <h4>Real-time Analytics</h4>
                <p>Monitor ticket status and team performance</p>
              </div>
              <div className="showcase-card">
                <img src={analyticsImg} alt="Analytics" className="showcase-img" />
                <h4>Insightful Reports</h4>
                <p>Data-driven decisions with visual analytics</p>
              </div>
              <div className="showcase-card">
                <img src={supportImg} alt="Support" className="showcase-img" />
                <h4>24/7 Support</h4>
                <p>Intelligent ticket management anytime</p>
              </div>
            </div>
          </div>


          {/* CTA Buttons */}
          <div className="cta-group-full">
            <Link to="/register" className="btn-primary-full">
              Get Started
            </Link>
            <Link to="/login" className="btn-secondary-full">
              Sign In
            </Link>
          </div>

          {/* Footer */}
          <div className="footer-full">
            <span>© DESK AI @ 2026</span>
            <span>Powered by AI &amp; NLP</span>
          </div>
        </div>

        {/* Module 7 & Proposed Work: Interactive Self-Service Assistant */}
        <ChatbotAssistant />
      </div>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .landing-wrapper {
          width: 100vw;
          min-height: 100vh;
          overflow-y: auto;
          position: relative;
          background: #080c1a;
          transition: background 0.4s ease;
          padding: 40px 20px;
        }

        .landing-wrapper.light {
          background: #f0f4ff;
        }

        /* Light Theme */
        .landing-wrapper.light .hero-title-full {
          color: #0a1628;
        }

        .landing-wrapper.light .hero-subtitle-full {
          color: #2a3a6a;
        }

        .landing-wrapper.light .hero-description-full {
          color: #4a5a7a;
        }

        .landing-wrapper.light .feature-card-full {
          background: rgba(255, 255, 255, 0.7);
          border-color: rgba(0, 0, 0, 0.08);
        }

        .landing-wrapper.light .feature-card-full:hover {
          background: rgba(255, 255, 255, 0.9);
          border-color: rgba(37, 99, 235, 0.2);
        }

        .landing-wrapper.light .feature-card-full h4 {
          color: #0a1628;
        }

        .landing-wrapper.light .feature-card-full p {
          color: #4a5a7a;
        }

        .landing-wrapper.light .showcase-card {
          background: rgba(255, 255, 255, 0.6);
          border-color: rgba(0, 0, 0, 0.06);
        }

        .landing-wrapper.light .showcase-card h4 {
          color: #0a1628;
        }

        .landing-wrapper.light .showcase-card p {
          color: #4a5a7a;
        }

        .landing-wrapper.light .btn-secondary-full {
          background: rgba(0, 0, 0, 0.05);
          color: #0a1628;
          border-color: rgba(0, 0, 0, 0.1);
        }

        .landing-wrapper.light .btn-secondary-full:hover {
          background: rgba(0, 0, 0, 0.08);
        }

        .landing-wrapper.light .stats-full {
          border-color: rgba(0, 0, 0, 0.08);
        }

        .landing-wrapper.light .stat-number-full {
          color: #2563eb;
        }

        .landing-wrapper.light .stat-label-full {
          color: #4a5a7a;
        }

        .landing-wrapper.light .stat-divider {
          background: rgba(0, 0, 0, 0.08);
        }

        .landing-wrapper.light .footer-full {
          border-color: rgba(0, 0, 0, 0.06);
          color: #6a7a9a;
        }

        .landing-wrapper.light .theme-toggle-fab {
          background: rgba(255, 255, 255, 0.9);
          border-color: rgba(0, 0, 0, 0.1);
          color: #0a1628;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .landing-wrapper.light .section-heading {
          color: #0a1628;
        }

        .landing-wrapper.light .aurora-blur-1,
        .landing-wrapper.light .aurora-blur-2,
        .landing-wrapper.light .aurora-blur-3 {
          opacity: 0.1;
        }

        /* Hero Section - Image Left, Text Right */
        .hero-section {
          display: flex;
          align-items: center;
          gap: 60px;
          max-width: 1200px;
          margin: 0 auto 60px;
          padding: 0 20px;
        }

        .hero-left {
          flex: 1;
          min-width: 0;
        }

        .hero-main-image {
          width: 100%;
          height: auto;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.3s ease;
          display: block;
        }

        .hero-main-image:hover {
          transform: scale(1.01);
          box-shadow: 0 25px 70px rgba(37, 99, 235, 0.2);
        }

        .landing-wrapper.light .hero-main-image {
          border-color: rgba(0, 0, 0, 0.08);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
        }

        .landing-wrapper.light .hero-main-image:hover {
          box-shadow: 0 25px 70px rgba(37, 99, 235, 0.15);
        }

        .hero-right {
          flex: 1;
          text-align: left;
          min-width: 0;
        }

        /* Theme Toggle Button */
        .theme-toggle-fab {
          position: fixed;
          top: 24px;
          right: 24px;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #eef2ff;
          font-size: 1.3rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 100;
        }

        .theme-toggle-fab:hover {
          transform: scale(1.1) rotate(15deg);
          border-color: rgba(56, 189, 248, 0.3);
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

        /* Main Content */
        .landing-content {
          position: relative;
          z-index: 1;
          max-width: 1200px;
          margin: 0 auto;
        }

        .content-inner {
          animation: fadeInUp 1s ease-out;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Logo */
        .logo-wrapper-full {
          margin-bottom: 16px;
        }

        .logo-img-full {
          width: 70px;
          height: 70px;
          object-fit: contain;
          filter: drop-shadow(0 0 40px rgba(6, 182, 212, 0.3));
          animation: float 4s ease-in-out infinite;
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        /* Typography - Left Aligned */
        .hero-title-full {
          font-size: 3.8rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          margin-bottom: 8px;
          line-height: 1.1;
          color: #eef2ff;
          transition: color 0.3s ease;
        }

        .gradient-text-full {
          background: linear-gradient(135deg, #38bdf8, #818cf8, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-size: 200% 200%;
          animation: gradientShift 3s ease-in-out infinite;
        }

        @keyframes gradientShift {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .hero-subtitle-full {
          font-size: 1.2rem;
          font-weight: 500;
          color: #b9c8f0;
          margin-bottom: 12px;
          transition: color 0.3s ease;
        }

        .hero-description-full {
          font-size: 0.95rem;
          color: #8a9bc0;
          font-weight: 300;
          margin-bottom: 28px;
          line-height: 1.6;
          transition: color 0.3s ease;
          max-width: 100%;
        }

        /* Feature Grid - Larger Cards, Left Aligned */
        .feature-grid-full {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 100%;
        }

        .feature-card-full {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 18px 22px;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
        }

        .feature-card-full:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(56, 189, 248, 0.2);
          transform: translateX(6px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
        }

        .feature-content {
          display: flex;
          align-items: center;
          gap: 16px;
          width: 100%;
        }

        .feature-img {
          width: 52px;
          height: 52px;
          object-fit: contain;
          flex-shrink: 0;
          filter: drop-shadow(0 0 20px rgba(56, 189, 248, 0.1));
        }

        .feature-text {
          text-align: left;
          flex: 1;
        }

        .feature-text h4 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #eef2ff;
          margin-bottom: 2px;
          transition: color 0.3s ease;
        }

        .feature-text p {
          font-size: 0.85rem;
          color: #8a9bc0;
          font-weight: 300;
          transition: color 0.3s ease;
          margin: 0;
        }

        /* Showcase Section */
        .showcase-section {
          max-width: 1000px;
          margin: 0 auto 50px;
        }

        .section-heading {
          font-size: 2rem;
          font-weight: 700;
          color: #eef2ff;
          margin-bottom: 30px;
          text-align: center;
          transition: color 0.3s ease;
        }

        .showcase-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .showcase-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 20px;
          transition: all 0.3s ease;
          text-align: center;
        }

        .showcase-card:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(56, 189, 248, 0.15);
          transform: translateY(-4px);
        }

        .showcase-img {
          width: 100%;
          height: 180px;
          object-fit: cover;
          border-radius: 12px;
          margin-bottom: 12px;
        }

        .showcase-card h4 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #eef2ff;
          margin-bottom: 4px;
        }

        .showcase-card p {
          font-size: 0.85rem;
          color: #8a9bc0;
        }

        /* Stats */
        .stats-full {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 32px;
          padding-top: 32px;
          border-top: 1px solid rgba(255, 255, 255, 0.04);
          max-width: 600px;
          margin: 0 auto 24px;
          transition: border-color 0.3s ease;
        }

        .stat-item-full {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .stat-number-full {
          font-size: 1.8rem;
          font-weight: 700;
          color: #7dd3fc;
          transition: color 0.3s ease;
        }

        .stat-label-full {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #8a9bc0;
          transition: color 0.3s ease;
        }

        .stat-divider {
          width: 1px;
          height: 40px;
          background: rgba(255, 255, 255, 0.05);
          transition: background 0.3s ease;
        }

        /* CTA Buttons */
        .cta-group-full {
          display: flex;
          gap: 16px;
          justify-content: center;
          margin: 40px 0;
          flex-wrap: wrap;
        }

        .btn-primary-full {
          background: linear-gradient(135deg, var(--accent-purple), var(--accent-cyan));

          color: white;
          font-weight: 600;
          padding: 14px 40px;
          border-radius: 99px;
          text-decoration: none;
          font-size: 1rem;
          transition: all 0.3s ease;
          box-shadow: 0 4px 25px rgba(37, 99, 235, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .btn-primary-full:hover {
          transform: scale(1.05);
          box-shadow: 0 8px 35px rgba(37, 99, 235, 0.4);
        }

        .btn-secondary-full {
          background: rgba(255, 255, 255, 0.05);
          color: #b9c8f0;
          font-weight: 600;
          padding: 14px 40px;
          border-radius: 99px;
          text-decoration: none;
          font-size: 1rem;
          transition: all 0.3s ease;
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
        }

        .btn-secondary-full:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: scale(1.05);
        }

        /* Footer */
        .footer-full {
          display: flex;
          justify-content: space-between;
          font-size: 0.84rem;
          color: #5a6f94;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.02);
          max-width: 600px;
          margin: 0 auto;
          transition: all 0.3s ease;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .hero-section {
            gap: 40px;
            padding: 0 10px;
          }

          .hero-title-full {
            font-size: 3rem;
          }

          .hero-subtitle-full {
            font-size: 1.1rem;
          }

          .showcase-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 768px) {
          .theme-toggle-fab {
            top: 16px;
            right: 16px;
            width: 40px;
            height: 40px;
            font-size: 1rem;
          }

          .landing-wrapper {
            padding: 30px 16px;
          }

          .hero-section {
            flex-direction: column;
            gap: 30px;
            padding: 0;
            margin-bottom: 40px;
          }

          .hero-left {
            width: 100%;
          }

          .hero-right {
            text-align: center;
            width: 100%;
          }

          .hero-title-full {
            font-size: 2.8rem;
          }

          .hero-subtitle-full {
            font-size: 1rem;
          }

          .hero-description-full {
            font-size: 0.9rem;
            text-align: center;
          }

          .feature-grid-full {
            align-items: center;
          }

          .feature-card-full {
            padding: 14px 18px;
            max-width: 100%;
          }

          .feature-card-full:hover {
            transform: translateX(0) translateY(-2px);
          }

          .feature-content {
            gap: 14px;
          }

          .feature-img {
            width: 44px;
            height: 44px;
          }

          .feature-text h4 {
            font-size: 1rem;
          }

          .feature-text p {
            font-size: 0.8rem;
          }

          .showcase-grid {
            grid-template-columns: 1fr;
            max-width: 400px;
            margin: 0 auto;
          }

          .showcase-img {
            height: 150px;
          }

          .stats-full {
            gap: 20px;
            flex-wrap: wrap;
          }

          .stat-divider {
            display: none;
          }

          .footer-full {
            flex-direction: column;
            gap: 4px;
            text-align: center;
          }

          .btn-primary-full,
          .btn-secondary-full {
            padding: 12px 28px;
            font-size: 0.9rem;
          }

          .logo-img-full {
            width: 60px;
            height: 60px;
          }

          .cta-group-full {
            flex-direction: column;
            align-items: center;
            width: 100%;
            max-width: 280px;
            margin-left: auto;
            margin-right: auto;
          }

          .btn-primary-full,
          .btn-secondary-full {
            width: 100%;
            text-align: center;
          }
        }

        @media (max-width: 480px) {
          .hero-title-full {
            font-size: 2.2rem;
          }

          .hero-main-image {
            border-radius: 12px;
          }

          .feature-card-full {
            padding: 12px 14px;
          }

          .feature-img {
            width: 38px;
            height: 38px;
          }

          .feature-text h4 {
            font-size: 0.9rem;
          }

          .feature-text p {
            font-size: 0.72rem;
          }
        }
      `}</style>
    </div>
  );
}