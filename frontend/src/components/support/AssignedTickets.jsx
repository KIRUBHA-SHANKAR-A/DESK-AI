import React, { useState, useMemo } from 'react';
import { Filter, FolderOpen, Search, CheckCircle2, Clock, Copy, Layers, ListFilter, AlertTriangle, ArrowRight, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { StatusBadge, PriorityBadge } from '../employee/BadgeComponents';
import { formatDate } from '../../utils/dateUtils';

// Utility helper to calculate text similarity between two strings
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  const s1 = str1.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  const s2 = str2.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  if (s1 === s2) return 1.0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.85;

  const words1 = new Set(s1.split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(s2.split(/\s+/).filter(w => w.length > 2));
  if (words1.size === 0 || words2.size === 0) return 0;

  let intersection = 0;
  for (const w of words1) {
    if (words2.has(w)) intersection++;
  }
  const union = new Set([...words1, ...words2]).size;
  return intersection / union;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export default function AssignedTickets({ tickets, currentUser, authHeaders, onSelectTicket, onTicketsUpdated, onRefresh }) {
  const [viewMode, setViewMode] = useState('queue'); // 'queue' | 'duplicates'
  const [scopeFilter, setScopeFilter] = useState('ALL'); // 'ALL' | 'OPEN_QUEUE' | 'MY_ASSIGNED'
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedClusters, setExpandedClusters] = useState({});
  const [claimingId, setClaimingId] = useState(null);

  const currentUserId = currentUser?.userId || currentUser?.id;
  const currentUserEmail = (currentUser?.email || '').toLowerCase();

  const isAssignedToMe = (t) => {
    if (!t.assignedTo) return false;
    const aId = t.assignedTo.userId || t.assignedTo.id;
    const aEmail = (t.assignedTo.email || '').toLowerCase();
    return (currentUserId && aId === currentUserId) || (currentUserEmail && aEmail === currentUserEmail);
  };

  const isUnassignedOpen = (t) => {
    const st = (t.status || '').toUpperCase();
    return st === 'OPEN' || !t.assignedTo;
  };

  const handleClaimTicket = async (t, e) => {
    e?.stopPropagation();
    const tId = t.ticketId || t.id;
    setClaimingId(tId);
    try {
      const headers = authHeaders ? authHeaders() : { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` };
      const res = await fetch(`${API_BASE_URL}/tickets/${tId}/assign`, {
        method: 'PUT',
        headers
      });
      if (res.ok) {
        const updated = await res.json();
        if (onTicketsUpdated) {
          onTicketsUpdated(prev => prev.map(item => (item.ticketId || item.id) === tId ? updated : item));
        }
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to claim ticket.');
      }
    } catch (err) {
      alert('Error claiming ticket: ' + err.message);
    } finally {
      setClaimingId(null);
    }
  };

  // 1. Group tickets into Duplicate Clusters
  const duplicateClusters = useMemo(() => {
    const clusters = [];
    const assignedTicketIds = new Set();

    // Sort by createdAt ascending (earliest is master ticket)
    const sorted = [...tickets].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateA - dateB;
    });

    for (let i = 0; i < sorted.length; i++) {
      const t1 = sorted[i];
      const t1Id = t1.ticketId || t1.id;
      if (assignedTicketIds.has(t1Id)) continue;

      const group = [t1];
      assignedTicketIds.add(t1Id);

      for (let j = i + 1; j < sorted.length; j++) {
        const t2 = sorted[j];
        const t2Id = t2.ticketId || t2.id;
        if (assignedTicketIds.has(t2Id)) continue;

        // Check if t2 is a duplicate of t1
        const titleSim = calculateSimilarity(t1.title, t2.title);
        const descSim = calculateSimilarity(t1.description, t2.description);
        const maxSim = Math.max(titleSim, descSim);
        const sameCategory = (t1.category?.categoryName || t1.aiCategory) === (t2.category?.categoryName || t2.aiCategory);
        const hasDupScore = (t2.duplicateScore && t2.duplicateScore >= 0.35) || (t1.duplicateScore && t1.duplicateScore >= 0.35);

        if (maxSim >= 0.35 || (sameCategory && maxSim >= 0.25) || (hasDupScore && sameCategory)) {
          group.push({ ...t2, matchSimilarity: Math.max(maxSim, t2.duplicateScore || 0.5) });
          assignedTicketIds.add(t2Id);
        }
      }

      clusters.push({
        id: `cluster-${t1Id}`,
        masterTicket: t1,
        duplicates: group.slice(1),
        allTickets: group,
        isDuplicateGroup: group.length > 1,
        totalCount: group.length,
        category: t1.category?.categoryName || t1.aiCategory || 'General Support',
      });
    }

    return clusters;
  }, [tickets]);

  // Lookup map for fast duplicate info in flat table
  const ticketClusterInfoMap = useMemo(() => {
    const map = {};
    for (const c of duplicateClusters) {
      if (c.isDuplicateGroup) {
        const masterId = c.masterTicket.ticketId || c.masterTicket.id;
        map[masterId] = { isMaster: true, dupCount: c.duplicates.length, clusterId: c.id };
        for (const d of c.duplicates) {
          const dId = d.ticketId || d.id;
          map[dId] = { isDuplicate: true, masterTicketNumber: c.masterTicket.ticketNumber || `TKT-${masterId}`, clusterId: c.id };
        }
      }
    }
    return map;
  }, [duplicateClusters]);

  const toggleClusterExpand = (clusterId) => {
    setExpandedClusters(prev => ({ ...prev, [clusterId]: !prev[clusterId] }));
  };

  const filteredTickets = tickets.filter(t => {
    if (scopeFilter === 'OPEN_QUEUE' && !isUnassignedOpen(t)) return false;
    if (scopeFilter === 'MY_ASSIGNED' && !isAssignedToMe(t)) return false;

    const matchStatus = statusFilter === 'ALL' || (t.status || '').toUpperCase() === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchSearch = !searchQuery ||
      (t.title && t.title.toLowerCase().includes(q)) ||
      (t.ticketNumber && t.ticketNumber.toLowerCase().includes(q)) ||
      (t.description && t.description.toLowerCase().includes(q));
    return matchStatus && matchSearch;
  }).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  const allCount = tickets.length;
  const openQueueCount = tickets.filter(isUnassignedOpen).length;
  const myAssignedCount = tickets.filter(isAssignedToMe).length;

  const filteredClusters = duplicateClusters.filter(c => {
    if (viewMode === 'duplicates' && !c.isDuplicateGroup) return false;
    const matchStatus = statusFilter === 'ALL' || c.allTickets.some(t => (t.status || '').toUpperCase() === statusFilter);
    const q = searchQuery.toLowerCase();
    const matchSearch = !searchQuery ||
      c.allTickets.some(t => 
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.ticketNumber && t.ticketNumber.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    return matchStatus && matchSearch;
  }).sort((a, b) => new Date(b.master?.createdAt || 0) - new Date(a.master?.createdAt || 0));

  const duplicateOnlyClusters = duplicateClusters.filter(c => c.isDuplicateGroup);
  const totalGroupedTickets = duplicateOnlyClusters.reduce((acc, c) => acc + c.totalCount, 0);

  return (
    <div className="tab-fade">
      <div className="glass-card">
        {/* Header with View Mode Switcher */}
        <div className="card-header-flex mb-4">
          <div>
            <div className="flex-align-center gap-2">
              <h4>📋 Department Support Queue</h4>
              {duplicateOnlyClusters.length > 0 && (
                <span className="badge-premium badge-p2" style={{ fontSize: '0.72rem' }}>
                  <Copy size={12} style={{ marginRight: 4 }} /> {duplicateOnlyClusters.length} Duplicate Group{duplicateOnlyClusters.length > 1 ? 's' : ''} ({totalGroupedTickets} tickets)
                </span>
              )}
            </div>
            <p className="text-muted-xs">View department open tickets, claim tickets to your queue, and solve them with AI assistance</p>
          </div>

          {/* View Mode Toggle Switcher */}
          <div className="view-mode-tabs">
            <button
              className={`view-tab-btn ${viewMode === 'queue' ? 'active' : ''}`}
              onClick={() => setViewMode('queue')}
            >
              <ListFilter size={14} />
              <span>Standard Queue ({tickets.length})</span>
            </button>
            <button
              className={`view-tab-btn ${viewMode === 'duplicates' ? 'active' : ''}`}
              onClick={() => setViewMode('duplicates')}
            >
              <Layers size={14} />
              <span>Grouped Duplicates ({duplicateOnlyClusters.length})</span>
              {duplicateOnlyClusters.length > 0 && (
                <span className="badge-count-pill">{totalGroupedTickets}</span>
              )}
            </button>
          </div>
        </div>

        {/* Scope Selector: All Department Queue | Open to Claim | My Active Assignments */}
        <div className="queue-scope-selector mb-3" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            className={`filter-pill ${scopeFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setScopeFilter('ALL')}
            style={{ fontWeight: 600, padding: '7px 14px' }}
          >
            🏢 All Department Tickets ({allCount})
          </button>
          <button
            className={`filter-pill ${scopeFilter === 'OPEN_QUEUE' ? 'active' : ''}`}
            onClick={() => setScopeFilter('OPEN_QUEUE')}
            style={{ fontWeight: 600, padding: '7px 14px', borderColor: scopeFilter === 'OPEN_QUEUE' ? 'var(--accent-cyan)' : undefined }}
          >
            🎯 Open to Claim ({openQueueCount})
          </button>
          <button
            className={`filter-pill ${scopeFilter === 'MY_ASSIGNED' ? 'active' : ''}`}
            onClick={() => setScopeFilter('MY_ASSIGNED')}
            style={{ fontWeight: 600, padding: '7px 14px', borderColor: scopeFilter === 'MY_ASSIGNED' ? 'var(--accent-purple)' : undefined }}
          >
            👤 My Assigned Tickets ({myAssignedCount})
          </button>
        </div>

        {/* Filter Bar */}
        <div className="filter-and-search-row mb-4">
          <div className="filter-pill-group">
            <Filter size={14} style={{ color: 'var(--text-muted)', marginRight: 4 }} />
            {['ALL', 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'PENDING', 'SOLVED', 'CLOSED'].map(key => (
              <button
                key={key}
                className={`filter-pill ${statusFilter === key ? 'active' : ''}`}
                onClick={() => setStatusFilter(key)}
              >
                {key.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="search-bar-box">
            <Search size={16} className="search-ico-svg" />
            <input
              type="text"
              className="input-premium search-input-padded"
              placeholder="Search by ticket ID, title, symptoms, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* VIEW 1: Standard Table Queue */}
        {viewMode === 'queue' && (
          filteredTickets.length === 0 ? (
            <div className="empty-state">
              <FolderOpen size={36} className="empty-ico-svg" />
              <p>No tickets match the selected filters.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table-premium">
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Title / Subject</th>
                    <th>Grouping</th>
                    <th>Submitted By</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map(t => {
                    const tId = t.ticketId || t.id;
                    const clusterInfo = ticketClusterInfoMap[tId];
                    const tStatus = (t.status || 'OPEN').toUpperCase();
                    return (
                      <tr key={tId} onClick={() => onSelectTicket(t)} className="clickable-row">
                        <td><code className="code-accent">{t.ticketNumber || `TKT-${tId}`}</code></td>
                        <td className="title-bold">{t.title}</td>
                        <td>
                          {clusterInfo?.isMaster ? (
                            <span className="badge-master-tag" title={`${clusterInfo.dupCount} duplicate ticket(s) grouped with this primary ticket`}>
                              👑 Master ({clusterInfo.dupCount} dups)
                            </span>
                          ) : clusterInfo?.isDuplicate ? (
                            <span className="badge-dup-tag" title={`Duplicate of ${clusterInfo.masterTicketNumber}`}>
                              ⚠️ Dup of {clusterInfo.masterTicketNumber}
                            </span>
                          ) : (
                            <span className="text-muted-xs">—</span>
                          )}
                        </td>
                        <td>{t.createdBy?.name || 'Employee'}</td>
                        <td>{t.category?.categoryName || t.aiCategory || 'General Support'}</td>
                        <td><PriorityBadge priority={t.priority} /></td>
                        <td><StatusBadge status={t.status} /></td>
                        <td>{formatDate(t.createdAt)}</td>
                        <td>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            {tStatus === 'OPEN' ? (
                              <>
                                <button
                                  className="btn-action btn-action-primary"
                                  onClick={(e) => handleClaimTicket(t, e)}
                                  disabled={claimingId === tId}
                                  title="Take ownership of this ticket"
                                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                >
                                  {claimingId === tId ? 'Taking...' : '🎯 Take Ticket'}
                                </button>
                                <button
                                  className="btn-action btn-approve"
                                  onClick={(e) => { e.stopPropagation(); onSelectTicket(t); }}
                                  title="View ticket details"
                                  style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                                >
                                  View
                                </button>
                              </>
                            ) : (
                              <button
                                className={`btn-action ${['IN_PROGRESS', 'PENDING'].includes(tStatus) ? 'btn-action-primary' : 'btn-approve'}`}
                                onClick={(e) => { e.stopPropagation(); onSelectTicket(t); }}
                              >
                                {tStatus === 'ASSIGNED' ? '▶️ Start Work' :
                                 tStatus === 'IN_PROGRESS' ? '✅ Solve Ticket' :
                                 tStatus === 'PENDING' ? '⏸️ Resume/Solve' :
                                 tStatus === 'SOLVED' ? '👁️ Solved' :
                                 tStatus === 'CLOSED' ? '🔒 Archived' : 'Manage'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* VIEW 2: Grouped Duplicate Clusters */}
        {viewMode === 'duplicates' && (
          filteredClusters.length === 0 ? (
            <div className="empty-state">
              <Sparkles size={36} className="empty-ico-svg" style={{ color: 'var(--accent-purple)' }} />
              <p>No duplicate ticket clusters found. All current tickets are unique!</p>
            </div>
          ) : (
            <div className="clusters-container">
              {filteredClusters.map((cluster) => {
                const master = cluster.masterTicket;
                const masterId = master.ticketId || master.id;
                const isExpanded = expandedClusters[cluster.id] !== false; // Default expanded

                return (
                  <div key={cluster.id} className="cluster-card">
                    {/* Cluster Primary Header */}
                    <div className="cluster-header" onClick={() => toggleClusterExpand(cluster.id)}>
                      <div className="cluster-header-left">
                        <div className="cluster-badge-row">
                          <span className="badge-primary-cluster">👑 Master Ticket: {master.ticketNumber || `TKT-${masterId}`}</span>
                          <span className="badge-cluster-count">
                            <Layers size={12} /> {cluster.totalCount} Tickets in Cluster ({cluster.duplicates.length} Duplicates)
                          </span>
                          <span className="badge-category-tag">{cluster.category}</span>
                        </div>
                        <h4 className="cluster-title">{master.title}</h4>
                        <p className="cluster-desc">{master.description}</p>
                      </div>

                      <div className="cluster-header-right">
                        <div className="cluster-meta-block">
                          <PriorityBadge priority={master.priority} />
                          <StatusBadge status={master.status} />
                        </div>
                        <div className="cluster-actions">
                          <button
                            className="btn-action-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectTicket(master);
                            }}
                          >
                            Manage Master
                          </button>
                          <button className="expand-chevron-btn">
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Duplicate Child Tickets List */}
                    {isExpanded && (
                      <div className="cluster-body">
                        <div className="cluster-sub-title">
                          <AlertTriangle size={14} color="#f59e0b" />
                          <span>Identified Duplicate Tickets ({cluster.duplicates.length})</span>
                        </div>

                        <div className="duplicate-tickets-list">
                          {cluster.duplicates.map((dup) => {
                            const dupId = dup.ticketId || dup.id;
                            const sim = dup.matchSimilarity || 0.85;
                            return (
                              <div
                                key={dupId}
                                className="duplicate-ticket-row clickable-row"
                                onClick={() => onSelectTicket(dup)}
                              >
                                <div className="dup-row-left">
                                  <span className="dup-match-badge">
                                    {Math.round(sim * 100)}% Match
                                  </span>
                                  <code className="code-accent">{dup.ticketNumber || `TKT-${dupId}`}</code>
                                  <span className="dup-title">{dup.title}</span>
                                </div>

                                <div className="dup-row-right">
                                  <span className="dup-user">{dup.createdBy?.name || 'Employee'}</span>
                                  <StatusBadge status={dup.status} />
                                  <span className="text-muted-xs">
                                    {formatDate(dup.createdAt)}
                                  </span>
                                  <button
                                    className="btn-action"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onSelectTicket(dup);
                                    }}
                                  >
                                    View <ArrowRight size={12} style={{ marginLeft: 2 }} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      <style>{`
        .card-header-flex {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }
        .text-muted-xs {
          font-size: 0.78rem;
          color: var(--text-muted);
          margin-top: 2px;
        }
        .flex-align-center {
          display: flex;
          align-items: center;
        }
        .gap-2 { gap: 8px; }

        /* View Mode Switcher */
        .view-mode-tabs {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--bg-hover);
          padding: 4px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
        }
        .view-tab-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 0.78rem;
          font-weight: 600;
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s;
        }
        .view-tab-btn.active {
          background: var(--bg-card);
          color: var(--text-primary);
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          border: 1px solid var(--border);
        }
        .badge-count-pill {
          padding: 1px 6px;
          border-radius: 99px;
          background: var(--accent-purple);
          color: #fff;
          font-size: 0.68rem;
          font-weight: 700;
        }

        /* Filter and Search */
        .filter-and-search-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
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
          background: rgba(139, 92, 246, 0.18);
          border-color: var(--accent-purple);
          color: var(--text-primary);
        }
        .search-bar-box {
          position: relative;
          display: flex;
          align-items: center;
          flex: 1;
          min-width: 260px;
          max-width: 450px;
        }
        .search-ico-svg {
          position: absolute;
          left: 14px;
          color: var(--text-muted);
        }
        .search-input-padded {
          padding-left: 42px;
          width: 100%;
        }

        /* Table & Badges */
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
          color: var(--text-primary);
        }
        .clickable-row {
          cursor: pointer;
          transition: background 0.2s;
        }
        .clickable-row:hover {
          background: var(--bg-hover);
        }
        .code-accent {
          color: var(--accent-cyan);
          font-weight: 700;
        }
        .title-bold {
          font-weight: 600;
          color: var(--text-primary);
        }
        .badge-master-tag {
          display: inline-flex;
          align-items: center;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 0.72rem;
          font-weight: 700;
          background: rgba(139, 92, 246, 0.15);
          color: var(--accent-purple);
          border: 1px solid rgba(139, 92, 246, 0.35);
        }
        .badge-dup-tag {
          display: inline-flex;
          align-items: center;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 0.72rem;
          font-weight: 600;
          background: rgba(245, 158, 11, 0.12);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }
        .btn-action {
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          font-size: 0.78rem;
          font-weight: 600;
          border: 1px solid var(--border);
          background: var(--bg-hover);
          color: var(--text-primary);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          transition: all 0.2s;
        }
        .btn-action:hover {
          background: rgba(6, 182, 212, 0.15);
          border-color: var(--accent-cyan);
          color: var(--accent-cyan);
        }
        .btn-action-primary {
          padding: 6px 14px;
          border-radius: var(--radius-sm);
          font-size: 0.78rem;
          font-weight: 700;
          background: var(--accent-cyan);
          color: #000;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-action-primary:hover {
          filter: brightness(1.15);
          transform: translateY(-1px);
        }

        /* Grouped Clusters View */
        .clusters-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .cluster-card {
          background: var(--bg-hover);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          overflow: hidden;
          transition: all 0.2s;
        }
        .cluster-card:hover {
          border-color: rgba(139, 92, 246, 0.4);
        }
        .cluster-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 16px;
          cursor: pointer;
          gap: 16px;
          flex-wrap: wrap;
          background: var(--bg-card);
        }
        .cluster-header-left {
          flex: 1;
          min-width: 280px;
        }
        .cluster-badge-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }
        .badge-primary-cluster {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.72rem;
          font-weight: 700;
          background: rgba(139, 92, 246, 0.2);
          color: var(--accent-purple);
          border: 1px solid rgba(139, 92, 246, 0.4);
        }
        .badge-cluster-count {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.72rem;
          font-weight: 700;
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.35);
        }
        .badge-category-tag {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.72rem;
          font-weight: 600;
          background: var(--bg-hover);
          color: var(--text-muted);
          border: 1px solid var(--border);
        }
        .cluster-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 6px 0;
        }
        .cluster-desc {
          font-size: 0.82rem;
          color: var(--text-secondary);
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .cluster-header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .cluster-meta-block {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
        }
        .cluster-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .expand-chevron-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 4px;
        }

        /* Cluster Body & Duplicate List */
        .cluster-body {
          padding: 14px 16px;
          border-top: 1px solid var(--border);
          background: rgba(0, 0, 0, 0.15);
        }
        .cluster-sub-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.78rem;
          font-weight: 700;
          color: #f59e0b;
          margin-bottom: 10px;
        }
        .duplicate-tickets-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .duplicate-ticket-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          border-radius: 6px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          gap: 12px;
          flex-wrap: wrap;
        }
        .duplicate-ticket-row:hover {
          border-color: var(--accent-cyan);
        }
        .dup-row-left {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          min-width: 240px;
        }
        .dup-match-badge {
          padding: 2px 8px;
          border-radius: 99px;
          font-size: 0.7rem;
          font-weight: 700;
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.35);
          white-space: nowrap;
        }
        .dup-title {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-primary);
        }
        .dup-row-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .dup-user {
          font-size: 0.78rem;
          color: var(--text-muted);
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
