import React, { useState, useEffect } from 'react';
import {
  Ticket, CheckCircle2, Clock, FolderOpen, AlertTriangle,
  Sparkles, ArrowRight, BookOpen, Bell, User, RefreshCw, Building2, Mail, BarChart3, ShieldAlert
} from 'lucide-react';
import { StatusBadge, PriorityBadge } from '../employee/BadgeComponents';
import { getDepartmentName, getDepartmentDetails } from '../common/TopHeaderActions';
import { SupportAnalyticsSection } from '../common/DashboardAnalytics';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export default function SupportDashboard({ stats, tickets, departmentName, currentUser, onNavigate, onSelectTicket }) {
  const deptDetails = getDepartmentDetails(currentUser);
  const deptDisplay = deptDetails.name || departmentName || 'IT Support';

  const [slaPredictions, setSlaPredictions] = useState([]);
  const [loadingPredictions, setLoadingPredictions] = useState(false);

  useEffect(() => {
    fetchSlaPredictions();
  }, [tickets]);

  const fetchSlaPredictions = async () => {
    setLoadingPredictions(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE_URL}/tickets/sla-breach-predictions`, { headers });
      if (res.ok) {
        const data = await res.json();
        setSlaPredictions(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch SLA predictions:', err);
    } finally {
      setLoadingPredictions(false);
    }
  };

  return (
    <div className="tab-fade">
      {/* Stats Row */}
      <div className="dashboard-grid-stats">
        <div className="glass-card stat-bubble">
          <div className="accent-bg icon-container bg-purple">
            <Ticket size={22} color="var(--accent-cyan)" />
          </div>
          <div className="val">{stats.total}</div>
          <p className="lbl">Assigned Requests</p>
        </div>

        <div className="glass-card stat-bubble">
          <div className="accent-bg icon-container bg-amber">
            <FolderOpen size={22} color="#f59e0b" />
          </div>
          <div className="val">{stats.open}</div>
          <p className="lbl">Open Tickets</p>
        </div>

        <div className="glass-card stat-bubble">
          <div className="accent-bg icon-container bg-cyan">
            <Clock size={22} color="#3b82f6" />
          </div>
          <div className="val">{stats.inProgress}</div>
          <p className="lbl">In Progress</p>
        </div>

        <div className="glass-card stat-bubble">
          <div className="accent-bg icon-container bg-emerald">
            <CheckCircle2 size={22} color="#10b981" />
          </div>
          <div className="val">{stats.resolved}</div>
          <p className="lbl">Resolved</p>
        </div>
      </div>

      {/* Department Overview Banner */}
      {(currentUser?.department || currentUser?.departmentName || currentUser?.departmentId) && (
        <div className="glass-card dept-overview-banner mt-3 mb-3">
          <div className="dept-banner-left">
            <div className="dept-icon-wrapper">
              <Building2 size={24} color="var(--accent-cyan)" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                {currentUser?.email && (
                  <span className="badge-premium badge-p1" style={{ fontSize: '0.75rem' }}>
                    <Mail size={12} style={{ display: 'inline', marginRight: 4 }} /> {currentUser.email}
                  </span>
                )}
              </div>
              <h4 className="dept-banner-title">{deptDetails.name}</h4>
              <p className="dept-banner-desc">{deptDetails.desc}</p>
            </div>
          </div>
          <div className="dept-banner-right">
            <div className="dept-email-pill" title={`Official Department Channel for ${deptDetails.name}`}>
              <Mail size={14} /> <span>{deptDetails.email}</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid-split-2 mt-4">
        {/* Recent Assigned Tickets */}
        <div className="glass-card">
          <div className="card-header-flex">
            <div>
              <span className="badge-premium badge-p3 mb-1">{deptDisplay} Queue</span>
              <h4>Recent Assigned Tickets</h4>
            </div>
            <button className="btn-link" onClick={() => onNavigate('assigned')}>
              View Queue <ArrowRight size={14} />
            </button>
          </div>

          {tickets.length === 0 ? (
            <div className="empty-state">
              <Ticket size={36} className="empty-ico-svg" />
              <p>No tickets currently assigned to your queue.</p>
            </div>
          ) : (
            <div className="recent-list">
              {[...tickets].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5).map(t => (
                <div key={t.ticketId || t.id} className="ticket-item-row" onClick={() => onSelectTicket(t)}>
                  <div className="ticket-info">
                    <div className="ticket-title">{t.title}</div>
                    <div className="ticket-meta">
                      <code className="ticket-num">{t.ticketNumber || `TKT-${t.ticketId || t.id}`}</code>
                      <span>•</span>
                      <span>{t.category?.categoryName || 'General Support'}</span>
                      <span>•</span>
                      <PriorityBadge priority={t.priority} />
                    </div>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Operations & AI Routing Status */}
        <div className="glass-card flex-column">
          <h4 className="mb-4">Engineer Operations</h4>
          <div className="quick-actions-grid">
            <button className="action-tile" onClick={() => onNavigate('assigned')}>
              <div className="tile-ico-box"><Ticket size={20} color="var(--accent-cyan)" /></div>
              <div>
                <div className="tile-title">Assigned Tickets</div>
                <div className="tile-desc">Resolve & update status</div>
              </div>
            </button>

            <button className="action-tile" onClick={() => onNavigate('kb')}>
              <div className="tile-ico-box"><BookOpen size={20} color="#a855f7" /></div>
              <div>
                <div className="tile-title">Manage KB</div>
                <div className="tile-desc">Add & edit articles</div>
              </div>
            </button>

            <button className="action-tile" onClick={() => onNavigate('notifications')}>
              <div className="tile-ico-box"><Bell size={20} color="#ec4899" /></div>
              <div>
                <div className="tile-title">Notifications</div>
                <div className="tile-desc">Ticket activity alerts</div>
              </div>
            </button>

            <button className="action-tile" onClick={() => onNavigate('profile')}>
              <div className="tile-ico-box"><User size={20} color="#10b981" /></div>
              <div>
                <div className="tile-title">My Profile</div>
                <div className="tile-desc">View department details</div>
              </div>
            </button>
          </div>

          <div className="ai-banner mt-4">
            <div className="ai-banner-title">
              <Sparkles size={14} /> AI Triage & Resolution Assistant
            </div>
            <p className="ai-banner-text">
              Tickets are auto-routed to your <strong>{departmentName || 'Support Team'}</strong> based on Sentence-BERT semantic classification and TF-IDF priority prediction.
            </p>
          </div>
        </div>
      </div>

      {/* Module 8 & Proposed Work: AI SLA Breach Risk Monitor */}
      <div className="glass-card mt-4 mb-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={20} style={{ color: '#ef4444' }} />
              <h4 style={{ margin: 0 }}>AI SLA Breach Risk Monitor</h4>
              <span className="badge-premium badge-p1" style={{ fontSize: '0.72rem' }}>
                Sentence-BERT & Deadline Forecaster
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Machine learning models forecast tickets vulnerable to SLA expiration based on historical resolution times, priority tiers, and queue congestion.
            </p>
          </div>
          <button
            className="btn-action"
            onClick={fetchSlaPredictions}
            disabled={loadingPredictions}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={loadingPredictions ? 'spin-anim' : ''} />
            Refresh Predictions
          </button>
        </div>

        {slaPredictions.length === 0 ? (
          <div className="empty-recommendations" style={{ padding: '24px' }}>
            <span className="empty-ico">🛡️</span>
            <p><strong>Zero SLA Breaches Predicted</strong> — All active support tickets are currently progressing within their required service level agreement thresholds.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
            {slaPredictions.slice(0, 4).map((pred, idx) => {
              const matchingTicket = tickets.find(t => (t.ticketId || t.id) === pred.ticketId);
              const riskLevel = pred.riskLevel || (pred.riskScore > 0.7 ? 'CRITICAL' : pred.riskScore > 0.4 ? 'HIGH' : 'MEDIUM');
              const badgeClass = riskLevel === 'CRITICAL' ? 'badge-p1' : riskLevel === 'HIGH' ? 'badge-p2' : 'badge-p3';
              const riskPct = Math.round((pred.riskScore || 0.65) * 100);

              return (
                <div
                  key={idx}
                  className="glass-card"
                  style={{
                    background: 'var(--bg-input)',
                    borderLeft: `4px solid ${riskLevel === 'CRITICAL' ? '#ef4444' : riskLevel === 'HIGH' ? '#f59e0b' : '#38bdf8'}`,
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onClick={() => onSelectTicket(matchingTicket || pred)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <code style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)' }}>
                      {pred.ticketNumber || `TKT-${pred.ticketId}`}
                    </code>
                    <span className={`badge-premium ${badgeClass}`} style={{ fontSize: '0.72rem' }}>
                      {riskLevel} RISK ({riskPct}%)
                    </span>
                  </div>

                  <h5 style={{ margin: '0 0 6px 0', fontSize: '0.92rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                    {pred.title || matchingTicket?.title || 'Support Request'}
                  </h5>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} style={{ color: '#ef4444' }} />
                      <strong>{pred.hoursRemaining != null ? `${pred.hoursRemaining}h remaining` : 'Expiring soon'}</strong>
                    </span>
                    <span>•</span>
                    <PriorityBadge priority={pred.priority || matchingTicket?.priority} />
                  </div>

                  {Array.isArray(pred.factors) && pred.factors.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                      {pred.factors.map((factor, fIdx) => (
                        <span key={fIdx} style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }}>
                          ⚠️ {factor}
                        </span>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Intervene Ticket <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Support Engineer Analytics Suite */}
      <SupportAnalyticsSection tickets={tickets} stats={stats} departmentName={deptDisplay} />

      <style>{dashboardStyles}</style>
    </div>
  );
}

const dashboardStyles = `
  .dashboard-grid-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
  }
  @media (max-width: 900px) {
    .dashboard-grid-stats { grid-template-columns: repeat(2, 1fr); }
  }

  .stat-bubble {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 24px 16px;
  }

  .icon-container {
    width: 46px;
    height: 46px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
  }

  .bg-purple { background: rgba(139, 92, 246, 0.15); border: 1px solid rgba(139, 92, 246, 0.3); }
  .bg-amber { background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); }
  .bg-cyan { background: rgba(6, 182, 212, 0.15); border: 1px solid rgba(6, 182, 212, 0.3); }
  .bg-emerald { background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); }

  .stat-bubble .val {
    font-size: 2.2rem;
    font-weight: 800;
    color: var(--text-primary);
    line-height: 1;
  }

  .stat-bubble .lbl {
    font-size: 0.8rem;
    color: var(--text-muted);
    margin-top: 6px;
  }

  .grid-split-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
  @media (max-width: 900px) {
    .grid-split-2 { grid-template-columns: 1fr; }
  }

  .mt-4 { margin-top: 24px; }
  .mb-1 { margin-bottom: 4px; }
  .mb-4 { margin-bottom: 24px; }
  .mt-3 { margin-top: 16px; }

  .card-header-flex {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .card-header-flex h4 { margin: 0; color: var(--text-primary); }

  .btn-link {
    background: none;
    border: none;
    color: var(--accent-cyan);
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .recent-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 16px;
  }

  .ticket-item-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 14px;
    border-radius: var(--radius-sm);
    background: var(--bg-hover);
    border: 1px solid var(--border);
    cursor: pointer;
    transition: all 0.2s;
  }

  .ticket-item-row:hover {
    border-color: var(--border-glow);
  }

  .ticket-title {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .ticket-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-top: 4px;
  }

  .ticket-num { color: var(--accent-cyan); font-weight: 700; }

  .quick-actions-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-top: 16px;
  }

  .action-tile {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px;
    border-radius: var(--radius-sm);
    background: var(--bg-card);
    border: 1px solid var(--border);
    cursor: pointer;
    text-align: left;
    transition: all 0.2s;
  }

  .action-tile:hover {
    border-color: var(--border-glow);
    background: var(--bg-hover);
    transform: translateY(-1px);
  }

  .tile-ico-box {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.04);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .tile-title {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .tile-desc {
    font-size: 0.72rem;
    color: var(--text-muted);
  }

  .ai-banner {
    padding: 16px;
    border-radius: var(--radius-sm);
    background: rgba(139, 92, 246, 0.08);
    border: 1px solid rgba(139, 92, 246, 0.25);
  }

  .ai-banner-title {
    font-size: 0.72rem;
    font-weight: 800;
    color: var(--accent-purple);
    letter-spacing: 0.06em;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .ai-banner-text {
    font-size: 0.8rem;
    color: var(--text-secondary);
    margin: 0;
    line-height: 1.5;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;
    color: var(--text-muted);
  }

  .empty-ico-svg {
    color: var(--text-muted);
    margin-bottom: 12px;
  }

  .flex-column {
    display: flex;
    flex-direction: column;
  }
`;
