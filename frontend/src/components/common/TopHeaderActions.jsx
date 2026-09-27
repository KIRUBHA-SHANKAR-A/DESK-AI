import React, { useState, useRef, useEffect } from 'react';
import { RotateCw, Sun, Moon, Bell, CheckCheck, Info, User } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { formatDateTime } from '../../utils/dateUtils';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const DEPARTMENT_DETAILS_MAP = {
  1: { id: 1, name: 'IT Support', desc: 'General IT support and troubleshooting.', email: 'itsupport@deskai.com' },
  2: { id: 2, name: 'Hardware Support', desc: 'Handles hardware devices and peripherals.', email: 'hardware@deskai.com' },
  3: { id: 3, name: 'Software Support', desc: 'Handles software installation and application issues.', email: 'software@deskai.com' },
  4: { id: 4, name: 'Network Support', desc: 'Handles Wi-Fi, LAN, VPN, and network connectivity.', email: 'network@deskai.com' },
  5: { id: 5, name: 'Database Support', desc: 'Handles database administration and connectivity.', email: 'database@deskai.com' },
  6: { id: 6, name: 'Server Support', desc: 'Handles Windows/Linux servers and infrastructure.', email: 'server@deskai.com' },
  7: { id: 7, name: 'Email Support', desc: 'Handles Outlook, Microsoft 365, Gmail, and Exchange issues.', email: 'email@deskai.com' },
  8: { id: 8, name: 'Security Support', desc: 'Handles authentication, passwords, MFA, and security incidents.', email: 'security@deskai.com' },
  9: { id: 9, name: 'Human Resources', desc: 'Handles recruitment and employee management.', email: 'hr@deskai.com' },
  10: { id: 10, name: 'Finance', desc: 'Handles accounting and financial operations.', email: 'finance@deskai.com' },
  11: { id: 11, name: 'Sales', desc: 'Handles sales and customer acquisition.', email: 'sales@deskai.com' },
  12: { id: 12, name: 'Marketing', desc: 'Handles marketing and branding activities.', email: 'marketing@deskai.com' },
  13: { id: 13, name: 'Administration', desc: 'Handles office administration.', email: 'admin@deskai.com' },
  14: { id: 14, name: 'Information Technology', desc: 'General IT department.', email: 'it@deskai.com' },
  15: { id: 15, name: 'Operations', desc: 'Handles day-to-day business operations.', email: 'operations@deskai.com' },
  16: { id: 16, name: 'Customer Support', desc: 'Handles customer service operations.', email: 'customersupport@deskai.com' }
};

export function getDepartmentDetails(input) {
  if (!input && input !== 0) {
    return { id: 1, name: 'IT Support', desc: 'General IT support and troubleshooting.', email: 'itsupport@deskai.com' };
  }

  // Case 1: Direct department ID passed (e.g. 1, '1', 4)
  if (typeof input === 'number' || (typeof input === 'string' && !isNaN(Number(input)) && input.trim() !== '')) {
    const id = Number(input);
    if (DEPARTMENT_DETAILS_MAP[id]) {
      return DEPARTMENT_DETAILS_MAP[id];
    }
  }

  // Case 2: Object with department, department_id, or departmentId
  if (typeof input === 'object') {
    const rawDeptId = input.departmentId || input.department_id || input.deptId ||
      (input.department && typeof input.department === 'object' ? (input.department.departmentId || input.department.department_id || input.department.id) : null) ||
      (typeof input.department === 'number' ? input.department : null);

    if (rawDeptId && DEPARTMENT_DETAILS_MAP[Number(rawDeptId)]) {
      const mapped = DEPARTMENT_DETAILS_MAP[Number(rawDeptId)];
      const customName = input.departmentName || (input.department && typeof input.department === 'object' && input.department.departmentName);
      return {
        id: mapped.id,
        name: customName || mapped.name,
        desc: (input.department && input.department.description) || mapped.desc,
        email: (input.department && input.department.email) || mapped.email
      };
    }

    if (input.department && typeof input.department === 'object') {
      const dept = input.department;
      const deptId = dept.departmentId || dept.id || 1;
      const mapped = DEPARTMENT_DETAILS_MAP[Number(deptId)];
      return {
        id: deptId,
        name: dept.departmentName || dept.name || (mapped ? mapped.name : 'IT Support'),
        desc: dept.description || dept.desc || (mapped ? mapped.desc : 'General Department Operations'),
        email: dept.email || (mapped ? mapped.email : 'support@deskai.com')
      };
    }

    if (input.departmentName) {
      // Find matching ID by name if possible
      const match = Object.values(DEPARTMENT_DETAILS_MAP).find(
        d => d.name.toLowerCase() === input.departmentName.toLowerCase() ||
             input.departmentName.toLowerCase().includes(d.name.toLowerCase())
      );
      if (match) {
        return match;
      }
      return { id: 1, name: input.departmentName, desc: 'Corporate Department', email: 'support@deskai.com' };
    }
  }

  return { id: 1, name: 'IT Support', desc: 'General IT support and troubleshooting.', email: 'itsupport@deskai.com' };
}

