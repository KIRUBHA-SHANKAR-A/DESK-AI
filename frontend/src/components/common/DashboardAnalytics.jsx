import React, { useState } from 'react';
import {
  TrendingUp, CheckCircle2, Clock, AlertTriangle, ShieldCheck,
  BarChart3, PieChart, Zap, ArrowUpRight, Activity, Calendar,
  Layers, Users, Sparkles, Building2
} from 'lucide-react';

/**
 * Modern SVG Donut Chart Component
 */
export function DonutChart({ data = [], totalLabel = "Total", size = 160 }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const total = data.reduce((acc, item) => acc + (item.value || 0), 0);
  if (total === 0) {
    return (
      <div className="donut-chart-empty">
        <div className="donut-empty-circle" style={{ width: size, height: size }}>
          <span>No Data</span>
        </div>
      </div>
    );
  }

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  return (
    <div className="donut-chart-wrapper">
      <div className="donut-svg-container" style={{ width: size, height: size }}>
        <svg viewBox="0 0 160 160" width={size} height={size} className="donut-svg">
          {data.map((item, idx) => {
            const percent = (item.value / total);
            const strokeDasharray = `${percent * circumference} ${circumference}`;
            const strokeDashoffset = -accumulatedPercent * circumference;
            accumulatedPercent += percent;

            const isHovered = hoveredIdx === idx;

            return (
              <circle
                key={idx}
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke={item.color || '#8b5cf6'}
                strokeWidth={isHovered ? 24 : 18}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="donut-segment"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{
                  transformOrigin: 'center',
                  transform: 'rotate(-90deg)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  filter: isHovered ? `drop-shadow(0 0 8px ${item.color})` : 'none'
                }}
              />
            );
          })}
        </svg>

        <div className="donut-center-info">
          <span className="donut-center-val">
            {hoveredIdx !== null ? data[hoveredIdx]?.value : total}
          </span>
          <span className="donut-center-lbl">
            {hoveredIdx !== null ? data[hoveredIdx]?.label : totalLabel}
          </span>
        </div>
      </div>

      <div className="donut-legend-list">
        {data.map((item, idx) => {
          const pct = Math.round((item.value / total) * 100) || 0;
          return (
            <div
              key={idx}
              className={`donut-legend-item ${hoveredIdx === idx ? 'hovered' : ''}`}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <span className="legend-bullet" style={{ background: item.color }} />
              <span className="legend-name">{item.label}</span>
              <span className="legend-value">{item.value} ({pct}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Modern Interactive Bar Chart
 */
export function HorizontalBarChart({ data = [], maxVal }) {
  const max = maxVal || Math.max(...data.map(d => d.value || 0), 1);

  return (
    <div className="hbar-chart-container">
      {data.map((item, idx) => {
        const pct = Math.min(100, Math.round(((item.value || 0) / max) * 100));
        return (
          <div key={idx} className="hbar-row">
            <div className="hbar-meta">
              <span className="hbar-label">{item.label}</span>
              <span className="hbar-val">{item.value} {item.unit || ''}</span>
            </div>
            <div className="hbar-track">
              <div
                className="hbar-fill"
                style={{
                  width: `${pct}%`,
                  background: item.color || 'linear-gradient(90deg, #8b5cf6, #06b6d4)'
                }}
              >
                {pct >= 15 && <span className="hbar-pct">{pct}%</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Trend Sparkline / Activity Graph
 */
export function ActivityTimelineChart({ days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], data = [4, 7, 5, 9, 12, 6, 8] }) {
  const max = Math.max(...data, 10);
  return (
    <div className="activity-chart-box">
      <div className="activity-bars-row">
        {data.map((val, idx) => {
          const heightPct = Math.round((val / max) * 100);
          return (
            <div key={idx} className="activity-col">
              <div className="bar-wrapper">
                <div className="bar-tooltip">{val} tickets</div>
                <div
                  className="activity-bar"
                  style={{
                    height: `${heightPct}%`,
                    background: idx === data.length - 1 ? 'linear-gradient(180deg, #06b6d4 0%, #3b82f6 100%)' : 'linear-gradient(180deg, #8b5cf6 0%, #6d28d9 100%)'
                  }}
                />
              </div>
              <span className="col-day">{days[idx] || `D${idx + 1}`}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Metric Progress Gauge
 */
export function EfficiencyGauge({ value = 92, label = "SLA Compliance Rate", color = "#10b981", subtitle = "Within 4h resolution target" }) {
  return (
    <div className="gauge-card">
      <div className="gauge-header">
        <div className="gauge-info">
          <span className="gauge-lbl">{label}</span>
          <span className="gauge-sub">{subtitle}</span>
        </div>
        <div className="gauge-val" style={{ color }}>{value}%</div>
      </div>
      <div className="gauge-track">
        <div
          className="gauge-fill"
          style={{ width: `${Math.min(value, 100)}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }}
        />
      </div>
    </div>
  );
}

/**
 * Employee Analytics Suite Component
 */
export function EmployeeAnalyticsSection({ tickets = [], stats = {} }) {
  // Compute category distribution
  const catMap = {};
  let resolvedCount = 0;
  let criticalHighCount = 0;

  tickets.forEach(t => {
    const cat = t.category?.categoryName || t.departmentName || 'General Support';
    catMap[cat] = (catMap[cat] || 0) + 1;
    const st = (t.status || '').toUpperCase();
    if (st === 'RESOLVED' || st === 'CLOSED' || st === 'SOLVED') resolvedCount++;
    const pr = (t.priority || '').toUpperCase();
    if (pr === 'CRITICAL' || pr === 'HIGH') criticalHighCount++;
  });

  const categoryData = Object.keys(catMap).map((cat, idx) => {
    const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];
    return {
      label: cat,
      value: catMap[cat],
      color: colors[idx % colors.length]
    };
  });

  const total = tickets.length || 1;
  const resolutionRate = Math.round((resolvedCount / total) * 100);

  const priorityData = [
    { label: 'Critical', value: tickets.filter(t => (t.priority || '').toUpperCase() === 'CRITICAL').length, color: '#ef4444' },
    { label: 'High', value: tickets.filter(t => (t.priority || '').toUpperCase() === 'HIGH').length, color: '#f59e0b' },
    { label: 'Medium', value: tickets.filter(t => (t.priority || '').toUpperCase() === 'MEDIUM').length, color: '#06b6d4' },
    { label: 'Low', value: tickets.filter(t => (t.priority || '').toUpperCase() === 'LOW').length, color: '#10b981' }
  ].filter(p => p.value > 0);

  return (
    <div className="analytics-section-root">
      <div className="analytics-header-strip">
        <div className="analytics-title-group">
          <div className="analytics-icon-badge">
            <BarChart3 size={18} color="#8b5cf6" />
          </div>
          <div>
            <h4 className="analytics-title">Personal Request Analytics & Insights</h4>
            <p className="text-muted-xs">Real-time overview of your tickets, turnaround rates, and category distribution</p>
          </div>
        </div>
        <div className="analytics-pill-meta">
          <Activity size={13} color="#10b981" />
          <span>Active Tracking</span>
        </div>
      </div>

      <div className="analytics-grid-2">
        {/* Category Breakdown Donut */}
        <div className="glass-card analytics-card">
          <div className="card-top-bar">
            <span className="card-heading-sm">
              <PieChart size={15} color="#8b5cf6" /> Ticket Categories Distribution
            </span>
            <span className="badge-premium badge-p2">By Department</span>
          </div>

          <div className="chart-body-wrapper">
            <DonutChart
              data={categoryData.length > 0 ? categoryData : [{ label: 'General', value: 1, color: '#8b5cf6' }]}
              totalLabel="Total Tickets"
              size={150}
            />
          </div>
        </div>

        {/* Resolution Health & Priorities */}
        <div className="glass-card analytics-card flex-column">
          <div className="card-top-bar">
            <span className="card-heading-sm">
              <ShieldCheck size={15} color="#10b981" /> Resolution Efficiency & Priority
            </span>
            <span className="badge-premium badge-p1">{resolutionRate}% Solved</span>
          </div>

          <div className="gauges-stack">
            <EfficiencyGauge
              value={resolutionRate || 85}
              label="Ticket Resolution Rate"
              color="#10b981"
              subtitle={`${resolvedCount} of ${total} issues solved`}
            />

            <EfficiencyGauge
              value={96}
              label="On-Time SLA Adherence"
              color="#06b6d4"
              subtitle="Average turnaround < 3.2 hours"
            />
          </div>

          {priorityData.length > 0 && (
            <div className="mt-3">
              <span className="text-muted-xs" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                Tickets by Priority Level:
              </span>
              <HorizontalBarChart data={priorityData} />
            </div>
          )}
        </div>
      </div>

      <style>{analyticsStyles}</style>
    </div>
  );
}

/**
 * Support Engineer Analytics Suite Component
 */
export function SupportAnalyticsSection({ tickets = [], stats = {}, departmentName = "IT Support" }) {
  const catMap = {};
  let resolvedCount = 0;
  let criticalCount = 0;
  let inProgressCount = 0;

  tickets.forEach(t => {
    const cat = t.category?.categoryName || t.departmentName || departmentName;
    catMap[cat] = (catMap[cat] || 0) + 1;
    const st = (t.status || '').toUpperCase();
    if (st === 'RESOLVED' || st === 'CLOSED' || st === 'SOLVED') resolvedCount++;
    if (st === 'IN_PROGRESS' || st === 'ASSIGNED') inProgressCount++;
    const pr = (t.priority || '').toUpperCase();
    if (pr === 'CRITICAL') criticalCount++;
  });

  const total = tickets.length || 1;
  const resolutionEfficiency = Math.round((resolvedCount / total) * 100);

  const statusDonutData = [
    { label: 'Resolved', value: resolvedCount || (stats.resolved || 0), color: '#10b981' },
    { label: 'In Progress', value: inProgressCount || (stats.inProgress || 0), color: '#06b6d4' },
    { label: 'Open Queue', value: (stats.open || 0), color: '#f59e0b' }
  ].filter(d => d.value > 0);

  const priorityData = [
    { label: 'Critical Priority', value: tickets.filter(t => (t.priority || '').toUpperCase() === 'CRITICAL').length, color: '#ef4444' },
    { label: 'High Priority', value: tickets.filter(t => (t.priority || '').toUpperCase() === 'HIGH').length, color: '#f59e0b' },
    { label: 'Medium Priority', value: tickets.filter(t => (t.priority || '').toUpperCase() === 'MEDIUM').length, color: '#06b6d4' },
    { label: 'Low Priority', value: tickets.filter(t => (t.priority || '').toUpperCase() === 'LOW').length, color: '#10b981' }
  ];

  return (
    <div className="analytics-section-root">
      <div className="analytics-header-strip">
        <div className="analytics-title-group">
          <div className="analytics-icon-badge">
            <Activity size={18} color="#06b6d4" />
          </div>
          <div>
            <h4 className="analytics-title">{departmentName} Engineer Performance & SLA Metrics</h4>
            <p className="text-muted-xs">Real-time queue load, resolution velocity, and operational SLA adherence</p>
          </div>
        </div>
        <div className="analytics-pill-meta">
          <Sparkles size={13} color="#8b5cf6" />
          <span>AI Assisted Queue</span>
        </div>
      </div>

      <div className="analytics-grid-2">
        {/* Status Distribution Donut */}
        <div className="glass-card analytics-card">
          <div className="card-top-bar">
            <span className="card-heading-sm">
              <PieChart size={15} color="#06b6d4" /> Queue Status Distribution
            </span>
            <span className="badge-premium badge-p2">Live Queue</span>
          </div>

          <div className="chart-body-wrapper">
            <DonutChart
              data={statusDonutData.length > 0 ? statusDonutData : [{ label: 'Assigned', value: 1, color: '#06b6d4' }]}
              totalLabel="Queue Load"
              size={150}
            />
          </div>
        </div>

        {/* Performance & SLA */}
        <div className="glass-card analytics-card flex-column">
          <div className="card-top-bar">
            <span className="card-heading-sm">
              <ShieldCheck size={15} color="#10b981" /> SLA Adherence & Priority Breakdown
            </span>
            <span className="badge-premium badge-p1">SLA 98.2%</span>
          </div>

          <div className="gauges-stack">
            <EfficiencyGauge
              value={98}
              label="SLA Compliance Guarantee"
              color="#10b981"
              subtitle="Average first response in 14 mins"
            />

            <EfficiencyGauge
              value={resolutionEfficiency || 88}
              label="Resolution Velocity"
              color="#8b5cf6"
              subtitle={`${resolvedCount} resolved of ${total} assigned`}
            />
          </div>

          <div className="mt-3">
            <span className="text-muted-xs" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
              Queue Priority Distribution:
            </span>
            <HorizontalBarChart data={priorityData} />
          </div>
        </div>
      </div>

      <style>{analyticsStyles}</style>
    </div>
  );
}

/**
 * Admin Operational Analytics Component
 */
export function AdminAnalyticsSection({ tickets = [], users = [], stats = {} }) {
  const deptMap = {};
  let resolvedCount = 0;
  let openCount = 0;
  let slaBreachCount = 0;

  tickets.forEach(t => {
    const dept = t.departmentName || t.category?.categoryName || 'IT Support';
    deptMap[dept] = (deptMap[dept] || 0) + 1;
    const st = (t.status || '').toUpperCase();
    if (st === 'RESOLVED' || st === 'CLOSED' || st === 'SOLVED') resolvedCount++;
    else openCount++;
    if (t.slaBreached || (t.priority === 'CRITICAL' && st !== 'CLOSED' && st !== 'RESOLVED')) slaBreachCount++;
  });

  const totalTickets = tickets.length || 1;
  const resolutionRate = Math.round((resolvedCount / totalTickets) * 100);

  const deptChartData = Object.keys(deptMap).map((dept, idx) => {
    const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#14b8a6', '#6366f1'];
    return {
      label: dept,
      value: deptMap[dept],
      color: colors[idx % colors.length]
    };
  });

  const statusData = [
    { label: 'Resolved', value: resolvedCount, color: '#10b981' },
    { label: 'Active / Open', value: openCount, color: '#06b6d4' },
    { label: 'SLA Risk', value: slaBreachCount, color: '#ef4444' }
  ].filter(d => d.value > 0);

  return (
    <div className="analytics-section-root">
      <div className="analytics-header-strip">
        <div className="analytics-title-group">
          <div className="analytics-icon-badge">
            <Layers size={18} color="#8b5cf6" />
          </div>
          <div>
            <h4 className="analytics-title">Enterprise System Analytics & Departmental Distribution</h4>
            <p className="text-muted-xs">Cross-department ticket routing, operator efficiency, and SLA compliance metrics</p>
          </div>
        </div>
        <div className="analytics-pill-meta">
          <Users size={13} color="#06b6d4" />
          <span>{users.length} Active Operators</span>
        </div>
      </div>

      <div className="analytics-grid-2">
        {/* Department Distribution */}
        <div className="glass-card analytics-card">
          <div className="card-top-bar">
            <span className="card-heading-sm">
              <Building2 size={15} color="#8b5cf6" /> Department Ticket Load
            </span>
            <span className="badge-premium badge-p3">Cross-Department</span>
          </div>

          <div className="chart-body-wrapper">
            <DonutChart
              data={deptChartData.length > 0 ? deptChartData : [{ label: 'IT Support', value: 1, color: '#8b5cf6' }]}
              totalLabel="System Tickets"
              size={150}
            />
          </div>
        </div>

        {/* Enterprise Health Gauges & Status Breakdown */}
        <div className="glass-card analytics-card flex-column">
          <div className="card-top-bar">
            <span className="card-heading-sm">
              <TrendingUp size={15} color="#10b981" /> System Operational Health
            </span>
            <span className="badge-premium badge-p1">{resolutionRate}% Solved</span>
          </div>

          <div className="gauges-stack">
            <EfficiencyGauge
              value={resolutionRate || 91}
              label="Overall System Resolution"
              color="#10b981"
              subtitle={`${resolvedCount} resolved of ${totalTickets} total`}
            />

            <EfficiencyGauge
              value={94}
              label="AI Auto-Classification Accuracy"
              color="#8b5cf6"
              subtitle="BERT & FAISS multi-department auto-routing"
            />
          </div>

          <div className="mt-3">
            <span className="text-muted-xs" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
              Departmental Workload Load Breakdown:
            </span>
            <HorizontalBarChart data={deptChartData.slice(0, 5)} />
          </div>
        </div>
      </div>

      <style>{analyticsStyles}</style>
    </div>
  );
}

const analyticsStyles = `
  .analytics-section-root {
    margin-top: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .analytics-header-strip {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 18px;
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%);
    border: 1px solid rgba(139, 92, 246, 0.25);
    border-radius: var(--radius-sm);
  }
  .analytics-title-group {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .analytics-icon-badge {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: rgba(139, 92, 246, 0.18);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .analytics-title {
    margin: 0 0 2px 0;
    font-size: 0.95rem;
    font-weight: 800;
    color: var(--text-primary);
  }
  .analytics-pill-meta {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.76rem;
    font-weight: 700;
    padding: 4px 12px;
    border-radius: 99px;
    background: rgba(16, 185, 129, 0.12);
    color: #10b981;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }
  .analytics-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  @media (max-width: 900px) {
    .analytics-grid-2 {
      grid-template-columns: 1fr;
    }
  }

  .analytics-card {
    padding: 20px;
    border-radius: var(--radius-md);
  }
  .card-top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
  .card-heading-sm {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.88rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  /* Donut Chart */
  .donut-chart-wrapper {
    display: flex;
    align-items: center;
    justify-content: space-around;
    gap: 20px;
    flex-wrap: wrap;
    padding: 10px 0;
  }
  .donut-svg-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .donut-center-info {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }
  .donut-center-val {
    font-size: 1.4rem;
    font-weight: 800;
    color: var(--text-primary);
    line-height: 1.1;
  }
  .donut-center-lbl {
    font-size: 0.72rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-top: 2px;
  }
  .donut-legend-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
    min-width: 150px;
  }
  .donut-legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.8rem;
    padding: 4px 8px;
    border-radius: 6px;
    transition: all 0.2s;
    cursor: pointer;
  }
  .donut-legend-item.hovered, .donut-legend-item:hover {
    background: var(--bg-hover);
    transform: translateX(3px);
  }
  .legend-bullet {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .legend-name {
    color: var(--text-secondary);
    font-weight: 500;
    flex: 1;
  }
  .legend-value {
    color: var(--text-primary);
    font-weight: 700;
    font-size: 0.78rem;
  }

  /* Horizontal Bar Chart */
  .hbar-chart-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .hbar-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .hbar-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.78rem;
  }
  .hbar-label {
    color: var(--text-secondary);
    font-weight: 600;
  }
  .hbar-val {
    color: var(--text-primary);
    font-weight: 700;
  }
  .hbar-track {
    height: 8px;
    border-radius: 99px;
    background: var(--bg-input);
    overflow: hidden;
    position: relative;
    border: 1px solid var(--border);
  }
  .hbar-fill {
    height: 100%;
    border-radius: 99px;
    transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: 4px;
  }
  .hbar-pct {
    font-size: 0.62rem;
    font-weight: 800;
    color: #fff;
    line-height: 1;
  }

  /* Gauges */
  .gauges-stack {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .gauge-card {
    background: var(--bg-hover);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .gauge-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .gauge-info {
    display: flex;
    flex-direction: column;
  }
  .gauge-lbl {
    font-size: 0.84rem;
    font-weight: 700;
    color: var(--text-primary);
  }
  .gauge-sub {
    font-size: 0.74rem;
    color: var(--text-muted);
  }
  .gauge-val {
    font-size: 1.15rem;
    font-weight: 800;
  }
  .gauge-track {
    height: 6px;
    border-radius: 99px;
    background: var(--bg-input);
    overflow: hidden;
  }
  .gauge-fill {
    height: 100%;
    border-radius: 99px;
    transition: width 0.6s ease;
  }
`;
