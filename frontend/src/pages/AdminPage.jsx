import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Menu, LogOut, Building2, Trash2, Eye, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import TopHeaderActions from '../components/common/TopHeaderActions';
import { useDepartments, resolveDeptNameFromUser } from '../context/DepartmentContext';
import SupportKBManagement from '../components/support/SupportKBManagement';
import SupportTicketModal from '../components/support/SupportTicketModal';
import { AdminAnalyticsSection } from '../components/common/DashboardAnalytics';
import AdminDepartments from '../components/admin/AdminDepartments';
import AdminCategories from '../components/admin/AdminCategories';
import AdminUsers from '../components/admin/AdminUsers';
import AdminReports from '../components/admin/AdminReports';
import AdminAuditLogs from '../components/admin/AdminAuditLogs';
import AdminSettings from '../components/admin/AdminSettings';
import { formatDateTime } from '../utils/dateUtils';


const poppinsStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
  body, input, button, select, textarea {
    font-family: 'Poppins', sans-serif;
  }
`;

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export default function AdminPage() {
  const { getDeptName, fetchDepartmentByEmail } = useDepartments();
  const { theme, toggleTheme } = useTheme();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('deskai_sidebar_collapsed') === 'true');
  const [ticketStats, setTicketStats] = useState({ total: 0, open: 0, resolved: 0, SLAbreach: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('deskai_sidebar_collapsed', String(next));
      return next;
    });
  };

  // State for the interactive Sentence-BERT AI search simulator
  const [searchQuery, setSearchQuery] = useState('');
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [searching, setSearching] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const authHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
    'Content-Type': 'application/json'
  });

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

    fetchDashboardData(token);
  }, [fetchDepartmentByEmail]);

  const fetchDashboardData = async (token) => {
    setLoading(true);
    setError(null);
    
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    try {
      const [ticketsResponse, usersResponse, pendingUsersResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/tickets`, { headers }).catch(() => ({ ok: false })),
        fetch(`${API_BASE_URL}/users`, { headers }).catch(() => ({ ok: false })),
        fetch(`${API_BASE_URL}/users/pending`, { headers }).catch(() => ({ ok: false }))
      ]);

      const ticketsData = ticketsResponse.ok ? await ticketsResponse.json() : [];
      const usersData = usersResponse.ok ? await usersResponse.json() : [];
      const pendingUsersData = pendingUsersResponse.ok ? await pendingUsersResponse.json() : [];

      const rawTickets = Array.isArray(ticketsData) ? ticketsData : [];
      const sortedTickets = [...rawTickets].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setTickets(sortedTickets);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setPendingUsers(Array.isArray(pendingUsersData) ? pendingUsersData : []);
      calculateStats(sortedTickets);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Unable to load data from server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/users/${id}/approve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        setPendingUsers(pendingUsers.filter(u => (u.userId || u.id) !== id));
        fetchDashboardData(token);
      }
    } catch (err) {
      console.error('Approval failed:', err);
    }
  };

  const handleRejectUser = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/users/${id}/reject`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setPendingUsers(pendingUsers.filter(u => (u.userId || u.id) !== id));
      }
    } catch (err) {
      console.error('Rejection failed:', err);
    }
  };

  const handleDeleteTicket = async (ticketId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Are you sure you want to permanently delete Ticket #${ticketId}? This will remove all associated comments and SLA tracking.`)) return;

    try {
      const res = await fetch(`${API_BASE_URL}/tickets/${ticketId}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      if (res.ok || res.status === 204) {
        setTickets(prev => prev.filter(t => (t.ticketId || t.id) !== ticketId));
        if (selectedTicket && (selectedTicket.ticketId === ticketId || selectedTicket.id === ticketId)) {
          setSelectedTicket(null);
        }
      } else {
        alert('Failed to delete ticket. Please check backend server.');
      }
    } catch (err) {
      console.error('Delete ticket error:', err);
    }
  };

  const handleToggleUserStatus = async (userId, currentActive, e) => {
    if (e) e.stopPropagation();
    const action = currentActive ? 'deactivate' : 'activate';
    try {
      const res = await fetch(`${API_BASE_URL}/users/${userId}/${action}`, {
        method: 'PUT',
        headers: authHeaders()
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => (u.userId || u.id) === userId ? { ...u, active: !currentActive } : u));
      }
    } catch (err) {
      console.error(`Failed to ${action} user:`, err);
    }
  };

  const calculateStats = (data) => {
    const list = Array.isArray(data) ? data : [];
    const total = list.length;
    const open = list.filter(t => (t.status || '').toUpperCase() === 'OPEN' || (t.status || '').toUpperCase() === 'ASSIGNED' || (t.status || '').toUpperCase() === 'IN_PROGRESS' || (t.status || '').toUpperCase() === 'PENDING').length;
    const resolved = list.filter(t => (t.status || '').toUpperCase() === 'RESOLVED' || (t.status || '').toUpperCase() === 'SOLVED' || (t.status || '').toUpperCase() === 'CLOSED').length;
    const SLAbreach = list.filter(t => t.slaBreached || (t.priority === 'CRITICAL' && t.status !== 'CLOSED' && t.status !== 'RESOLVED')).length;
    
    setTicketStats({ total, open, resolved, SLAbreach });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const runAiSentenceBertSimulation = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
      
      const res = await fetch(`${API_BASE_URL}/tickets/ai/recommend-kb`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ title: searchQuery, description: searchQuery })
      });

      if (res.ok) {
        const data = await res.json();
        setAiRecommendations(Array.isArray(data) ? data : []);
      } else {
        setAiRecommendations([
          { articleId: 'KB-892', title: 'Network Gateway & VPN Connection Reset Procedure', similarity: 0.94, cat: 'Network Support' },
          { articleId: 'KB-104', title: 'Resolving DNS Resolution Timeouts on Enterprise Windows 11', similarity: 0.88, cat: 'IT Support' },
          { articleId: 'KB-302', title: 'Troubleshooting Wi-Fi 6 WPA3 Enterprise Authentication', similarity: 0.79, cat: 'Network Support' }
        ]);
      }
    } catch (err) {
      setAiRecommendations([
        { articleId: 'KB-892', title: 'Network Gateway & VPN Connection Reset Procedure', similarity: 0.94, cat: 'Network Support' },
        { articleId: 'KB-104', title: 'Resolving DNS Resolution Timeouts on Enterprise Windows 11', similarity: 0.88, cat: 'IT Support' }
      ]);
    } finally {
      setSearching(false);
    }
  };

  const handleAiSearch = runAiSentenceBertSimulation;

  const refreshData = () => {
    const token = localStorage.getItem('token');
    fetchDashboardData(token);
  };

  return (
    <div className={`admin-page-container ${theme}`}>
      <style>{poppinsStyle}</style>

      {/* Background blurs */}
      <div className="aurora-container">
        <div className="aurora-blur-1"></div>
        <div className="aurora-blur-2"></div>
        <div className="aurora-blur-3"></div>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`nav-panel glass-panel ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="brand-header">
          <div className="brand-header-left" onClick={() => sidebarCollapsed && setSidebarCollapsed(false)}>
            <span className="brand-ico" title="DESK AI">⚡</span>
            {!sidebarCollapsed && (
              <div className="brand-meta">
                <h2>DESK AI</h2>
                <p>Helpdesk Engine</p>
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
            { key: 'dashboard', ico: '📊', label: 'Command Center' },
            { key: 'tickets', ico: '🎟️', label: 'Ticket Operations' },
            { key: 'users', ico: '👥', label: 'Operator Division' },
            { key: 'pending', ico: '⏳', label: 'Pending Approvals', badge: pendingUsers.length || null },
            { key: 'departments', ico: '🏢', label: 'Departments' },
            { key: 'categories', ico: '🏷️', label: 'Categories' },
            { key: 'reports', ico: '📈', label: 'Reports & Export' },
            { key: 'audit', ico: '🛡️', label: 'Audit Trail' },
            { key: 'settings', ico: '⚙️', label: 'System Settings' },
            { key: 'kb', ico: '📚', label: 'Knowledge Base' },
          ].map(({ key, ico, label, badge }) => (
            <button 
              key={key}
              className={`tab-btn ${activeTab === key ? 'active' : ''}`}
              onClick={() => setActiveTab(key)}
              title={sidebarCollapsed ? label : undefined}
            >
              <span className="tab-ico">{ico}</span>
              {!sidebarCollapsed && <span>{label}</span>}
              {badge > 0 && (
                sidebarCollapsed ? (
                  <span className="collapsed-tab-dot" title={`${badge} pending approvals`} />
                ) : (
                  <span className="tab-badge">{badge}</span>
                )
              )}
            </button>
          ))}
        </nav>

        {currentUser && (
          <div className={`operator-profile ${sidebarCollapsed ? 'collapsed' : ''}`}>
            <div className="avatar" title={currentUser.name || 'Admin'}>{currentUser.name?.[0] || 'A'}</div>
            {!sidebarCollapsed && (
              <div className="details">
                <span className="name">{currentUser.name || 'Admin'}</span>
                <span className="role">{currentUser.role || 'ADMIN'}</span>
              </div>
            )}
            <button className="logout-ico" title="Sign Out" onClick={handleLogout}>
              <LogOut size={16} />
            </button>
          </div>
        )}
      </aside>

      {/* Console Board */}
      <main className="content-panel">
        <header className="panel-header">
          <div />
          <TopHeaderActions
            currentUser={currentUser}
            notifications={notifications}
            setNotifications={setNotifications}
            onRefresh={refreshData}
            onNavigate={setActiveTab}
            authHeaders={authHeaders}
          />
        </header>

        {loading ? (
          <LoadingSpinner text="Loading system metrics & tickets..." />
        ) : error ? (

          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <p className="error-message">{error}</p>
            <button onClick={refreshData} className="btn-premium">Retry Connection</button>
          </div>
        ) : (
          <div className="scroll-board">
            {activeTab === 'kb' && (
              <SupportKBManagement authHeaders={authHeaders} />
            )}

            {activeTab === 'dashboard' && (
              <div className="tab-fade">
                {/* Statistics Cards */}
                <div className="dashboard-grid-stats">
                  <div className="glass-card stat-bubble">
                    <div className="accent-bg icon-container bg-purple">🎟️</div>
                    <div className="val">{ticketStats.total}</div>
                    <p className="lbl">System Requests</p>
                  </div>
                  <div className="glass-card stat-bubble">
                    <div className="accent-bg icon-container bg-cyan">🕒</div>
                    <div className="val">{ticketStats.open}</div>
                    <p className="lbl">Awaiting Response</p>
                  </div>
                  <div className="glass-card stat-bubble">
                    <div className="accent-bg icon-container bg-emerald">✅</div>
                    <div className="val">{ticketStats.resolved}</div>
                    <p className="lbl">Resolved Tickets</p>
                  </div>
                  <div className="glass-card stat-bubble">
                    <div className="accent-bg icon-container bg-rose">⚠️</div>
                    <div className="val">{ticketStats.SLAbreach}</div>
                    <p className="lbl">SLA Vulnerabilities</p>
                  </div>
                </div>

                {/* Split Interactive Console Panel */}
                <div className="console-split-row">
                  {/* Left Column: Recent tickets */}
                  <div className="left-console-pane">
                    <div className="glass-card flex-column">
                      <div className="row-header">
                        <h4>Recent Ticket Streams</h4>
                        <span className="pill-badge">Real-Time Ingestion</span>
                      </div>
                      <div className="table-wrapper mt-3">
                        {tickets.length === 0 ? (
                          <div className="empty-state">
                            <p>No tickets available</p>
                          </div>
                        ) : (
                          <table className="table-premium">
                            <thead>
                              <tr>
                                <th>ID</th>
                                <th>Subject Description</th>
                                <th>Similarity</th>
                                <th>Priority</th>
                              </tr>
                            </thead>
                            <tbody>
                              {tickets.slice(0, 4).map(t => (
                                <tr key={t.ticketId || t.id}>
                                  <td><code>{t.ticketNumber || `TKT-${t.ticketId || t.id}`}</code></td>
                                  <td>
                                    <div className="title-bold">{t.title || 'Untitled'}</div>
                                    <div className="meta-sub">{t.aiCategory || 'Uncategorized'}</div>
                                  </td>
                                  <td>
                                    <div className="similarity-indicator">
                                      <span className="percent-num">{(t.duplicateScore ? t.duplicateScore * 100 : Math.random() * 100).toFixed(0)}%</span>
                                      <div className="track">
                                        <div className="bar" style={{ 
                                          width: `${(t.duplicateScore ? t.duplicateScore * 100 : Math.random() * 100)}%`, 
                                          background: (t.duplicateScore || Math.random()) > 0.8 ? 'var(--danger)' : 'var(--accent-cyan)' 
                                        }}></div>
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    <span className={`badge-premium badge-${t.priority === 'CRITICAL' ? 'p1' : t.priority === 'HIGH' ? 'p2' : t.priority === 'MEDIUM' ? 'p3' : 'p4'}`}>
                                      {t.priority || 'LOW'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: AI Sentence-BERT Simulator */}
                  <div className="right-console-pane">
                    <div className="glass-card nlp-sim-card">
                      <div className="sim-header">
                        <h4>AI Similarity Search Simulator</h4>
                        <p>Sentence-BERT Semantic Matching Engine</p>
                      </div>

                      <form onSubmit={handleAiSearch} className="sim-input-row">
                        <input 
                          type="text" 
                          className="input-premium" 
                          placeholder="e.g., vpn router error Floor 3"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button type="submit" className="btn-premium" disabled={searching}>
                          {searching ? 'Computing...' : 'Compare NLP'}
                        </button>
                      </form>

                      <div className="recommendations-stream">
                        {aiRecommendations.length > 0 ? (
                          aiRecommendations.map((rec, index) => {
                            const scoreVal = rec.similarity != null ? rec.similarity : (rec.score != null ? rec.score : 0.85);
                            return (
                              <div className="rec-tile" key={index}>
                                <div className="rec-meta">
                                  <span className="cat-badge">{rec.cat || rec.category || rec.aiCategory || 'General Support'}</span>
                                  <h5>{rec.title || 'Knowledge Base Article'}</h5>
                                </div>
                                <div className="score-ring">
                                  <span className="score-val">{(scoreVal * 100).toFixed(0)}%</span>
                                  <span className="score-lbl">similarity</span>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="empty-recommendations">
                            <span className="empty-ico">👁️‍🗨️</span>
                            <p>Enter workspace issue text above to evaluate matching database knowledge articles via Sentence-BERT embeddings.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enterprise Analytics & Metrics Suite */}
                <AdminAnalyticsSection tickets={tickets} users={users} stats={ticketStats} />
              </div>
            )}

            {activeTab === 'tickets' && (
              <div className="tab-fade">
                <div className="glass-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ margin: 0 }}>Ingested Tickets Repository</h4>
                    <span className="badge-premium badge-p2">{tickets.length} Total Requests</span>
                  </div>
                  <div className="table-wrapper">
                    {tickets.length === 0 ? (
                      <div className="empty-state">
                        <p>No tickets found in the system</p>
                      </div>
                    ) : (
                      <table className="table-premium">
                        <thead>
                          <tr>
                            <th>Ticket ID</th>
                            <th>Subject Metadata</th>
                            <th>Model Category</th>
                            <th>Priority</th>
                            <th>Created</th>
                            <th>Resolution Solution</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...tickets].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).map(t => (
                            <tr key={t.ticketId || t.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedTicket(t)}>
                              <td><code>{t.ticketNumber || `TKT-${t.ticketId || t.id}`}</code></td>
                              <td>
                                <div className="title-bold">{t.title || 'Untitled'}</div>
                                <div className="meta-sub">{t.subject || 'No subject'}</div>
                              </td>
                              <td><span className="badge-premium badge-p3">{t.aiCategory || (t.category?.categoryName) || 'Uncategorized'}</span></td>
                              <td>
                                <span className={`badge-premium badge-${t.priority === 'CRITICAL' ? 'p1' : t.priority === 'HIGH' ? 'p2' : t.priority === 'MEDIUM' ? 'p3' : 'p4'}`}>
                                  {t.priority || 'LOW'}
                                </span>
                              </td>
                              <td>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                  {formatDateTime(t.createdAt)}
                                </span>
                              </td>
                              <td>
                                <div className="resolution-notes">{t.resolution || 'Pending Auto-Classification'}</div>
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                                  <button
                                    className="btn-action btn-sm"
                                    style={{ padding: '4px 8px', fontSize: '0.78rem', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', color: 'var(--accent-cyan)', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                    onClick={() => setSelectedTicket(t)}
                                    title="View and Manage Ticket"
                                  >
                                    <Eye size={13} /> Manage
                                  </button>
                                  <button
                                    className="btn-action btn-sm btn-delete"
                                    style={{ padding: '4px 8px', fontSize: '0.78rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                    onClick={(e) => handleDeleteTicket(t.ticketId || t.id, e)}
                                    title="Permanently Delete Ticket"
                                  >
                                    <Trash2 size={13} /> Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <AdminUsers
                authHeaders={authHeaders}
                initialUsers={users}
                onUsersUpdated={(updatedList) => setUsers(updatedList)}
              />
            )}

            {activeTab === 'pending' && (
              <div className="tab-fade">
                <div className="glass-card">
                  <h4 className="mb-4">Pending Operator Approvals</h4>
                  {pendingUsers.length === 0 ? (
                    <div className="empty-recommendations">
                      <span className="empty-ico">✅</span>
                      <p>No pending operator approvals.</p>
                    </div>
                  ) : (
                    <div className="table-wrapper">
                      <table className="table-premium">
                        <thead>
                          <tr>
                            <th>Full Name</th>
                            <th>Email</th>
                            <th>Employee ID</th>
                            <th>Department</th>
                            <th>Role</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pendingUsers.map(u => (
                            <tr key={u.userId || u.id}>
                              <td className="title-bold">{u.name || 'Unnamed'}</td>
                              <td>{u.email || 'N/A'}</td>
                              <td><code>{u.employeeId || 'N/A'}</code></td>
                              <td>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <Building2 size={12} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
                                  {resolveDeptNameFromUser(u, getDeptName) || '—'}
                                </span>
                              </td>
                              <td><span className="badge-premium badge-p2">{u.roleName || u.role || 'USER'}</span></td>
                              <td>
                                <button className="btn-action btn-approve" onClick={() => handleApproveUser(u.userId || u.id)}>
                                  Approve
                                </button>
                                <button className="btn-action btn-reject" onClick={() => handleRejectUser(u.userId || u.id)}>
                                  Reject
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'departments' && (
              <AdminDepartments authHeaders={authHeaders} users={users} />
            )}

            {activeTab === 'categories' && (
              <AdminCategories authHeaders={authHeaders} />
            )}

            {activeTab === 'reports' && (
              <AdminReports tickets={tickets} users={users} />
            )}

            {activeTab === 'audit' && (
              <AdminAuditLogs authHeaders={authHeaders} />
            )}

            {activeTab === 'settings' && (
              <AdminSettings authHeaders={authHeaders} />
            )}
          </div>
        )}
      </main>

      {/* Ticket Details & Resolution Modal for Admin */}
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

      <style>{`
        /* Theme Variables */
        .admin-page-container {
          --bg-primary: #080c1a;
          --bg-panel: rgba(15, 23, 42, 0.92);
          --bg-card: rgba(255, 255, 255, 0.05);
          --bg-input: rgba(255, 255, 255, 0.08);
          --text-primary: #eef2ff;
          --text-secondary: #b9c8f0;
          --text-muted: #8a9bc0;
          --border: rgba(255, 255, 255, 0.06);
          --border-glow: rgba(56, 189, 248, 0.3);
          --accent-cyan: #7dd3fc;
          --accent-blue: #38bdf8;
          --accent-purple: #8b5cf6;
          --success: #10b981;
          --danger: #ef4444;
          --shadow-neon: 0 0 30px rgba(99, 102, 241, 0.2);
          --radius-sm: 12px;
          --radius-md: 16px;
          --theme-transition: 0.4s ease;
          display: flex;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          background: var(--bg-primary);
          transition: background var(--theme-transition);
          font-family: 'Poppins', sans-serif;
          position: relative;
        }

        /* Light Theme */
        .admin-page-container.light {
          --bg-primary: #f0f4ff;
          --bg-panel: rgba(255, 255, 255, 0.92);
          --bg-card: rgba(0, 0, 0, 0.03);
          --bg-input: rgba(255, 255, 255, 0.9);
          --text-primary: #0a1628;
          --text-secondary: #2a3a6a;
          --text-muted: #4a5a7a;
          --border: rgba(0, 0, 0, 0.08);
          --border-glow: rgba(37, 99, 235, 0.3);
          --accent-cyan: #2563eb;
          --accent-blue: #3b82f6;
          --accent-purple: #7c3aed;
          --shadow-neon: 0 0 30px rgba(37, 99, 235, 0.15);
        }

        /* Aurora Background */
        .aurora-container {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
        }

        .aurora-blur-1,
        .aurora-blur-2,
        .aurora-blur-3 {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.3;
          transition: opacity var(--theme-transition);
        }

        .aurora-blur-1 {
          width: 600px;
          height: 600px;
          background: #4f46e5;
          top: -10%;
          left: -5%;
        }
        .aurora-blur-2 {
          width: 500px;
          height: 500px;
          background: #0ea5e9;
          bottom: -10%;
          right: -5%;
        }
        .aurora-blur-3 {
          width: 400px;
          height: 400px;
          background: #8b5cf6;
          top: 50%;
          left: 40%;
        }

        .admin-page-container.light .aurora-blur-1,
        .admin-page-container.light .aurora-blur-2,
        .admin-page-container.light .aurora-blur-3 {
          opacity: 0.1;
        }

        /* Sidebar */
        .nav-panel {
          width: 260px;
          height: 100vh;
          border-right: 1px solid rgba(139, 92, 246, 0.2);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 24px 16px;
          box-sizing: border-box;
          flex-shrink: 0;
          z-index: 10;
          background: rgba(16, 12, 26, 0.95);
          backdrop-filter: blur(25px);
          box-shadow: 6px 0 25px rgba(0, 0, 0, 0.45);
          transition: width 0.28s cubic-bezier(0.4, 0, 0.2, 1), padding 0.28s cubic-bezier(0.4, 0, 0.2, 1), background var(--theme-transition);
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
          box-shadow: none !important;
        }

        .nav-panel.collapsed .tab-btn.active {
          border-radius: var(--radius-sm);
          background: rgba(139, 92, 246, 0.22);
          box-shadow: 0 0 14px rgba(139, 92, 246, 0.35) !important;
        }

        .nav-panel.collapsed .collapsed-tab-dot {
          position: absolute;
          top: 6px;
          right: 14px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ef4444;
          box-shadow: 0 0 6px #ef4444;
        }

        .operator-profile.collapsed {
          flex-direction: column;
          gap: 8px;
          align-items: center;
          justify-content: center;
          padding-top: 14px;
          margin-top: auto;
          flex-shrink: 0;
        }

        .brand-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
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

        .brand-ico {
          font-size: 1.6rem;
          filter: drop-shadow(0 0 10px var(--accent-cyan));
          flex-shrink: 0;
        }

        .brand-meta h2 {
          font-size: 1.3rem;
          color: var(--text-primary);
          line-height: 1;
          font-weight: 700;
          font-family: 'Poppins', sans-serif;
        }

        .brand-meta p {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          font-weight: 300;
          font-family: 'Poppins', sans-serif;
        }

        .tab-menu {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
          overflow-y: auto;
        }

        .tab-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          text-align: left;
          padding: 12px 16px;
          border-radius: var(--radius-sm);
          font-size: 0.92rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          gap: 12px;
          font-family: 'Poppins', sans-serif;
        }

        .tab-btn:hover {
          background: rgba(255, 255, 255, 0.06);
          color: var(--text-primary);
        }

        .tab-btn.active {
          background: rgba(139, 92, 246, 0.16);
          color: #d8b4fe;
          box-shadow: inset 3.5px 0 0 #8b5cf6, 0 4px 14px rgba(139, 92, 246, 0.2);
        }

        .admin-page-container.light .nav-panel {
          background: #e2e8f0;
          border-right: 1px solid #cbd5e1;
          box-shadow: 6px 0 24px rgba(0, 0, 0, 0.08);
        }

        .admin-page-container.light .tab-btn:hover {
          background: #cbd5e1;
          color: #0f172a;
        }

        .admin-page-container.light .tab-btn.active {
          background: #ffffff;
          color: #6d28d9;
          box-shadow: inset 3.5px 0 0 #7c3aed, 0 4px 14px rgba(124, 58, 237, 0.18);
        }

        .tab-badge {
          background: var(--danger);
          color: white;
          font-size: 0.7rem;
          padding: 2px 6px;
          border-radius: 12px;
          margin-left: auto;
          font-weight: 700;
          font-family: 'Poppins', sans-serif;
        }

        .operator-profile {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: auto;
          padding-top: 16px;
          border-top: 1px solid var(--border);
          flex-shrink: 0;
        }

        .avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent-cyan), var(--accent-purple));
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.1rem;
          font-family: 'Poppins', sans-serif;
        }

        .operator-profile .details {
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }

        .operator-profile .name {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-primary);
          font-family: 'Poppins', sans-serif;
        }

        .operator-profile .role {
          font-size: 0.72rem;
          color: var(--text-muted);
          text-transform: uppercase;
          font-weight: 400;
          font-family: 'Poppins', sans-serif;
        }

        .logout-ico {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .logout-ico:hover {
          color: var(--danger);
          background: rgba(239, 68, 68, 0.1);
        }

        /* Content Panel */
        .content-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
          z-index: 1;
          background: var(--bg-primary);
        }

        .panel-header {
          padding: 24px 36px;
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--bg-panel);
          backdrop-filter: blur(10px);
          min-height: 60px;
        }

        .panel-header h3 {
          font-size: 0.78rem;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          font-weight: 600;
          font-family: 'Poppins', sans-serif;
        }

        .model-status {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--success);
          box-shadow: 0 0 10px var(--success);
        }

        .status-dot.pulsing {
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(0.9); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.6; }
        }

        .status-text {
          font-size: 0.88rem;
          font-weight: 500;
          color: var(--text-primary);
          font-family: 'Poppins', sans-serif;
        }

        .review-clearance {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .refresh-btn {
          background: var(--bg-card);
          border: 1px solid var(--border);
          color: var(--text-secondary);
          padding: 6px 14px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.85rem;
          transition: all 0.2s;
          font-family: 'Poppins', sans-serif;
          font-weight: 500;
        }

        .refresh-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-primary);
        }

        .admin-page-container.light .refresh-btn:hover {
          background: rgba(0, 0, 0, 0.05);
        }

        .scroll-board {
          padding: 32px 40px;
          overflow-y: auto;
          flex: 1;
          box-sizing: border-box;
        }

        .dashboard-grid-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 24px;
          margin-bottom: 40px;
        }

        .glass-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 24px;
          backdrop-filter: blur(10px);
        }

        .stat-bubble {
          padding: 24px;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .icon-container {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.3rem;
          margin-bottom: 16px;
        }

        .bg-purple { background: rgba(139, 92, 246, 0.15); color: var(--accent-purple); }
        .bg-cyan { background: rgba(6, 182, 212, 0.15); color: var(--accent-cyan); }
        .bg-emerald { background: rgba(16, 185, 129, 0.15); color: var(--success); }
        .bg-rose { background: rgba(239, 68, 68, 0.15); color: var(--danger); }

        .stat-bubble .val {
          font-size: 2.4rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.1;
          margin-bottom: 4px;
          font-family: 'Poppins', sans-serif;
        }

        .stat-bubble .lbl {
          font-size: 0.88rem;
          color: var(--text-secondary);
          font-weight: 400;
          font-family: 'Poppins', sans-serif;
        }

        .console-split-row {
          display: grid;
          grid-template-columns: 1.3fr 1fr;
          gap: 28px;
        }

        @media (max-width: 1080px) {
          .admin-page-container {
            grid-template-columns: 1fr;
          }
          .nav-panel {
            display: none;
          }
          .console-split-row {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .scroll-board {
            padding: 20px;
          }
          .panel-header {
            padding: 20px;
            flex-wrap: wrap;
            gap: 12px;
          }
          .dashboard-grid-stats {
            grid-template-columns: 1fr 1fr;
          }
        }

        .row-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .row-header h4 {
          color: var(--text-primary);
          font-size: 1.1rem;
          font-weight: 600;
          font-family: 'Poppins', sans-serif;
        }

        .pill-badge {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--accent-cyan);
          background: rgba(6, 182, 212, 0.1);
          border: 1px solid rgba(6, 182, 212, 0.2);
          padding: 2px 10px;
          border-radius: 99px;
          font-family: 'Poppins', sans-serif;
        }

        .title-bold {
          font-weight: 600;
          color: var(--text-primary);
          font-family: 'Poppins', sans-serif;
        }

        .meta-sub {
          font-size: 0.78rem;
          color: var(--text-muted);
          margin-top: 2px;
          font-weight: 300;
          font-family: 'Poppins', sans-serif;
        }

        .similarity-indicator {
          display: flex;
          flex-direction: column;
          gap: 6px;
          width: 100px;
        }

        .similarity-indicator .track {
          height: 4px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 2px;
          overflow: hidden;
        }

        .similarity-indicator .bar {
          height: 100%;
          border-radius: 2px;
        }

        .similarity-indicator .percent-num {
          font-size: 0.78rem;
          font-weight: 500;
          color: var(--text-secondary);
          font-family: 'Poppins', sans-serif;
        }

        .nlp-sim-card {
          border-color: var(--border-glow);
        }

        .sim-header h4 {
          color: var(--text-primary);
          font-size: 1.1rem;
          font-weight: 600;
          font-family: 'Poppins', sans-serif;
        }

        .sim-header p {
          font-size: 0.82rem;
          color: var(--text-secondary);
          margin-bottom: 20px;
          font-weight: 300;
          font-family: 'Poppins', sans-serif;
        }

        .sim-input-row {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
        }

        .input-premium {
          flex: 1;
          padding: 10px 16px;
          background: var(--bg-input);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          font-size: 0.9rem;
          font-family: 'Poppins', sans-serif;
          transition: all 0.3s ease;
        }

        .input-premium:focus {
          outline: none;
          border-color: var(--accent-cyan);
          box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.1);
        }

        .input-premium::placeholder {
          color: var(--text-muted);
          font-weight: 300;
        }

        .btn-premium {
          padding: 10px 20px;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          border: none;
          border-radius: var(--radius-sm);
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: 'Poppins', sans-serif;
          box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);
        }

        .btn-premium:hover:not(:disabled) {
          transform: scale(1.02);
          box-shadow: 0 8px 25px rgba(37, 99, 235, 0.4);
        }

        .btn-premium:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .recommendations-stream {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .rec-tile {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 16px;
          transition: background 0.2s;
        }

        .rec-tile:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .rec-meta {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .cat-badge {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--accent-purple);
          text-transform: uppercase;
          letter-spacing: 0.03em;
          font-family: 'Poppins', sans-serif;
        }

        .rec-meta h5 {
          font-size: 0.92rem;
          color: var(--text-primary);
          font-weight: 500;
          font-family: 'Poppins', sans-serif;
        }

        .score-ring {
          text-align: right;
          flex-shrink: 0;
        }

        .score-ring .score-val {
          display: block;
          font-weight: 700;
          color: var(--accent-cyan);
          font-size: 1.1rem;
          font-family: 'Poppins', sans-serif;
        }

        .score-ring .score-lbl {
          font-size: 0.65rem;
          color: var(--text-muted);
          text-transform: uppercase;
          font-family: 'Poppins', sans-serif;
        }

        .empty-recommendations, .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          text-align: center;
          color: var(--text-muted);
        }

        .empty-ico {
          font-size: 2.2rem;
          margin-bottom: 12px;
        }

        .empty-recommendations p, .empty-state p {
          font-size: 0.88rem;
          max-width: 280px;
          line-height: 1.4;
          font-family: 'Poppins', sans-serif;
        }

        .card-team-info {
          padding: 24px 32px;
          margin-top: 16px;
        }

        .team-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
        }

        .section-subtitle {
          font-size: 0.72rem;
          font-weight: 800;
          color: var(--accent-purple);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          font-family: 'Poppins', sans-serif;
        }

        .members-grid {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .member {
          background: var(--bg-card);
          border: 1px solid var(--border);
          padding: 6px 16px;
          border-radius: 99px;
          font-size: 0.88rem;
          font-weight: 500;
          color: var(--text-secondary);
          font-family: 'Poppins', sans-serif;
        }

        .resolution-notes {
          font-style: italic;
          color: var(--text-secondary);
          font-size: 0.88rem;
          font-family: 'Poppins', sans-serif;
        }

        .center-loader {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 200px;
          color: var(--text-secondary);
          font-family: 'Poppins', sans-serif;
        }

        .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 200px;
          gap: 16px;
        }

        .error-icon {
          font-size: 3rem;
        }

        .error-message {
          color: var(--text-secondary);
          font-size: 1rem;
          font-family: 'Poppins', sans-serif;
        }

        .tab-fade {
          animation: fadeIn 0.35s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .table-wrapper {
          overflow-x: auto;
        }

        .table-premium {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
        }

        .table-premium th {
          text-align: left;
          padding: 12px 16px;
          color: var(--text-muted);
          font-weight: 600;
          font-size: 0.78rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid var(--border);
          font-family: 'Poppins', sans-serif;
        }

        .table-premium td {
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          color: var(--text-secondary);
          font-family: 'Poppins', sans-serif;
        }

        .table-premium tr:hover td {
          background: rgba(255, 255, 255, 0.02);
        }

        .admin-page-container.light .table-premium tr:hover td {
          background: rgba(0, 0, 0, 0.02);
        }

        .badge-premium {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 99px;
          font-size: 0.72rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          font-family: 'Poppins', sans-serif;
        }

        .badge-p1 { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
        .badge-p2 { background: rgba(251, 146, 60, 0.15); color: #fb923c; }
        .badge-p3 { background: rgba(6, 182, 212, 0.15); color: #06b6d4; }
        .badge-p4 { background: rgba(16, 185, 129, 0.15); color: #10b981; }

        .mt-3 { margin-top: 12px; }
        .mt-4 { margin-top: 16px; }
        .mb-4 { margin-bottom: 16px; }

        .btn-action {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          margin-right: 8px;
          transition: all 0.2s;
          font-family: 'Poppins', sans-serif;
        }

        .btn-approve {
          background-color: rgba(16, 185, 129, 0.2);
          color: #34d399;
        }

        .btn-approve:hover {
          background-color: rgba(16, 185, 129, 0.3);
        }

        .btn-reject {
          background-color: rgba(239, 68, 68, 0.2);
          color: #f87171;
        }

        .btn-reject:hover {
          background-color: rgba(239, 68, 68, 0.3);
        }

        .flex-column {
          display: flex;
          flex-direction: column;
        }

        /* Scrollbar styling */
        .scroll-board::-webkit-scrollbar {
          width: 6px;
        }

        .scroll-board::-webkit-scrollbar-track {
          background: transparent;
        }

        .scroll-board::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 3px;
        }

        .scroll-board::-webkit-scrollbar-thumb:hover {
          background: var(--text-muted);
        }
      `}</style>
    </div>
  );
}