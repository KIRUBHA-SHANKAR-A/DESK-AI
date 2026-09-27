// ExistingSolutionModal.jsx – Premium modal for viewing existing solutions in Create Ticket
import React, { useState } from 'react';
import {
  X, Sparkles, CheckCircle2, ShieldCheck, Zap, Lightbulb,
  Copy, Check, FileText, ArrowRight, HelpCircle, Layers, ExternalLink
} from 'lucide-react';

export default function ExistingSolutionModal({
  ticket,
  allDuplicates = [],
  onSelectDuplicate,
  onClose,
  onSolved,
  currentFormTitle = ''
}) {
  const [copied, setCopied] = useState(false);

  if (!ticket) return null;

  const currentId = ticket.id || ticket.ticketId;
  const score = ticket.similarity !== undefined ? ticket.similarity : (ticket.score !== undefined ? ticket.score : 0.85);
  const matchPct = Math.round(score * 100);
  const statusLabel = (ticket.status || 'RESOLVED').toUpperCase();

  const getScoreTheme = (pct) => {
    if (pct >= 80) return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.25)', text: 'Very High Match' };
    if (pct >= 65) return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.25)', text: 'High Match' };
    return { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)', border: 'rgba(139, 92, 246, 0.25)', text: 'Moderate Match' };
  };

  const theme = getScoreTheme(matchPct);

  const handleCopy = () => {
    const textToCopy = ticket.resolution || ticket.title;
    if (navigator.clipboard && textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <div className="esm-backdrop" onClick={onClose}>
      <div className="esm-dialog" onClick={(e) => e.stopPropagation()}>

        {/* ── Top Header Bar ─────────────────────────────────────────── */}
        <div className="esm-header">
          <div className="esm-header-left">
            <div className="esm-icon-badge">
              <Sparkles size={22} />
            </div>
            <div>
              <div className="esm-category-pill">
                <Zap size={11} style={{ marginRight: 4 }} />
                AI SEMANTIC MATCH ({matchPct}%)
              </div>
              <h3 className="esm-title">Existing Verified Solution Found</h3>
              <p className="esm-subtitle">
                A previously resolved ticket matches your issue. Review the solution below to fix it immediately without waiting for a support ticket.
              </p>
            </div>
          </div>
          <button className="esm-close-btn" onClick={onClose} title="Close Solution">
            <X size={18} />
          </button>
        </div>

        {/* ── Multi-Duplicate Switcher Tabs (if >1 match) ──────────── */}
        {allDuplicates && allDuplicates.length > 1 && (
          <div className="esm-tabs-bar">
            <div className="esm-tabs-label">
              <Layers size={13} />
              <span>Matching Tickets ({allDuplicates.length}):</span>
            </div>
            <div className="esm-tabs-scroll">
              {allDuplicates.map((dup, idx) => {
                const dupId = dup.id || dup.ticketId;
                const dupScore = dup.similarity !== undefined ? dup.similarity : (dup.score !== undefined ? dup.score : 0.85);
                const dupPct = Math.round(dupScore * 100);
                const isActive = dupId === currentId;

                return (
                  <button
                    key={idx}
                    type="button"
                    className={`esm-tab-chip ${isActive ? 'active' : ''}`}
                    onClick={() => onSelectDuplicate && onSelectDuplicate(dup)}
                  >
                    <span className="esm-chip-id">#{dupId}</span>
                    <span className="esm-chip-title">{dup.title}</span>
                    <span className="esm-chip-pct">{dupPct}%</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Main Modal Body ───────────────────────────────────────── */}
        <div className="esm-body">

          {/* Ticket Context Info Card */}
          <div className="esm-ticket-card">
            <div className="esm-ticket-card-top">
              <div className="esm-ticket-badges">
                <span className="esm-badge-id">
                  <FileText size={12} style={{ marginRight: 4 }} />
                  TKT-{currentId}
                </span>
                <span className="esm-badge-status" data-status={statusLabel}>
                  <ShieldCheck size={12} style={{ marginRight: 4 }} />
                  {statusLabel}
                </span>
              </div>

              {/* Match Score Gauge */}
              <div className="esm-match-gauge" style={{ borderColor: theme.border, background: theme.bg }}>
                <Zap size={14} color={theme.color} />
                <div className="esm-gauge-text">
                  <span className="esm-gauge-pct" style={{ color: theme.color }}>{matchPct}% Match</span>
                  <span className="esm-gauge-label">{theme.text}</span>
                </div>
              </div>
            </div>

            <h4 className="esm-ticket-title">{ticket.title}</h4>

            {currentFormTitle && (
              <div className="esm-comparison-row">
                <span className="esm-comp-label">Your Ticket Title:</span>
                <span className="esm-comp-val">"{currentFormTitle}"</span>
              </div>
            )}
          </div>

          {/* Solution & Resolution Section */}
          <div className="esm-resolution-box">
            <div className="esm-resolution-header">
              <div className="esm-resolution-title">
                <Lightbulb size={17} color="#10b981" />
                <span>Verified Resolution & Instructions</span>
              </div>

              <button
                type="button"
                className={`esm-copy-btn ${copied ? 'copied' : ''}`}
                onClick={handleCopy}
                title="Copy resolution to clipboard"
              >
                {copied ? (
                  <>
                    <Check size={14} color="#10b981" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy Solution</span>
                  </>
                )}
              </button>
            </div>

            <div className="esm-resolution-content">
              {ticket.resolution ? (
                <div className="esm-resolution-text">
                  {ticket.resolution}
                </div>
              ) : (
                <div className="esm-empty-resolution">
                  <HelpCircle size={20} color="#f59e0b" />
                  <div>
                    <strong>No detailed notes recorded for this ticket</strong>
                    <p>This previous ticket was marked as resolved. If the title above addresses your problem, you may check related Knowledge Base guides or continue submitting your ticket.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="esm-resolution-tip">
              <Sparkles size={13} color="#06b6d4" />
              <span>
                <strong>Pro Tip:</strong> Following these recorded steps has successfully resolved this exact symptom in past support requests.
              </span>
            </div>
          </div>

        </div>

        {/* ── Decision Footer ───────────────────────────────────────── */}
        <div className="esm-footer">
          <div className="esm-footer-prompt">
            <div className="esm-prompt-title">Did this solution resolve your issue?</div>
            <div className="esm-prompt-sub">
              Resolve now for instant self-service, or close to submit your ticket for engineer assistance.
            </div>
          </div>

          <div className="esm-footer-actions">
            <button
              type="button"
              className="esm-btn-solved"
              onClick={() => {
                if (onSolved) onSolved();
                onClose();
              }}
            >
              <div className="esm-btn-inner">
                <CheckCircle2 size={18} />
                <div className="esm-btn-text">
                  <span className="esm-btn-main">Yes, This Solved My Problem</span>
                  <span className="esm-btn-sub">Self-Service Resolution</span>
                </div>
              </div>
            </button>

            <button
              type="button"
              className="esm-btn-proceed"
              onClick={onClose}
            >
              <div className="esm-btn-inner">
                <ArrowRight size={16} />
                <div className="esm-btn-text">
                  <span className="esm-btn-main">No, Still Need Help</span>
                  <span className="esm-btn-sub">Proceed to Submit Ticket</span>
                </div>
              </div>
            </button>
          </div>
        </div>

      </div>

      <style>{esmStyles}</style>
    </div>
  );
}

const esmStyles = `
  .esm-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(2, 6, 23, 0.78);
    backdrop-filter: blur(14px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10003;
    padding: 20px;
    animation: esmFadeIn 0.22s ease-out;
  }
  @keyframes esmFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes esmSlideUp {
    from { opacity: 0; transform: translateY(22px) scale(0.97); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  .esm-dialog {
    width: 100%;
    max-width: 760px;
    max-height: 88vh;
    display: flex;
    flex-direction: column;
    border-radius: 22px;
    background: linear-gradient(165deg, rgba(15, 23, 42, 0.98), rgba(10, 15, 30, 0.99));
    border: 1px solid rgba(6, 182, 212, 0.25);
    box-shadow:
      0 0 0 1px rgba(6, 182, 212, 0.1),
      0 25px 65px -10px rgba(0, 0, 0, 0.75),
      0 0 80px rgba(6, 182, 212, 0.08);
    animation: esmSlideUp 0.26s cubic-bezier(0.16, 1, 0.3, 1);
    overflow: hidden;
  }

  /* ── Header ──────────────────────────────────────────────────────────── */
  .esm-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 22px 26px 18px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    background: linear-gradient(180deg, rgba(6, 182, 212, 0.08) 0%, rgba(139, 92, 246, 0.02) 100%);
  }
  .esm-header-left {
    display: flex;
    align-items: flex-start;
    gap: 15px;
    flex: 1;
  }
  .esm-icon-badge {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(124, 58, 237, 0.25));
    border: 1px solid rgba(6, 182, 212, 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #06b6d4;
    flex-shrink: 0;
    box-shadow: 0 4px 16px rgba(6, 182, 212, 0.2);
  }
  .esm-category-pill {
    display: inline-flex;
    align-items: center;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: #06b6d4;
    background: rgba(6, 182, 212, 0.12);
    border: 1px solid rgba(6, 182, 212, 0.25);
    padding: 2px 8px;
    border-radius: 99px;
    margin-bottom: 6px;
  }
  .esm-title {
    font-size: 1.15rem;
    font-weight: 700;
    color: #f8fafc;
    margin: 0 0 4px 0;
    line-height: 1.3;
  }
  .esm-subtitle {
    font-size: 0.8rem;
    color: #94a3b8;
    margin: 0;
    line-height: 1.45;
  }
  .esm-close-btn {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #94a3b8;
    cursor: pointer;
    padding: 8px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    margin-left: 12px;
    flex-shrink: 0;
  }
  .esm-close-btn:hover {
    color: #ef4444;
    border-color: rgba(239, 68, 68, 0.4);
    background: rgba(239, 68, 68, 0.12);
  }

  /* ── Tabs Bar ────────────────────────────────────────────────────────── */
  .esm-tabs-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 24px;
    background: rgba(0, 0, 0, 0.2);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    overflow-x: auto;
  }
  .esm-tabs-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.72rem;
    font-weight: 600;
    color: #64748b;
    white-space: nowrap;
  }
  .esm-tabs-scroll {
    display: flex;
    align-items: center;
    gap: 8px;
    overflow-x: auto;
  }
  .esm-tab-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #94a3b8;
    font-size: 0.74rem;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }
  .esm-tab-chip:hover {
    background: rgba(6, 182, 212, 0.08);
    border-color: rgba(6, 182, 212, 0.2);
    color: #e2e8f0;
  }
  .esm-tab-chip.active {
    background: linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(124, 58, 237, 0.15));
    border-color: rgba(6, 182, 212, 0.4);
    color: #f1f5f9;
    font-weight: 600;
    box-shadow: 0 2px 8px rgba(6, 182, 212, 0.12);
  }
  .esm-chip-id {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.68rem;
    color: #06b6d4;
    font-weight: 700;
  }
  .esm-chip-title {
    max-width: 140px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .esm-chip-pct {
    font-size: 0.68rem;
    font-weight: 700;
    color: #10b981;
    background: rgba(16, 185, 129, 0.12);
    padding: 1px 5px;
    border-radius: 4px;
  }

  /* ── Body ─────────────────────────────────────────────────────────────── */
  .esm-body {
    flex: 1;
    overflow-y: auto;
    padding: 20px 26px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .esm-body::-webkit-scrollbar { width: 5px; }
  .esm-body::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 99px; }

  /* ── Ticket Card ──────────────────────────────────────────────────────── */
  .esm-ticket-card {
    background: rgba(255, 255, 255, 0.025);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    padding: 16px 18px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .esm-ticket-card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }
  .esm-ticket-badges {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .esm-badge-id {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.72rem;
    font-weight: 700;
    color: #06b6d4;
    background: rgba(6, 182, 212, 0.12);
    border: 1px solid rgba(6, 182, 212, 0.25);
    padding: 2px 8px;
    border-radius: 6px;
    display: inline-flex;
    align-items: center;
  }
  .esm-badge-status {
    font-size: 0.68rem;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 6px;
    display: inline-flex;
    align-items: center;
    letter-spacing: 0.03em;
    background: rgba(16, 185, 129, 0.12);
    border: 1px solid rgba(16, 185, 129, 0.25);
    color: #10b981;
  }
  .esm-badge-status[data-status="CLOSED"] {
    background: rgba(100, 116, 139, 0.12);
    border-color: rgba(100, 116, 139, 0.25);
    color: #94a3b8;
  }
  .esm-match-gauge {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 4px 10px;
    border-radius: 8px;
    border: 1px solid;
  }
  .esm-gauge-text {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }
  .esm-gauge-pct {
    font-size: 0.76rem;
    font-weight: 800;
    line-height: 1.1;
  }
  .esm-gauge-label {
    font-size: 0.62rem;
    font-weight: 600;
    color: #94a3b8;
  }
  .esm-ticket-title {
    font-size: 0.96rem;
    font-weight: 700;
    color: #f1f5f9;
    margin: 4px 0 0;
    line-height: 1.4;
  }
  .esm-comparison-row {
    font-size: 0.74rem;
    color: #94a3b8;
    background: rgba(0, 0, 0, 0.2);
    padding: 6px 10px;
    border-radius: 6px;
    margin-top: 4px;
    display: flex;
    align-items: center;
    gap: 6px;
    overflow: hidden;
  }
  .esm-comp-label {
    color: #64748b;
    font-weight: 600;
    flex-shrink: 0;
  }
  .esm-comp-val {
    color: #cbd5e1;
    font-style: italic;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* ── Resolution Box ──────────────────────────────────────────────────── */
  .esm-resolution-box {
    background: rgba(16, 185, 129, 0.04);
    border: 1px solid rgba(16, 185, 129, 0.2);
    border-radius: 16px;
    padding: 16px 18px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    box-shadow: 0 4px 20px rgba(16, 185, 129, 0.04);
  }
  .esm-resolution-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(16, 185, 129, 0.15);
  }
  .esm-resolution-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.78rem;
    font-weight: 700;
    color: #10b981;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .esm-copy-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #cbd5e1;
    font-size: 0.72rem;
    font-weight: 600;
    padding: 5px 11px;
    border-radius: 7px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .esm-copy-btn:hover {
    background: rgba(16, 185, 129, 0.15);
    border-color: rgba(16, 185, 129, 0.3);
    color: #10b981;
  }
  .esm-copy-btn.copied {
    background: rgba(16, 185, 129, 0.2);
    border-color: #10b981;
    color: #10b981;
  }
  .esm-resolution-content {
    background: rgba(0, 0, 0, 0.25);
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    padding: 14px 16px;
    max-height: 240px;
    overflow-y: auto;
  }
  .esm-resolution-content::-webkit-scrollbar { width: 4px; }
  .esm-resolution-content::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 99px; }

  .esm-resolution-text {
    font-size: 0.88rem;
    color: #f1f5f9;
    line-height: 1.65;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .esm-empty-resolution {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    color: #94a3b8;
    font-size: 0.8rem;
    line-height: 1.45;
  }
  .esm-empty-resolution strong {
    color: #e2e8f0;
    display: block;
    margin-bottom: 2px;
  }
  .esm-empty-resolution p {
    margin: 0;
  }
  .esm-resolution-tip {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.74rem;
    color: #06b6d4;
    background: rgba(6, 182, 212, 0.06);
    border: 1px solid rgba(6, 182, 212, 0.12);
    border-radius: 8px;
    padding: 8px 12px;
    line-height: 1.4;
  }

  /* ── Footer ──────────────────────────────────────────────────────────── */
  .esm-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 26px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(0, 0, 0, 0.22);
    gap: 16px;
    flex-wrap: wrap;
  }
  .esm-footer-prompt {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 220px;
  }
  .esm-prompt-title {
    font-size: 0.92rem;
    font-weight: 800;
    color: #f8fafc;
  }
  .esm-prompt-sub {
    font-size: 0.74rem;
    color: #94a3b8;
  }
  .esm-footer-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .esm-btn-solved {
    padding: 11px 18px;
    border-radius: 10px;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: #ffffff;
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 18px rgba(16, 185, 129, 0.35);
    transition: all 0.2s ease;
  }
  .esm-btn-solved:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 24px rgba(16, 185, 129, 0.5);
    filter: brightness(1.08);
  }
  .esm-btn-proceed {
    padding: 11px 18px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #cbd5e1;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .esm-btn-proceed:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #f8fafc;
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }
  .esm-btn-inner {
    display: flex;
    align-items: center;
    gap: 10px;
    text-align: left;
  }
  .esm-btn-text {
    display: flex;
    flex-direction: column;
  }
  .esm-btn-main {
    font-size: 0.84rem;
    font-weight: 700;
    line-height: 1.2;
  }
  .esm-btn-sub {
    font-size: 0.68rem;
    opacity: 0.85;
    margin-top: 1px;
  }

  @media (max-width: 680px) {
    .esm-footer {
      flex-direction: column;
      align-items: stretch;
    }
    .esm-footer-actions {
      flex-direction: column;
    }
    .esm-btn-solved, .esm-btn-proceed {
      width: 100%;
    }
  }
`;
