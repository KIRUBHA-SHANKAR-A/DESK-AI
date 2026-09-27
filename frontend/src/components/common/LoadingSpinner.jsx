import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

export default function LoadingSpinner({ text = 'Loading DESK AI data...', fullScreen = false }) {
  if (fullScreen) {
    return (
      <div className="spinner-fullscreen-backdrop">
        <div className="spinner-card-box">
          <div className="spinner-glow-ring">
            <Loader2 size={36} className="spinning-icon" />
          </div>
          <div className="spinner-text-row">
            <Sparkles size={14} className="sparkle-ico" />
            <span>{text}</span>
          </div>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="spinner-container-box">
      <div className="spinner-glow-ring">
        <Loader2 size={28} className="spinning-icon" />
      </div>
      <div className="spinner-text-row">
        <Sparkles size={13} className="sparkle-ico" />
        <span>{text}</span>
      </div>
      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .spinner-fullscreen-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(9, 5, 20, 0.75);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
  }

  .spinner-card-box {
    padding: 32px 48px;
    border-radius: var(--radius-lg);
    background: var(--bg-panel);
    border: 1px solid var(--border-glow);
    box-shadow: var(--shadow-lg);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .spinner-container-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    width: 100%;
  }

  .spinner-glow-ring {
    width: 54px;
    height: 54px;
    border-radius: 50%;
    background: rgba(139, 92, 246, 0.15);
    border: 1px solid rgba(139, 92, 246, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 25px rgba(139, 92, 246, 0.25);
  }

  .spinning-icon {
    color: var(--accent-purple);
    animation: spin 1.2s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .spinner-text-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--text-primary);
    letter-spacing: 0.02em;
  }

  .sparkle-ico {
    color: var(--accent-cyan);
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.5; transform: scale(0.9); }
    50% { opacity: 1; transform: scale(1.1); }
  }
`;
