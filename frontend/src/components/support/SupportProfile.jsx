import React, { useState } from 'react';
import { User, Shield, Mail, Building2, CheckCircle2, Lock } from 'lucide-react';
import { getDepartmentName, formatRoleName } from '../common/TopHeaderActions';

export default function SupportProfile({ user, onUpdateProfile }) {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [saved, setSaved] = useState(false);

  const deptName = getDepartmentName(user) || 'IT Support';
  const roleTitle = formatRoleName(user);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdateProfile({ name, email, password });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="tab-fade">
      <div className="glass-card max-width-card">
        <div className="card-header-flex mb-4">
          <div>
            <h4>👤 {roleTitle} Profile</h4>
            <p className="text-muted-xs">Manage your account details & specialization ({deptName})</p>
          </div>
          <span className="badge-premium badge-p3">
            <Building2 size={12} style={{ marginRight: 4 }} /> {deptName}
          </span>
        </div>

        {saved && (
          <div className="alert-success mb-4">
            <CheckCircle2 size={16} /> Profile details updated successfully.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field-group mb-3">
            <label>Full Name</label>
            <div className="input-icon-box">
              <User size={16} className="field-ico" />
              <input
                type="text"
                className="input-premium padded-left"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="field-group mb-3">
            <label>Email Address</label>
            <div className="input-icon-box">
              <Mail size={16} className="field-ico" />
              <input
                type="email"
                className="input-premium padded-left"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="field-group mb-4">
            <label>Change Password (Optional)</label>
            <div className="input-icon-box">
              <Lock size={16} className="field-ico" />
              <input
                type="password"
                className="input-premium padded-left"
                placeholder="Leave blank to keep current password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn-premium">
            Save Profile Changes
          </button>
        </form>
      </div>

      <style>{`
        .max-width-card { max-width: 600px; margin: 0 auto; }
        .card-header-flex { display: flex; justify-content: space-between; align-items: flex-start; }
        .text-muted-xs { font-size: 0.78rem; color: var(--text-muted); }
        .input-icon-box { position: relative; display: flex; align-items: center; }
        .field-ico { position: absolute; left: 14px; color: var(--text-muted); }
        .padded-left { padding-left: 42px; width: 100%; }
        .alert-success { background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.3); color: #34d399; padding: 12px 16px; border-radius: var(--radius-sm); font-size: 0.88rem; display: flex; align-items: center; gap: 8px; }
        .mb-3 { margin-bottom: 16px; }
        .mb-4 { margin-bottom: 24px; }
      `}</style>
    </div>
  );
}
