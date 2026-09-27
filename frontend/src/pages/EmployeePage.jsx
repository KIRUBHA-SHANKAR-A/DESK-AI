import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard, Ticket, PlusCircle, BookOpen, Bell, User, Zap,
  RefreshCw, Sun, Moon, LogOut, CheckCircle2, Clock, AlertTriangle,
  FolderOpen, Search, FileText, X, Send, ShieldCheck, Sparkles,
  ArrowRight, Filter, Paperclip, CheckCheck, AlertCircle, Upload,
  MessageSquare, Eye, Edit3, Trash2, Image, ChevronLeft, ChevronRight, Menu
} from 'lucide-react';

import EmployeeDashboard from '../components/employee/EmployeeDashboard';
import MyTickets from '../components/employee/MyTickets';
import CreateTicket from '../components/employee/CreateTicket';
import KnowledgeBase from '../components/employee/KnowledgeBase';
import Notifications from '../components/employee/Notifications';
import Profile from '../components/employee/Profile';
import TicketDetailModal from '../components/employee/TicketDetailModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import TopHeaderActions from '../components/common/TopHeaderActions';
import { useDepartments, resolveDeptNameFromUser } from '../context/DepartmentContext';
import ChatbotAssistant from '../components/common/ChatbotAssistant';


const poppinsStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
  body, input, button, select, textarea {
    font-family: 'Poppins', sans-serif;
  }
