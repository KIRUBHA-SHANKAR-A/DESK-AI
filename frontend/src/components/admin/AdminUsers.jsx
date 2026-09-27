import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, UserPlus, Edit2, Trash2, ShieldCheck, ShieldAlert,
  Search, Filter, Mail, Phone, Building2, BadgeCheck, X, AlertCircle, Check, Key, Briefcase
} from 'lucide-react';
import { useDepartments } from '../../context/DepartmentContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export default function AdminUsers({ authHeaders, initialUsers = [], onUsersUpdated }) {
  const { departments = [], getDeptName } = useDepartments?.() || {};
  const [users, setUsers] = useState(initialUsers);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    employeeId: '',
    phone: '',
    designation: '',
    roleName: 'SUPPORT_ENGINEER',
    departmentId: '',
    active: true
  });

  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

  // Delete modal state
  const [deletingUser, setDeletingUser] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token && token !== 'null' && token !== 'undefined' && token.trim() !== '') {
      headers['Authorization'] = `Bearer ${token.trim()}`;
    }
    return headers;
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        const userList = Array.isArray(data) ? data : [];
        setUsers(userList);
        if (onUsersUpdated) onUsersUpdated(userList);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user = null) => {
    setModalError('');
    if (user) {
      setEditingUser(user);
      const userDeptId = user.departmentId || user.department?.departmentId || '';
      const userRole = user.roleName || user.role?.roleName || user.role || 'SUPPORT_ENGINEER';
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '',
        employeeId: user.employeeId || '',
        phone: user.phone || '',
        designation: user.designation || '',
        roleName: userRole.replace('ROLE_', '').toUpperCase(),
        departmentId: userDeptId ? String(userDeptId) : '',
        active: user.active ?? true
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        employeeId: '',
        phone: '',
        designation: '',
        roleName: 'SUPPORT_ENGINEER',
        departmentId: departments.length > 0 ? String(departments[0].departmentId) : '',
        active: true
      });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      setModalError('Full name and corporate email are required.');
      return;
    }

    if (!editingUser && !formData.password.trim()) {
      setModalError('Password is required when provisioning a new user.');
      return;
    }

    setSaving(true);
    setModalError('');
    setStatusMsg({ text: '', type: '' });

    try {
      const url = editingUser
        ? `${API_BASE_URL}/users/${editingUser.userId || editingUser.id}`
        : `${API_BASE_URL}/users`;
      const method = editingUser ? 'PUT' : 'POST';

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        employeeId: formData.employeeId.trim() || null,
        phone: formData.phone.trim() || null,
        designation: formData.designation.trim() || null,
        roleName: formData.roleName,
        departmentId: formData.departmentId ? Number(formData.departmentId) : null,
        active: formData.active
      };

      if (formData.password && formData.password.trim().length > 0) {
        payload.password = formData.password.trim();
      }

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const savedUser = await res.json().catch(() => null);
        setStatusMsg({
          text: `Operator "${formData.name}" successfully ${editingUser ? 'updated' : 'provisioned'}!`,
          type: 'success'
        });
        setModalOpen(false);

        // Instant local state update
        if (editingUser && savedUser) {
          const editId = editingUser.userId || editingUser.id;
          setUsers(prev => prev.map(u => (u.userId || u.id) === editId ? savedUser : u));
        } else if (savedUser) {
          setUsers(prev => [savedUser, ...prev]);
        }

        fetchUsers();
      } else {
        const errData = await res.json().catch(() => ({}));
        const msg = errData.message || errData.error || `Server returned ${res.status}: ${res.statusText}`;
        setModalError(msg);
      }
    } catch (err) {
      setModalError(`Network error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingUser) return;
    setDeleting(true);

    try {
      const userId = deletingUser.userId || deletingUser.id;
      const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      if (res.ok) {
        setUsers(prev => prev.filter(u => (u.userId || u.id) !== userId));
        setStatusMsg({ text: `Operator "${deletingUser.name}" successfully removed.`, type: 'success' });
        setDeletingUser(null);
        if (onUsersUpdated) {
          onUsersUpdated(users.filter(u => (u.userId || u.id) !== userId));
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setStatusMsg({ text: errData.message || errData.error || `Failed to delete user (${res.status}).`, type: 'error' });
      }
    } catch (err) {
      setStatusMsg({ text: 'Network error occurred while deleting user.', type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const userId = user.userId || user.id;
    const nextStatus = !user.active;

    try {
      const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ active: nextStatus })
      });

      if (res.ok) {
        const updated = await res.json().catch(() => ({ ...user, active: nextStatus }));
        setUsers(prev => prev.map(u => (u.userId || u.id) === userId ? { ...u, active: nextStatus } : u));
        setStatusMsg({
          text: `Operator "${user.name}" ${nextStatus ? 'activated' : 'deactivated'} successfully.`,
          type: 'success'
        });
      } else {
        // Fallback to legacy activate/deactivate endpoints
        const endpoint = nextStatus ? 'activate' : 'deactivate';
        const fallbackRes = await fetch(`${API_BASE_URL}/users/${userId}/${endpoint}`, {
          method: 'PUT',
          headers: getHeaders()
        });
        if (fallbackRes.ok) {
          setUsers(prev => prev.map(u => (u.userId || u.id) === userId ? { ...u, active: nextStatus } : u));
          setStatusMsg({
            text: `Operator "${user.name}" ${nextStatus ? 'activated' : 'deactivated'} successfully.`,
            type: 'success'
          });
        }
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const name = (u.name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const empId = (u.employeeId || '').toLowerCase();
      const role = (u.roleName || u.role?.roleName || u.role || '').toUpperCase().replace('ROLE_', '');
      const search = searchTerm.toLowerCase();

      const matchesSearch = !searchTerm || name.includes(search) || email.includes(search) || empId.includes(search);
      const matchesRole = roleFilter === 'ALL' || role === roleFilter;

      const userDeptId = String(u.departmentId || u.department?.departmentId || '');
      const matchesDept = deptFilter === 'ALL' || userDeptId === deptFilter;

      const matchesStatus = statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && Boolean(u.active)) ||
        (statusFilter === 'INACTIVE' && !u.active);

      return matchesSearch && matchesRole && matchesDept && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, deptFilter, statusFilter]);

  const resolveDeptDisplayName = (u) => {
    if (u.departmentName) return u.departmentName;
    if (u.department?.departmentName) return u.department.departmentName;
    const id = u.departmentId || u.department?.departmentId;
    if (id && getDeptName) {
      const name = getDeptName(id);
      if (name) return name;
    }
    const found = departments.find(d => String(d.departmentId) === String(id));
    return found ? found.departmentName : 'Unassigned';
  };

  const getRoleBadgeClass = (roleStr) => {
    const r = (roleStr || '').toUpperCase().replace('ROLE_', '');
    if (r === 'ADMIN') return 'role-badge-admin';
    if (r === 'SUPPORT_ENGINEER') return 'role-badge-engineer';
    return 'role-badge-employee';
  };

  const getRoleDisplayName = (roleStr) => {
    const r = (roleStr || '').toUpperCase().replace('ROLE_', '');
    if (r === 'ADMIN') return 'Administrator';
    if (r === 'SUPPORT_ENGINEER') return 'Support Operator';
    if (r === 'EMPLOYEE') return 'Employee';
    return r;
  };

  return (
    <div className="tab-fade">
      {/* Top Banner & Action Controls */}
      <div className="glass-card mb-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={24} style={{ color: 'var(--accent-purple)' }} />
              Operator Division & User Governance
            </h3>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Provision operator accounts, manage role clearance levels, allocate departmental queues, and control credentials.
            </p>
          </div>
          <button
            className="btn-premium"
            onClick={() => handleOpenModal()}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <UserPlus size={16} /> Add New Operator
          </button>
        </div>

        {statusMsg.text && (
          <div className={`alert-banner ${statusMsg.type === 'success' ? 'alert-success' : 'alert-error'} mt-3`}>
            {statusMsg.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginTop: '18px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border)'
        }}>
          {/* Search Bar */}
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-premium"
              placeholder="Search by name, email, employee ID..."
              style={{ paddingLeft: '36px' }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Role Filter */}
          <div>
            <select
              className="input-premium"
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
            >
              <option value="ALL">All Clearance Roles</option>
              <option value="ADMIN">Administrators</option>
              <option value="SUPPORT_ENGINEER">Support Operators</option>
              <option value="EMPLOYEE">Employees / General Users</option>
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <select
              className="input-premium"
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
            >
              <option value="ALL">All Departments</option>
              {departments.map(d => (
                <option key={d.departmentId} value={String(d.departmentId)}>
                  {d.departmentName}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              className="input-premium"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Account Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Operators Table */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
            Registered Operators & Personnel
          </h4>
          <span className="badge-premium badge-p2">
            {filteredUsers.length} of {users.length} Users Listed
          </span>
        </div>

        {loading ? (
          <div className="empty-state">
            <p>Loading operator directory...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state">
            <Users size={40} className="empty-ico-svg" />
            <p>No operator accounts match the selected filters.</p>
            <button className="btn-premium mt-3" onClick={() => handleOpenModal()}>
              Provision First Operator
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table-premium">
              <thead>
                <tr>
                  <th>Operator Profile</th>
                  <th>Contact Email</th>
                  <th>Employee ID</th>
                  <th>Department Allocation</th>
                  <th>Clearance Level</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => {
                  const roleName = u.roleName || u.role?.roleName || u.role || 'EMPLOYEE';
                  const initials = (u.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

                  return (
                    <tr key={u.userId || u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-cyan))',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {initials}
                          </div>
                          <div>
                            <div className="title-bold" style={{ color: 'var(--text-primary)' }}>
                              {u.name || 'Unnamed Operator'}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {u.designation || 'Operational Staff'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                          <Mail size={13} />
                          {u.email || 'N/A'}
                        </div>
                        {u.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            <Phone size={11} />
                            {u.phone}
                          </div>
                        )}
                      </td>
                      <td>
                        <code>{u.employeeId || '—'}</code>
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                          <Building2 size={13} style={{ color: 'var(--accent-cyan)' }} />
                          {resolveDeptDisplayName(u)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge-premium ${getRoleBadgeClass(roleName)}`}>
                            {getRoleDisplayName(roleName)}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggleStatus(u)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            display: 'inline-flex'
                          }}
                          title={`Click to ${u.active ? 'deactivate' : 'activate'} account`}
                        >
                          <span className={`badge-premium ${u.active ? 'badge-p4' : 'badge-p1'}`}>
                            {u.active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            className="btn-action btn-edit-user"
                            onClick={() => handleOpenModal(u)}
                            title="Edit Operator Profile"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="btn-action btn-reject"
                            onClick={() => setDeletingUser(u)}
                            title="Remove Operator Account"
                          >
                            <Trash2 size={14} />
                          </button>
                          <button
                            className="btn-action"
                            style={{
                              padding: '5px 8px',
                              fontSize: '0.75rem',
                              color: u.active ? '#ef4444' : '#10b981'
                            }}
                            onClick={() => handleToggleStatus(u)}
                            title={u.active ? 'Deactivate user' : 'Activate user'}
                          >
                            {u.active ? <ShieldAlert size={13} /> : <ShieldCheck size={13} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Operator Modal Dialog */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal-card glass-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px', width: '92%' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.15rem' }}>
                <Users size={20} style={{ color: 'var(--accent-purple)' }} />
                {editingUser ? 'Edit Operator Profile' : 'Provision New Operator Account'}
              </h4>
              <button className="btn-icon" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-premium"
                    placeholder="e.g., Sarah Connor"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
                    Corporate Email *
                  </label>
                  <input
                    type="email"
                    required
                    className="input-premium"
                    placeholder="e.g., sconnor@deskai.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
                    {editingUser ? 'Password (Leave blank to keep)' : 'Initial Password *'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="password"
                      required={!editingUser}
                      className="input-premium"
                      placeholder={editingUser ? '••••••••' : 'Minimum 6 characters'}
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
                    Employee / Operator ID
                  </label>
                  <input
                    type="text"
                    className="input-premium"
                    placeholder="e.g., EMP-1048"
                    value={formData.employeeId}
                    onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
                    Clearance Role *
                  </label>
                  <select
                    className="input-premium"
                    value={formData.roleName}
                    onChange={e => setFormData({ ...formData, roleName: e.target.value })}
                  >
                    <option value="SUPPORT_ENGINEER">Support Operator (Engineer)</option>
                    <option value="ADMIN">System Administrator</option>
                    <option value="EMPLOYEE">General Employee / User</option>
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
                    Assigned Department Queue
                  </label>
                  <select
                    className="input-premium"
                    value={formData.departmentId}
                    onChange={e => setFormData({ ...formData, departmentId: e.target.value })}
                  >
                    <option value="">Unassigned (General Pool)</option>
                    {departments.map(d => (
                      <option key={d.departmentId} value={String(d.departmentId)}>
                        {d.departmentName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
                    Job Title / Designation
                  </label>
                  <input
                    type="text"
                    className="input-premium"
                    placeholder="e.g., Tier-2 Cloud Operations"
                    value={formData.designation}
                    onChange={e => setFormData({ ...formData, designation: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    className="input-premium"
                    placeholder="e.g., +1 (555) 019-2834"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  id="userActiveCheck"
                  checked={formData.active}
                  onChange={e => setFormData({ ...formData, active: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent-purple)', cursor: 'pointer' }}
                />
                <label htmlFor="userActiveCheck" style={{ fontSize: '0.88rem', cursor: 'pointer', userSelect: 'none', color: 'var(--text-primary)' }}>
                  Enable Operator Account (Immediate System Access)
                </label>
              </div>

              {modalError && (
                <div className="alert-banner alert-error" style={{ padding: '8px 12px', fontSize: '0.82rem', marginTop: '4px' }}>
                  <AlertCircle size={15} />
                  <span>{modalError}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
                <button type="button" className="btn-action" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-premium" disabled={saving}>
                  {saving ? 'Processing...' : editingUser ? 'Update Operator Profile' : 'Provision Operator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingUser && (
        <div className="modal-backdrop" onClick={() => !deleting && setDeletingUser(null)}>
          <div className="modal-card glass-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px', width: '92%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div className="delete-icon-wrapper">
                <Trash2 size={20} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)' }}>Remove Operator</h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Permanent Account Removal</p>
              </div>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: '0 0 20px 0' }}>
              Are you sure you want to permanently delete <strong style={{ color: 'var(--text-primary)' }}>{deletingUser.name}</strong> ({deletingUser.email})? Associated ticket history and assignments will be safely unlinked.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn-action"
                onClick={() => setDeletingUser(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-action btn-reject"
                style={{ padding: '8px 16px', border: 'none' }}
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Removing...' : 'Delete Operator'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