export const DEPARTMENT_NAME_MAP = {
  1: 'IT Support',
  2: 'Hardware Support',
  3: 'Software Support',
  4: 'Network Support',
  5: 'Database Support',
  6: 'Server Support',
  7: 'Email Support',
  8: 'Security Support',
  9: 'Human Resources',
  10: 'Finance',
  11: 'Sales',
  12: 'Marketing',
  13: 'Administration',
  14: 'Information Technology',
  15: 'Operations',
  16: 'Customer Support'
};

export function getDepartmentName(input) {
  if (!input && input !== 0) return 'IT Support';
  const details = getDepartmentDetails(input);
  return details.name || 'IT Support';
}

export function formatRoleName(user) {
  if (!user) return 'User';

  const role = (user.role || '').toUpperCase();
  const dept = getDepartmentName(user);

  if (role === 'ADMIN') return 'System Administrator';

  if (role === 'SUPPORT_ENGINEER' || role === 'ENGINEER') {
    if (!dept) return 'IT Support Engineer';
    if (dept.toLowerCase().includes('support') || dept.toLowerCase().includes('engineer')) {
      return `${dept} Engineer`;
    }
    return `${dept} Support Engineer`;
  }

  if (role === 'EMPLOYEE' || role === 'USER') {
    if (dept) return `${dept} Staff`;
    return 'Corporate Employee';
  }

  return dept ? `${dept} Specialist` : 'Support Specialist';
}

export default function TopHeaderActions({
  currentUser,
  notifications = [],
  setNotifications,
  onRefresh,
  onNavigate,
  authHeaders
}) {
  const { theme, toggleTheme } = useTheme();
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = (notifications || []).filter(n => !(n.read || n.isRead)).length;

  const getHeaders = () => {
    const base = authHeaders ? (typeof authHeaders === 'function' ? authHeaders() : authHeaders) : {};
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...base
    };
  };

  const handleRefreshClick = async () => {
    setIsRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
        method: 'PUT',
        headers: getHeaders(),
      });
    } catch (err) {
      console.error('Failed to mark notifications read on server:', err);
    } finally {
      if (setNotifications) {
        setNotifications(prev => (prev || []).map(n => ({ ...n, read: true, isRead: true })));
      }
    }
  };

  const handleNotificationClick = async (notif) => {
    const notifId = notif.notificationId || notif.id;
    if (notifId && !(notif.read || notif.isRead)) {
      try {
        await fetch(`${API_BASE_URL}/notifications/${notifId}/read`, {
          method: 'PUT',
          headers: getHeaders(),
        });
      } catch (err) {
        console.error('Failed to mark notification read:', err);
      }
    }
    if (setNotifications) {
      setNotifications(prev => (prev || []).map(n => (n.notificationId === notifId || n.id === notifId) ? { ...n, read: true, isRead: true } : n));
    }
  };

  const userInitial = currentUser?.name?.[0]?.toUpperCase() || 'U';
  const userName = currentUser?.name || 'User';
  const userRole = formatRoleName(currentUser);

  const handleBellClick = () => {
    if (unreadCount > 0) {
      setShowNotifMenu(!showNotifMenu);
    } else {
      setShowNotifMenu(false);
      if (onNavigate) {
        onNavigate('notifications');
      }
    }
  };

  return (
    <div className="header-actions" ref={dropdownRef}>
      {/* 1. Refresh Symbol */}
      <button
        className="icon-action-btn"
        onClick={handleRefreshClick}
        title="Refresh Workspace Data"
      >
        <RotateCw size={18} className={isRefreshing ? 'spin' : ''} />
      </button>

      {/* 2. Theme Symbol */}
      <button
        className="icon-action-btn"
        onClick={toggleTheme}
        title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* 3. Notification Symbol & Dropdown */}
      <div className="relative">
        <button
          className="icon-action-btn"
          onClick={handleBellClick}
          title={unreadCount > 0 ? `${unreadCount} Unread Notifications` : 'Go to Notifications'}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="bell-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
          )}
        </button>

        {showNotifMenu && (
          <div className="notif-dropdown-panel">
            <div className="notif-dropdown-header">
              <h4>
                <Bell size={16} /> Notifications ({notifications.length})
              </h4>
              {unreadCount > 0 && (
                <button className="mark-all-btn" onClick={handleMarkAllRead}>
                  <CheckCheck size={14} /> Mark all as read
                </button>
              )}
            </div>

            <div className="notif-dropdown-body">
              {notifications && notifications.length > 0 ? (
                notifications.map((notif, idx) => {
                  const isUnread = !(notif.read || notif.isRead);
                  return (
                    <div
                      key={idx}
                      className={`notif-item ${isUnread ? 'unread' : ''}`}
                      onClick={() => handleNotificationClick(notif)}
                    >
                      <Info size={16} className="notif-item-ico" />
                      <div className="notif-item-content">
                        <div className="notif-item-title">{notif.title || 'Notification Update'}</div>
                        <p className="notif-item-msg">{notif.message || notif.content}</p>
                        <span className="notif-item-time">
                          {formatDateTime(notif.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="notif-empty">No notifications available</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. Profile Symbol */}
      <button
        className="icon-action-btn profile-icon-btn"
        onClick={() => onNavigate && onNavigate('profile')}
        title={`Profile (${userName})`}
      >
        <div className="user-avatar-sm">{userInitial}</div>
      </button>
    </div>
  );
}