`;

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export default function EmployeePage() {
  const { getDeptName, fetchDepartmentByEmail } = useDepartments();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // ── Global State ──────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('deskai_sidebar_collapsed') === 'true');
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 });
  const [categories, setCategories] = useState([]);
  const [kbArticles, setKbArticles] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('deskai_sidebar_collapsed', String(next));
      return next;
    });
  };

  const token = () => localStorage.getItem('token');
  const authHeaders = useCallback(() => ({
    'Authorization': `Bearer ${token()}`,
    'Content-Type': 'application/json'
  }), []);

  // ── Data Fetching ─────────────────────────────────────────
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    const headers = authHeaders();

    try {
      const [ticketsRes, categoriesRes, kbRes, notifRes] = await Promise.all([
        fetch(`${API_BASE_URL}/tickets/my-tickets`, { headers }).catch(() => null),
        fetch(`${API_BASE_URL}/categories`, { headers }).catch(() => null),
        fetch(`${API_BASE_URL}/knowledge-base`, { headers }).catch(() => null),
        fetch(`${API_BASE_URL}/notifications`, { headers }).catch(() => null),
      ]);

      if (ticketsRes && ticketsRes.ok) {
        const data = await ticketsRes.json();
        const raw = Array.isArray(data) ? data : [];
        const sorted = [...raw].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setTickets(sorted);
        calculateStats(sorted);
      }

      if (categoriesRes && categoriesRes.ok) {
        const data = await categoriesRes.json();
        setCategories(data);
      }

      if (kbRes && kbRes.ok) {
        const data = await kbRes.json();
        setKbArticles(data);
      }

      if (notifRes && notifRes.ok) {
        const data = await notifRes.json();
        setNotifications(data.map(n => ({ ...n, read: n.read ?? n.isRead ?? false })));
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  const calculateStats = (ticketList) => {
    setStats({
      total: ticketList.length,
      open: ticketList.filter(t => (t.status || '').toUpperCase() === 'OPEN').length,
      inProgress: ticketList.filter(t => ['IN_PROGRESS', 'ASSIGNED', 'PENDING', 'WAITING_FOR_USER'].includes((t.status || '').toUpperCase())).length,
      resolved: ticketList.filter(t => ['RESOLVED', 'SOLVED'].includes((t.status || '').toUpperCase())).length,
      closed: ticketList.filter(t => (t.status || '').toUpperCase() === 'CLOSED').length,
    });
  };

  // ── Init ──────────────────────────────────────────────────
  useEffect(() => {
    const userRaw = localStorage.getItem('user');
    const tkn = localStorage.getItem('token');

    if (!tkn || !userRaw) {
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
      fetchDepartmentByEmail(parsed.email, tkn).then(userDept => {
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

    fetchAllData();
  }, [fetchAllData, navigate, fetchDepartmentByEmail]);

  // ── Handlers ──────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleTicketCreated = () => {
    setActiveTab('mytickets');
    fetchAllData();
  };

  const handleCommentAdded = (updatedTicket) => {
    setSelectedTicket(updatedTicket);
    fetchAllData();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = async () => {
    try {
      await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
        method: 'PUT',
        headers: authHeaders(),
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  const markOneRead = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: authHeaders(),
      });
      setNotifications(prev => prev.map(n => n.notificationId === id || n.id === id ? { ...n, read: true } : n));
    } catch {
      setNotifications(prev => prev.map(n => n.notificationId === id || n.id === id ? { ...n, read: true } : n));
    }
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div className={`employee-page-container ${theme === 'light' ? 'light-theme' : 'dark-theme'}`}>

      <style>{poppinsStyle}</style>

      {/* Aurora Backdrop Blurs */}
      <div className="aurora-container">
        <div className="aurora-blur-1" />
        <div className="aurora-blur-2" />
        <div className="aurora-blur-3" />
      </div>

      {/* ── Sidebar ── */}
      <aside className={`nav-panel glass-panel ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="brand-header">
          <div className="brand-header-left" onClick={() => sidebarCollapsed && setSidebarCollapsed(false)}>
            <div className="brand-icon-wrapper" title="DESK AI">
              <Zap className="brand-ico-lucide" size={22} />
            </div>
            {!sidebarCollapsed && (
              <div className="brand-meta">
                <h2>DESK AI</h2>
                <p>Employee Portal</p>
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
            { key: 'create', icon: PlusCircle, label: 'Create Ticket' },
            { key: 'mytickets', icon: Ticket, label: 'My Tickets' },
            { key: 'kb', icon: BookOpen, label: 'Knowledge Base' },
            { key: 'notifications', icon: Bell, label: 'Notifications', badge: unreadCount || null, badgeClass: 'warning' },
            { key: 'profile', icon: User, label: 'Profile' },
          ].map(({ key, icon: Icon, label, badge, badgeClass }) => (
            <button
              key={key}
              id={`tab-${key}`}
              className={`tab-btn ${activeTab === key ? 'active' : ''}`}
              onClick={() => setActiveTab(key)}
              title={sidebarCollapsed ? label : undefined}
            >
              <Icon size={18} className="tab-ico-svg" />
              {!sidebarCollapsed && <span>{label}</span>}
              {badge > 0 && (
                sidebarCollapsed ? (
                  <span className="collapsed-tab-dot" title={`${badge} unread`} />
                ) : (
                  <span className={`tab-badge ${badgeClass || ''}`}>{badge}</span>
                )
              )}
            </button>
          ))}
        </nav>

        {currentUser && (
          <div className={`operator-profile ${sidebarCollapsed ? 'collapsed' : ''}`}>
            <div className="avatar" title={currentUser.name || 'Employee'}>
              {currentUser.name?.[0]?.toUpperCase() || 'E'}
            </div>
            {!sidebarCollapsed && (
              <div className="details">
                <span className="name">{currentUser.name || 'Employee'}</span>
                <span className="role" style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                  {resolveDeptNameFromUser(currentUser, getDeptName) || 'Employee'}
                </span>
              </div>
            )}
            <button className="logout-ico" title="Sign Out" onClick={handleLogout}>
              <LogOut size={16} />
            </button>
          </div>
        )}
      </aside>

      {/* ── Main Content ── */}
      <main className="content-panel">
        <header className="panel-header">
          <div />

          <TopHeaderActions
            currentUser={currentUser}
            notifications={notifications}
            setNotifications={setNotifications}
            onRefresh={fetchAllData}
            onNavigate={setActiveTab}
            authHeaders={authHeaders}
          />
        </header>



        {loading ? (
          <LoadingSpinner text="Fetching your workspace tickets & AI recommendations..." />
        ) : (

          <div className="scroll-board">
            {activeTab === 'dashboard' && (
              <EmployeeDashboard
                stats={stats}
                tickets={tickets}
                unreadCount={unreadCount}
                currentUser={currentUser}
                onNavigate={setActiveTab}
                onSelectTicket={setSelectedTicket}
              />
            )}

            {activeTab === 'create' && (
              <CreateTicket
                categories={categories}
                authHeaders={authHeaders}
                onTicketCreated={handleTicketCreated}
                onSelectKb={setSelectedTicket}
              />
            )}

            {activeTab === 'mytickets' && (
              <MyTickets
                tickets={tickets}
                onSelectTicket={setSelectedTicket}
              />
            )}

            {activeTab === 'kb' && (
              <KnowledgeBase articles={kbArticles} />
            )}

            {activeTab === 'notifications' && (
              <Notifications
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkAllRead={markAllRead}
                onMarkOneRead={markOneRead}
              />
            )}

            {activeTab === 'profile' && (
              <Profile
                currentUser={currentUser}
                stats={stats}
                authHeaders={authHeaders}
              />
            )}
          </div>
        )}
      </main>

      {/* ── Ticket Detail Modal ── */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          authHeaders={authHeaders}
          onCommentAdded={handleCommentAdded}
        />
      )}

      {/* Module 7 & Proposed Work: Floating Self-Service AI Chatbot Assistant */}
      <ChatbotAssistant authHeaders={authHeaders} onTicketCreated={handleTicketCreated} />

      <style>{employeeStyles}</style>
    </div>
  );
}

