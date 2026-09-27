import React, { useState, useEffect } from 'react';
import {
  Settings, Database, Download, Upload, Save, Check,
  AlertCircle, ShieldCheck, Sliders, RefreshCw, Cpu
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export default function AdminSettings({ authHeaders }) {
  const [settings, setSettings] = useState({
    'sla.p1.hours': '4',
    'sla.p2.hours': '12',
    'sla.p3.hours': '24',
    'sla.p4.hours': '48',
    'duplicate.similarity.threshold': '0.80',
    'auto.assignment.enabled': 'true',
    'support.email': 'support@deskai.com',
    'org.name': 'Desk AI Enterprise'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });
  const [restoreStatus, setRestoreStatus] = useState({ text: '', type: '' });
  const [restoring, setRestoring] = useState(false);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token && token !== 'null' && token !== 'undefined' && token.trim() !== '') {
      headers['Authorization'] = `Bearer ${token.trim()}`;
    }
    return headers;
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/system-settings/map`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.error('Failed to load system settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg({ text: '', type: '' });

    try {
      const res = await fetch(`${API_BASE_URL}/system-settings/batch`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(settings)
      });

      if (res.ok) {
        setStatusMsg({ text: 'System configuration settings saved successfully!', type: 'success' });
      } else {
        setStatusMsg({ text: 'Failed to update system settings.', type: 'error' });
      }
    } catch (err) {
      setStatusMsg({ text: 'Network error occurred while saving settings.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Full Database Backup Download
  const handleDownloadBackup = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/backup`, {
        headers: getHeaders()
      });

      if (!res.ok) throw new Error('Backup failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `desk_ai_full_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setStatusMsg({ text: 'Full database snapshot downloaded successfully.', type: 'success' });
    } catch (err) {
      setStatusMsg({ text: 'Backup export failed: ' + err.message, type: 'error' });
    }
  };

  // Restore Database Snapshot
  const handleRestoreFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm(`Are you sure you want to restore data from "${file.name}"? Existing matching entities will be synchronized.`)) {
      e.target.value = '';
      return;
    }

    setRestoring(true);
    setRestoreStatus({ text: '', type: '' });

    try {
      const text = await file.text();
      const payload = JSON.parse(text);

      const res = await fetch(`${API_BASE_URL}/admin/restore`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setRestoreStatus({
          text: `Snapshot successfully restored! Categories restored: ${data.categoriesRestored || 0}, Departments restored: ${data.departmentsRestored || 0}.`,
          type: 'success'
        });
      } else {
        setRestoreStatus({ text: data.error || 'Restore failed.', type: 'error' });
      }
    } catch (err) {
      setRestoreStatus({ text: 'Invalid JSON backup file: ' + err.message, type: 'error' });
    } finally {
      setRestoring(false);
      e.target.value = '';
    }
  };

  return (
    <div className="tab-fade">
      {/* Top Banner */}
      <div className="glass-card mb-4">
        <div>
          <span className="badge-premium badge-p2 mb-1">Module 10</span>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={24} style={{ color: 'var(--accent-cyan)' }} />
            System Governance, AI Parameters & Data Recovery
          </h3>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Configure organizational SLA resolution windows, Sentence-BERT duplicate detection threshold, automated routing heuristics, and database backup snapshots.
          </p>
        </div>

        {statusMsg.text && (
          <div className={`alert-banner ${statusMsg.type === 'success' ? 'alert-success' : 'alert-error'} mt-3`}>
            {statusMsg.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
            <span>{statusMsg.text}</span>
          </div>
        )}
      </div>

      <div className="grid-split-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>
        {/* System Settings Form */}
        <div className="glass-card">
          <h4 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={18} style={{ color: 'var(--accent-cyan)' }} />
            Operational Parameters & SLAs
          </h4>

          {loading ? (
            <div className="empty-state">
              <RefreshCw size={28} className="spin-anim" />
              <p>Loading system parameters...</p>
            </div>
          ) : (
            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                    P1 Critical SLA (Hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="input-premium"
                    style={{ width: '100%' }}
                    value={settings['sla.p1.hours'] || '4'}
                    onChange={e => handleInputChange('sla.p1.hours', e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                    P2 High SLA (Hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="input-premium"
                    style={{ width: '100%' }}
                    value={settings['sla.p2.hours'] || '12'}
                    onChange={e => handleInputChange('sla.p2.hours', e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                    P3 Medium SLA (Hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="input-premium"
                    style={{ width: '100%' }}
                    value={settings['sla.p3.hours'] || '24'}
                    onChange={e => handleInputChange('sla.p3.hours', e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                    P4 Low SLA (Hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="input-premium"
                    style={{ width: '100%' }}
                    value={settings['sla.p4.hours'] || '48'}
                    onChange={e => handleInputChange('sla.p4.hours', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                  Sentence-BERT Duplicate Detection Threshold (0.00 – 1.00)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="range"
                    min="0.50"
                    max="0.99"
                    step="0.01"
                    style={{ flex: 1, accentColor: 'var(--accent-purple)' }}
                    value={settings['duplicate.similarity.threshold'] || '0.80'}
                    onChange={e => handleInputChange('duplicate.similarity.threshold', e.target.value)}
                  />
                  <code style={{ fontSize: '0.9rem', minWidth: '45px' }}>{settings['duplicate.similarity.threshold']}</code>
                </div>
                <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  Cosine similarity cutoff above which tickets are automatically flagged as duplicate candidates.
                </small>
              </div>

              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                  Intelligent Auto-Assignment Engine
                </label>
                <select
                  className="input-premium"
                  style={{ width: '100%' }}
                  value={settings['auto.assignment.enabled'] || 'true'}
                  onChange={e => handleInputChange('auto.assignment.enabled', e.target.value)}
                >
                  <option value="true">Enabled (Auto-route tickets to available engineers)</option>
                  <option value="false">Disabled (Require manual triage & assignment)</option>
                </select>
              </div>

              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                  System Support Channel Email
                </label>
                <input
                  type="email"
                  className="input-premium"
                  style={{ width: '100%' }}
                  value={settings['support.email'] || ''}
                  onChange={e => handleInputChange('support.email', e.target.value)}
                />
              </div>

              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                  Organization / University Name
                </label>
                <input
                  type="text"
                  className="input-premium"
                  style={{ width: '100%' }}
                  value={settings['org.name'] || ''}
                  onChange={e => handleInputChange('org.name', e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn-premium mt-2"
                disabled={saving}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Save size={16} />
                {saving ? 'Saving Parameters...' : 'Save System Settings'}
              </button>
            </form>
          )}
        </div>

        {/* Database Backup & Restore Card */}
        <div className="glass-card flex-column" style={{ justifyContent: 'space-between' }}>
          <div>
            <h4 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={18} style={{ color: 'var(--accent-purple)' }} />
              Database Backup & Disaster Recovery
            </h4>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '18px' }}>
              Export full system state snapshots including tickets, knowledge articles, category mappings, and department hierarchies. Snapshots can be archived or restored across test and production environments.
            </p>

            {restoreStatus.text && (
              <div className={`alert-banner ${restoreStatus.type === 'success' ? 'alert-success' : 'alert-error'} mb-3`}>
                {restoreStatus.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                <span>{restoreStatus.text}</span>
              </div>
            )}

            {/* Backup Action */}
            <div style={{ padding: '16px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <Download size={18} style={{ color: 'var(--accent-cyan)' }} />
                <strong style={{ fontSize: '0.92rem' }}>Export System Snapshot</strong>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
                Download comprehensive JSON database backup containing all active tables.
              </p>
              <button
                className="btn-premium"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onClick={handleDownloadBackup}
              >
                <Download size={16} /> Download Backup (.json)
              </button>
            </div>

            {/* Restore Action */}
            <div style={{ padding: '16px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <Upload size={18} style={{ color: 'var(--accent-purple)' }} />
                <strong style={{ fontSize: '0.92rem' }}>Restore from Snapshot</strong>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
                Upload a previously exported <code>.json</code> snapshot to restore entities.
              </p>
              <label
                className="btn-action"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: restoring ? 'not-allowed' : 'pointer',
                  background: 'rgba(139, 92, 246, 0.2)',
                  color: 'var(--accent-purple)'
                }}
              >
                <Upload size={16} />
                {restoring ? 'Restoring Database...' : 'Select Backup File (.json)'}
                <input
                  type="file"
                  accept=".json"
                  style={{ display: 'none' }}
                  disabled={restoring}
                  onChange={handleRestoreFile}
                />
              </label>
            </div>
          </div>

          <div className="ai-banner mt-4">
            <div className="ai-banner-title">
              <Cpu size={14} /> High-Availability Safety Protocol
            </div>
            <p className="ai-banner-text">
              Database backups are encrypted in transit and all restoration events are logged to the immutable audit trail.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
