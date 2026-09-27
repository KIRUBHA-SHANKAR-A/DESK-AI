import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, Trash2, Mail, Users, Check, X, AlertCircle } from 'lucide-react';
import { useDepartments } from '../../context/DepartmentContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export default function AdminDepartments({ authHeaders, users = [] }) {
  const { refreshDepartments } = useDepartments?.() || {};
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({ departmentName: '', email: '', description: '' });
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  
  // Custom in-app delete confirmation modal state
  const [deletingDept, setDeletingDept] = useState(null);
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
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/departments`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setDepartments(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load departments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (dept = null) => {
    setModalError('');
    if (dept) {
      setEditingDept(dept);
      setFormData({
        departmentName: dept.departmentName || '',
        email: dept.email || '',
        description: dept.description || ''
      });
    } else {
      setEditingDept(null);
      setFormData({ departmentName: '', email: '', description: '' });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.departmentName.trim()) return;

    setSaving(true);
    setStatusMsg({ text: '', type: '' });
    setModalError('');

    try {
      const url = editingDept
        ? `${API_BASE_URL}/departments/${editingDept.departmentId}`
        : `${API_BASE_URL}/departments`;
      const method = editingDept ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const savedData = await res.json().catch(() => null);
        setStatusMsg({
          text: `Department "${formData.departmentName}" successfully ${editingDept ? 'updated' : 'created'}!`,
          type: 'success'
        });
        setModalOpen(false);

        // Update local state immediately
        if (editingDept && savedData) {
          setDepartments(prev => prev.map(d => d.departmentId === editingDept.departmentId ? savedData : d));
        } else if (savedData) {
          setDepartments(prev => [savedData, ...prev]);
        }

        try { sessionStorage.removeItem('desk_ai_departments'); } catch { }
        refreshDepartments?.();
        fetchDepartments();
      } else {
        const errData = await res.json().catch(() => ({}));
        const msg = errData.message || errData.error || `Server returned ${res.status}: ${res.statusText}`;
        setModalError(msg);
        setStatusMsg({ text: msg, type: 'error' });
      }
    } catch (err) {
      const msg = `Network error: ${err.message}`;
      setModalError(msg);
      setStatusMsg({ text: msg, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingDept) return;
    setDeleting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/departments/${deletingDept.id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setDepartments(prev => prev.filter(d => d.departmentId !== deletingDept.id));
        try { sessionStorage.removeItem('desk_ai_departments'); } catch { }
        refreshDepartments?.();
        setStatusMsg({ text: `Department "${deletingDept.name}" deleted successfully.`, type: 'success' });
        setDeletingDept(null);
      } else {
        const errData = await res.json().catch(() => ({}));
        setStatusMsg({ text: errData.message || errData.error || `Delete failed (${res.status}).`, type: 'error' });
      }
    } catch (err) {
      setStatusMsg({ text: 'Failed to delete department due to network error.', type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  // Calculate engineer counts per department
  const getDeptUserCount = (deptId) => {
    return users.filter(u => (u.departmentId || u.department?.departmentId) === deptId).length;
  };

  return (
    <div className="tab-fade">
      <div className="glass-card mb-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={24} style={{ color: 'var(--accent-cyan)' }} />
              Department Management
            </h3>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Manage corporate organizational units, assign ticket routing queues, and oversee staff distribution.
            </p>
          </div>
          <button className="btn-premium" onClick={() => handleOpenModal()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} /> Add Department
          </button>
        </div>

        {statusMsg.text && (
          <div className={`alert-banner ${statusMsg.type === 'success' ? 'alert-success' : 'alert-error'} mt-3`}>
            {statusMsg.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
            <span>{statusMsg.text}</span>
          </div>
        )}
      </div>

      <div className="glass-card">
        {loading ? (
          <div className="empty-state">
            <p>Loading departments...</p>
          </div>
        ) : departments.length === 0 ? (
          <div className="empty-state">
            <Building2 size={40} className="empty-ico-svg" />
            <p>No departments configured yet.</p>
            <button className="btn-premium mt-3" onClick={() => handleOpenModal()}>
              Create First Department
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table-premium">
              <thead>
                <tr>
                  <th>Department Name</th>
                  <th>Contact Email</th>
                  <th>Description</th>
                  <th>Assigned Staff</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.map(d => {
                  const staffCount = getDeptUserCount(d.departmentId);
                  return (
                    <tr key={d.departmentId}>
                      <td>
                        <div className="title-bold" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Building2 size={16} style={{ color: 'var(--accent-cyan)' }} />
                          {d.departmentName}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                          <Mail size={13} />
                          {d.email || 'N/A'}
                        </div>
                      </td>
                      <td>
                        <div style={{ maxWidth: '300px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {d.description || 'No description provided.'}
                        </div>
                      </td>
                      <td>
                        <span className="badge-premium badge-p3" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Users size={12} /> {staffCount} Staff
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="btn-action btn-edit-dept"
                            onClick={() => handleOpenModal(d)}
                            title="Edit Department"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="btn-action btn-reject"
                            onClick={() => setDeletingDept({ id: d.departmentId, name: d.departmentName })}
                            title="Delete Department"
                          >
                            <Trash2 size={14} />
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

      {/* Add / Edit Modal Dialog */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal-card glass-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px', width: '92%' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.15rem' }}>
                <Building2 size={20} style={{ color: 'var(--accent-cyan)' }} />
                {editingDept ? 'Edit Department' : 'Create New Department'}
              </h4>
              <button className="btn-icon" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
                  Department Name *
                </label>
                <input
                  type="text"
                  required
                  className="input-premium"
                  style={{ width: '100%' }}
                  placeholder="e.g., Cloud & Infrastructure Support"
                  value={formData.departmentName}
                  onChange={e => setFormData({ ...formData, departmentName: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
                  Official Email Channel
                </label>
                <input
                  type="email"
                  className="input-premium"
                  style={{ width: '100%' }}
                  placeholder="e.g., cloudsupport@deskai.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
                  Description & Scope
                </label>
                <textarea
                  className="input-premium"
                  rows={3}
                  style={{ width: '100%', resize: 'vertical' }}
                  placeholder="Brief summary of tickets routed to this department..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
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
                  {saving ? 'Saving...' : editingDept ? 'Update Department' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingDept && (
        <div className="modal-backdrop" onClick={() => !deleting && setDeletingDept(null)}>
          <div className="modal-card glass-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px', width: '92%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div className="delete-icon-wrapper">
                <Trash2 size={20} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)' }}>Delete Department</h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Irreversible Action</p>
              </div>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: '0 0 20px 0' }}>
              Are you sure you want to permanently delete <strong style={{ color: 'var(--text-primary)' }}>{deletingDept.name}</strong>? Linked tickets and user assignments will be safely unlinked.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn-action"
                onClick={() => setDeletingDept(null)}
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
                {deleting ? 'Deleting...' : 'Delete Department'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