// ── Scoped Styles ──────────────────────────────────────────
const employeeStyles = `
  .employee-page-container {
    display: flex;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
    background: var(--bg-app);
    color: var(--text-primary);
    position: relative;
    transition: background var(--theme-transition), color var(--theme-transition);
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
    transition: width 0.28s cubic-bezier(0.4, 0, 0.2, 1), padding 0.28s cubic-bezier(0.4, 0, 0.2, 1), background var(--theme-transition), border-color var(--theme-transition), color var(--theme-transition);
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

  .collapsed-tab-dot {
    position: absolute;
    top: 6px;
    right: 14px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #ef4444;
    box-shadow: 0 0 6px #ef4444;
  }

  .nav-panel .tab-btn.active {
    background: rgba(139, 92, 246, 0.16);
    color: #d8b4fe;
    border-left: 3.5px solid #8b5cf6;
    box-shadow: 0 4px 14px rgba(139, 92, 246, 0.2);
  }

  .light-theme .nav-panel {
    background: #e2e8f0;
    border-right: 1px solid #cbd5e1;
    box-shadow: 6px 0 24px rgba(0, 0, 0, 0.08);
  }

  .light-theme .nav-panel .tab-btn {
    color: #334155;
  }

  .light-theme .nav-panel .tab-btn:hover {
    background: #cbd5e1;
    color: #0f172a;
  }

  .light-theme .nav-panel .tab-btn.active {
    background: #ffffff;
    color: #6d28d9;
    border-left: 3.5px solid #7c3aed;
    box-shadow: 0 4px 14px rgba(124, 58, 237, 0.18);
  }

  .brand-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 28px;
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

  .brand-icon-wrapper {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(139, 92, 246, 0.2));
    border: 1px solid rgba(6, 182, 212, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--accent-cyan);
    box-shadow: 0 0 15px rgba(6, 182, 212, 0.2);
    flex-shrink: 0;
  }

  .brand-meta h2 {
    font-size: 1.25rem;
    color: var(--text-primary);
    margin: 0;
    font-weight: 800;
    line-height: 1;
  }

  .brand-meta p {
    font-size: 0.72rem;
    color: var(--text-muted);
    margin: 4px 0 0;
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
    border: none;
    background: transparent;
    color: var(--text-secondary);
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
  }

  .tab-btn:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .tab-btn.active {
    background: rgba(99, 102, 241, 0.15);
    color: var(--accent-cyan);
    border-left: 3px solid var(--accent-cyan);
    box-shadow: 0 4px 12px rgba(6, 182, 212, 0.1);
  }

  .tab-ico-svg { flex-shrink: 0; }

  .tab-badge {
    margin-left: auto;
    background: var(--accent-blue);
    color: white;
    font-size: 0.7rem;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 99px;
  }

  .tab-badge.warning { background: #ef4444; }

  .operator-profile {
    display: flex;
    align-items: center;
    gap: 10px;
    padding-top: 16px;
    border-top: 1px solid var(--border);
    margin-top: 16px;
  }

  .operator-profile .avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--accent-cyan), var(--accent-purple));
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
    font-size: 0.9rem;
  }

  .operator-profile .details {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .operator-profile .name {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .operator-profile .role {
    font-size: 0.68rem;
    color: var(--text-muted);
  }

  .operator-profile.collapsed {
    flex-direction: column;
    padding-top: 14px;
    gap: 8px;
    align-items: center;
  }

  .operator-profile.collapsed .logout-ico {
    margin-top: 2px;
  }

  .logout-ico {
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px;
    border-radius: 6px;
    transition: all 0.2s;
  }

  .logout-ico:hover {
    color: #ef4444;
    background: rgba(239, 68, 68, 0.1);
  }

  .content-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .panel-header {
    padding: 16px 36px;
    border-bottom: 1px solid var(--border);
    background: var(--bg-panel);
    backdrop-filter: blur(20px);
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-height: 60px;
  }

  .review-clearance {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .icon-btn-header {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: var(--bg-hover);
    border: 1px solid var(--border);
    color: var(--text-primary);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .icon-btn-header:hover {
    background: rgba(99, 102, 241, 0.15);
    border-color: var(--accent-cyan);
    color: var(--accent-cyan);
    transform: translateY(-1px);
  }


  .scroll-board {
    padding: 32px 36px;
    overflow-y: auto;
    flex: 1;
  }

  .center-loader {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    font-size: 1rem;
    color: var(--text-muted);
  }

  .spin-icon {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
