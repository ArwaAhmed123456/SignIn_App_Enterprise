import React, { useState } from 'react';
import { Users, Shield, FileText, CreditCard, ChevronRight, Plus, Trash2, X } from 'lucide-react';
import api from '../../api';

const ROLES = ['superadmin', 'admin', 'viewer'];

const ROLE_COLORS = {
  superadmin: 'bg-purple-100 text-purple-700',
  admin:      'bg-blue-100 text-[#2b4594]',
  viewer:     'bg-slate-100 text-slate-600',
};

// ─── Invite user modal ────────────────────────────────────────────────────────
const InviteModal = ({ onClose, onInvited }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('admin');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleInvite = async () => {
    if (!email.trim()) { setError('Email is required'); return; }
    setSaving(true); setError('');
    try {
      await api.post('/auth/invite', { email: email.trim(), role });
      onInvited({ email: email.trim(), role });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send invite');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Invite portal user</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Email address <span className="text-red-500">*</span></label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Role</label>
            <select value={role} onChange={e => setRole(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]">
              {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
            <div className="mt-2 text-xs text-slate-500 space-y-1">
              <p><strong>Superadmin</strong> — full access including billing and user management</p>
              <p><strong>Admin</strong> — manage sites, visitors and reports</p>
              <p><strong>Viewer</strong> — read-only access to activity and reports</p>
            </div>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
          <button onClick={handleInvite} disabled={saving}
            className="px-5 py-2 bg-[#2b4594] hover:bg-[#1e326e] disabled:opacity-60 text-white rounded-lg text-sm font-semibold">
            {saving ? 'Inviting…' : 'Send invite'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Section card ─────────────────────────────────────────────────────────────
const SectionCard = ({ icon: Icon, title, desc, onClick }) => (
  <button onClick={onClick}
    className="flex items-center gap-4 w-full text-left px-5 py-4 bg-white rounded-xl border border-slate-200 hover:shadow-sm hover:border-slate-300 transition-all group">
    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-50 transition-colors">
      <Icon size={18} className="text-slate-500 group-hover:text-[#2b4594]" />
    </div>
    <div className="flex-1">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
    </div>
    <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500" />
  </button>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const AccountManagement = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [showInvite, setShowInvite] = useState(false);
  const [users, setUsers] = useState([
    { id: 1, email: 'admin@signinapp.com', role: 'superadmin', status: 'active' },
    { id: 2, email: 'test@tripod.com',     role: 'admin',      status: 'active' },
  ]);

  const addUser = (u) => setUsers(prev => [...prev, { ...u, id: Date.now(), status: 'invited' }]);
  const removeUser = (id) => { if (confirm('Remove this user?')) setUsers(u => u.filter(x => x.id !== id)); };
  const changeRole = (id, role) => setUsers(u => u.map(x => x.id === id ? { ...x, role } : x));

  // Overview
  if (activeSection === 'overview') return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Account management</h1>
      <p className="text-slate-500 text-sm mb-8">Manage subscription, user roles and permissions for your organisation.</p>
      <div className="space-y-3">
        <SectionCard icon={Users}       title="Portal users"         desc="Add and edit users who have access to this portal" onClick={() => setActiveSection('users')} />
        <SectionCard icon={Shield}      title="Roles and permissions" desc="Set up different user roles and what they can do"  onClick={() => setActiveSection('roles')} />
        <SectionCard icon={CreditCard}  title="Subscription details"  desc="Plans and payment details"                        onClick={() => setActiveSection('billing')} />
        <SectionCard icon={FileText}    title="Audit log"             desc="Record of system activity and events"              onClick={() => setActiveSection('audit')} />
      </div>
    </div>
  );

  // Portal users
  if (activeSection === 'users') return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setActiveSection('overview')} className="text-sm text-[#2b4594] hover:underline">← Account management</button>
      </div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Portal users</h1>
          <p className="text-slate-500 text-sm">Add and edit users who have access to this portal.</p>
        </div>
        <button onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#2b4594] hover:bg-[#1e326e] text-white rounded-lg text-sm font-semibold">
          <Plus size={15} /> Invite user
        </button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <tr>
              <th className="px-5 py-3 text-left">Email</th>
              <th className="px-5 py-3 text-left">Role</th>
              <th className="px-5 py-3 text-left">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50 group">
                <td className="px-5 py-3 text-slate-800 font-medium">{u.email}</td>
                <td className="px-5 py-3">
                  <select value={u.role} onChange={e => changeRole(u.id, e.target.value)}
                    className="border border-slate-200 rounded-md px-2 py-1 text-xs focus:outline-none focus:border-[#2b4594] bg-white">
                    {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                  </select>
                </td>
                <td className="px-5 py-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                    u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>{u.status}</span>
                </td>
                <td className="px-5 py-3 text-right">
                  <button onClick={() => removeUser(u.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showInvite && <InviteModal onClose={() => setShowInvite(false)} onInvited={addUser} />}
    </div>
  );

  // Billing
  if (activeSection === 'billing') return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setActiveSection('overview')} className="text-sm text-[#2b4594] hover:underline">← Account management</button>
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Subscription details</h1>
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <p className="text-sm font-semibold text-slate-800">Current plan</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#2b4594] text-white">CORE</span>
              <span className="text-sm text-slate-600">Enterprise</span>
            </div>
          </div>
          <button className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">Upgrade plan</button>
        </div>
        {[['Billing cycle', 'Monthly'], ['Next billing date', '4 Aug 2026'], ['Payment method', 'Visa •••• 4242']].map(([k, v]) => (
          <div key={k} className="flex items-center justify-between">
            <p className="text-sm text-slate-500">{k}</p>
            <p className="text-sm font-semibold text-slate-800">{v}</p>
          </div>
        ))}
        <div className="pt-4 border-t border-slate-100">
          <button className="text-sm text-red-600 hover:underline">Cancel subscription</button>
        </div>
      </div>
    </div>
  );

  // Audit log
  if (activeSection === 'audit') return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setActiveSection('overview')} className="text-sm text-[#2b4594] hover:underline">← Account management</button>
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Audit log</h1>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <tr>
              <th className="px-5 py-3 text-left">Time</th>
              <th className="px-5 py-3 text-left">User</th>
              <th className="px-5 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[
              ['Today 14:32', 'admin@signinapp.com', 'Updated site settings for Tripod'],
              ['Today 12:10', 'admin@signinapp.com', 'Added member: Arwa Ahmed'],
              ['Today 09:05', 'test@tripod.com',     'Started evacuation at My remote site'],
              ['Yesterday',   'admin@signinapp.com', 'Exported attendance report'],
              ['3 Jul 2026',  'admin@signinapp.com', 'Created visitor group: Deliveries'],
            ].map(([time, user, action], i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="px-5 py-3 text-slate-400 text-xs whitespace-nowrap">{time}</td>
                <td className="px-5 py-3 text-slate-600 text-xs">{user}</td>
                <td className="px-5 py-3 text-slate-800 text-sm">{action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Roles
  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setActiveSection('overview')} className="text-sm text-[#2b4594] hover:underline">← Account management</button>
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Roles and permissions</h1>
      <div className="space-y-4">
        {[
          { role: 'superadmin', perms: ['Full access', 'Billing management', 'User management', 'All site settings', 'All reports'] },
          { role: 'admin',      perms: ['Site settings', 'Visitor management', 'People directory', 'Activity reports', 'Attendance reports'] },
          { role: 'viewer',     perms: ['View activity', 'View attendance', 'View people directory'] },
        ].map(({ role, perms }) => (
          <div key={role} className="bg-white rounded-xl border border-slate-200 px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${ROLE_COLORS[role]}`}>{role}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {perms.map(p => (
                <span key={p} className="text-xs px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-full text-slate-600">{p}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AccountManagement;
