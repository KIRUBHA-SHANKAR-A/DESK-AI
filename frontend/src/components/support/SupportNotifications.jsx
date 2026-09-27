import React, { useState } from 'react';
import { Bell, CheckCircle2, Ticket, MessageSquare, AlertCircle } from 'lucide-react';
import { formatDateTime } from '../../utils/dateUtils';

export default function SupportNotifications({ notifications = [], onMarkRead, onMarkAllRead }) {
  return (
    <div className="tab-fade">
      <div className="glass-card">
        <div className="card-header-flex mb-4">
          <div>
            <h4>🔔 Queue Notifications</h4>
            <p className="text-muted-xs">Activity alerts for assigned tickets & employee comments</p>
          </div>

          {notifications.some(n => !n.read) && (
            <button className="btn-link" onClick={onMarkAllRead}>
              Mark all as read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="empty-state">
            <Bell size={36} className="empty-ico-svg" />
            <p>No new notifications at this time.</p>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map(n => (
              <div key={n.id} className={`notification-item ${!n.read ? 'unread' : ''}`} onClick={() => onMarkRead(n.id)}>
                <div className="notif-ico-box">
                  <Ticket size={18} color="var(--accent-purple)" />
                </div>
                <div className="notif-content">
                  <div className="notif-msg">{n.message}</div>
                  <div className="notif-time">{n.createdAt ? formatDateTime(n.createdAt) : 'Just now'}</div>
                </div>
                {!n.read && <div className="unread-dot"></div>}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .card-header-flex { display: flex; justify-content: space-between; align-items: center; }
        .text-muted-xs { font-size: 0.78rem; color: var(--text-muted); }
        .notifications-list { display: flex; flex-direction: column; gap: 10px; }
        .notification-item { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: var(--radius-sm); background: var(--bg-hover); border: 1px solid var(--border); cursor: pointer; transition: all 0.2s; }
        .notification-item.unread { background: rgba(139, 92, 246, 0.08); border-color: rgba(139, 92, 246, 0.25); }
        .notif-ico-box { width: 36px; height: 36px; border-radius: 10px; background: rgba(255, 255, 255, 0.04); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .notif-content { flex: 1; }
        .notif-msg { font-size: 0.88rem; color: var(--text-primary); }
        .notif-time { font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; }
        .unread-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent-purple); flex-shrink: 0; }
        .btn-link { background: none; border: none; color: var(--accent-cyan); font-size: 0.82rem; font-weight: 600; cursor: pointer; }
        .empty-state { display: flex; flex-direction: column; align-items: center; padding: 40px 20px; color: var(--text-muted); }
        .empty-ico-svg { margin-bottom: 12px; }
        .mb-4 { margin-bottom: 24px; }
      `}</style>
    </div>
  );
}
