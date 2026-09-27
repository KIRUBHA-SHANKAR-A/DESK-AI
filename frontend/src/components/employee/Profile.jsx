import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';
import { getDepartmentName } from '../common/TopHeaderActions';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export default function Profile({ currentUser, stats, authHeaders }) {
  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    department: getDepartmentName(currentUser) || 'IT Support',
    newPassword: ''
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: profileForm.name,
        ...(profileForm.newPassword && { password: profileForm.newPassword })
      };

      const res = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const updated = await res.json();
        localStorage.setItem('user', JSON.stringify(updated));
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="tab-fade">
      <div className="grid-split-2">
        <div className="glass-card profile-card">
          <div className="profile-avatar">{currentUser?.name?.[0]?.toUpperCase() || 'E'}</div>
          <h4>{currentUser?.name || 'Employee Name'}</h4>
          <p className="text-muted-sm">{currentUser?.email}</p>
          <span className="badge-premium badge-p4 mt-2">
            <ShieldCheck size={12} /> ACTIVE EMPLOYEE
          </span>

          <div className="profile-stats-divider">
            <div className="p-stat">
              <span className="val">{stats.total}</span>
              <span className="lbl">Tickets</span>
            </div>
            <div className="p-stat">
              <span className="val">{stats.resolved}</span>
              <span className="lbl">Resolved</span>
            </div>
            <div className="p-stat">
              <span className="val">{stats.open}</span>
              <span className="lbl">Open</span>
            </div>
          </div>
        </div>

        <div className="glass-card">
          <h4 className="mb-4">Account Profile Settings</h4>
          {saveSuccess && (
            <div className="save-success-alert mb-3">
              <CheckCircle2 size={16} /> Profile updated successfully!
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="form-layout">
            <div className="field-group">
              <label>Full Name</label>
              <input
                type="text"
                className="input-premium"
                value={profileForm.name}
                onChange={(e) => setProfileForm(p => ({ ...p, name: e.target.value }))}
                required
              />
            </div>

            <div className="field-group">
              <label>Email Address</label>
              <input
                type="email"
                className="input-premium"
                value={profileForm.email}
                disabled
              />
            </div>

            <div className="field-group">
              <label>Department</label>
              <input
                type="text"
                className="input-premium"
                value={profileForm.department}
                disabled
              />
            </div>

            <div className="field-group">
              <label>Change Password (Optional)</label>
              <input
                type="password"
                className="input-premium"
                placeholder="Leave empty to keep existing password"
                value={profileForm.newPassword}
                onChange={(e) => setProfileForm(p => ({ ...p, newPassword: e.target.value }))}
              />
            </div>

            <button type="submit" className="btn-premium mt-3" disabled={saving}>
              {saving ? 'Saving Changes...' : 'Save Profile Updates'}
            </button>
          </form>
        </div>
      </div>

      <style>{profileStyles}</style>
    </div>
  );
}

const profileStyles = `
  .grid-split-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
  .profile-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 32px 24px;
  }
  .profile-avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--accent-cyan), var(--accent-purple));
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.2rem;
    font-weight: 800;
    color: white;
    margin-bottom: 16px;
  }
  .profile-stats-divider {
    display: flex;
    justify-content: space-around;
    width: 100%;
    border-top: 1px solid var(--border);
    padding-top: 20px;
    margin-top: 24px;
  }
  .p-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .p-stat .val {
    font-size: 1.3rem;
    font-weight: 800;
    color: var(--text-primary);
  }
  .p-stat .lbl {
    font-size: 0.72rem;
    color: var(--text-muted);
  }
  .save-success-alert {
    padding: 10px 14px;
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.4);
    color: #34d399;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.85rem;
  }
  .mb-3 { margin-bottom: 12px; }
  .mb-4 { margin-bottom: 24px; }
  .mt-2 { margin-top: 8px; }
  .mt-3 { margin-top: 16px; }
`;
