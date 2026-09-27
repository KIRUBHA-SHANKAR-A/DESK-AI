import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Filter, RefreshCw, Clock, User, Activity } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export default function AdminAuditLogs({ authHeaders }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [filterType]);

  const getHeaders = () => {
    const base = authHeaders ? (typeof authHeaders === 'function' ? authHeaders() : authHeaders) : {};
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...base
    };
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const query = filterType ? `?entityType=${filterType}` : '';
      const res = await fetch(`${API_BASE_URL}/audit-logs${query}`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (log.action || '').toLowerCase().includes(term) ||
      (log.performedBy || '').toLowerCase().includes(term) ||
      (log.details || '').toLowerCase().includes(term) ||
      (log.entityType || '').toLowerCase().includes(term)
    );
  });

  const getActionBadgeClass = (action = '') => {
    const act = action.toUpperCase();
    if (act.includes('DELETE') || act.includes('REJECT') || act.includes('BREACH')) return 'badge-p1'; // Red
    if (act.includes('UPDATE') || act.includes('MERGE') || act.includes('ASSIGN')) return 'badge-p2'; // Orange/amber
    if (act.includes('CREATE') || act.includes('APPROVE') || act.includes('RESOLVE') || act.includes('RESTORE')) return 'badge-p4'; // Green
    return 'badge-p3'; // Blue
  };

  return (
    <div className="tab-fade">
      {/* Header Banner */}
      <div className="glass-card mb-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span className="badge-premium badge-p1 mb-1">Module 10 Security</span>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={24} style={{ color: 'var(--accent-cyan)' }} />
              System Audit & Compliance Trail
            </h3>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Immutable chronological record of administrator events, security approvals, ticket lifecycle transitions, and configuration changes.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="btn-action"
              onClick={fetchLogs}
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={14} className={loading ? 'spin-anim' : ''} />
              Refresh Logs
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '220px', position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-premium"
              style={{ width: '100%', paddingLeft: '34px' }}
              placeholder="Search actions, operators, or details..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ minWidth: '180px' }}>
            <select
              className="input-premium"
              style={{ width: '100%', cursor: 'pointer' }}
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
            >
              <option value="">All Entity Scopes</option>
              <option value="TICKET">Tickets (TICKET)</option>
              <option value="COMMENT">Comments & Notes (COMMENT)</option>
              <option value="SYSTEM">System Settings (SYSTEM)</option>
              <option value="USER">User Clearance (USER)</option>
              <option value="KB">Knowledge Base (KB)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-card">
        {loading ? (
          <div className="empty-state">
            <RefreshCw size={36} className="spin-anim empty-ico-svg" />
            <p>Fetching immutable audit trail...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="empty-state">
            <ShieldCheck size={40} className="empty-ico-svg" />
            <p>No audit entries match the selected criteria.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table-premium">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action Event</th>
                  <th>Entity Scope</th>
                  <th>Target ID</th>
                  <th>Operator</th>
                  <th>Security Role</th>
                  <th>Audit Event Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        <Clock size={12} style={{ color: 'var(--accent-cyan)' }} />
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                      </div>
                    </td>
                    <td>
                      <span className={`badge-premium ${getActionBadgeClass(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td><code>{log.entityType || 'SYSTEM'}</code></td>
                    <td>
                      <span style={{ fontSize: '0.82rem', color: 'var(--accent-blue)', fontWeight: 600 }}>
                        {log.entityId ? `#${log.entityId}` : '—'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                        <User size={13} style={{ color: 'var(--accent-cyan)' }} />
                        {log.performedBy || 'SYSTEM'}
                      </div>
                    </td>
                    <td>
                      <span className="badge-premium badge-p2" style={{ fontSize: '0.72rem' }}>
                        {log.performedByRole || 'SYSTEM'}
                      </span>
                    </td>
                    <td>
                      <div style={{ maxWidth: '380px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {log.details || 'No additional details.'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .spin-anim {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
