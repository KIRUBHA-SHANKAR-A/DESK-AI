import React, { useState, useEffect, useCallback } from 'react';
import {
  Send, Sparkles, AlertTriangle, BookOpen, ArrowRight, Paperclip,
  CheckCircle2, Zap, Lightbulb, Copy, Check, ExternalLink, ThumbsUp, HelpCircle
} from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import ExistingSolutionModal from './ExistingSolutionModal';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export default function CreateTicket({ authHeaders, onTicketCreated }) {
  const [form, setForm] = useState({ title: '', description: '' });
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  
  // Real-time background AI assistance (Duplicates & KB recommendations only)
  const [aiDuplicates, setAiDuplicates] = useState([]);
  const [aiKbDocs, setAiKbDocs] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedKbModal, setSelectedKbModal] = useState(null);
  const [selectedDuplicateModal, setSelectedDuplicateModal] = useState(null);
  
  // Pre-Creation Decision Modal
  const [showKbDecisionModal, setShowKbDecisionModal] = useState(false);
  const [resolvedWithoutTicket, setResolvedWithoutTicket] = useState(false);
  const [expandedKbIndex, setExpandedKbIndex] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const getHeaders = useCallback(() => {
    const base = authHeaders ? (typeof authHeaders === 'function' ? authHeaders() : authHeaders) : {};
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...base
    };
  }, [authHeaders]);

  // Background real-time analysis for duplicate detection & KB suggestions
  const runAiAnalysis = useCallback(async (title, description) => {
    if ((title || '').trim().length < 4 && (description || '').trim().length < 8) {
      setAiDuplicates([]);
      setAiKbDocs([]);
      return;
    }

    setAiLoading(true);
    const headers = getHeaders();

    try {
      const payload = { title: title || '', description: description || '' };

      const [dupRes, kbRes] = await Promise.all([
        fetch(`${API_BASE_URL}/tickets/ai/duplicate-check`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        }).catch(() => null),
        fetch(`${API_BASE_URL}/tickets/ai/recommend-kb`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        }).catch(() => null)
      ]);

      if (dupRes && dupRes.ok) {
        const dupData = await dupRes.json();
        setAiDuplicates(dupData || []);
      }

      if (kbRes && kbRes.ok) {
        const kbData = await kbRes.json();
        setAiKbDocs(kbData || []);
      }
    } catch (err) {
      console.error('AI Analysis error:', err);
    } finally {
      setAiLoading(false);
    }
  }, [getHeaders]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (form.title || form.description) {
        runAiAnalysis(form.title, form.description);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [form.title, form.description, runAiAnalysis]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setScreenshot(file);
      setScreenshotPreview(URL.createObjectURL(file));
    }
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
    });
  };

  const executeCreateTicket = async () => {
    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        status: 'OPEN',
      };

      const res = await fetch(`${API_BASE_URL}/tickets`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const createdTicket = await res.json();
        
        // Convert image file to Base64 format and store in backend
        if (screenshot && createdTicket.ticketId) {
          try {
            const base64Data = await convertToBase64(screenshot);
            await fetch(`${API_BASE_URL}/attachments/base64`, {
              method: 'POST',
              headers: getHeaders(),
              body: JSON.stringify({
                ticketId: createdTicket.ticketId,
                imageName: screenshot.name,
                imageType: screenshot.type || 'image/png',
                fileSize: screenshot.size,
                base64Data: base64Data
              })
            });
          } catch (err) {
            console.error('Failed to upload Base64 attachment:', err);
          }
        }

        setForm({ title: '', description: '' });
        setScreenshot(null);
        setScreenshotPreview(null);
        setSubmitSuccess(true);
        setShowKbDecisionModal(false);
        setTimeout(() => {
          setSubmitSuccess(false);
          onTicketCreated();
        }, 1800);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Failed to submit ticket. Please check your inputs.');
      }
    } catch (e) {
      console.error('Ticket creation failed:', e);
      alert('An error occurred while creating your ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateTicketSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;

    // Check if we already have matches or perform an on-demand check before submitting
    let matchedArticles = aiKbDocs;
    if (!matchedArticles || matchedArticles.length === 0) {
      setSubmitting(true);
      try {
        const res = await fetch(`${API_BASE_URL}/tickets/ai/recommend-kb`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            title: form.title,
            description: form.description
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            matchedArticles = data;
            setAiKbDocs(data);
          }
        }
      } catch (err) {
        console.warn('Pre-creation KB check error:', err);
      } finally {
        setSubmitting(false);
      }
    }

    const hasStrongKbMatch = matchedArticles && matchedArticles.length > 0 && matchedArticles.some(k => (k.similarity || 0) >= 0.20);
    if (hasStrongKbMatch) {
      setExpandedKbIndex(0);
      setShowKbDecisionModal(true);
    } else {
      executeCreateTicket();
    }
  };

  const handleResolvedByKb = () => {
    setShowKbDecisionModal(false);
    setSelectedKbModal(null);
    setResolvedWithoutTicket(true);
    setForm({ title: '', description: '' });
    setScreenshot(null);
    setScreenshotPreview(null);
    setAiKbDocs([]);
    setAiDuplicates([]);
    setTimeout(() => {
      setResolvedWithoutTicket(false);
    }, 4500);
  };

  const handleCopyContent = (text, idx) => {
    if (navigator.clipboard && text) {
      navigator.clipboard.writeText(text);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  const activeArticle = aiKbDocs && aiKbDocs.length > 0 ? aiKbDocs[expandedKbIndex] || aiKbDocs[0] : null;

  return (
    <div className="tab-fade">
      {resolvedWithoutTicket ? (
        <div className="glass-card success-banner-card" style={{ borderColor: 'var(--accent-purple)' }}>
          <div className="success-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent-purple)' }}>
            <Zap size={54} color="var(--accent-purple)" />
          </div>
          <h3>🎉 Issue Solved with Knowledge Base!</h3>
          <p>Great! You resolved your issue immediately using our self-service Knowledge Base without needing to wait for a support ticket.</p>
          <button className="btn-premium mt-3" onClick={() => setResolvedWithoutTicket(false)}>
            Need help with another issue?
          </button>
        </div>
      ) : submitSuccess ? (
        <div className="glass-card success-banner-card">
          <div className="success-icon">
            <CheckCircle2 size={54} color="#34d399" />
          </div>
          <h3>Ticket Submitted Successfully!</h3>
          <p>AI Engine is categorizing your ticket, predicting priority, and assigning it to the right support department.</p>
        </div>
      ) : (
        <div className="grid-split-2">
          {/* Left Column: Create Ticket Form */}
          <div className="glass-card form-glass-card">
            <div className="card-header-flex mb-3">
              <div>
                <h4 style={{ margin: 0 }}>Create Support Ticket</h4>
                <p className="text-muted-xs" style={{ marginTop: 2 }}>Explain your problem and let our AI match instant fixes</p>
              </div>
            </div>

            <form onSubmit={handleCreateTicketSubmit} className="form-layout">
              <div className="field-group">
                <label>Ticket Title / Subject *</label>
                <input
                  type="text"
                  className="input-premium"
                  placeholder="e.g. VPN connection failing or need access to Financial Portal..."
                  value={form.title}
                  onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                  required
                />
              </div>

              {/* Real-time KB Match Prompt banner before submission */}
              {aiKbDocs.length > 0 && (
                <div className="kb-intercept-banner">
                  <div className="kb-intercept-head">
                    <div className="sparkle-pulse">
                      <Lightbulb size={16} color="#8b5cf6" />
                    </div>
                    <span><strong>{aiKbDocs.length} Instant Solution{aiKbDocs.length > 1 ? 's' : ''}</strong> Available</span>
                  </div>
                  <p className="kb-intercept-sub">
                    Article: <strong>"{aiKbDocs[0].title}"</strong> matches your request. Review it to resolve without waiting in queue.
                  </p>
                  <div className="kb-intercept-actions">
                    <button
                      type="button"
                      className="btn-action-purple"
                      onClick={() => {
                        setExpandedKbIndex(0);
                        setShowKbDecisionModal(true);
                      }}
                    >
                      <Sparkles size={14} style={{ marginRight: 6 }} /> Review Suggested Solutions
                    </button>
                  </div>
                </div>
              )}

              {/* Semantic Duplicate Warning */}
              {aiDuplicates.length > 0 && (aiDuplicates[0].similarity || aiDuplicates[0].score || 0) >= 0.50 && (
                <div className="duplicate-warning-box">
                  <div className="warning-head">
                    <AlertTriangle size={18} color="#f59e0b" />
                    <span>Similar Resolved Ticket Found ({Math.round(((aiDuplicates[0].similarity || aiDuplicates[0].score || 0)) * 100)}% Match)</span>
                  </div>
                  <p className="warning-title">"{aiDuplicates[0].title}"</p>
                  {aiDuplicates[0].resolution ? (
                    <div className="warning-solution">
                      <strong>Previous Resolution:</strong> {aiDuplicates[0].resolution.length > 150 ? aiDuplicates[0].resolution.substring(0, 150) + '...' : aiDuplicates[0].resolution}
                    </div>
                  ) : (
                    <p className="warning-sub">An existing ticket has been logged with similar symptoms.</p>
                  )}
                  <button
                    type="button"
                    className="btn-view-solution mt-2"
                    onClick={() => setSelectedDuplicateModal(aiDuplicates[0])}
                  >
                    <Sparkles size={14} style={{ marginRight: 6 }} />
                    View Existing Solution
                  </button>
                </div>
              )}

              <div className="field-group">
                <label>Detailed Description *</label>
                <textarea
                  className="input-premium"
                  rows="6"
                  placeholder="Please describe the issue in detail, error messages, and what steps you've tried..."
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  required
                />
              </div>

              <div className="field-group">
                <label>Upload Screenshot (Optional)</label>
                <div className="file-input-wrapper">
                  <Paperclip size={16} style={{ color: 'var(--text-muted)' }} />
                  <input type="file" accept="image/*" className="file-input" onChange={handleFileChange} />
                </div>
                {screenshotPreview && (
                  <div className="img-preview-box mt-2">
                    <img src={screenshotPreview} alt="Screenshot Preview" />
                    <span className="file-name">{screenshot?.name}</span>
                  </div>
                )}
              </div>

              <button type="submit" className="btn-premium mt-2" disabled={submitting}>
                {submitting ? (
                  <>
                    <Sparkles size={16} className="spin-icon" /> Checking Solutions & Routing...
                  </>
                ) : (
                  <>
                    <Send size={16} /> Submit Ticket
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: AI Live Suggestions & Knowledge Base Sidebar */}
          <div className="glass-card ai-sidebar-card">
            <div className="ai-sidebar-header">
              <div className="ai-header-badge">
                <Sparkles size={14} color="#8b5cf6" />
                <span>AI Live Suggestions</span>
              </div>
              <h4>⚡ Instant Knowledge Base Solutions</h4>
              <p className="text-muted-sm">
                As you type, AI matches your issue against our Knowledge Base to help you fix problems immediately.
              </p>
            </div>

            {aiLoading ? (
              <div className="ai-loading-box">
                <LoadingSpinner text="Searching Knowledge Base & duplicate solutions..." />
              </div>
            ) : (aiKbDocs.length > 0 || aiDuplicates.length > 0) ? (
              <div className="ai-results-stack">
                {/* Knowledge Base Articles Suggestions on Right Side */}
                {aiKbDocs.length > 0 && (
                  <div className="ai-card-block">
                    <div className="ai-card-head">
                      <BookOpen size={16} color="#8b5cf6" />
                      <span>Matching Knowledge Base Articles ({aiKbDocs.length})</span>
                    </div>

                    <div className="rec-list">
                      {aiKbDocs.map((kb, idx) => {
                        const matchPct = Math.round((kb.similarity || 0.8) * 100);
                        return (
                          <div
                            key={idx}
                            className="suggestion-item-card"
                            onClick={() => {
                              setExpandedKbIndex(idx);
                              setShowKbDecisionModal(true);
                            }}
                          >
                            <div className="suggestion-card-top">
                              <span className={`suggestion-match-pill ${matchPct >= 80 ? 'high-match' : ''}`}>
                                <Zap size={11} /> {matchPct}% Match
                              </span>
                              <span className="suggestion-category-tag">
                                {kb.category || 'Support'}
                              </span>
                            </div>

                            <div className="suggestion-card-title">
                              <Lightbulb size={14} className="title-bulb-ico" />
                              <span>{kb.title}</span>
                            </div>

                            <p className="suggestion-card-snippet">
                              {kb.summary || (kb.content && kb.content.length > 110 ? kb.content.substring(0, 110) + '...' : kb.content) || 'Click to view step-by-step resolution guide.'}
                            </p>

                            <div className="suggestion-card-footer">
                              <button
                                type="button"
                                className="btn-read-steps"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedKbIndex(idx);
                                  setShowKbDecisionModal(true);
                                }}
                              >
                                <span>Read Resolution</span>
                                <ArrowRight size={13} />
                              </button>

                              <button
                                type="button"
                                className="btn-solved-mini"
                                title="Click if this article solved your issue"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleResolvedByKb();
                                }}
                              >
                                <Check size={13} /> Solved
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Similar Past Tickets */}
                {aiDuplicates.length > 0 && (
                  <div className="ai-card-block">
                    <div className="ai-card-head">
                      <AlertTriangle size={16} color="#f59e0b" />
                      <span>Similar Resolved Tickets ({aiDuplicates.length})</span>
                    </div>
                    <div className="rec-list">
                      {aiDuplicates.map((dup, idx) => (
                        <div
                          key={idx}
                          className="rec-item-row warning-border"
                          onClick={() => setSelectedDuplicateModal(dup)}
                        >
                          <div className="rec-info">
                            <div className="rec-item-title">{dup.title}</div>
                            <div className="rec-item-match warning-text">
                              #{dup.id} • {Math.round(dup.similarity * 100)}% match
                            </div>
                          </div>
                          <ArrowRight size={14} className="text-muted" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-suggestions-container">
                <div className="empty-glow-icon">
                  <Lightbulb size={36} color="var(--accent-purple)" />
                </div>
                <h5>Live Help Ready</h5>
                <p className="text-muted-xs mb-4">
                  Start typing your ticket title or description on the left. Relevant guides and solutions will show here instantly.
                </p>

                <div className="ai-feature-pill-list">
                  <div className="feature-pill-item">
                    <div className="pill-ico-circle"><Zap size={14} color="#8b5cf6" /></div>
                    <div>
                      <strong>Instant Solutions</strong>
                      <span>Read step-by-step fixes without waiting</span>
                    </div>
                  </div>

                  <div className="feature-pill-item">
                    <div className="pill-ico-circle"><CheckCircle2 size={14} color="#10b981" /></div>
                    <div>
                      <strong>Self-Service Resolution</strong>
                      <span>Resolve your issue with a single click</span>
                    </div>
                  </div>

                  <div className="feature-pill-item">
                    <div className="pill-ico-circle"><Sparkles size={14} color="#06b6d4" /></div>
                    <div>
                      <strong>Smart Auto-Routing</strong>
                      <span>Auto-assigned to IT, HR, Software, or Network team</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          Ultra-Premium Suggestion Popup Modal (Pre-Creation Decision Modal)
         ========================================================================= */}
      {showKbDecisionModal && (
        <div className="modal-backdrop modal-backdrop-blur" onClick={() => setShowKbDecisionModal(false)}>
          <div className="glass-panel modal-dialog kb-suggestion-popup" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="modal-header kb-popup-header">
              <div className="kb-popup-header-left">
                <div className="popup-glow-avatar">
                  <Sparkles size={22} color="#8b5cf6" />
                </div>
                <div>
                  <div className="badge-premium badge-p2 mb-1">
                    <Zap size={12} style={{ marginRight: 4 }} /> AI Knowledge Base Match Found
                  </div>
                  <h3 className="kb-popup-title">Suggested Solutions for Your Issue</h3>
                  <p className="text-muted-sm" style={{ margin: 0 }}>
                    We found verified Knowledge Base guides matching your request. Review them below before creating a ticket.
                  </p>
                </div>
              </div>
              <button className="close-btn" onClick={() => setShowKbDecisionModal(false)} title="Close popup">✕</button>
            </div>

            {/* Modal Body: 2-Column Responsive Layout */}
            <div className="modal-body kb-popup-body">
              <div className="kb-popup-grid">
                
                {/* Left Column: Article List / Tabs */}
                <div className="kb-popup-sidebar">
                  <div className="sidebar-section-title">
                    <span>Matched Guides ({aiKbDocs.length})</span>
                  </div>

                  <div className="kb-tabs-list">
                    {aiKbDocs.map((kb, idx) => {
                      const matchPct = Math.round((kb.similarity || 0.8) * 100);
                      const isSelected = expandedKbIndex === idx;
                      return (
                        <div
                          key={idx}
                          className={`kb-tab-item ${isSelected ? 'active-tab' : ''}`}
                          onClick={() => setExpandedKbIndex(idx)}
                        >
                          <div className="kb-tab-top">
                            <span className={`kb-tab-match-badge ${matchPct >= 80 ? 'high' : ''}`}>
                              {matchPct}% Match
                            </span>
                            <span className="kb-tab-category">{kb.category || 'Guide'}</span>
                          </div>
                          <div className="kb-tab-title">{kb.title}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Column: Detailed Article Content */}
                <div className="kb-popup-content-panel">
                  {activeArticle ? (
                    <div className="active-article-view">
                      <div className="active-article-header">
                        <div className="active-article-meta">
                          <span className="badge-premium badge-p3">
                            <BookOpen size={12} style={{ marginRight: 4 }} />
                            {activeArticle.category || 'General Support'}
                          </span>
                          <span className="confidence-pill">
                            <Zap size={12} color="#10b981" /> {Math.round((activeArticle.similarity || 0.85) * 100)}% Confidence Match
                          </span>
                        </div>

                        <h3 className="active-article-title">{activeArticle.title}</h3>
                        {activeArticle.summary && (
                          <p className="active-article-summary">{activeArticle.summary}</p>
                        )}
                      </div>

                      {/* Step-by-step Resolution Guide */}
                      <div className="resolution-guide-container">
                        <div className="guide-header-bar">
                          <div className="guide-header-label">
                            <Lightbulb size={16} color="#8b5cf6" />
                            <span>Step-by-Step Resolution Steps:</span>
                          </div>
                          <button
                            type="button"
                            className="btn-copy-steps"
                            onClick={() => handleCopyContent(activeArticle.content || activeArticle.summary, expandedKbIndex)}
                          >
                            {copiedIndex === expandedKbIndex ? (
                              <>
                                <Check size={13} color="#10b981" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={13} />
                                <span>Copy Solution</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="guide-content-scroll">
                          <div className="guide-formatted-text">
                            {activeArticle.content || activeArticle.summary || 'Follow standard support steps provided in the Knowledge Base.'}
                          </div>
                        </div>

                        <div className="guide-helpful-tip">
                          <HelpCircle size={14} color="#06b6d4" />
                          <span>Tip: Follow the steps above in order. Most common issues are resolved immediately with this guide.</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="no-article-selected">
                      <BookOpen size={36} className="text-muted" />
                      <p>Select an article from the left list to view resolution instructions.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Employee Decision Choice Panel */}
              <div className="kb-decision-footer-panel">
                <div className="decision-prompt-block">
                  <div className="prompt-title">Did this solution resolve your issue?</div>
                  <div className="prompt-subtitle">
                    Save time by resolving your issue instantly, or proceed to submit your ticket for engineer assistance.
                  </div>
                </div>

                <div className="decision-actions-group">
                  <button
                    type="button"
                    className="btn-decision-solved"
                    onClick={handleResolvedByKb}
                  >
                    <div className="solved-btn-inner">
                      <CheckCircle2 size={20} />
                      <div className="solved-text-block">
                        <span className="btn-main-text">Yes, This Solved My Problem</span>
                        <span className="btn-sub-text">No Ticket Needed (Self-Service)</span>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="btn-decision-proceed"
                    disabled={submitting}
                    onClick={executeCreateTicket}
                  >
                    <div className="proceed-btn-inner">
                      {submitting ? (
                        <Sparkles size={18} className="spin-icon" />
                      ) : (
                        <Send size={18} />
                      )}
                      <div className="proceed-text-block">
                        <span className="btn-main-text">No, Still Need Help</span>
                        <span className="btn-sub-text">Proceed to Create Ticket</span>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Individual KB Reader Modal */}
      {selectedKbModal && (
        <div className="modal-backdrop modal-backdrop-blur" onClick={() => setSelectedKbModal(null)}>
          <div className="glass-panel modal-dialog kb-reader-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="badge-premium badge-p2">Knowledge Base Guide</span>
                <h4 style={{ marginTop: 6, marginBottom: 0 }}>{selectedKbModal.title}</h4>
              </div>
              <button className="close-btn" onClick={() => setSelectedKbModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="kb-content-box" style={{ whiteSpace: 'pre-line', maxHeight: '55vh', overflowY: 'auto' }}>
                {selectedKbModal.content || selectedKbModal.summary}
              </div>
              <div className="mt-4 pt-3 border-top-glass flex-between-center">
                <span className="text-muted-xs">Did this article fix your issue?</span>
                <button className="btn-action-green" onClick={handleResolvedByKb}>
                  <CheckCircle2 size={14} style={{ marginRight: 6 }} /> Yes, Problem Solved
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Premium Existing Verified Solution Modal */}
      {selectedDuplicateModal && (
        <ExistingSolutionModal
          ticket={selectedDuplicateModal}
          allDuplicates={aiDuplicates}
          onSelectDuplicate={(dup) => setSelectedDuplicateModal(dup)}
          onClose={() => setSelectedDuplicateModal(null)}
          onSolved={handleResolvedByKb}
          currentFormTitle={form.title}
        />
      )}

      <style>{createStyles}</style>
    </div>
  );
}

const createStyles = `
  .grid-split-2 {
    display: grid;
    grid-template-columns: 1.15fr 0.85fr;
    gap: 24px;
    align-items: flex-start;
  }
  @media (max-width: 980px) {
    .grid-split-2 { grid-template-columns: 1fr; }
  }

  .form-glass-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 24px;
  }

  .form-layout {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .field-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .field-group label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-secondary);
  }
  .input-premium {
    padding: 11px 14px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--bg-input);
    color: var(--text-primary);
    font-size: 0.88rem;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .input-premium:focus {
    border-color: var(--accent-purple);
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15);
    outline: none;
  }
  .file-input-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--bg-input);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 8px 12px;
  }
  .file-input {
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-size: 0.82rem;
  }
  .img-preview-box {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    background: var(--bg-hover);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
  }
  .img-preview-box img {
    width: 54px;
    height: 40px;
    object-fit: cover;
    border-radius: 4px;
  }
  .file-name {
    font-size: 0.78rem;
    color: var(--text-secondary);
  }

  /* Real-time KB Intercept Banner */
  .kb-intercept-banner {
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(6, 182, 212, 0.08) 100%);
    border: 1px solid rgba(139, 92, 246, 0.4);
    border-radius: var(--radius-sm);
    padding: 14px 16px;
    position: relative;
    box-shadow: 0 4px 20px rgba(139, 92, 246, 0.1);
  }
  .kb-intercept-head {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.88rem;
    font-weight: 700;
    color: var(--accent-purple);
  }
  .sparkle-pulse {
    display: flex;
    align-items: center;
    justify-content: center;
    animation: pulseGlow 2s infinite ease-in-out;
  }
  @keyframes pulseGlow {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.15); opacity: 0.8; }
  }
  .kb-intercept-sub {
    font-size: 0.82rem;
    color: var(--text-secondary);
    margin: 6px 0 12px 0;
    line-height: 1.45;
  }
  .kb-intercept-actions {
    display: flex;
    gap: 10px;
  }
  .btn-action-purple {
    padding: 8px 16px;
    border-radius: var(--radius-sm);
    font-size: 0.82rem;
    font-weight: 700;
    background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
    color: #fff;
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    box-shadow: 0 4px 14px rgba(139, 92, 246, 0.35);
    transition: all 0.2s;
  }
  .btn-action-purple:hover {
    filter: brightness(1.12);
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(139, 92, 246, 0.45);
  }

  /* Duplicate warning */
  .duplicate-warning-box {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(16, 185, 129, 0.04) 100%);
    border: 1px solid rgba(245, 158, 11, 0.35);
    border-radius: var(--radius-sm);
    padding: 15px 18px;
    box-shadow: 0 4px 16px rgba(245, 158, 11, 0.06);
  }
  .warning-head {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
    color: #f59e0b;
    font-size: 0.86rem;
  }
  .warning-title {
    font-weight: 600;
    font-size: 0.88rem;
    margin: 6px 0;
    color: var(--text-primary);
  }
  .warning-solution {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(16, 185, 129, 0.2);
    padding: 9px 12px;
    border-radius: 8px;
    font-size: 0.82rem;
    color: #10b981;
    line-height: 1.45;
  }
  .btn-view-solution {
    display: inline-flex;
    align-items: center;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 0.82rem;
    font-weight: 700;
    color: #ffffff;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
    transition: all 0.2s ease;
  }
  .btn-view-solution:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.48);
    filter: brightness(1.08);
  }

  /* Right-Side AI Sidebar Card */
  .ai-sidebar-card {
    background: var(--bg-card);
    border: 1px solid rgba(139, 92, 246, 0.25);
    border-radius: var(--radius-md);
    padding: 22px;
    position: sticky;
    top: 20px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
  }
  .ai-sidebar-header {
    margin-bottom: 18px;
  }
  .ai-header-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 10px;
    border-radius: 99px;
    font-size: 0.72rem;
    font-weight: 700;
    background: rgba(139, 92, 246, 0.15);
    color: var(--accent-purple);
    border: 1px solid rgba(139, 92, 246, 0.3);
    margin-bottom: 8px;
  }
  .ai-sidebar-header h4 {
    margin: 0 0 4px 0;
    font-size: 1rem;
    font-weight: 700;
    color: var(--text-primary);
  }
  .ai-sidebar-header p {
    margin: 0;
    font-size: 0.8rem;
    line-height: 1.45;
  }

  .ai-loading-box {
    padding: 40px 20px;
    text-align: center;
  }
  .ai-results-stack {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .ai-card-block {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .ai-card-head {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  /* Right-Side Suggestion Item Cards */
  .suggestion-item-card {
    background: var(--bg-hover);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 14px;
    cursor: pointer;
    transition: all 0.22s ease;
    display: flex;
    flex-direction: column;
    gap: 8px;
    position: relative;
  }
  .suggestion-item-card:hover {
    border-color: var(--accent-purple);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(139, 92, 246, 0.18);
    background: rgba(139, 92, 246, 0.04);
  }
  .suggestion-card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .suggestion-match-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 99px;
    font-size: 0.7rem;
    font-weight: 700;
    background: rgba(6, 182, 212, 0.15);
    color: #06b6d4;
    border: 1px solid rgba(6, 182, 212, 0.3);
  }
  .suggestion-match-pill.high-match {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
    border-color: rgba(16, 185, 129, 0.35);
  }
  .suggestion-category-tag {
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--text-muted);
  }
  .suggestion-card-title {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 0.88rem;
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1.35;
  }
  .title-bulb-ico {
    color: #eab308;
    flex-shrink: 0;
    margin-top: 2px;
  }
  .suggestion-card-snippet {
    margin: 0;
    font-size: 0.8rem;
    color: var(--text-secondary);
    line-height: 1.45;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .suggestion-card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 4px;
    padding-top: 8px;
    border-top: 1px solid var(--border);
  }
  .btn-read-steps {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--accent-purple);
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-read-steps:hover {
    color: var(--accent-cyan);
    transform: translateX(2px);
  }
  .btn-solved-mini {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 0.74rem;
    font-weight: 700;
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
    border: 1px solid rgba(16, 185, 129, 0.35);
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-solved-mini:hover {
    background: #10b981;
    color: #fff;
    border-color: #10b981;
  }

  /* Empty state container */
  .empty-suggestions-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 24px 12px;
  }
  .empty-glow-icon {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: rgba(139, 92, 246, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 14px;
    box-shadow: 0 0 25px rgba(139, 92, 246, 0.2);
  }
  .empty-suggestions-container h5 {
    margin: 0 0 6px 0;
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text-primary);
  }
  .ai-feature-pill-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
    text-align: left;
  }
  .feature-pill-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    background: var(--bg-hover);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-size: 0.78rem;
  }
  .pill-ico-circle {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: var(--bg-card);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .feature-pill-item div {
    display: flex;
    flex-direction: column;
  }
  .feature-pill-item strong {
    font-size: 0.8rem;
    color: var(--text-primary);
  }
  .feature-pill-item span {
    font-size: 0.72rem;
    color: var(--text-muted);
  }

  /* =========================================================================
     Ultra-Premium Suggestion Popup Modal Styles (Solid & High-Contrast)
     ========================================================================= */
  .modal-backdrop-blur {
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    background: rgba(5, 3, 10, 0.86);
  }

  .kb-suggestion-popup {
    max-width: 880px;
    width: 94%;
    max-height: 90vh;
    border-radius: var(--radius-md);
    background: #150f24;
    border: 1px solid rgba(139, 92, 246, 0.45);
    box-shadow: 0 30px 90px rgba(0, 0, 0, 0.85), 0 0 40px rgba(139, 92, 246, 0.2);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    opacity: 1;
  }

  .light-theme .kb-suggestion-popup {
    background: #ffffff;
    border-color: rgba(139, 92, 246, 0.35);
    box-shadow: 0 25px 70px rgba(0, 0, 0, 0.25), 0 0 30px rgba(139, 92, 246, 0.12);
  }

  .kb-popup-header {
    padding: 20px 24px;
    background: #1b142e;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .light-theme .kb-popup-header {
    background: #f8fafc;
    border-bottom-color: #e2e8f0;
  }

  .kb-popup-header-left {
    display: flex;
    gap: 16px;
    align-items: flex-start;
  }
  .popup-glow-avatar {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: rgba(139, 92, 246, 0.25);
    border: 1px solid rgba(139, 92, 246, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 0 16px rgba(139, 92, 246, 0.35);
  }
  .kb-popup-title {
    margin: 4px 0 4px 0;
    font-size: 1.15rem;
    font-weight: 800;
    color: var(--text-primary);
    letter-spacing: -0.01em;
  }

  .kb-popup-body {
    padding: 20px 24px;
    background: #150f24;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .light-theme .kb-popup-body {
    background: #ffffff;
  }

  .kb-popup-grid {
    display: grid;
    grid-template-columns: 290px 1fr;
    gap: 18px;
    min-height: 320px;
  }
  @media (max-width: 768px) {
    .kb-popup-grid {
      grid-template-columns: 1fr;
    }
  }

  /* Left Sidebar in Modal */
  .kb-popup-sidebar {
    display: flex;
    flex-direction: column;
    gap: 8px;
    border-right: 1px solid rgba(255, 255, 255, 0.08);
    padding-right: 16px;
    background: #120d1e;
    padding: 12px;
    border-radius: var(--radius-sm);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
  .light-theme .kb-popup-sidebar {
    background: #f8fafc;
    border-color: #e2e8f0;
  }

  .sidebar-section-title {
    font-size: 0.74rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    margin-bottom: 4px;
  }
  .kb-tabs-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 380px;
    overflow-y: auto;
  }
  .kb-tab-item {
    padding: 12px 14px;
    border-radius: var(--radius-sm);
    background: #1d1630;
    border: 1px solid rgba(255, 255, 255, 0.1);
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .light-theme .kb-tab-item {
    background: #ffffff;
    border-color: #e2e8f0;
  }

  .kb-tab-item:hover {
    border-color: rgba(139, 92, 246, 0.6);
    background: #251c3d;
  }
  .light-theme .kb-tab-item:hover {
    background: #f1f5f9;
  }

  .kb-tab-item.active-tab {
    background: linear-gradient(135deg, #2d1d4d 0%, #22143d 100%);
    border-color: #8b5cf6;
    box-shadow: 0 0 16px rgba(139, 92, 246, 0.3);
  }
  .light-theme .kb-tab-item.active-tab {
    background: #ede9fe;
    border-color: #8b5cf6;
    box-shadow: 0 2px 10px rgba(139, 92, 246, 0.15);
  }

  .kb-tab-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .kb-tab-match-badge {
    font-size: 0.68rem;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 99px;
    background: rgba(6, 182, 212, 0.2);
    color: #06b6d4;
  }
  .kb-tab-match-badge.high {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
  }
  .kb-tab-category {
    font-size: 0.68rem;
    color: var(--text-muted);
  }
  .kb-tab-title {
    font-size: 0.84rem;
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1.35;
  }

  /* Right Detailed Content Panel */
  .kb-popup-content-panel {
    display: flex;
    flex-direction: column;
  }
  .active-article-view {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .active-article-header {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .active-article-meta {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .confidence-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.72rem;
    font-weight: 700;
    color: #10b981;
    background: rgba(16, 185, 129, 0.16);
    padding: 3px 9px;
    border-radius: 99px;
  }
  .active-article-title {
    margin: 0;
    font-size: 1.08rem;
    font-weight: 800;
    color: var(--text-primary);
  }
  .active-article-summary {
    margin: 0;
    font-size: 0.84rem;
    color: var(--text-secondary);
    line-height: 1.45;
  }

  .resolution-guide-container {
    background: #110c1c;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: var(--radius-sm);
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .light-theme .resolution-guide-container {
    background: #f8fafc;
    border-color: #e2e8f0;
  }

  .guide-header-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .guide-header-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.86rem;
    font-weight: 700;
    color: var(--text-primary);
  }
  .btn-copy-steps {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 12px;
    border-radius: 6px;
    font-size: 0.76rem;
    font-weight: 600;
    background: #201734;
    color: var(--text-primary);
    border: 1px solid rgba(255, 255, 255, 0.12);
    cursor: pointer;
    transition: all 0.2s;
  }
  .light-theme .btn-copy-steps {
    background: #ffffff;
    border-color: #cbd5e1;
  }

  .btn-copy-steps:hover {
    border-color: var(--accent-purple);
    color: var(--accent-purple);
  }
  .guide-content-scroll {
    max-height: 230px;
    overflow-y: auto;
    padding: 14px;
    background: #1a1329;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
  }
  .light-theme .guide-content-scroll {
    background: #ffffff;
    border-color: #e2e8f0;
  }

  .guide-formatted-text {
    font-size: 0.86rem;
    line-height: 1.65;
    color: #f1f5f9;
    white-space: pre-line;
    font-family: inherit;
  }
  .light-theme .guide-formatted-text {
    color: #1e293b;
  }

  .guide-helpful-tip {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 0.78rem;
    color: var(--text-muted);
    line-height: 1.4;
    padding-top: 4px;
  }

  /* Bottom Decision Footer */
  .kb-decision-footer-panel {
    background: #191228;
    border: 1px solid rgba(139, 92, 246, 0.35);
    border-radius: var(--radius-sm);
    padding: 18px 22px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .light-theme .kb-decision-footer-panel {
    background: #f8fafc;
    border-color: #e2e8f0;
  }

  .decision-prompt-block {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .prompt-title {
    font-size: 0.94rem;
    font-weight: 800;
    color: var(--text-primary);
  }
  .prompt-subtitle {
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .decision-actions-group {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
  }
  .btn-decision-solved {
    flex: 1.2;
    min-width: 250px;
    padding: 13px 20px;
    border-radius: var(--radius-sm);
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: #fff;
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 18px rgba(16, 185, 129, 0.4);
    transition: all 0.22s ease;
  }
  .btn-decision-solved:hover {
    filter: brightness(1.1);
    transform: translateY(-2px);
    box-shadow: 0 6px 24px rgba(16, 185, 129, 0.5);
  }
  .solved-btn-inner {
    display: flex;
    align-items: center;
    gap: 12px;
    text-align: left;
  }
  .solved-text-block {
    display: flex;
    flex-direction: column;
  }
  .btn-main-text {
    font-size: 0.9rem;
    font-weight: 800;
    line-height: 1.2;
  }
  .btn-sub-text {
    font-size: 0.74rem;
    opacity: 0.9;
    margin-top: 2px;
  }

  .btn-decision-proceed {
    flex: 1;
    min-width: 220px;
    padding: 13px 20px;
    border-radius: var(--radius-sm);
    background: #201734;
    color: var(--text-primary);
    border: 1px solid rgba(255, 255, 255, 0.15);
    cursor: pointer;
    transition: all 0.22s ease;
  }
  .light-theme .btn-decision-proceed {
    background: #ffffff;
    border-color: #cbd5e1;
  }

  .btn-decision-proceed:hover {
    background: rgba(139, 92, 246, 0.2);
    border-color: var(--accent-purple);
    color: var(--accent-purple);
    transform: translateY(-1px);
  }
  .proceed-btn-inner {
    display: flex;
    align-items: center;
    gap: 12px;
    text-align: left;
  }
  .proceed-text-block {
    display: flex;
    flex-direction: column;
  }

  .success-banner-card {
    text-align: center;
    padding: 60px 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .border-top-glass {
    border-top: 1px solid var(--border);
  }
  .flex-between-center {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .mb-1 { margin-bottom: 4px; }
  .mb-2 { margin-bottom: 8px; }
  .mb-3 { margin-bottom: 12px; }
  .mb-4 { margin-bottom: 24px; }
  .mt-2 { margin-top: 8px; }
  .mt-3 { margin-top: 16px; }
  .mt-4 { margin-top: 20px; }
  .pt-3 { padding-top: 12px; }
`;

