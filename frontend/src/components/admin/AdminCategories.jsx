import React, { useState, useEffect } from 'react';
import { Tag, Plus, Edit2, Trash2, CheckCircle2, XCircle, BookOpen, AlertCircle, Check, X } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export default function AdminCategories({ authHeaders }) {
  const [categories, setCategories] = useState([]);
  const [kbArticles, setKbArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [formData, setFormData] = useState({ categoryName: '', description: '', active: true });
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  // Custom in-app delete confirmation modal state
  const [deletingCat, setDeletingCat] = useState(null);
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
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catsRes, kbRes] = await Promise.all([
        fetch(`${API_BASE_URL}/categories`, { headers: getHeaders() }).catch(() => null),
        fetch(`${API_BASE_URL}/knowledge-base`, { headers: getHeaders() }).catch(() => null)
      ]);

      if (catsRes && catsRes.ok) {
        const cats = await catsRes.json();
        setCategories(Array.isArray(cats) ? cats : []);
      }
      if (kbRes && kbRes.ok) {
        const kb = await kbRes.json();
        setKbArticles(Array.isArray(kb) ? kb : []);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (cat = null) => {
    setModalError('');
    if (cat) {
      setEditingCat(cat);
      setFormData({
        categoryName: cat.categoryName || '',
        description: cat.description || '',
        active: cat.active ?? true
      });
    } else {
      setEditingCat(null);
      setFormData({ categoryName: '', description: '', active: true });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.categoryName.trim()) return;

    setSaving(true);
    setStatusMsg({ text: '', type: '' });
    setModalError('');

    try {
      const url = editingCat
        ? `${API_BASE_URL}/categories/${editingCat.categoryId}`
        : `${API_BASE_URL}/categories`;
      const method = editingCat ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const savedData = await res.json().catch(() => null);
        setStatusMsg({
          text: `Category "${formData.categoryName}" successfully ${editingCat ? 'updated' : 'created'}!`,
          type: 'success'
        });
        setModalOpen(false);

        // Update local state immediately
        if (editingCat && savedData) {
          setCategories(prev => prev.map(c => c.categoryId === editingCat.categoryId ? savedData : c));
        } else if (savedData) {
          setCategories(prev => [savedData, ...prev]);
        }

        fetchData();
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
    if (!deletingCat) return;
    setDeleting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/categories/${deletingCat.id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setCategories(prev => prev.filter(c => c.categoryId !== deletingCat.id));
        setStatusMsg({ text: `Category "${deletingCat.name}" deleted successfully.`, type: 'success' });
        setDeletingCat(null);
      } else {
        const errData = await res.json().catch(() => ({}));
        setStatusMsg({ text: errData.message || errData.error || `Delete failed (${res.status}).`, type: 'error' });
      }
    } catch (err) {
      setStatusMsg({ text: 'Failed to delete category due to network error.', type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = async (cat) => {
    const updated = { ...cat, active: !cat.active };
    try {
      const res = await fetch(`${API_BASE_URL}/categories/${cat.categoryId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        setCategories(prev => prev.map(c => c.categoryId === cat.categoryId ? updated : c));
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const getKbCountForCategory = (catName) => {
    if (!catName) return 0;
    return kbArticles.filter(k =>
      (k.category?.categoryName || k.category || k.categoryName || '').toLowerCase() === catName.toLowerCase()
    ).length;
  };

  return (
    <div className="tab-fade">
      <div className="glass-card mb-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tag size={24} style={{ color: 'var(--accent-purple)' }} />
              Category Management
            </h3>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Classify tickets, calibrate AI auto-tagging, and link operational categories to the Knowledge Base.
            </p>
          </div>
          <button className="btn-premium" onClick={() => handleOpenModal()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} /> Add Category
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
            <p>Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="empty-state">
            <Tag size={40} className="empty-ico-svg" />
            <p>No ticket categories configured yet.</p>
            <button className="btn-premium mt-3" onClick={() => handleOpenModal()}>
              Create First Category
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table-premium">
              <thead>
                <tr>
                  <th>Category ID</th>
                  <th>Category Name</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Knowledge Base Mapping</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(c => {
                  const kbCount = getKbCountForCategory(c.categoryName);
                  return (
                    <tr key={c.categoryId}>
                      <td><code>#{c.categoryId}</code></td>
                      <td>
                        <div className="title-bold" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Tag size={14} style={{ color: 'var(--accent-purple)' }} />
                          {c.categoryName}
                        </div>
                      </td>
                      <td>
                        <div style={{ maxWidth: '320px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {c.description || 'No description provided.'}
                        </div>
                      </td>
                      <td>
                        <button
                          onClick={() => toggleActive(c)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                          title="Click to toggle status"
                        >
                          {c.active ? (
                            <span className="badge-premium badge-p4" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle2 size={12} /> ACTIVE
                            </span>
                          ) : (
                            <span className="badge-premium badge-p1" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <XCircle size={12} /> INACTIVE
                            </span>
                          )}
                        </button>
                      </td>
                      <td>
                        <span className="badge-premium badge-p3" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <BookOpen size={12} /> {kbCount} KB Article{kbCount !== 1 ? 's' : ''} Linked
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="btn-action btn-edit-cat"
                            onClick={() => handleOpenModal(c)}
                            title="Edit Category"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="btn-action btn-reject"
                            onClick={() => setDeletingCat({ id: c.categoryId, name: c.categoryName })}
                            title="Delete Category"
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
          <div className="modal-card glass-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', width: '92%' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.15rem' }}>
                <Tag size={20} style={{ color: 'var(--accent-purple)' }} />
                {editingCat ? 'Edit Category' : 'Create New Category'}
              </h4>
              <button className="btn-icon" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  className="input-premium"
                  style={{ width: '100%' }}
                  placeholder="e.g., Software & Licensing"
                  value={formData.categoryName}
                  onChange={e => setFormData({ ...formData, categoryName: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
                  Description
                </label>
                <textarea
                  className="input-premium"
                  rows={3}
                  style={{ width: '100%', resize: 'vertical' }}
                  placeholder="Scope and purpose of this issue category..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="categoryActive"
                  checked={formData.active}
                  onChange={e => setFormData({ ...formData, active: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent-purple)', cursor: 'pointer' }}
                />
                <label htmlFor="categoryActive" style={{ fontSize: '0.88rem', cursor: 'pointer', userSelect: 'none', color: 'var(--text-primary)' }}>
                  Enable Category for Ticket Routing & Self-Service
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
                  {saving ? 'Saving...' : editingCat ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCat && (
        <div className="modal-backdrop" onClick={() => !deleting && setDeletingCat(null)}>
          <div className="modal-card glass-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px', width: '92%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div className="delete-icon-wrapper">
                <Trash2 size={20} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)' }}>Delete Category</h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Irreversible Action</p>
              </div>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: '0 0 20px 0' }}>
              Are you sure you want to permanently delete <strong style={{ color: 'var(--text-primary)' }}>{deletingCat.name}</strong>? Associated tickets and KB articles will be safely unlinked.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn-action"
                onClick={() => setDeletingCat(null)}
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
                {deleting ? 'Deleting...' : 'Delete Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
