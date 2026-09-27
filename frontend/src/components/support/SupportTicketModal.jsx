import React, { useState, useEffect } from 'react';
import {
  X, CheckCircle2, MessageSquare, Send, Paperclip, Sparkles, BookOpen,
  Clock, Play, UserCheck, AlertCircle, ArrowRight, Pause, RotateCcw,
  ShieldCheck, Lock, User, Building2, Calendar, FileText, Wrench, Info, Image as ImageIcon,
  Download, GitMerge, Tag
} from 'lucide-react';
import { StatusBadge, PriorityBadge } from '../employee/BadgeComponents';
import { formatDate, formatDateTime } from '../../utils/dateUtils';
import SimilarResolvedModal from './SimilarResolvedModal';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export default function SupportTicketModal({ ticket, onClose, authHeaders, onTicketUpdated }) {
  const [status, setStatus] = useState(ticket.status || 'OPEN');
  const [resolutionText, setResolutionText] = useState(ticket.resolution || '');
  const [solutionScreenshot, setSolutionScreenshot] = useState(null);
  const [solutionBase64, setSolutionBase64] = useState(null);

  const [commentText, setCommentText] = useState('');
  const [commentScreenshot, setCommentScreenshot] = useState(null);
  const [isInternalComment, setIsInternalComment] = useState(false);
  
  const [submittingResolution, setSubmittingResolution] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [createKbOption, setCreateKbOption] = useState(true);

  // Duplicate detection & merging states
  const [duplicateCandidates, setDuplicateCandidates] = useState([]);
  const [mergingTicket, setMergingTicket] = useState(false);
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [similarModalOpen, setSimilarModalOpen] = useState(false);
  const [selectedTargetId, setSelectedTargetId] = useState(null);
  const [mergeReason, setMergeReason] = useState('Duplicate request identified by Sentence-BERT');
  const [mergeMessage, setMergeMessage] = useState(null);
  const [similarResolvedTickets, setSimilarResolvedTickets] = useState([]);

  const ticketId = ticket.ticketId || ticket.id;
  const [comments, setComments] = useState(ticket.comments || []);

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
          if (list && list.length > 0) setAttachment(list[0]);
        })
        .catch(() => null);
      
      fetch(`${API_BASE_URL}/tickets/${ticketId}/duplicates`, { headers: getHeaders() })
        .then(r => r.ok ? r.json() : [])
        .then(dups => {
          if (Array.isArray(dups)) {
            setDuplicateCandidates(dups.filter(d => (d.id || d.ticketId) !== ticketId));
          }
          // Filter only RESOLVED/SOLVED/CLOSED tickets for similar modal
          const resolved = (Array.isArray(dups) ? dups : []).filter(d => {
            const st = (d.status || d.ticketStatus || '').toUpperCase();
            return (st === 'RESOLVED' || st === 'SOLVED' || st === 'CLOSED') && (d.id || d.ticketId) !== ticketId;
          });
          setSimilarResolvedTickets(resolved);
        })
        .catch(() => null);

      loadComments();
    }
  }, [ticketId]);

  const handleMergeTicket = async (targetId) => {
    const finalTargetId = targetId || selectedTargetId;
    if (!finalTargetId) return;

    setMergingTicket(true);
    try {
      const res = await fetch(`${API_BASE_URL}/tickets/${ticketId}/merge`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          targetTicketId: finalTargetId,
          reason: mergeReason
        })
      });

      if (res.ok) {
        const merged = await res.json();
        setMergeMessage(`Ticket successfully merged into #TKT-${finalTargetId}.`);
        setStatus('CLOSED');
        setMergeModalOpen(false);
        if (onTicketUpdated) onTicketUpdated(merged);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to merge ticket.');
      }
    } catch (err) {
      alert('Error during merge: ' + err.message);
    } finally {
      setMergingTicket(false);
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

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [holdReason, setHoldReason] = useState('');
  const [showHoldInput, setShowHoldInput] = useState(false);

  // 1. Claim / Assign Ticket (OPEN -> ASSIGNED)
  const handleAssignToMe = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/tickets/${ticketId}/assign`, {
        method: 'PUT',
        headers: getHeaders()
      });
      if (res.ok) {
        const updated = await res.json();
        setStatus(updated.status);
        onTicketUpdated(updated);
        return updated;
      } else {
        const err = await res.json().catch(() => ({}));
        setActionError(err.error || 'Failed to claim ticket.');
        return null;
      }
    } catch (err) {
      setActionError('Error assigning ticket: ' + err.message);
      return null;
    } finally {
      setActionLoading(false);
    }
  };

  // 1b. Claim Ticket and Immediately Start Working (OPEN -> IN_PROGRESS)
  const handleClaimAndStart = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/tickets/${ticketId}/assign`, {
        method: 'PUT',
        headers: getHeaders()
      });
      if (res.ok) {
        const startRes = await fetch(`${API_BASE_URL}/tickets/${ticketId}/start`, {
          method: 'PUT',
          headers: getHeaders()
        });
        if (startRes.ok) {
          const updated = await startRes.json();
          setStatus(updated.status);
          onTicketUpdated(updated);
        } else {
          const assignedTicket = await res.json();
          setStatus(assignedTicket.status);
          onTicketUpdated(assignedTicket);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setActionError(err.error || 'Failed to claim ticket.');
      }
    } catch (err) {
      setActionError('Error claiming ticket: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Start / Resume Work Progress (ASSIGNED/PENDING -> IN_PROGRESS)
  const handleStartProgress = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/tickets/${ticketId}/start`, {
        method: 'PUT',
        headers: getHeaders()
      });
      if (res.ok) {
        const updated = await res.json();
        setStatus(updated.status);
        onTicketUpdated(updated);
      } else {
        const err = await res.json().catch(() => ({}));
        setActionError(err.error || 'Failed to start progress.');
      }
    } catch (err) {
      setActionError('Error starting progress: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Put On Hold (IN_PROGRESS -> PENDING)
  const handleHoldPending = async (e) => {
    e?.preventDefault?.();
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/tickets/${ticketId}/pending`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ reason: holdReason.trim() || 'Waiting for user response or external dependency.' })
      });
      if (res.ok) {
        const updated = await res.json();
        setStatus(updated.status);
        setShowHoldInput(false);
        onTicketUpdated(updated);
      } else {
        const err = await res.json().catch(() => ({}));
        setActionError(err.error || 'Failed to place ticket on hold.');
      }
    } catch (err) {
      setActionError('Error holding ticket: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Solve Ticket (IN_PROGRESS/PENDING -> SOLVED) with optional proof attachment & Auto-create KB
  const handleSolveTicket = async (e) => {
    e.preventDefault();
    if (!resolutionText.trim()) {
      setActionError('Please provide resolution details before marking the ticket as solved.');
      return;
    }

    setSubmittingResolution(true);
    setActionError(null);
    try {
      let finalSolutionB64 = solutionBase64;
      if (solutionScreenshot && !finalSolutionB64) {
        finalSolutionB64 = await convertToBase64(solutionScreenshot);
      }

      const res = await fetch(`${API_BASE_URL}/tickets/${ticketId}/solve`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          resolution: resolutionText.trim(),
          solutionAttachmentBase64: finalSolutionB64,
          solutionAttachmentName: solutionScreenshot ? solutionScreenshot.name : null
        })
      });

      if (res.ok) {
        const solvedTicket = await res.json();
        setStatus(solvedTicket.status);

        // Auto-create Knowledge Base article if checkbox is checked
        if (createKbOption) {
          try {
            await fetch(`${API_BASE_URL}/knowledgebase`, {
              method: 'POST',
              headers: getHeaders(),
              body: JSON.stringify({
                title: `Solution: ${ticket.title}`,
                summary: `Verified resolution for ${ticket.category?.categoryName || 'Support'} issues.`,
                content: resolutionText.trim(),
                keywords: `${ticket.title}, ${ticket.category?.categoryName || 'IT Support'}`,
                attachmentBase64: finalSolutionB64,
                attachmentName: solutionScreenshot ? solutionScreenshot.name : null,
                attachmentType: solutionScreenshot ? (solutionScreenshot.type || 'image/png') : null
              })
            });
          } catch (kbErr) {
            console.error('Failed to auto-create KB article:', kbErr);
          }
        }

        onTicketUpdated(solvedTicket);
      } else {
        const err = await res.json().catch(() => ({}));
        setActionError(err.error || 'Failed to solve ticket.');
      }
    } catch (err) {
      setActionError('Resolution submission failed: ' + err.message);
    } finally {
      setSubmittingResolution(false);
    }
  };

  // 5. Close Ticket (SOLVED -> CLOSED)
  const handleCloseTicket = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/tickets/${ticketId}/close`, {
        method: 'PUT',
        headers: getHeaders()
      });
      if (res.ok) {
        const updated = await res.json();
        setStatus(updated.status);
        onTicketUpdated(updated);
      } else {
        const err = await res.json().catch(() => ({}));
        setActionError(err.error || 'Failed to close ticket.');
      }
    } catch (err) {
      setActionError('Error closing ticket: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

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
          internalComment: isInternalComment,
          attachmentBase64: b64Attachment,
          attachmentName: attName,
          attachmentType: attType
        })
      });

      if (res.ok) {
        setCommentText('');
        setCommentScreenshot(null);
        loadComments();
        const refreshedRes = await fetch(`${API_BASE_URL}/tickets/${ticketId}`, { headers: getHeaders() });
        if (refreshedRes.ok) {
          const refreshed = await refreshedRes.json();
          onTicketUpdated(refreshed);
        }
      }
    } catch (err) {
      console.error('Comment error:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const normalizedStatus = (status || 'OPEN').toUpperCase();
  const stepMap = { 'OPEN': 0, 'ASSIGNED': 1, 'IN_PROGRESS': 2, 'PENDING': 2, 'WAITING_FOR_USER': 2, 'SOLVED': 3, 'RESOLVED': 3, 'CLOSED': 4 };
  const currentStep = stepMap[normalizedStatus] ?? 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="glass-panel modal-dialog modal-dialog-wide" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="flex-align-center gap-2 flex-wrap mb-1">
              <span className="ticket-id-tag">
                <FileText size={12} style={{ marginRight: 4 }} />
                {ticket.ticketNumber || `TKT-${ticketId}`}
              </span>
              <StatusBadge status={status} />
              <PriorityBadge priority={ticket.priority} />
              <span className="category-pill-tag">
                <Building2 size={12} style={{ marginRight: 4 }} />
                {ticket.category?.categoryName || 'IT Support'}
              </span>
            </div>
            <h3 className="modal-title">{ticket.title}</h3>
          </div>
          <button className="close-btn" onClick={onClose} title="Close Modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Action Error Alert */}
          {actionError && (
            <div className="action-error-alert mb-4">
              <AlertCircle size={16} />
              <span>{actionError}</span>
            </div>
          )}

          {/* 5-Step Enterprise Lifecycle Stepper */}
          <div className="lifecycle-stepper-card mb-4">
            <div className="stepper-title">
              <Sparkles size={14} className="accent-icon" />
              <span>Workflow State Progression</span>
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

          {/* Similar Resolved Tickets - Quick Access */}
          {similarResolvedTickets && similarResolvedTickets.length > 0 && normalizedStatus !== 'CLOSED' && (
            <div className="similar-resolved-banner mb-4" onClick={() => setSimilarModalOpen(true)}>
              <div className="similar-banner-left">
                <Sparkles size={16} color="#06b6d4" />
                <div>
                  <span className="similar-banner-title">
                    {similarResolvedTickets.length} Similar Resolved Ticket{similarResolvedTickets.length !== 1 ? 's' : ''} Found
                  </span>
                  <span className="similar-banner-desc">
                    AI detected previously resolved tickets that may help resolve this issue faster.
                  </span>
                </div>
              </div>
              <button className="similar-banner-btn">
                <Sparkles size={13} style={{ marginRight: 4 }} />
                View Solutions
              </button>
            </div>
          )}
          <div className="workflow-action-panel mb-4">
            {normalizedStatus === 'OPEN' && (
              <div className="action-card action-card-open">
                <div className="action-card-left">
                  <div className="card-status-indicator">
                    <UserCheck size={18} color="var(--accent-cyan)" />
                    <div>
                      <h4>Ticket Available in Department Queue</h4>
                      <p className="text-muted-xs">Unassigned ticket awaiting ownership. Take this ticket to start troubleshooting and solve it.</p>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    className="btn-action-primary"
                    onClick={handleAssignToMe}
                    disabled={actionLoading}
                    title="Claim and assign ticket to your queue"
                  >
                    <UserCheck size={16} style={{ marginRight: 6 }} />
                    {actionLoading ? 'Claiming...' : 'Claim Ticket'}
                  </button>
                  <button
                    className="btn-action-purple"
                    onClick={handleClaimAndStart}
                    disabled={actionLoading}
                    title="Claim and immediately begin troubleshooting"
                  >
                    <Play size={16} style={{ marginRight: 6 }} />
                    {actionLoading ? 'Starting...' : 'Take & Start Solving'}
                  </button>
                </div>
              </div>
            )}

            {normalizedStatus === 'ASSIGNED' && (
              <div className="action-card action-card-assigned">
                <div className="action-card-left">
                  <div className="card-status-indicator">
                    <Play size={18} color="var(--accent-purple)" />
                    <div>
                      <h4>Assigned to {ticket.assignedTo?.name || 'Support Engineer'}</h4>
                      <p className="text-muted-xs">
                        Claimed at {formatDateTime(ticket.assignedAt)}. Ready to begin active investigation.
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  className="btn-action-purple"
                  onClick={handleStartProgress}
                  disabled={actionLoading}
                >
                  <Play size={16} style={{ marginRight: 6 }} />
                  {actionLoading ? 'Starting...' : 'Start Progress'}
                </button>
              </div>
            )}

            {normalizedStatus === 'IN_PROGRESS' && (
              <div className="action-card action-card-progress">
                <div className="action-progress-head mb-3">
                  <div className="flex-between-center flex-wrap gap-2">
                    <div className="flex-align-center gap-2">
                      <Wrench size={16} color="#f59e0b" />
                      <h4 className="m-0">Active Troubleshooting in Progress</h4>
                    </div>

                    <button
                      className="btn-action-amber-outline"
                      onClick={() => setShowHoldInput(!showHoldInput)}
                    >
                      <Pause size={13} style={{ marginRight: 4 }} />
                      {showHoldInput ? 'Cancel Hold' : 'Put on Hold (PENDING)'}
                    </button>
                  </div>
                  <p className="text-muted-xs mt-1">
                    Started at {formatDateTime(ticket.startedAt)}. Once resolved, write solution notes below and optionally attach proof.
                  </p>
                </div>

                {showHoldInput && (
                  <form onSubmit={handleHoldPending} className="hold-form-box mb-3">
                    <label className="hold-form-label">
                      <Pause size={12} style={{ marginRight: 4 }} />
                      Reason for Placing On Hold (e.g. Waiting for employee reply, server patch):
                    </label>
                    <div className="flex-gap-2 mt-2">
                      <input
                        type="text"
                        className="input-premium flex-1"
                        placeholder="State reason for hold..."
                        value={holdReason}
                        onChange={(e) => setHoldReason(e.target.value)}
                        required
                      />
                      <button type="submit" className="btn-action-amber" disabled={actionLoading}>
                        Confirm Hold
                      </button>
                    </div>
                  </form>
                )}

                <form onSubmit={handleSolveTicket}>
                  <div className="field-group mb-3">
                    <label className="form-label-flex">
                      <CheckCircle2 size={14} color="#10b981" />
                      Solution & Resolution Notes *
                    </label>
                    <textarea
                      className="input-premium"
                      rows="3"
                      placeholder="Explain how the issue was resolved (e.g., cleared DNS cache, replaced network cable, re-synced credentials)..."
                      value={resolutionText}
                      onChange={(e) => setResolutionText(e.target.value)}
                      required
                    />
                  </div>

                  {/* Resolution Proof Attachment */}
                  <div className="flex-align-center gap-2 flex-wrap mb-3">
                    <label className="btn-file-upload-solution" title="Attach screenshot or proof of resolution">
                      <Paperclip size={14} style={{ marginRight: 6 }} />
                      {solutionScreenshot ? 'Change Solution Proof' : 'Attach Resolution Proof / Screenshot'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setSolutionScreenshot(file);
                            const b64 = await convertToBase64(file);
                            setSolutionBase64(b64);
                          }
                        }}
                        style={{ display: 'none' }}
                      />
                    </label>

                    {solutionScreenshot && (
                      <div className="attachment-chip">
                        <Paperclip size={12} />
                        <span>{solutionScreenshot.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSolutionScreenshot(null);
                            setSolutionBase64(null);
                          }}
                          className="chip-remove-btn"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex-between-center flex-wrap gap-2">
                    <label className={`custom-checkbox-card ${createKbOption ? 'checked' : ''}`}>
                      <input
                        type="checkbox"
                        className="custom-checkbox"
                        checked={createKbOption}
                        onChange={(e) => setCreateKbOption(e.target.checked)}
                      />
                      <BookOpen size={14} color="var(--accent-cyan)" />
                      <span className="font-semibold text-xs">Auto-create Knowledge Base article from solution</span>
                    </label>

                    <button
                      type="submit"
                      className="btn-action-green"
                      disabled={submittingResolution}
                    >
                      <CheckCircle2 size={16} style={{ marginRight: 6 }} />
                      {submittingResolution ? 'Marking as Solved...' : 'Mark as SOLVED (Notify Employee)'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {(normalizedStatus === 'PENDING' || normalizedStatus === 'WAITING_FOR_USER') && (
              <div className="action-card action-card-pending">
                <div className="action-progress-head mb-3">
                  <div className="flex-between-center flex-wrap gap-2">
                    <div className="flex-align-center gap-2">
                      <Pause size={16} color="#f59e0b" />
                      <h4 className="m-0" style={{ color: '#f59e0b' }}>Ticket On Hold Awaiting Information</h4>
                    </div>

                    <button
                      className="btn-action-purple"
                      onClick={handleStartProgress}
                      disabled={actionLoading}
                    >
                      <RotateCcw size={14} style={{ marginRight: 5 }} />
                      {actionLoading ? 'Resuming...' : 'Resume Progress'}
                    </button>
                  </div>
                  <p className="text-muted-xs mt-1">
                    The ticket is on hold. You can resume progress or provide a solution if the missing details were supplied.
                  </p>
                </div>

                <form onSubmit={handleSolveTicket}>
                  <div className="field-group mb-3">
                    <label className="form-label-flex">
                      <CheckCircle2 size={14} color="#10b981" />
                      Provide Verified Solution & Resolve
                    </label>
                    <textarea
                      className="input-premium"
                      rows="2"
                      placeholder="Enter verified resolution..."
                      value={resolutionText}
                      onChange={(e) => setResolutionText(e.target.value)}
                      required
                    />
                  </div>

                  {/* Resolution Proof Attachment */}
                  <div className="flex-align-center gap-2 flex-wrap mb-3">
                    <label className="btn-file-upload-solution" title="Attach screenshot or proof of resolution">
                      <Paperclip size={14} style={{ marginRight: 6 }} />
                      {solutionScreenshot ? 'Change Solution Proof' : 'Attach Resolution Proof / Screenshot'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setSolutionScreenshot(file);
                            const b64 = await convertToBase64(file);
                            setSolutionBase64(b64);
                          }
                        }}
                        style={{ display: 'none' }}
                      />
                    </label>

                    {solutionScreenshot && (
                      <div className="attachment-chip">
                        <Paperclip size={12} />
                        <span>{solutionScreenshot.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSolutionScreenshot(null);
                            setSolutionBase64(null);
                          }}
                          className="chip-remove-btn"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex-between-center flex-wrap gap-2">
                    <label className={`custom-checkbox-card ${createKbOption ? 'checked' : ''}`}>
                      <input
                        type="checkbox"
                        className="custom-checkbox"
                        checked={createKbOption}
                        onChange={(e) => setCreateKbOption(e.target.checked)}
                      />
                      <BookOpen size={14} color="var(--accent-cyan)" />
                      <span className="font-semibold text-xs">Auto-create Knowledge Base article</span>
                    </label>

                    <button
                      type="submit"
                      className="btn-action-green"
                      disabled={submittingResolution}
                    >
                      <CheckCircle2 size={16} style={{ marginRight: 6 }} />
                      Mark as SOLVED
                    </button>
                  </div>
                </form>
              </div>
            )}

            {(normalizedStatus === 'SOLVED' || normalizedStatus === 'RESOLVED') && (
              <div className="action-card action-card-solved">
                <div className="flex-between-center flex-wrap gap-2">
                  <div className="solved-head">
                    <ShieldCheck size={24} color="#10b981" />
                    <div>
                      <h4>Ticket Solved & Verified</h4>
                      <p className="text-muted-xs">
                        Solved by <strong>{ticket.solvedBy?.name || ticket.assignedTo?.name || 'Support Engineer'}</strong> on {formatDateTime(ticket.solvedAt || ticket.resolvedAt)}.
                      </p>
                    </div>
                  </div>

                  <button
                    className="btn-action-slate"
                    onClick={handleCloseTicket}
                    disabled={actionLoading}
                  >
                    <Lock size={13} style={{ marginRight: 5 }} />
                    Close & Archive Ticket
                  </button>
                </div>

                {ticket.resolution && (
                  <div className="solved-resolution-box mt-3">
                    <div className="flex-align-center gap-1 mb-1 font-semibold text-xs text-emerald">
                      <CheckCircle2 size={13} />
                      <span>Resolution Provided:</span>
                    </div>
                    <p>{ticket.resolution}</p>

                    {ticket.solutionAttachmentBase64 && (
                      <div className="solution-attachment-container mt-3">
                        <span className="font-semibold text-xs text-muted flex-align-center gap-1 mb-2">
                          <Paperclip size={12} /> Solution Proof ({ticket.solutionAttachmentName || 'Screenshot'}):
                        </span>
                        <img src={ticket.solutionAttachmentBase64} alt="Solution attachment" className="solution-attachment-img" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {normalizedStatus === 'CLOSED' && (
              <div className="action-card action-card-closed">
                <div className="flex-align-center gap-3">
                  <div className="closed-icon-badge">
                    <Lock size={18} color="#94a3b8" />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, color: '#94a3b8' }}>Ticket Closed & Archived</h4>
                    <p className="text-muted-xs" style={{ margin: '2px 0 0 0' }}>
                      Final confirmation completed on {formatDateTime(ticket.closedAt)}.
                    </p>
                  </div>
                </div>

                {ticket.resolution && (
                  <div className="solved-resolution-box mt-3">
                    <div className="flex-align-center gap-1 mb-1 font-semibold text-xs text-muted">
                      <FileText size={13} />
                      <span>Archived Resolution:</span>
                    </div>
                    <p>{ticket.resolution}</p>

                    {ticket.solutionAttachmentBase64 && (
                      <div className="solution-attachment-container mt-3">
                        <span className="font-semibold text-xs text-muted flex-align-center gap-1 mb-2">
                          <Paperclip size={12} /> Archived Solution Proof ({ticket.solutionAttachmentName || 'Screenshot'}):
                        </span>
                        <img src={ticket.solutionAttachmentBase64} alt="Archived Solution attachment" className="solution-attachment-img" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Details Grid */}
          <div className="details-grid mb-4">
            <div className="detail-box">
              <span className="box-lbl">
                <User size={12} style={{ marginRight: 4 }} />
                Submitted By
              </span>
              <span className="box-val">{ticket.createdBy?.name || 'Employee'} ({ticket.createdBy?.email || 'N/A'})</span>
            </div>

            <div className="detail-box">
              <span className="box-lbl">
                <Building2 size={12} style={{ marginRight: 4 }} />
                Department & Category
              </span>
              <span className="box-val">{ticket.department?.departmentName || 'IT Support'} • {ticket.category?.categoryName || 'General'}</span>
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
                <UserCheck size={12} style={{ marginRight: 4 }} />
                Assigned Engineer
              </span>
              <span className="box-val">{ticket.assignedTo?.name || <em className="text-muted">Unassigned (In Queue)</em>}</span>
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

          {/* Issue Description */}
          <div className="field-group mb-4">
            <label className="form-label-flex">
              <FileText size={14} color="var(--accent-cyan)" />
              Issue Description
            </label>
            <div className="desc-box">
              {ticket.description || 'No detailed description provided.'}
            </div>
          </div>

          {/* Screenshot Attachment */}
          {attachment && attachment.base64Data && (
            <div className="field-group mb-4">
              <div className="flex-between-center mb-1">
                <label className="form-label-flex">
                  <Paperclip size={14} color="var(--accent-cyan)" />
                  Employee Screenshot Attachment
                </label>
                <a
                  href={attachment.base64Data}
                  download={attachment.imageName || 'ticket_screenshot.png'}
                  className="btn-download-sm"
                  title="Download original screenshot"
                >
                  <Download size={13} style={{ marginRight: 4 }} /> Download Screenshot
                </a>
              </div>
              <div className="attachment-image-box">
                <img src={attachment.base64Data} alt="Attached Screenshot" className="attachment-img" />
              </div>
            </div>
          )}

          {/* AI Semantic Duplicate Detection & Merging (Sentence-BERT) */}
          {(ticket.duplicateScore > 0 || (duplicateCandidates && duplicateCandidates.length > 0)) && (
            <div className="duplicate-alert-card mb-4">
              <div className="duplicate-alert-header">
                <div className="flex-align-center gap-2">
                  <Sparkles size={16} color="#f59e0b" />
                  <span className="font-bold">Sentence-BERT Duplicate Detection</span>
                </div>
                <span className="badge-similarity">
                  {Math.round((ticket.duplicateScore || (duplicateCandidates[0]?.similarity || duplicateCandidates[0]?.score || 0.75)) * 100)}% Match
                </span>
              </div>
              <p className="text-muted-xs mt-1 mb-2">
                Sentence-BERT identified similar existing support tickets. You can review or merge this ticket into an existing request to prevent duplicate efforts.
              </p>

              {duplicateCandidates && duplicateCandidates.length > 0 ? (
                <div className="duplicate-candidates-list">
                  {duplicateCandidates.map((dup, i) => {
                    const simScore = Math.round((dup.score || dup.similarity || 0.8) * 100);
                    const candId = dup.id || dup.ticketId;
                    return (
                      <div key={i} className="duplicate-cand-item">
                        <div className="cand-info">
                          <span className="cand-id">#TKT-{candId}</span>
                          <span className="cand-title">{dup.title}</span>
                          <span className="cand-score">{simScore}% Similarity</span>
                        </div>
                        <button
                          type="button"
                          className="btn-merge-cand"
                          onClick={() => {
                            setSelectedTargetId(candId);
                            setMergeModalOpen(true);
                          }}
                          disabled={normalizedStatus === 'CLOSED' || mergingTicket}
                        >
                          <GitMerge size={12} style={{ marginRight: 4 }} />
                          Merge with #{candId}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex-between-center mt-2">
                  <span className="text-muted-xs">Similarity score is high. You can manually merge with another active ticket:</span>
                  <button
                    type="button"
                    className="btn-merge-cand"
                    onClick={() => setMergeModalOpen(true)}
                    disabled={normalizedStatus === 'CLOSED' || mergingTicket}
                  >
                    <GitMerge size={12} style={{ marginRight: 4 }} /> Merge Ticket
                  </button>
                </div>
              )}

              {mergeMessage && (
                <div className="merge-success-banner mt-2">
                  <CheckCircle2 size={14} color="#10b981" />
                  <span>{mergeMessage}</span>
                </div>
              )}
            </div>
          )}

          {/* Similar Resolved Modal */}
          {similarModalOpen && (
            <SimilarResolvedModal
              tickets={similarResolvedTickets}
              onClose={() => setSimilarModalOpen(false)}
              onSelect={(id) => {
                setSelectedTargetId(id);
                setMergeModalOpen(true);
                setSimilarModalOpen(false);
              }}
            />
          )}

          {/* Merge Confirmation Dialog */}
          {mergeModalOpen && (
            <div className="merge-dialog-overlay">
              <div className="merge-dialog glass-card">
                <h4><GitMerge size={16} /> Merge Duplicate Ticket</h4>
                <p className="text-muted-xs">
                  This will mark ticket <strong>#{ticket.ticketNumber || ticketId}</strong> as CLOSED (Merged) and link all updates to the target ticket.
                </p>
                <div className="field-group mt-2 mb-2">
                  <label className="text-xs font-semibold">Target Ticket ID to Merge Into:</label>
                  <input
                    type="number"
                    className="input-premium"
                    placeholder="e.g., 1001"
                    value={selectedTargetId || ''}
                    onChange={(e) => setSelectedTargetId(e.target.value)}
                    required
                  />
                </div>
                <div className="field-group mb-3">
                  <label className="text-xs font-semibold">Merge Reason:</label>
                  <input
                    type="text"
                    className="input-premium"
                    value={mergeReason}
                    onChange={(e) => setMergeReason(e.target.value)}
                  />
                </div>
                <div className="flex-between-center">
                  <button type="button" className="btn-action-slate" onClick={() => setMergeModalOpen(false)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-action-green"
                    onClick={() => handleMergeTicket()}
                    disabled={mergingTicket || !selectedTargetId}
                  >
                    {mergingTicket ? 'Merging...' : 'Confirm Merge'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Discussion History */}
          <div className="field-group mb-4">
            <label className="form-label-flex">
              <MessageSquare size={14} color="var(--accent-cyan)" />
              Discussion History ({comments.length})
            </label>
            {comments && comments.length > 0 ? (
              <div className="comments-stack">
                {comments.map((c, idx) => (
                  <div key={idx} className={`comment-bubble ${c.internalComment ? 'comment-bubble-internal' : ''}`}>
                    <div className="comment-meta">
                      <span className="user-name">
                        {c.user?.name || 'Support Engineer'}
                        {c.internalComment && (
                          <span className="badge-internal-tag">🔒 INTERNAL NOTE</span>
                        )}
                      </span>
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
                <span className="text-muted-xs">No discussion entries yet. Reply below to communicate with the employee.</span>
              </div>
            )}
          </div>

          {/* Reply Form */}
          <form onSubmit={handleAddComment} className="field-group mt-3">
            {/* Comment Visibility Toggle */}
            <div className="comment-mode-toggle mb-2">
              <button
                type="button"
                className={`mode-toggle-btn ${!isInternalComment ? 'active' : ''}`}
                onClick={() => setIsInternalComment(false)}
              >
                <MessageSquare size={13} style={{ marginRight: 4 }} /> Public Reply (Visible to Employee)
              </button>
              <button
                type="button"
                className={`mode-toggle-btn internal ${isInternalComment ? 'active' : ''}`}
                onClick={() => setIsInternalComment(true)}
              >
                <Lock size={13} style={{ marginRight: 4 }} /> Internal Note (Support Team Only 🔒)
              </button>
            </div>

            <label className="form-label-flex">
              <Send size={14} color="var(--accent-cyan)" />
              {isInternalComment ? 'Post Internal Team Note' : 'Reply to Employee'}
            </label>
            <div className="comment-input-row">
              <input
                type="text"
                className="input-premium flex-1"
                placeholder={isInternalComment ? "Write internal investigation note (hidden from employee)..." : "Ask employee for details or post progress update..."}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                required
              />
              <label className="btn-file-ico" title="Attach screenshot">
                <Paperclip size={16} />
                <input type="file" accept="image/*" onChange={(e) => setCommentScreenshot(e.target.files[0])} style={{ display: 'none' }} />
              </label>
              <button type="submit" className={`btn-premium ${isInternalComment ? 'btn-internal-submit' : ''}`} disabled={submittingComment}>
                <Send size={14} /> {isInternalComment ? 'Save Note' : 'Send Reply'}
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
    max-width: 680px;
    max-height: 88vh;
    overflow-y: auto;
    padding: 28px 32px;
    border-radius: var(--radius-lg);
    background: var(--bg-panel);
    color: var(--text-primary);
    border: 1px solid var(--border-glow);
    box-shadow: var(--shadow-lg);
  }
  .modal-dialog-wide {
    max-width: 800px;
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
  .action-error-alert {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border-radius: var(--radius-sm);
    background: rgba(239, 68, 68, 0.12);
    border: 1px solid rgba(239, 68, 68, 0.35);
    color: #ef4444;
    font-size: 0.84rem;
    font-weight: 600;
  }

  /* Lifecycle Stepper Track */
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

  /* Action Panels */
  .workflow-action-panel {
    border-radius: var(--radius-sm);
  }
  .action-card {
    border-radius: var(--radius-sm);
    padding: 16px 20px;
    transition: all 0.2s;
  }
  .action-card-open {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(6, 182, 212, 0.07);
    border: 1px solid rgba(6, 182, 212, 0.3);
    gap: 16px;
    flex-wrap: wrap;
  }
  .action-card-assigned {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(139, 92, 246, 0.08);
    border: 1px solid rgba(139, 92, 246, 0.35);
    gap: 16px;
    flex-wrap: wrap;
  }
  .action-card-progress {
    background: rgba(245, 158, 11, 0.07);
    border: 1px solid rgba(245, 158, 11, 0.35);
  }
  .action-card-pending {
    background: rgba(245, 158, 11, 0.09);
    border: 1px solid rgba(245, 158, 11, 0.4);
  }
  .action-card-solved {
    background: rgba(16, 185, 129, 0.07);
    border: 1px solid rgba(16, 185, 129, 0.35);
  }
  .action-card-closed {
    background: rgba(100, 116, 139, 0.08);
    border: 1px solid rgba(100, 116, 139, 0.35);
  }

  .card-status-indicator {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .card-status-indicator h4 {
    margin: 0;
    font-size: 0.95rem;
    color: var(--text-primary);
  }

  .hold-form-box {
    background: var(--bg-card);
    border: 1px solid rgba(245, 158, 11, 0.35);
    border-radius: 8px;
    padding: 14px;
  }
  .hold-form-label {
    display: flex;
    align-items: center;
    font-size: 0.78rem;
    font-weight: 600;
    color: #f59e0b;
  }
  .form-label-flex {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--text-secondary);
    margin-bottom: 6px;
  }

  .btn-file-upload-solution {
    display: inline-flex;
    align-items: center;
    padding: 6px 12px;
    border-radius: var(--radius-sm);
    background: var(--bg-card);
    border: 1px dashed var(--accent-cyan);
    color: var(--accent-cyan);
    font-size: 0.76rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-file-upload-solution:hover {
    background: rgba(6, 182, 212, 0.12);
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

  .btn-action-primary {
    padding: 8px 18px;
    border-radius: var(--radius-sm);
    font-size: 0.84rem;
    font-weight: 700;
    background: var(--accent-cyan);
    color: #000;
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    transition: all 0.2s;
  }
  .btn-action-primary:hover {
    filter: brightness(1.15);
    transform: translateY(-1px);
  }
  .btn-action-purple {
    padding: 8px 18px;
    border-radius: var(--radius-sm);
    font-size: 0.84rem;
    font-weight: 700;
    background: var(--accent-purple);
    color: #fff;
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    transition: all 0.2s;
  }
  .btn-action-purple:hover {
    filter: brightness(1.15);
    transform: translateY(-1px);
  }
  .btn-action-amber {
    padding: 8px 14px;
    border-radius: var(--radius-sm);
    font-size: 0.8rem;
    font-weight: 700;
    background: #f59e0b;
    color: #000;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-action-amber:hover {
    filter: brightness(1.1);
  }
  .btn-action-amber-outline {
    padding: 5px 12px;
    border-radius: var(--radius-sm);
    font-size: 0.76rem;
    font-weight: 600;
    background: transparent;
    color: #f59e0b;
    border: 1px solid #f59e0b;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    transition: all 0.2s;
  }
  .btn-action-amber-outline:hover {
    background: rgba(245, 158, 11, 0.15);
  }
  .btn-action-slate {
    padding: 7px 16px;
    border-radius: var(--radius-sm);
    font-size: 0.8rem;
    font-weight: 700;
    background: #334155;
    color: #f8fafc;
    border: 1px solid rgba(148, 163, 184, 0.25);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    transition: all 0.2s;
  }
  .btn-action-slate:hover {
    background: #1e293b;
    border-color: rgba(148, 163, 184, 0.4);
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
    padding: 4px 10px;
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
  .mb-2 { margin-bottom: 8px; }
  .mb-3 { margin-bottom: 14px; }
  .mb-4 { margin-bottom: 20px; }
  .mt-1 { margin-top: 4px; }
  .mt-2 { margin-top: 8px; }
  .mt-3 { margin-top: 14px; }
  .m-0 { margin: 0; }
  .text-emerald { color: #10b981; }
  .font-semibold { font-weight: 600; }
  .text-xs { font-size: 0.75rem; }

  /* PPT Features: Auto-Tags, Duplicates, Merging, Internal Notes */
  .tag-pill {
    padding: 2px 7px;
    border-radius: 6px;
    background: rgba(6, 182, 212, 0.15);
    border: 1px solid rgba(6, 182, 212, 0.3);
    color: var(--accent-cyan);
    font-size: 0.72rem;
    font-weight: 700;
  }
  .btn-download-sm {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: var(--text-primary);
    text-decoration: none;
    font-size: 0.72rem;
    font-weight: 600;
    transition: all 0.2s;
  }
  .btn-download-sm:hover {
    background: rgba(124, 58, 237, 0.25);
    border-color: #8b5cf6;
    color: #fff;
  }
  .duplicate-candidates-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 6px;
  }
  .duplicate-cand-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-radius: 8px;
    background: rgba(245, 158, 11, 0.08);
    border: 1px solid rgba(245, 158, 11, 0.25);
  }
  .cand-info {
    display: flex;
    align-items: center;
    gap: 8px;
    overflow: hidden;
  }
  .cand-id {
    font-weight: 800;
    font-size: 0.76rem;
    color: #f59e0b;
  }
  .cand-title {
    font-size: 0.8rem;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 320px;
  }
  .cand-score {
    font-size: 0.72rem;
    padding: 2px 6px;
    border-radius: 4px;
    background: rgba(245, 158, 11, 0.2);
    color: #fbbf24;
    font-weight: 700;
  }
  .btn-merge-cand {
    display: inline-flex;
    align-items: center;
    padding: 5px 10px;
    border-radius: 6px;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    border: none;
    color: #fff;
    font-size: 0.72rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-merge-cand:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }
  .merge-dialog-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10001;
    backdrop-filter: blur(4px);
  }
  .merge-dialog {
    width: 440px;
    padding: 24px;
    border-radius: 16px;
    background: var(--bg-card, #0f172a);
    border: 1px solid rgba(245, 158, 11, 0.4);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
  }
  .merge-dialog h4 {
    margin: 0 0 8px 0;
    display: flex;
    align-items: center;
    gap: 8px;
    color: #f59e0b;
  }
  .merge-success-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 8px;
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.3);
    color: #10b981;
    font-size: 0.8rem;
    font-weight: 600;
  }
  .comment-bubble-internal {
    border: 1px dashed rgba(245, 158, 11, 0.4) !important;
    background: rgba(245, 158, 11, 0.06) !important;
  }
  .badge-internal-tag {
    display: inline-block;
    margin-left: 8px;
    font-size: 0.62rem;
    padding: 1px 6px;
    border-radius: 4px;
    background: rgba(245, 158, 11, 0.2);
    color: #fbbf24;
    font-weight: 800;
    letter-spacing: 0.5px;
  }
  .comment-mode-toggle {
    display: flex;
    gap: 8px;
  }
  .mode-toggle-btn {
    padding: 5px 12px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.04);
    color: var(--text-muted);
    font-size: 0.74rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
  }
  .mode-toggle-btn.active {
    background: rgba(124, 58, 237, 0.2);
    border-color: #8b5cf6;
    color: #fff;
  }
  .mode-toggle-btn.internal.active {
    background: rgba(245, 158, 11, 0.2);
    border-color: #f59e0b;
    color: #fbbf24;
  }
  .btn-internal-submit {
    background: linear-gradient(135deg, #f59e0b, #d97706) !important;
  }

  /* Similar Resolved Tickets Banner */
  .similar-resolved-banner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 18px;
    border-radius: var(--radius-sm);
    background: linear-gradient(135deg, rgba(6, 182, 212, 0.06), rgba(124, 58, 237, 0.06));
    border: 1px solid rgba(6, 182, 212, 0.2);
    cursor: pointer;
    transition: all 0.25s;
    gap: 14px;
    flex-wrap: wrap;
  }
  .similar-resolved-banner:hover {
    border-color: rgba(6, 182, 212, 0.4);
    background: linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(124, 58, 237, 0.08));
    box-shadow: 0 4px 20px rgba(6, 182, 212, 0.08);
    transform: translateY(-1px);
  }
  .similar-banner-left {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    flex: 1;
  }
  .similar-banner-title {
    display: block;
    font-size: 0.88rem;
    font-weight: 700;
    color: #06b6d4;
    margin-bottom: 2px;
  }
  .similar-banner-desc {
    display: block;
    font-size: 0.74rem;
    color: #94a3b8;
    line-height: 1.4;
  }
  .similar-banner-btn {
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 0.78rem;
    font-weight: 700;
    background: linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(124, 58, 237, 0.15));
    border: 1px solid rgba(6, 182, 212, 0.3);
    color: #06b6d4;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    transition: all 0.2s;
    white-space: nowrap;
  }
  .similar-banner-btn:hover {
    background: linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(124, 58, 237, 0.2));
    color: #22d3ee;
    transform: translateY(-1px);
  }
`;
