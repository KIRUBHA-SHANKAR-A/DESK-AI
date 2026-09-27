import React from 'react';
import {
  Ticket, PlusCircle, BookOpen, Bell, FolderOpen, Clock,
  CheckCircle2, Sparkles, ArrowRight, Building2, Mail, BarChart3
} from 'lucide-react';
import { StatusBadge } from './BadgeComponents';
import { getDepartmentName, getDepartmentDetails } from '../common/TopHeaderActions';
import { EmployeeAnalyticsSection } from '../common/DashboardAnalytics';

export default function EmployeeDashboard({ stats, tickets, unreadCount, currentUser, onNavigate, onSelectTicket }) {
  const deptDetails = getDepartmentDetails(currentUser);
  const deptDisplay = deptDetails.name || 'Corporate Staff';

  return (
    <div className="tab-fade">
      {/* Stats Row */}
      <div className="dashboard-grid-stats">
        <div className="glass-card stat-bubble">
          <div className="accent-bg icon-container bg-purple">
            <Ticket size={22} color="#8b5cf6" />
          </div>
          <div className="val">{stats.total}</div>
          <p className="lbl">Total Requests</p>
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
            <Clock size={22} color="#06b6d4" />
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
        {/* Recent Tickets */}
        <div className="glass-card">
          <div className="card-header-flex">
            <div>
              <span className="badge-premium badge-p3 mb-1">{(currentUser?.department || currentUser?.departmentName) ? `${deptDisplay} Workspace` : 'Workspace'}</span>
              <h4>Recent Tickets</h4>
            </div>
            <button className="btn-link" onClick={() => onNavigate('mytickets')}>
              View All <ArrowRight size={14} />
            </button>
          </div>

          {tickets.length === 0 ? (
            <div className="empty-state">
              <Ticket size={36} className="empty-ico-svg" />
              <p>No active support tickets found. Create your first request!</p>
              <button className="btn-premium mt-3" onClick={() => onNavigate('create')}>
                <PlusCircle size={16} /> Create New Ticket
              </button>
            </div>
          ) : (
            <div className="recent-list">
              {[...tickets].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5).map(t => (
                <div key={t.ticketId || t.id} className="ticket-item-row" onClick={() => onSelectTicket(t)}>
                  <div className="ticket-info">
                    <div className="ticket-title">{t.title}</div>
                    <div className="ticket-meta">
                      <code className="ticket-num">{t.ticketNumber || `TKT-${t.ticketId}`}</code>
                      <span>•</span>
                      <span>{t.category?.categoryName || 'General Support'}</span>
                    </div>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions & AI Banner */}
        <div className="glass-card flex-column">
          <h4 className="mb-4">Quick Operations</h4>
          <div className="quick-actions-grid">
            <button className="action-tile" onClick={() => onNavigate('create')}>
              <div className="tile-ico-box"><PlusCircle size={20} color="#06b6d4" /></div>
              <div>
                <div className="tile-title">Create Ticket</div>
                <div className="tile-desc">Submit new issue to AI router</div>
              </div>
            </button>

            <button className="action-tile" onClick={() => onNavigate('mytickets')}>
              <div className="tile-ico-box"><Ticket size={20} color="#3b82f6" /></div>
              <div>
                <div className="tile-title">My Tickets</div>
                <div className="tile-desc">Track status & updates</div>
              </div>
            </button>

            <button className="action-tile" onClick={() => onNavigate('kb')}>
              <div className="tile-ico-box"><BookOpen size={20} color="#8b5cf6" /></div>
              <div>
                <div className="tile-title">Knowledge Base</div>
                <div className="tile-desc">Search instant AI solutions</div>
              </div>
            </button>

            <button className="action-tile" onClick={() => onNavigate('notifications')}>
              <div className="tile-ico-box"><Bell size={20} color="#ec4899" /></div>
              <div>
                <div className="tile-title">Notifications</div>
                <div className="tile-desc">{unreadCount} unread messages</div>
              </div>
            </button>
          </div>

          <div className="ai-banner mt-4">
            <div className="ai-banner-title">
              <Sparkles size={14} /> SENTENCE-BERT AI ENGINE
            </div>
            <p className="ai-banner-text">
              DESK AI monitors ticket content to detect semantic duplicates, auto-assign categories, and recommend verified solutions.
            </p>
          </div>
        </div>
      </div>

      {/* Analytics Suite */}
      <EmployeeAnalyticsSection tickets={tickets} stats={stats} />

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

  .mt-4 { margin-top: 24px; }
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
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid var(--border);
    cursor: pointer;
    transition: all 0.2s;
  }

  .ticket-item-row:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: var(--border-glow);
  }

  .ticket-title {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .ticket-meta {
    display: flex;
    gap: 8px;
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-top: 4px;
  }

  .ticket-num { color: var(--accent-cyan); }

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
    border-color: var(--accent-cyan);
    background: rgba(6, 182, 212, 0.05);
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
    background: rgba(99, 102, 241, 0.08);
    border: 1px solid rgba(99, 102, 241, 0.25);
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
