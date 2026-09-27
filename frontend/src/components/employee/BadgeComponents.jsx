import React from 'react';
import { AlertTriangle, AlertCircle, Clock, CheckCircle2, PauseCircle, Lock } from 'lucide-react';

export function StatusBadge({ status }) {
  const s = (status || '').toUpperCase();
  if (s === 'OPEN') return <span className="badge-premium badge-p2">OPEN</span>;
  if (s === 'ASSIGNED') return <span className="badge-premium badge-p3">ASSIGNED</span>;
  if (s === 'IN_PROGRESS') return <span className="badge-premium badge-p3">IN PROGRESS</span>;
  if (s === 'PENDING' || s === 'WAITING_FOR_USER') return <span className="badge-premium badge-p1" style={{ color: '#f59e0b', borderColor: '#f59e0b' }}><PauseCircle size={11} style={{ marginRight: 3, display: 'inline-block' }} /> PENDING</span>;
  if (s === 'SOLVED') return <span className="badge-premium badge-p4"><CheckCircle2 size={11} style={{ marginRight: 3, display: 'inline-block' }} /> SOLVED</span>;
  if (s === 'RESOLVED') return <span className="badge-premium badge-p4"><CheckCircle2 size={11} style={{ marginRight: 3, display: 'inline-block' }} /> RESOLVED</span>;
  if (s === 'CLOSED') return <span className="badge-premium" style={{ background: 'rgba(100, 116, 139, 0.15)', color: '#94a3b8', border: '1px solid rgba(100, 116, 139, 0.3)' }}><Lock size={11} style={{ marginRight: 3, display: 'inline-block' }} /> CLOSED</span>;
  return <span className="badge-premium badge-p3">{status || 'OPEN'}</span>;
}

export function PriorityBadge({ priority }) {
  const p = (priority || '').toUpperCase();
  if (p === 'CRITICAL') return <span className="badge-premium badge-p1"><AlertTriangle size={12} /> CRITICAL</span>;
  if (p === 'HIGH') return <span className="badge-premium badge-p2"><AlertCircle size={12} /> HIGH</span>;
  if (p === 'MEDIUM') return <span className="badge-premium badge-p3"><Clock size={12} /> MEDIUM</span>;
  if (p === 'LOW') return <span className="badge-premium badge-p4"><CheckCircle2 size={12} /> LOW</span>;
  return <span className="badge-premium badge-p3">{priority || 'MEDIUM'}</span>;
}
