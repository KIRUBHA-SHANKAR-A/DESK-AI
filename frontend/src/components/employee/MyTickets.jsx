import React, { useState } from 'react';
import { Filter, FolderOpen } from 'lucide-react';
import { StatusBadge, PriorityBadge } from './BadgeComponents';
import { formatDate } from '../../utils/dateUtils';

export default function MyTickets({ tickets, onSelectTicket }) {
  const [ticketFilter, setTicketFilter] = useState('ALL');

  const filteredTickets = (ticketFilter === 'ALL'
    ? [...tickets]
    : tickets.filter(t => (t.status || '').toUpperCase() === ticketFilter)
  ).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  return (
    <div className="tab-fade">
      <div className="glass-card">
        <div className="card-header-flex mb-4">
          <h4>My Support Requests</h4>
          <div className="filter-pill-group">
            <Filter size={14} style={{ color: 'var(--text-muted)', marginRight: 4 }} />
            {['ALL', 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'PENDING', 'SOLVED', 'CLOSED'].map(statusKey => (
              <button
                key={statusKey}
                className={`filter-pill ${ticketFilter === statusKey ? 'active' : ''}`}
                onClick={() => setTicketFilter(statusKey)}
              >
                {statusKey.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {filteredTickets.length === 0 ? (
          <div className="empty-state">
            <FolderOpen size={36} className="empty-ico-svg" />
            <p>No tickets match the selected status filter.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table-premium">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Subject / Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map(t => (
                  <tr key={t.ticketId || t.id} onClick={() => onSelectTicket(t)} className="clickable-row">
                    <td><code className="code-accent">{t.ticketNumber || `TKT-${t.ticketId || t.id}`}</code></td>
                    <td className="title-bold">{t.title}</td>
                    <td>{t.category?.categoryName || 'General IT'}</td>
                    <td><PriorityBadge priority={t.priority} /></td>
                    <td><StatusBadge status={t.status} /></td>
                    <td>{formatDate(t.createdAt)}</td>
                    <td>
                      <button
                        className="btn-action btn-approve"
                        onClick={(e) => { e.stopPropagation(); onSelectTicket(t); }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .card-header-flex {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .filter-pill-group {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .filter-pill {
          padding: 4px 12px;
          border-radius: 99px;
          font-size: 0.72rem;
          font-weight: 600;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s;
        }
        .filter-pill.active {
          background: rgba(99, 102, 241, 0.2);
          border-color: var(--accent-purple);
          color: var(--accent-cyan);
        }
        .table-wrapper {
          overflow-x: auto;
        }
        .table-premium {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .table-premium th {
          padding: 12px 14px;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-muted);
          border-bottom: 1px solid var(--border);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .table-premium td {
          padding: 14px;
          border-bottom: 1px solid var(--border);
          font-size: 0.88rem;
        }
        .clickable-row {
          cursor: pointer;
          transition: background 0.2s;
        }
        .clickable-row:hover {
          background: rgba(255, 255, 255, 0.04);
        }
        .code-accent {
          color: var(--accent-cyan);
          font-weight: 700;
        }
        .title-bold {
          font-weight: 600;
          color: var(--text-primary);
        }
        .btn-action {
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          font-size: 0.78rem;
          font-weight: 600;
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-action:hover {
          background: rgba(6, 182, 212, 0.15);
          border-color: var(--accent-cyan);
          color: var(--accent-cyan);
        }
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px 20px;
          color: var(--text-muted);
        }
        .empty-ico-svg {
          margin-bottom: 12px;
        }
        .mb-4 { margin-bottom: 24px; }
      `}</style>
    </div>
  );
}
