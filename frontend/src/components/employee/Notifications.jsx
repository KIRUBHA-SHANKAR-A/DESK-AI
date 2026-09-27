import React from 'react';
import { Bell, Sparkles, CheckCheck } from 'lucide-react';
import { formatDateTime } from '../../utils/dateUtils';

export default function Notifications({ notifications, unreadCount, onMarkAllRead, onMarkOneRead }) {
  return (
    <div className="tab-fade">
      <div className="glass-card">
        <div className="card-header-flex mb-4">
          <h4>🔔 Notifications & Activity Log</h4>
          {unreadCount > 0 && (
            <button className="btn-link" onClick={onMarkAllRead}>
              <CheckCheck size={14} /> Mark all as read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="empty-state">
            <Bell size={36} className="empty-ico-svg" />
            <p>No notifications yet. You will be notified when your tickets are updated.</p>
          </div>
        ) : (
          <div className="notifications-list">
            {[...notifications]
              .sort((a, b) => new Date(b.createdAt || b.time || 0) - new Date(a.createdAt || a.time || 0))
              .map(n => {

              const id = n.notificationId || n.id;
              const isRead = n.read ?? n.isRead ?? false;
              const message = n.message || n.content || 'Ticket status updated';
              const timeStr = n.createdAt ? formatDateTime(n.createdAt) : n.time || 'Just now';

              return (
                <div
                  key={id}
                  className={`notification-item ${isRead ? 'read' : 'unread'}`}
                  onClick={() => onMarkOneRead(id)}
                >
                  <div className="notif-icon">
                    {isRead ? <Bell size={18} color="var(--text-muted)" /> : <Sparkles size={18} color="#8b5cf6" />}
                  </div>
                  <div className="notif-content">
                    <div className="notif-text">{message}</div>
                    <div className="notif-time">{timeStr}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{notifStyles}</style>
    </div>
  );
}

const notifStyles = `
  .notifications-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .notification-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: rgba(255, 255, 255, 0.02);
    cursor: pointer;
    transition: all 0.2s;
  }
  .notification-item.unread {
    border-color: rgba(99, 102, 241, 0.3);
    background: rgba(99, 102, 241, 0.06);
  }
  .notif-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.04);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .notif-text {
    font-size: 0.88rem;
    color: var(--text-primary);
  }
  .notif-time {
    font-size: 0.72rem;
    color: var(--text-muted);
    margin-top: 4px;
  }
  .card-header-flex {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .mb-4 { margin-bottom: 24px; }
`;
