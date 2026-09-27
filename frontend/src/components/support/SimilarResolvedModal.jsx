// SimilarResolvedModal.jsx – Premium modal showing AI-detected similar resolved tickets
import React, { useState } from 'react';
import {
  X, Sparkles, CheckCircle2, FileText, Eye, ChevronDown, ChevronUp,
  ShieldCheck, Clock, Lightbulb, Zap, BookOpen
} from 'lucide-react';

/**
 * Props:
 *  - tickets: Array of similar ticket objects from AI duplicate detection
 *             Each has: { id, title, status, resolution, score }
 *  - onClose: () => void
 */
export default function SimilarResolvedModal({ tickets, onClose }) {
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const getScoreColor = (score) => {
    const pct = Math.round((score || 0) * 100);
    if (pct >= 85) return '#10b981';
    if (pct >= 70) return '#f59e0b';
    return '#6366f1';
  };

  const getScoreLabel = (score) => {
    const pct = Math.round((score || 0) * 100);
    if (pct >= 85) return 'Very High';
    if (pct >= 70) return 'High';
    return 'Moderate';
  };

  return (
    <div className="srm-backdrop" onClick={onClose}>
      <div className="srm-dialog" onClick={e => e.stopPropagation()}>

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="srm-header">
          <div className="srm-header-left">
            <div className="srm-header-icon-wrap">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="srm-title">AI-Detected Similar Resolved Tickets</h3>
              <p className="srm-subtitle">
                Sentence-BERT identified {tickets?.length || 0} previously resolved ticket{(tickets?.length || 0) !== 1 ? 's' : ''} that may help resolve this issue faster.
              </p>
            </div>
          </div>
          <button className="srm-close-btn" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────── */}
        <div className="srm-body">
          {tickets && tickets.length > 0 ? (
            <div className="srm-list">
              {tickets.map((t, i) => {
                const candId = t.id || t.ticketId;
                const score = t.score || t.similarity || 0;
                const pct = Math.round(score * 100);
                const isExpanded = expandedId === candId;
                const statusLabel = (t.status || 'RESOLVED').toUpperCase();

                return (
                  <div key={i} className={`srm-card ${isExpanded ? 'expanded' : ''}`}>
                    {/* Card Header */}
                    <div className="srm-card-header" onClick={() => toggleExpand(candId)}>
                      <div className="srm-card-left">
                        <div className="srm-card-rank">
                          <span className="srm-rank-number">{i + 1}</span>
                        </div>
                        <div className="srm-card-info">
                          <div className="srm-card-top-row">
                            <span className="srm-ticket-id">
                              <FileText size={11} style={{ marginRight: 3 }} />
                              TKT-{candId}
                            </span>
                            <span className="srm-status-badge" data-status={statusLabel}>
                              <ShieldCheck size={10} style={{ marginRight: 3 }} />
                              {statusLabel}
                            </span>
                          </div>
                          <span className="srm-card-title">{t.title}</span>
                        </div>
                      </div>

                      <div className="srm-card-right">
                        <div className="srm-score-wrap">
                          <div className="srm-score-bar-bg">
                            <div
                              className="srm-score-bar-fill"
                              style={{ width: `${pct}%`, background: getScoreColor(score) }}
                            />
                          </div>
                          <div className="srm-score-text" style={{ color: getScoreColor(score) }}>
                            <Zap size={11} />
                            <span>{pct}%</span>
                            <span className="srm-score-label">{getScoreLabel(score)}</span>
                          </div>
                        </div>
                        <button className="srm-expand-btn" title={isExpanded ? 'Collapse' : 'View Solution'}>
                          {isExpanded ? <ChevronUp size={16} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Resolution */}
                    {isExpanded && (
                      <div className="srm-card-expanded">
                        <div className="srm-resolution-section">
                          <div className="srm-resolution-label">
                            <Lightbulb size={13} />
                            <span>Resolution / Solution Applied</span>
                          </div>
                          {t.resolution ? (
                            <div className="srm-resolution-text">{t.resolution}</div>
                          ) : (
                            <div className="srm-resolution-empty">
                              <BookOpen size={14} />
                              <span>No resolution notes were recorded for this ticket.</span>
                            </div>
                          )}
                        </div>
                        <div className="srm-tip-bar">
                          <Sparkles size={12} />
                          <span>You can apply a similar resolution to the current ticket.</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="srm-empty">
              <div className="srm-empty-icon">
                <Sparkles size={28} />
              </div>
              <h4>No Similar Resolved Tickets Found</h4>
              <p>The AI engine did not find any previously resolved tickets matching this issue's context.</p>
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────── */}
        <div className="srm-footer">
          <div className="srm-footer-info">
            <Sparkles size={12} />
            <span>Powered by Sentence-BERT Semantic Similarity</span>
          </div>
          <button className="srm-footer-close" onClick={onClose}>Close</button>
        </div>
      </div>

      <style>{srmStyles}</style>
    </div>
  );
}

const srmStyles = `
  .srm-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(2, 2, 12, 0.72);
    backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10002;
    padding: 20px;
    animation: srmFadeIn 0.2s ease-out;
  }
  @keyframes srmFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes srmSlideUp {
    from { opacity: 0; transform: translateY(20px) scale(0.97); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  .srm-dialog {
    width: 100%;
    max-width: 720px;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    border-radius: 20px;
    background: linear-gradient(165deg, rgba(15, 23, 42, 0.97), rgba(10, 15, 30, 0.99));
    border: 1px solid rgba(6, 182, 212, 0.2);
    box-shadow:
      0 0 0 1px rgba(6, 182, 212, 0.08),
      0 25px 60px rgba(0, 0, 0, 0.6),
      0 0 80px rgba(6, 182, 212, 0.06);
    animation: srmSlideUp 0.3s ease-out;
    overflow: hidden;
  }

  /* ── Header ──────────────────────────────────────────────────────────── */
  .srm-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 22px 26px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    background: linear-gradient(180deg, rgba(6, 182, 212, 0.06) 0%, transparent 100%);
  }
  .srm-header-left {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    flex: 1;
  }
  .srm-header-icon-wrap {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    background: linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(124, 58, 237, 0.2));
    border: 1px solid rgba(6, 182, 212, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #06b6d4;
    flex-shrink: 0;
  }
  .srm-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: #f1f5f9;
    margin: 0 0 4px 0;
    line-height: 1.3;
  }
  .srm-subtitle {
    font-size: 0.78rem;
    color: #94a3b8;
    margin: 0;
    line-height: 1.45;
  }
  .srm-close-btn {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #94a3b8;
    cursor: pointer;
    padding: 7px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    margin-left: 12px;
    flex-shrink: 0;
  }
  .srm-close-btn:hover {
    color: #ef4444;
    border-color: rgba(239, 68, 68, 0.4);
    background: rgba(239, 68, 68, 0.1);
  }

  /* ── Body ─────────────────────────────────────────────────────────────── */
  .srm-body {
    flex: 1;
    overflow-y: auto;
    padding: 18px 24px;
  }
  .srm-body::-webkit-scrollbar { width: 5px; }
  .srm-body::-webkit-scrollbar-track { background: transparent; }
  .srm-body::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 99px; }

  .srm-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* ── Card ─────────────────────────────────────────────────────────────── */
  .srm-card {
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.07);
    background: rgba(255, 255, 255, 0.025);
    transition: all 0.25s ease;
    overflow: hidden;
  }
  .srm-card:hover {
    border-color: rgba(6, 182, 212, 0.25);
    background: rgba(6, 182, 212, 0.03);
  }
  .srm-card.expanded {
    border-color: rgba(6, 182, 212, 0.3);
    background: rgba(6, 182, 212, 0.04);
    box-shadow: 0 4px 20px rgba(6, 182, 212, 0.06);
  }

  .srm-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 16px;
    cursor: pointer;
    gap: 12px;
  }

  .srm-card-left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
  }
  .srm-card-rank {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(6, 182, 212, 0.15));
    border: 1px solid rgba(124, 58, 237, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .srm-rank-number {
    font-size: 0.78rem;
    font-weight: 800;
    color: #a78bfa;
  }
  .srm-card-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  .srm-card-top-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .srm-ticket-id {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    font-weight: 700;
    color: #06b6d4;
    background: rgba(6, 182, 212, 0.1);
    border: 1px solid rgba(6, 182, 212, 0.2);
    padding: 1px 7px;
    border-radius: 5px;
    display: inline-flex;
    align-items: center;
  }
  .srm-status-badge {
    font-size: 0.64rem;
    font-weight: 700;
    padding: 1px 7px;
    border-radius: 5px;
    display: inline-flex;
    align-items: center;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    background: rgba(16, 185, 129, 0.12);
    border: 1px solid rgba(16, 185, 129, 0.25);
    color: #10b981;
  }
  .srm-status-badge[data-status="CLOSED"] {
    background: rgba(100, 116, 139, 0.12);
    border-color: rgba(100, 116, 139, 0.25);
    color: #94a3b8;
  }
  .srm-card-title {
    font-size: 0.88rem;
    font-weight: 600;
    color: #e2e8f0;
    line-height: 1.35;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .srm-card-right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  /* ── Score ────────────────────────────────────────────────────────────── */
  .srm-score-wrap {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
    min-width: 90px;
  }
  .srm-score-bar-bg {
    width: 90px;
    height: 5px;
    border-radius: 99px;
    background: rgba(255, 255, 255, 0.06);
    overflow: hidden;
  }
  .srm-score-bar-fill {
    height: 100%;
    border-radius: 99px;
    transition: width 0.5s ease;
  }
  .srm-score-text {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.72rem;
    font-weight: 700;
  }
  .srm-score-label {
    font-size: 0.62rem;
    font-weight: 600;
    opacity: 0.7;
  }

  .srm-expand-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #94a3b8;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  .srm-expand-btn:hover {
    color: #06b6d4;
    border-color: rgba(6, 182, 212, 0.4);
    background: rgba(6, 182, 212, 0.1);
  }

  /* ── Expanded Content ────────────────────────────────────────────────── */
  .srm-card-expanded {
    padding: 0 16px 14px;
    animation: srmExpandIn 0.25s ease-out;
  }
  @keyframes srmExpandIn {
    from { opacity: 0; max-height: 0; }
    to { opacity: 1; max-height: 300px; }
  }

  .srm-resolution-section {
    background: rgba(16, 185, 129, 0.05);
    border: 1px solid rgba(16, 185, 129, 0.15);
    border-radius: 10px;
    padding: 12px 14px;
    margin-bottom: 10px;
  }
  .srm-resolution-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.74rem;
    font-weight: 700;
    color: #10b981;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .srm-resolution-text {
    font-size: 0.84rem;
    color: #cbd5e1;
    line-height: 1.55;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .srm-resolution-empty {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.8rem;
    color: #64748b;
    font-style: italic;
  }

  .srm-tip-bar {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.72rem;
    color: #06b6d4;
    background: rgba(6, 182, 212, 0.06);
    border: 1px solid rgba(6, 182, 212, 0.12);
    border-radius: 8px;
    padding: 8px 12px;
  }

  /* ── Empty State ─────────────────────────────────────────────────────── */
  .srm-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 40px 20px;
    gap: 10px;
  }
  .srm-empty-icon {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    background: linear-gradient(135deg, rgba(100, 116, 139, 0.1), rgba(100, 116, 139, 0.05));
    border: 1px solid rgba(100, 116, 139, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
    margin-bottom: 6px;
  }
  .srm-empty h4 {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    color: #94a3b8;
  }
  .srm-empty p {
    margin: 0;
    font-size: 0.82rem;
    color: #64748b;
    max-width: 340px;
    line-height: 1.45;
  }

  /* ── Footer ──────────────────────────────────────────────────────────── */
  .srm-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(0, 0, 0, 0.15);
  }
  .srm-footer-info {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.7rem;
    color: #475569;
    font-weight: 600;
  }
  .srm-footer-close {
    padding: 7px 18px;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 700;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #94a3b8;
    cursor: pointer;
    transition: all 0.2s;
  }
  .srm-footer-close:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #e2e8f0;
    border-color: rgba(255, 255, 255, 0.2);
  }
`;
