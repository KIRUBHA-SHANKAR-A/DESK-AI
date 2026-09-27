import React, { useState, useMemo } from 'react';
import {
  FileText, Download, Printer, CheckCircle2, AlertTriangle,
  Clock, TrendingUp, Users, Tag, BarChart3, Filter, Award
} from 'lucide-react';

export default function AdminReports({ tickets = [], users = [] }) {
  const [timeFilter, setTimeFilter] = useState('ALL'); // ALL, MONTH, WEEK

  // Filter tickets by timeframe
  const filteredTickets = useMemo(() => {
    if (timeFilter === 'ALL') return tickets;
    const now = new Date();
    const daysAgo = timeFilter === 'WEEK' ? 7 : 30;
    const cutoff = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    return tickets.filter(t => {
      const created = t.createdAt ? new Date(t.createdAt) : null;
      return created ? created >= cutoff : true;
    });
  }, [tickets, timeFilter]);

  // Compute metrics
  const totalCount = filteredTickets.length;
  const openCount = filteredTickets.filter(t => {
    const s = (t.status || '').toUpperCase();
    return s === 'OPEN' || s === 'ASSIGNED' || s === 'IN_PROGRESS' || s === 'PENDING';
  }).length;

  const resolvedCount = filteredTickets.filter(t => {
    const s = (t.status || '').toUpperCase();
    return s === 'RESOLVED' || s === 'CLOSED' || s === 'SOLVED';
  }).length;

  const breachedCount = filteredTickets.filter(t =>
    t.slaBreached === true || (t.priority === 'CRITICAL' && t.status !== 'CLOSED' && t.status !== 'RESOLVED')
  ).length;

  const slaMetCount = Math.max(0, totalCount - breachedCount);
  const slaComplianceRate = totalCount > 0 ? Math.round((slaMetCount / totalCount) * 100) : 100;

  // Category breakdown
  const categoryStats = useMemo(() => {
    const map = {};
    filteredTickets.forEach(t => {
      const cat = t.category?.categoryName || t.aiCategory || 'General Support';
      map[cat] = (map[cat] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, count]) => ({
        name,
        count,
        percent: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredTickets, totalCount]);

  // SLA breakdown by Priority
  const prioritySlaStats = useMemo(() => {
    const priorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    return priorities.map(pri => {
      const list = filteredTickets.filter(t => (t.priority || 'LOW').toUpperCase() === pri);
      const breached = list.filter(t => t.slaBreached).length;
      const met = list.length - breached;
      const rate = list.length > 0 ? Math.round((met / list.length) * 100) : 100;
      return {
        priority: pri,
        total: list.length,
        met,
        breached,
        complianceRate: rate,
        targetHours: pri === 'CRITICAL' ? '4h' : pri === 'HIGH' ? '12h' : pri === 'MEDIUM' ? '24h' : '48h'
      };
    });
  }, [filteredTickets]);

  // Engineer Performance
  const engineerPerformance = useMemo(() => {
    const engineers = users.filter(u => {
      const r = (u.roleName || u.role || '').toUpperCase();
      return r.includes('ENGINEER') || r.includes('SUPPORT');
    });

    return engineers.map(eng => {
      const assigned = filteredTickets.filter(t =>
        (t.assignedTo?.userId || t.assignedTo?.id) === (eng.userId || eng.id) ||
        (t.assignedEngineerEmail || '').toLowerCase() === (eng.email || '').toLowerCase()
      );
      const resolved = assigned.filter(t => {
        const s = (t.status || '').toUpperCase();
        return s === 'RESOLVED' || s === 'CLOSED';
      }).length;
      const breached = assigned.filter(t => t.slaBreached).length;
      const rate = assigned.length > 0 ? Math.round((resolved / assigned.length) * 100) : 0;

      return {
        name: eng.name || 'Engineer',
        email: eng.email || 'N/A',
        department: eng.departmentName || eng.department?.departmentName || 'IT Support',
        assignedCount: assigned.length,
        resolvedCount: resolved,
        breachedCount: breached,
        resolutionRate: rate
      };
    }).sort((a, b) => b.resolvedCount - a.resolvedCount);
  }, [filteredTickets, users]);

  // Export to Excel / CSV
  const handleExportCSV = () => {
    const headers = [
      'Ticket Number',
      'Title',
      'Priority',
      'Status',
      'Category',
      'Assigned Engineer',
      'Channel',
      'SLA Breached',
      'Created Date',
      'Resolution Notes'
    ];

    const rows = filteredTickets.map(t => [
      `"${t.ticketNumber || `TKT-${t.ticketId || t.id}`}"`,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${t.priority || 'LOW'}"`,
      `"${t.status || 'OPEN'}"`,
      `"${(t.category?.categoryName || t.aiCategory || 'General Support').replace(/"/g, '""')}"`,
      `"${(t.assignedTo?.name || t.assignedEngineerEmail || 'Unassigned').replace(/"/g, '""')}"`,
      `"${t.sourceChannel || 'PORTAL'}"`,
      `"${t.slaBreached ? 'YES' : 'NO'}"`,
      `"${t.createdAt ? new Date(t.createdAt).toLocaleString() : 'N/A'}"`,
      `"${(t.resolution || 'Pending').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `desk_ai_executive_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF via window.print
  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="tab-fade printable-report">
      {/* Top Banner & Export Actions */}
      <div className="glass-card mb-4 no-print">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span className="badge-premium badge-p4 mb-1">Module 9</span>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={24} style={{ color: 'var(--accent-blue)' }} />
              Executive Helpdesk Intelligence & SLA Reports
            </h3>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Comprehensive SLA compliance, resolution throughput, category allocation, and engineer KPI reporting.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div className="timeframe-selector" style={{ display: 'flex', background: 'var(--bg-input)', borderRadius: '8px', padding: '3px' }}>
              <button
                className={`btn-action ${timeFilter === 'ALL' ? 'active-filter' : ''}`}
                onClick={() => setTimeFilter('ALL')}
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                All Time
              </button>
              <button
                className={`btn-action ${timeFilter === 'MONTH' ? 'active-filter' : ''}`}
                onClick={() => setTimeFilter('MONTH')}
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                Last 30 Days
              </button>
              <button
                className={`btn-action ${timeFilter === 'WEEK' ? 'active-filter' : ''}`}
                onClick={() => setTimeFilter('WEEK')}
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                Last 7 Days
              </button>
            </div>

            <button
              className="btn-action"
              onClick={handleExportCSV}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}
              title="Download structured spreadsheet report"
            >
              <Download size={15} /> Export Excel / CSV
            </button>

            <button
              className="btn-premium"
              onClick={handlePrintPDF}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Print or save as high-fidelity PDF"
            >
              <Printer size={15} /> Export PDF / Print
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Stats */}
      <div className="dashboard-grid-stats mb-4">
        <div className="glass-card stat-bubble">
          <div className="accent-bg icon-container bg-purple">
            <FileText size={20} color="var(--accent-purple)" />
          </div>
          <div className="val">{totalCount}</div>
          <p className="lbl">Total System Tickets</p>
        </div>

        <div className="glass-card stat-bubble">
          <div className="accent-bg icon-container bg-cyan">
            <Clock size={20} color="var(--accent-cyan)" />
          </div>
          <div className="val">{openCount}</div>
          <p className="lbl">Open & In Progress</p>
        </div>

        <div className="glass-card stat-bubble">
          <div className="accent-bg icon-container bg-emerald">
            <CheckCircle2 size={20} color="var(--success)" />
          </div>
          <div className="val">{resolvedCount}</div>
          <p className="lbl">Resolved & Closed</p>
        </div>

        <div className="glass-card stat-bubble">
          <div className="accent-bg icon-container bg-rose">
            <Award size={20} color={slaComplianceRate >= 90 ? 'var(--success)' : 'var(--danger)'} />
          </div>
          <div className="val" style={{ color: slaComplianceRate >= 90 ? 'var(--success)' : 'var(--danger)' }}>
            {slaComplianceRate}%
          </div>
          <p className="lbl">SLA Compliance Met</p>
        </div>
      </div>

      {/* Grid: Open vs Closed & Category Distribution */}
      <div className="grid-split-2 mb-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Open vs Closed Breakdown */}
        <div className="glass-card">
          <h4 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} style={{ color: 'var(--accent-cyan)' }} />
            Open vs Closed Resolution Ratio
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Resolved / Closed Ratio</span>
                <span style={{ fontWeight: 700, color: 'var(--success)' }}>
                  {totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0}% ({resolvedCount} tickets)
                </span>
              </div>
              <div style={{ height: '10px', background: 'var(--bg-input)', borderRadius: '99px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${totalCount > 0 ? (resolvedCount / totalCount) * 100 : 0}%`,
                    background: 'linear-gradient(90deg, #10b981, #059669)',
                    borderRadius: '99px',
                    transition: 'width 0.5s ease'
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Active Pending Backlog</span>
                <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>
                  {totalCount > 0 ? Math.round((openCount / totalCount) * 100) : 0}% ({openCount} tickets)
                </span>
              </div>
              <div style={{ height: '10px', background: 'var(--bg-input)', borderRadius: '99px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${totalCount > 0 ? (openCount / totalCount) * 100 : 0}%`,
                    background: 'linear-gradient(90deg, #38bdf8, #8b5cf6)',
                    borderRadius: '99px',
                    transition: 'width 0.5s ease'
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>SLA Breached Incidents</span>
                <span style={{ fontWeight: 700, color: 'var(--danger)' }}>
                  {totalCount > 0 ? Math.round((breachedCount / totalCount) * 100) : 0}% ({breachedCount} tickets)
                </span>
              </div>
              <div style={{ height: '10px', background: 'var(--bg-input)', borderRadius: '99px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${totalCount > 0 ? (breachedCount / totalCount) * 100 : 0}%`,
                    background: 'linear-gradient(90deg, #ef4444, #dc2626)',
                    borderRadius: '99px',
                    transition: 'width 0.5s ease'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tickets by Category */}
        <div className="glass-card">
          <h4 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Tag size={18} style={{ color: 'var(--accent-purple)' }} />
            Tickets by Category Breakdown
          </h4>

          {categoryStats.length === 0 ? (
            <div className="empty-state">
              <p>No category metrics recorded.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {categoryStats.slice(0, 5).map(cat => (
                <div key={cat.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600 }}>{cat.name}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{cat.count} ({cat.percent}%)</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--bg-input)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${cat.percent}%`,
                        background: 'linear-gradient(90deg, #8b5cf6, #38bdf8)',
                        borderRadius: '99px'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SLA Compliance by Priority Level */}
      <div className="glass-card mb-4">
        <h4 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={18} style={{ color: '#f59e0b' }} />
          SLA Compliance Matrix by Ticket Priority (P1–P4)
        </h4>

        <div className="table-wrapper">
          <table className="table-premium">
            <thead>
              <tr>
                <th>Priority Level</th>
                <th>SLA Target Deadline</th>
                <th>Total Ingested</th>
                <th>Met Compliance</th>
                <th>Breached SLA</th>
                <th>SLA Compliance Score</th>
              </tr>
            </thead>
            <tbody>
              {prioritySlaStats.map(stat => (
                <tr key={stat.priority}>
                  <td>
                    <span className={`badge-premium badge-${stat.priority === 'CRITICAL' ? 'p1' : stat.priority === 'HIGH' ? 'p2' : stat.priority === 'MEDIUM' ? 'p3' : 'p4'}`}>
                      {stat.priority === 'CRITICAL' ? 'P1 CRITICAL' : stat.priority === 'HIGH' ? 'P2 HIGH' : stat.priority === 'MEDIUM' ? 'P3 MEDIUM' : 'P4 LOW'}
                    </span>
                  </td>
                  <td><code>{stat.targetHours}</code></td>
                  <td><strong>{stat.total}</strong></td>
                  <td><span style={{ color: 'var(--success)' }}>{stat.met}</span></td>
                  <td><span style={{ color: stat.breached > 0 ? 'var(--danger)' : 'var(--text-secondary)' }}>{stat.breached}</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, height: '6px', background: 'var(--bg-input)', borderRadius: '99px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${stat.complianceRate}%`,
                            background: stat.complianceRate >= 90 ? 'var(--success)' : stat.complianceRate >= 75 ? '#f59e0b' : 'var(--danger)'
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, minWidth: '40px' }}>{stat.complianceRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Engineer Performance Report */}
      <div className="glass-card">
        <h4 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={18} style={{ color: 'var(--accent-cyan)' }} />
          Support Engineer Performance & Throughput Audit
        </h4>

        {engineerPerformance.length === 0 ? (
          <div className="empty-state">
            <p>No active support engineers found.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table-premium">
              <thead>
                <tr>
                  <th>Support Engineer</th>
                  <th>Department</th>
                  <th>Assigned Tickets</th>
                  <th>Resolved Tickets</th>
                  <th>SLA Breaches</th>
                  <th>Resolution Rate</th>
                </tr>
              </thead>
              <tbody>
                {engineerPerformance.map((eng, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="title-bold">{eng.name}</div>
                      <div className="meta-sub">{eng.email}</div>
                    </td>
                    <td>{eng.department}</td>
                    <td><code>{eng.assignedCount}</code></td>
                    <td><strong style={{ color: 'var(--success)' }}>{eng.resolvedCount}</strong></td>
                    <td>
                      <span style={{ color: eng.breachedCount > 0 ? 'var(--danger)' : 'var(--text-secondary)' }}>
                        {eng.breachedCount}
                      </span>
                    </td>
                    <td>
                      <span className={`badge-premium ${eng.resolutionRate >= 80 ? 'badge-p4' : eng.resolutionRate >= 50 ? 'badge-p3' : 'badge-p2'}`}>
                        {eng.resolutionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .active-filter {
          background: var(--accent-blue) !important;
          color: #fff !important;
        }
        @media print {
          .no-print, .nav-panel, .panel-header, .theme-toggle-fab, .aurora-container {
            display: none !important;
          }
          .printable-report {
            background: white !important;
            color: black !important;
            padding: 0 !important;
          }
          .glass-card {
            border: 1px solid #ccc !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            margin-bottom: 20px !important;
            page-break-inside: avoid;
          }
          .table-premium th, .table-premium td {
            color: black !important;
            border-bottom: 1px solid #ddd !important;
          }
        }
      `}</style>
    </div>
  );
}
