import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Ticket, BookOpen, Bell, User, LogOut,
  Sun, Moon, ShieldCheck, Sparkles, Building2, ChevronLeft, ChevronRight, Menu
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import SupportDashboard from '../components/support/SupportDashboard';
import AssignedTickets from '../components/support/AssignedTickets';
import SupportTicketModal from '../components/support/SupportTicketModal';
import SupportKBManagement from '../components/support/SupportKBManagement';
import SupportNotifications from '../components/support/SupportNotifications';
import SupportProfile from '../components/support/SupportProfile';
import LoadingSpinner from '../components/common/LoadingSpinner';
import TopHeaderActions, { getDepartmentName, formatRoleName } from '../components/common/TopHeaderActions';
import { useDepartments, resolveDeptNameFromUser } from '../context/DepartmentContext';
import ChatbotAssistant from '../components/common/ChatbotAssistant';


const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export default function SupportEngineerPage() {
  const { getDeptName, fetchDepartmentByEmail } = useDepartments();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('deskai_sidebar_collapsed') === 'true');
  const [currentUser, setCurrentUser] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('deskai_sidebar_collapsed', String(next));
      return next;
    });
  };

  const [notifications, setNotifications] = useState([
    { id: 1, message: 'New ticket TKT-104 assigned to IT Support queue', read: false, createdAt: new Date() },
    { id: 2, message: 'Employee replied to ticket TKT-101 (VPN issue)', read: false, createdAt: new Date() }
  ]);

  const authHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  useEffect(() => {
    const userRaw = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!token || !userRaw) {
      navigate('/login');
      return;
    }

    let parsed = null;
    try {
      parsed = JSON.parse(userRaw);
      setCurrentUser(parsed);
    } catch {
      navigate('/login');
      return;
    }

    // Live department lookup using user mail
    if (parsed && parsed.email) {
      fetchDepartmentByEmail(parsed.email, token).then(userDept => {
        if (userDept) {
          setCurrentUser(prev => {
            const updated = {
              ...prev,
              ...userDept,
              departmentId: userDept.departmentId || prev?.departmentId,
              departmentName: userDept.departmentName || prev?.departmentName,
              department: userDept.department || prev?.department
            };
            localStorage.setItem('user', JSON.stringify(updated));
            return updated;
          });
        }
      });
    }

    fetchAssignedTickets();
  }, [fetchDepartmentByEmail]);

  const fetchAssignedTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/tickets`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        const raw = Array.isArray(data) ? data : [];
        const sorted = [...raw].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setTickets(sorted);
      }
    } catch (err) {
      console.error('Failed to fetch assigned tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleUpdateProfile = async (updated) => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(prev => {
          const next = { ...prev, ...data };
          localStorage.setItem('user', JSON.stringify(next));
          return next;
        });
      } else {
        setCurrentUser(prev => {
          const next = { ...prev, ...updated };
          localStorage.setItem('user', JSON.stringify(next));
          return next;
        });
      }
    } catch {
      setCurrentUser(prev => {
        const next = { ...prev, ...updated };
        localStorage.setItem('user', JSON.stringify(next));
        return next;
      });
    }
  };

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => (t.status || '').toUpperCase() === 'OPEN').length,
    assigned: tickets.filter(t => (t.status || '').toUpperCase() === 'ASSIGNED').length,
    inProgress: tickets.filter(t => ['IN_PROGRESS', 'PENDING', 'WAITING_FOR_USER'].includes((t.status || '').toUpperCase())).length,
    resolved: tickets.filter(t => ['SOLVED', 'RESOLVED', 'CLOSED'].includes((t.status || '').toUpperCase())).length
  };

  return (
    <div className={`page-layout ${theme}`}>
      {/* Sidebar */}
      <aside className={`nav-panel ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="brand-header">
          <div className="brand-header-left" onClick={() => sidebarCollapsed && setSidebarCollapsed(false)}>
            <div className="brand-badge-box" title="DESK AI">
              <ShieldCheck size={22} color="var(--accent-cyan)" />
            </div>
            {!sidebarCollapsed && (
              <div className="brand-meta">
                <h2>DESK AI</h2>
                <p>Support Console</p>
              </div>
            )}
          </div>
          <button
            className="sidebar-collapse-btn"
            onClick={toggleSidebar}
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="tab-menu">
          {[
            { key: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { key: 'assigned', icon: Ticket, label: 'Assigned Tickets' },
            { key: 'kb', icon: BookOpen, label: 'Knowledge Base' },
            { key: 'notifications', icon: Bell, label: 'Notifications', hasDot: notifications.some(n => !n.read) },
            { key: 'profile', icon: User, label: 'Profile' },
          ].map(({ key, icon: Icon, label, hasDot }) => (
            <button
              key={key}
              className={`tab-btn ${activeTab === key ? 'active' : ''}`}
              onClick={() => setActiveTab(key)}
              title={sidebarCollapsed ? label : undefined}
            >
              <Icon size={18} />
              {!sidebarCollapsed && <span>{label}</span>}
              {hasDot && <span className="tab-dot"></span>}
            </button>
          ))}
        </nav>

        <div className={`sidebar-footer ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="engineer-user-card">
            <div className="user-avatar" title={currentUser?.name || 'Support Engineer'}>
              {currentUser?.name?.[0] || 'S'}
            </div>
            {!sidebarCollapsed && (
              <div className="user-info">
                <div className="user-name">{currentUser?.name || 'Support Engineer'}</div>
                <div className="user-dept">{resolveDeptNameFromUser(currentUser, getDeptName) || 'IT Support'}</div>
              </div>
            )}
            <button className="logout-icon-btn" onClick={handleLogout} title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="content-panel">
        <header className="panel-header">
          <div />

          <TopHeaderActions
            currentUser={currentUser}
            notifications={notifications}
            setNotifications={setNotifications}
            onRefresh={fetchAssignedTickets}
            onNavigate={setActiveTab}
            authHeaders={authHeaders}
          />
        </header>

        {/* Scrollable Content Board */}
        <div className="scroll-board">
          {loading ? (
            <LoadingSpinner text="Loading assigned ticket queue & metrics..." />
          ) : (
            <>
              {activeTab === 'dashboard' && (

            <SupportDashboard
              stats={stats}
              tickets={tickets}
              currentUser={currentUser}
              departmentName={getDepartmentName(currentUser)}
              onNavigate={(tab) => setActiveTab(tab)}
              onSelectTicket={(t) => setSelectedTicket(t)}
            />
          )}

          {activeTab === 'assigned' && (
            <AssignedTickets
              tickets={tickets}
              currentUser={currentUser}
              authHeaders={authHeaders}
              onSelectTicket={(t) => setSelectedTicket(t)}
              onTicketsUpdated={setTickets}
              onRefresh={fetchAssignedTickets}
            />
          )}

          {activeTab === 'kb' && (
            <SupportKBManagement
              authHeaders={authHeaders}
            />
          )}

          {activeTab === 'notifications' && (
            <SupportNotifications
              notifications={notifications}
              onMarkRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))}
              onMarkAllRead={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
            />
          )}

          {activeTab === 'profile' && (
            <SupportProfile
              user={currentUser}
              onUpdateProfile={handleUpdateProfile}
            />
          )}
            </>
          )}
        </div>

      </main>

      {/* Ticket Details & Resolution Modal */}
      {selectedTicket && (
        <SupportTicketModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          authHeaders={authHeaders}
          onTicketUpdated={(updatedTicket) => {
            setTickets(prev => prev.map(t => (t.ticketId || t.id) === (updatedTicket.ticketId || updatedTicket.id) ? updatedTicket : t));
            setSelectedTicket(updatedTicket);
          }}
        />
      )}

      {/* Module 7 & Proposed Work: Floating Self-Service AI Chatbot Assistant */}
      <ChatbotAssistant authHeaders={authHeaders} />

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .page-layout {
    display: flex;
    height: 100vh;
    width: 100vw;
    background: var(--bg-app);
    color: var(--text-primary);
    overflow: hidden;
  }

  .nav-panel {
    width: 260px;
    background: rgba(16, 12, 26, 0.95);
    border-right: 1px solid rgba(139, 92, 246, 0.2);
    box-shadow: 6px 0 25px rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(25px);
    -webkit-backdrop-filter: blur(25px);
    display: flex;
    flex-direction: column;
    padding: 24px 16px;
    flex-shrink: 0;
    z-index: 10;
    transition: width 0.28s cubic-bezier(0.4, 0, 0.2, 1), padding 0.28s cubic-bezier(0.4, 0, 0.2, 1), background var(--theme-transition), border-color var(--theme-transition);
  }

  .nav-panel.collapsed {
    width: 76px;
    padding: 24px 10px;
  }

  .nav-panel.collapsed .brand-header {
    justify-content: center;
    margin-bottom: 24px;
    flex-direction: column;
    gap: 12px;
    padding-left: 0;
  }

  .nav-panel.collapsed .brand-header-left {
    justify-content: center;
    cursor: pointer;
  }

  .nav-panel.collapsed .sidebar-collapse-btn {
    margin: 0 auto;
  }

  .nav-panel.collapsed .tab-btn {
    justify-content: center;
    padding: 12px 0;
    position: relative;
    border-left: none !important;
  }

  .nav-panel.collapsed .tab-btn.active {
    border-radius: var(--radius-sm);
    background: rgba(139, 92, 246, 0.22);
    box-shadow: 0 0 14px rgba(139, 92, 246, 0.35);
  }

  .nav-panel.collapsed .tab-dot {
    position: absolute;
    top: 6px;
    right: 14px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #ef4444;
    box-shadow: 0 0 6px #ef4444;
  }

  .sidebar-footer.collapsed .engineer-user-card {
    flex-direction: column;
    gap: 8px;
    align-items: center;
    justify-content: center;
    padding: 6px 0;
  }

  .light .nav-panel {
    background: #e2e8f0;
    border-right: 1px solid #cbd5e1;
    box-shadow: 6px 0 24px rgba(0, 0, 0, 0.08);
  }

  .brand-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 28px;
    padding-left: 4px;
  }

  .brand-header-left {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
  }

  .sidebar-collapse-btn {
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 6px;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .sidebar-collapse-btn:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
    border-color: var(--accent-purple);
  }

  .brand-badge-box {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: rgba(139, 92, 246, 0.15);
    border: 1px solid rgba(139, 92, 246, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .brand-meta h2 {
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--text-primary);
    margin: 0;
    line-height: 1.1;
  }

  .brand-meta p {
    font-size: 0.72rem;
    color: var(--accent-cyan);
    font-weight: 700;
    letter-spacing: 0.05em;
    margin: 0;
    text-transform: uppercase;
  }

  .tab-menu {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
  }

  .tab-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-radius: var(--radius-sm);
    background: transparent;
    border: none;
    color: var(--text-secondary);
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    position: relative;
  }

  .tab-btn:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .tab-btn.active {
    background: rgba(139, 92, 246, 0.16);
    color: #d8b4fe;
    border-left: 3.5px solid #8b5cf6;
    box-shadow: 0 4px 14px rgba(139, 92, 246, 0.2);
  }

  .light .tab-btn.active {
    background: #ffffff;
    color: #6d28d9;
    border-left: 3.5px solid #7c3aed;
    box-shadow: 0 4px 14px rgba(124, 58, 237, 0.15);
  }

  .tab-badge {
    margin-left: auto;
    background: #ef4444;
    color: white;
    font-size: 0.7rem;
    font-weight: 800;
    padding: 2px 7px;
    border-radius: 99px;
  }

  .tab-dot {
    margin-left: auto;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--accent-purple);
  }

  .sidebar-footer {
    padding-top: 16px;
    border-top: 1px solid var(--border);
  }

  .engineer-user-card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px;
    border-radius: var(--radius-sm);
  }

  .user-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--accent-purple), var(--accent-cyan));
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 0.95rem;
  }

  .user-info { flex: 1; overflow: hidden; }
  .user-name { font-size: 0.85rem; font-weight: 700; color: var(--text-primary); text-overflow: ellipsis; white-space: nowrap; overflow: hidden; }
  .user-dept { font-size: 0.72rem; color: var(--text-muted); text-overflow: ellipsis; white-space: nowrap; overflow: hidden; }

  .logout-icon-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 6px;
    border-radius: 6px;
    transition: all 0.2s;
  }
  .logout-icon-btn:hover { color: #ef4444; background: rgba(239, 68, 68, 0.1); }

  .content-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .panel-header {
    height: 70px;
    padding: 0 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--border);
    background: var(--bg-panel);
    backdrop-filter: blur(20px);
  }

  .panel-header h3 {
    font-size: 0.85rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    color: var(--text-primary);
    margin: 0;
  }

  .header-subtitle {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.78rem;
    color: var(--text-muted);
    margin-top: 2px;
  }

  .live-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #10b981;
    box-shadow: 0 0 8px #10b981;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .icon-action-btn {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: var(--bg-card);
    border: 1px solid var(--border);
    color: var(--text-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    position: relative;
    transition: all 0.2s;
  }

  .icon-action-btn:hover {
    border-color: var(--border-glow);
    background: var(--bg-hover);
  }

  .bell-dot {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #ef4444;
  }

  .profile-pill-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 12px 4px 4px;
    border-radius: 99px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    font-size: 0.82rem;
    font-weight: 600;
  }

  .user-avatar-sm {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--accent-purple);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 0.8rem;
  }

  .scroll-board {
    flex: 1;
    overflow-y: auto;
    padding: 32px;
  }
`;
