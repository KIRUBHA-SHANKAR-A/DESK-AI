import React, { useState, useEffect } from 'react';
import {
  X, CheckCircle2, MessageSquare, Send, Paperclip, Sparkles,
  ShieldCheck, Lock, User, Building2, Calendar, FileText, Pause,
  Clock, AlertCircle, Info, Check, Download, Tag, GitMerge
} from 'lucide-react';
import { StatusBadge, PriorityBadge } from './BadgeComponents';
import { formatDate, formatDateTime } from '../../utils/dateUtils';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export default function TicketDetailModal({ ticket, onClose, authHeaders, onCommentAdded }) {
  const [commentText, setCommentText] = useState('');
  const [commentScreenshot, setCommentScreenshot] = useState(null);
  const [submittingComment, setSubmittingComment] = useState(false);

  const [attachment, setAttachment] = useState(null);

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
    });
  };

  const [comments, setComments] = useState(ticket.comments || []);
  const ticketId = ticket.ticketId || ticket.id;

  const getHeaders = () => {
    const base = authHeaders ? (typeof authHeaders === 'function' ? authHeaders() : authHeaders) : {};
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...base
    };
  };

  const loadComments = () => {
    if (ticketId) {
      fetch(`${API_BASE_URL}/comments/ticket/${ticketId}`, { headers: getHeaders() })
        .then(r => r.ok ? r.json() : [])
        .then(data => setComments(data))
        .catch(() => null);
    }
  };

  useEffect(() => {
    if (ticketId) {
      fetch(`${API_BASE_URL}/attachments/ticket/${ticketId}`, { headers: getHeaders() })
        .then(r => r.ok ? r.json() : [])
        .then(list => {
          if (list && list.length > 0) {
            setAttachment(list[0]);
          }
        })
        .catch(() => null);

      loadComments();
    }
  }, [ticketId]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      let b64Attachment = null;
      let attName = null;
      let attType = null;
      if (commentScreenshot) {
        b64Attachment = await convertToBase64(commentScreenshot);
        attName = commentScreenshot.name;
        attType = commentScreenshot.type || 'image/png';
      }

      const res = await fetch(`${API_BASE_URL}/comments/ticket/${ticketId}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          commentText,
          attachmentBase64: b64Attachment,
          attachmentName: attName,
          attachmentType: attType
        })
      });

      if (res.ok) {
        setCommentText('');
        setCommentScreenshot(null);
        loadComments();
        const refreshedRes = await fetch(`${API_BASE_URL}/tickets/${ticketId}`, {
          headers: getHeaders()
        });
        if (refreshedRes.ok) {
          const refreshed = await refreshedRes.json();
          if (onCommentAdded) onCommentAdded(refreshed);
        } else {
          if (onCommentAdded) onCommentAdded(ticket);
        }
      }
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const [closingTicket, setClosingTicket] = useState(false);
  const [closeError, setCloseError] = useState(null);

  const handleConfirmClose = async () => {
    setClosingTicket(true);
    setCloseError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/tickets/${ticketId}/close`, {
        method: 'PUT',
        headers: getHeaders()
      });
      if (res.ok) {
        const updated = await res.json();
        if (onCommentAdded) onCommentAdded(updated);
      } else {
        const err = await res.json().catch(() => ({}));
        setCloseError(err.error || 'Failed to close ticket.');
      }
    } catch (err) {
      setCloseError('Error closing ticket: ' + err.message);
    } finally {
      setClosingTicket(false);
    }
  };

  const normalizedStatus = (ticket.status || 'OPEN').toUpperCase();
  const stepMap = { 'OPEN': 0, 'ASSIGNED': 1, 'IN_PROGRESS': 2, 'PENDING': 2, 'WAITING_FOR_USER': 2, 'SOLVED': 3, 'RESOLVED': 3, 'CLOSED': 4 };
  const currentStep = stepMap[normalizedStatus] ?? 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="glass-panel modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="flex-align-center gap-2 flex-wrap mb-1">
              <span className="ticket-id-tag">
                <FileText size={12} style={{ marginRight: 4 }} />
                {ticket.ticketNumber || `TKT-${ticket.ticketId || ticket.id}`}
              </span>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
              <span className="category-pill-tag">
                <Building2 size={12} style={{ marginRight: 4 }} />
                {ticket.category?.categoryName || 'General IT'}
              </span>
            </div>
            <h3 className="modal-title">{ticket.title}</h3>
          </div>
          <button className="close-btn" onClick={onClose} title="Close Modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* 5-Step Lifecycle Stepper */}
          <div className="lifecycle-stepper-card mb-4">
            <div className="stepper-title">
              <Sparkles size={14} className="accent-icon" />
              <span>Ticket Resolution Progress</span>
            </div>
            <div className="stepper-track">
              {[
                { label: 'OPEN', step: 0, desc: 'Created' },
                { label: 'ASSIGNED', step: 1, desc: 'Claimed' },
                { label: normalizedStatus === 'PENDING' ? 'PENDING' : 'IN PROGRESS', step: 2, desc: normalizedStatus === 'PENDING' ? 'On Hold' : 'In Work' },
                { label: 'SOLVED', step: 3, desc: 'Resolved' },
                { label: 'CLOSED', step: 4, desc: 'Archived' }
              ].map((item, idx) => {
                const isPassed = currentStep >= item.step;
                const isCurrent = currentStep === item.step;
                return (
                  <React.Fragment key={idx}>
                    <div className={`stepper-node ${isCurrent ? 'current' : isPassed ? 'passed' : ''}`}>
                      <div className="stepper-circle">
                        {isPassed && !isCurrent ? <CheckCircle2 size={13} /> : item.step + 1}
                      </div>
                      <div className="stepper-meta">
                        <span className="stepper-label">{item.label}</span>
                        <span className="stepper-desc">{item.desc}</span>
                      </div>
                    </div>
                    {idx < 4 && <div className={`stepper-connector ${currentStep > item.step ? 'passed' : ''}`} />}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Notice when ticket is in PENDING state */}
          {(normalizedStatus === 'PENDING' || normalizedStatus === 'WAITING_FOR_USER') && (
            <div className="pending-notice-card mb-4">
              <div className="flex-align-center gap-2">
                <div className="pending-icon-badge">
                  <Pause size={16} color="#f59e0b" />
                </div>
                <div>
                  <h4 className="m-0" style={{ color: '#f59e0b', fontSize: '0.94rem' }}>
                    Action Needed: Support Engineer Is Awaiting Your Response
                  </h4>
                  <p className="text-muted-xs mt-1" style={{ margin: '2px 0 0 0' }}>
                    The engineer working on this ticket needs additional details, logs, or confirmation. Please reply using the discussion box below.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Solved / Verification Banner for Employee */}
          {(normalizedStatus === 'SOLVED' || normalizedStatus === 'RESOLVED') && (
            <div className="action-card-solved mb-4">
              <div className="flex-between-center flex-wrap gap-2">
                <div className="solved-head">
                  <ShieldCheck size={24} color="#10b981" />
                  <div>
                    <h4 style={{ margin: 0, color: '#10b981' }}>
                      Solution Provided by {ticket.solvedBy?.name || ticket.assignedTo?.name || 'Support Engineer'}
                    </h4>
                    <p className="text-muted-xs" style={{ margin: '2px 0 0 0' }}>
                      Solved at {formatDateTime(ticket.solvedAt || ticket.resolvedAt)}
                    </p>
                  </div>
                </div>

                <button
                  className="btn-action-green"
                  onClick={handleConfirmClose}
                  disabled={closingTicket}
                >
                  <CheckCircle2 size={16} style={{ marginRight: 6 }} />
                  {closingTicket ? 'Closing Ticket...' : 'Confirm Solution & Close'}
                </button>
              </div>

              {closeError && <div className="text-danger mt-2 text-xs">{closeError}</div>}

              {ticket.resolution && (
                <div className="solved-resolution-box mt-3">
                  <div className="flex-align-center gap-1 mb-1 font-semibold text-xs text-emerald">
                    <CheckCircle2 size={13} />
                    <span>Verified Resolution Summary:</span>
                  </div>
                  <p>{ticket.resolution}</p>

                  {ticket.solutionAttachmentBase64 && (
                    <div className="solution-attachment-container mt-3">
                      <span className="font-semibold text-xs text-muted flex-align-center gap-1 mb-2">
                        <Paperclip size={12} /> Solution Proof ({ticket.solutionAttachmentName || 'Screenshot'}):
                      </span>
                      <img src={ticket.solutionAttachmentBase64} alt="Resolution proof" className="solution-attachment-img" />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Closed State Banner */}
          {normalizedStatus === 'CLOSED' && (
            <div className="action-card-closed mb-4">
              <div className="flex-align-center gap-3">
                <div className="closed-icon-badge">
                  <Lock size={18} color="#94a3b8" />
                </div>
                <div>
                  <h4 style={{ margin: 0, color: '#94a3b8' }}>Ticket Closed & Confirmed</h4>
                  <p className="text-muted-xs" style={{ margin: '2px 0 0 0' }}>
                    Closed on {formatDateTime(ticket.closedAt)}. Thank you for using DESK AI!
                  </p>
                </div>
              </div>
              {ticket.resolution && (
                <div className="solved-resolution-box mt-3">
                  <div className="flex-align-center gap-1 mb-1 font-semibold text-xs text-muted">
                    <FileText size={13} />
                    <span>Resolution Summary:</span>
                  </div>
                  <p>{ticket.resolution}</p>

                  {ticket.solutionAttachmentBase64 && (
                    <div className="solution-attachment-container mt-3">
                      <span className="font-semibold text-xs text-muted flex-align-center gap-1 mb-2">
                        <Paperclip size={12} /> Archived Solution Proof ({ticket.solutionAttachmentName || 'Screenshot'}):
                      </span>
                      <img src={ticket.solutionAttachmentBase64} alt="Archived Solution proof" className="solution-attachment-img" />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Merged Banner */}
          {ticket.mergedIntoTicketId && (
            <div className="merged-notice-banner mb-3">
              <GitMerge size={16} />
              <span>This ticket was identified as a duplicate and merged into Ticket <strong>#TKT-{ticket.mergedIntoTicketId}</strong>. Progress is tracked under that request.</span>
            </div>
          )}

          {/* Details Grid */}
          <div className="details-grid mb-4">
            <div className="detail-box">
              <span className="box-lbl">
                <User size={12} style={{ marginRight: 4 }} />
                Assigned Engineer
              </span>
              <span className="box-val">{ticket.assignedTo?.name || <em className="text-muted">Unassigned (In Team Queue)</em>}</span>
            </div>

            <div className="detail-box">
              <span className="box-lbl">
                <Calendar size={12} style={{ marginRight: 4 }} />
                Created Date
              </span>
              <span className="box-val">{formatDateTime(ticket.createdAt)}</span>
            </div>

            <div className="detail-box">
              <span className="box-lbl">
                <Tag size={12} style={{ marginRight: 4 }} />
                AI Auto-Tags
              </span>
              <span className="box-val text-cyan">
                {ticket.tags ? (
                  ticket.tags.split(',').map((t, idx) => (
                    <span key={idx} className="tag-pill" style={{ marginRight: 4, display: 'inline-block' }}>
                      #{t.trim()}
                    </span>
                  ))
                ) : (
                  <em className="text-muted">General</em>
                )}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="field-group mb-4">
            <label className="form-label-flex">
              <FileText size={14} color="var(--accent-cyan)" />
              Issue Description
            </label>
            <div className="desc-box">
              {ticket.description || 'No detailed description provided.'}
            </div>
          </div>

          {/* Attachment */}
          {attachment && attachment.base64Data && (
            <div className="field-group mb-4">
              <div className="flex-between-center mb-1">
                <label className="form-label-flex">
                  <Paperclip size={14} color="var(--accent-cyan)" />
                  Uploaded Screenshot Attachment
                </label>
                <a
                  href={attachment.base64Data}
                  download={attachment.imageName || 'ticket_screenshot.png'}
                  className="btn-download-sm"
                  title="Download screenshot"
                >
                  <Download size={13} style={{ marginRight: 4 }} /> Download Screenshot
                </a>
              </div>
              <div className="attachment-image-box">
                <img src={attachment.base64Data} alt="Attached Screenshot" className="attachment-img" />
              </div>
            </div>
          )}

          {/* Duplicate Ticket Alert Banner */}
          {ticket.duplicateScore > 0 && (
            <div className="duplicate-alert-card mb-4">
              <div className="duplicate-alert-header">
                <Sparkles size={16} className="text-warning" />
                <span>AI Similarity Alert ({Math.round(ticket.duplicateScore * 100)}% Match)</span>
              </div>
              <p className="text-muted-xs mt-1">
                A similar issue was previously reported and solved. If the recommended solution didn't help, support will assist you shortly.
              </p>
            </div>
          )}

          {/* Discussion History */}
          <div className="field-group mb-4">
            <label className="form-label-flex">
              <MessageSquare size={14} color="var(--accent-cyan)" />
              Discussion & Updates ({comments.length})
            </label>
            {comments && comments.length > 0 ? (
              <div className="comments-stack">
                {comments.map((c, idx) => (
                  <div key={idx} className="comment-bubble">
                    <div className="comment-meta">
                      <span className="user-name">{c.user?.name || 'Support Agent'}</span>
                      <span className="time">{formatDateTime(c.createdAt)}</span>
                    </div>
                    <p className="comment-text">{c.message || c.commentText}</p>
                    {c.attachmentBase64 && (
                      <div className="comment-attachment-box mt-2">
                        <span className="text-muted-xs flex-align-center gap-1 mb-1">
                          <Paperclip size={11} /> Attachment ({c.attachmentName || 'Screenshot'}):
                        </span>
                        <img src={c.attachmentBase64} alt="Comment attachment" className="comment-attachment-img" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-discussion-box">
                <MessageSquare size={20} className="text-muted" />
                <span className="text-muted-xs">No comments yet. Reply below if you have additional information to provide.</span>
              </div>
            )}
          </div>

          {/* Reply Box */}
          <form onSubmit={handleAddComment} className="field-group mt-3">
            <label className="form-label-flex">
              <Send size={14} color="var(--accent-cyan)" />
              Add Message / Reply to Engineer
            </label>
            <div className="comment-input-row">
              <input
                type="text"
                className="input-premium flex-1"
                placeholder="Provide additional details, system info, or reply to support..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                required
              />
              <label className="btn-file-ico" title="Attach screenshot">
                <Paperclip size={16} />
                <input type="file" accept="image/*" onChange={(e) => setCommentScreenshot(e.target.files[0])} style={{ display: 'none' }} />
              </label>
              <button type="submit" className="btn-premium" disabled={submittingComment}>
                <Send size={14} /> Send
              </button>
            </div>
            {commentScreenshot && (
              <div className="attachment-chip mt-2">
                <Paperclip size={12} />
                <span>{commentScreenshot.name}</span>
                <button type="button" onClick={() => setCommentScreenshot(null)} className="chip-remove-btn">
                  <X size={12} />
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      <style>{modalStyles}</style>
    </div>
  );
}

const modalStyles = `
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(4, 3, 10, 0.65);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    padding: 20px;
  }
  .modal-dialog {
    width: 100%;
    max-width: 660px;
    max-height: 88vh;
    overflow-y: auto;
    padding: 28px 32px;
    border-radius: var(--radius-lg);
    background: var(--bg-panel);
    color: var(--text-primary);
    border: 1px solid var(--border-glow);
    box-shadow: var(--shadow-lg);
  }
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
    border-bottom: 1px solid var(--border);
    padding-bottom: 16px;
  }
  .modal-header-left {
    flex: 1;
  }
  .modal-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 4px 0 0 0;
    line-height: 1.35;
  }
  .ticket-id-tag {
    font-family: monospace;
    font-size: 0.76rem;
    font-weight: 700;
    background: rgba(6, 182, 212, 0.12);
    border: 1px solid rgba(6, 182, 212, 0.3);
    color: var(--accent-cyan);
    padding: 2px 8px;
    border-radius: 6px;
    display: inline-flex;
    align-items: center;
  }
  .category-pill-tag {
    font-size: 0.72rem;
    font-weight: 600;
    background: var(--bg-hover);
    border: 1px solid var(--border);
    color: var(--text-secondary);
    padding: 2px 8px;
    border-radius: 6px;
    display: inline-flex;
    align-items: center;
  }
  .close-btn {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text-muted);
    cursor: pointer;
    padding: 6px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    margin-left: 12px;
  }
  .close-btn:hover {
    color: #ef4444;
    border-color: rgba(239, 68, 68, 0.4);
    background: rgba(239, 68, 68, 0.1);
  }

  /* Stepper */
  .lifecycle-stepper-card {
    background: var(--bg-hover);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 16px 20px;
  }
  .stepper-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.74rem;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 14px;
  }
  .accent-icon {
    color: var(--accent-cyan);
  }
  .stepper-track {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .stepper-node {
    display: flex;
    align-items: center;
    gap: 8px;
    opacity: 0.45;
    transition: all 0.25s;
  }
  .stepper-node.passed {
    opacity: 0.85;
  }
  .stepper-node.current {
    opacity: 1;
  }
  .stepper-circle {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: var(--bg-card);
    border: 1.5px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.74rem;
    font-weight: 700;
    color: var(--text-muted);
    flex-shrink: 0;
    transition: all 0.2s;
  }
  .stepper-node.passed .stepper-circle {
    background: rgba(16, 185, 129, 0.18);
    border-color: #10b981;
    color: #10b981;
  }
  .stepper-node.current .stepper-circle {
    background: var(--accent-cyan);
    border-color: var(--accent-cyan);
    color: #000;
    box-shadow: 0 0 12px rgba(6, 182, 212, 0.5);
  }
  .stepper-meta {
    display: flex;
    flex-direction: column;
  }
  .stepper-label {
    font-size: 0.76rem;
    font-weight: 700;
    color: var(--text-primary);
  }
  .stepper-desc {
    font-size: 0.65rem;
    color: var(--text-muted);
  }
  .stepper-connector {
    flex: 1;
    height: 2px;
    background: var(--border);
    margin: 0 4px;
    transition: all 0.2s;
  }
  .stepper-connector.passed {
    background: #10b981;
  }

  .pending-notice-card {
    padding: 14px 18px;
    background: rgba(245, 158, 11, 0.08);
    border: 1px solid rgba(245, 158, 11, 0.35);
    border-radius: var(--radius-sm);
  }
  .pending-icon-badge {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(245, 158, 11, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(245, 158, 11, 0.3);
    flex-shrink: 0;
  }

  .action-card-solved {
    padding: 16px 20px;
    background: rgba(16, 185, 129, 0.08);
    border: 1px solid rgba(16, 185, 129, 0.35);
    border-radius: var(--radius-sm);
  }
  .action-card-closed {
    padding: 16px 20px;
    background: rgba(100, 116, 139, 0.08);
    border: 1px solid rgba(100, 116, 139, 0.35);
    border-radius: var(--radius-sm);
  }
  .closed-icon-badge {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(100, 116, 139, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(100, 116, 139, 0.3);
  }
  .solved-head {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .solved-head h4 {
    margin: 0;
    color: #10b981;
    font-size: 0.98rem;
  }
  .solved-resolution-box {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 12px 16px;
    font-size: 0.85rem;
    color: var(--text-primary);
  }
  .solved-resolution-box p {
    margin: 0;
    color: var(--text-secondary);
    line-height: 1.5;
  }
  .solution-attachment-container {
    padding-top: 10px;
    border-top: 1px solid var(--border);
  }
  .solution-attachment-img {
    max-width: 100%;
    max-height: 250px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    object-fit: contain;
    background: var(--bg-app);
  }
  .btn-action-green {
    padding: 8px 18px;
    border-radius: var(--radius-sm);
    font-size: 0.84rem;
    font-weight: 700;
    background: #10b981;
    color: #fff;
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    transition: all 0.2s;
  }
  .btn-action-green:hover {
    filter: brightness(1.12);
    transform: translateY(-1px);
  }

  .details-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .detail-box {
    background: var(--bg-hover);
    border: 1px solid var(--border);
    padding: 10px 14px;
    border-radius: var(--radius-sm);
    display: flex;
    flex-direction: column;
  }
  .box-lbl {
    font-size: 0.72rem;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    margin-bottom: 2px;
  }
  .box-val { font-size: 0.88rem; font-weight: 600; color: var(--text-primary); }

  .form-label-flex {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--text-secondary);
    margin-bottom: 6px;
  }
  .desc-box {
    background: var(--bg-hover);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 14px 16px;
    font-size: 0.88rem;
    color: var(--text-primary);
    line-height: 1.55;
  }
  .attachment-image-box {
    padding: 12px;
    background: var(--bg-hover);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    display: flex;
    justify-content: center;
  }
  .attachment-img {
    max-width: 100%;
    max-height: 350px;
    border-radius: var(--radius-sm);
    object-fit: contain;
  }
  .duplicate-alert-card {
    background: rgba(245, 158, 11, 0.08);
    border: 1px solid rgba(245, 158, 11, 0.3);
    border-radius: var(--radius-sm);
    padding: 12px 16px;
    color: var(--text-primary);
  }
  .duplicate-alert-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    color: #f59e0b;
  }
  .comments-stack {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 220px;
    overflow-y: auto;
    padding-right: 4px;
  }
  .comment-bubble {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 10px 14px;
  }
  .comment-meta {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: var(--accent-cyan);
    margin-bottom: 4px;
  }
  .comment-text {
    font-size: 0.85rem;
    color: var(--text-primary);
    margin: 0;
    line-height: 1.45;
  }
  .comment-attachment-box {
    background: var(--bg-hover);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 8px;
  }
  .comment-attachment-img {
    max-width: 100%;
    max-height: 220px;
    border-radius: 4px;
    object-fit: contain;
    background: var(--bg-app);
  }
  .empty-discussion-box {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px;
    background: var(--bg-hover);
    border: 1px dashed var(--border);
    border-radius: var(--radius-sm);
  }
  .comment-input-row {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .btn-file-ico {
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--bg-input);
    color: var(--text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    transition: all 0.2s;
  }
  .btn-file-ico:hover {
    color: var(--text-primary);
    border-color: var(--accent-purple);
  }
  .attachment-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 10px;
    border-radius: 99px;
    background: rgba(6, 182, 212, 0.12);
    border: 1px solid rgba(6, 182, 212, 0.3);
    color: var(--accent-cyan);
    font-size: 0.75rem;
  }
  .chip-remove-btn {
    background: transparent;
    border: none;
    color: inherit;
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 0;
  }
  .flex-gap-2 { display: flex; gap: 8px; }
  .flex-between-center { display: flex; justify-content: space-between; align-items: center; }
  .flex-align-center { display: flex; align-items: center; }
  .flex-wrap { flex-wrap: wrap; }
  .gap-1 { gap: 4px; }
  .gap-2 { gap: 8px; }
  .gap-3 { gap: 12px; }
  .flex-1 { flex: 1; }
  .mb-1 { margin-bottom: 4px; }
  .mb-3 { margin-bottom: 14px; }
  .mb-4 { margin-bottom: 20px; }
  .mt-1 { margin-top: 4px; }
  .mt-2 { margin-top: 8px; }
  .mt-3 { margin-top: 14px; }
  .m-0 { margin: 0; }
  .text-emerald { color: #10b981; }
  .font-semibold { font-weight: 600; }
  .text-xs { font-size: 0.75rem; }
`;
