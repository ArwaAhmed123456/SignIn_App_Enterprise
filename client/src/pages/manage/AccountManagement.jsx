import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Users, Shield, FileText, CreditCard, ChevronRight, Plus, Trash2, X } from 'lucide-react';
import api from '../../api';

const ROLES = ['superadmin', 'admin', 'viewer'];

const ROLE_COLORS = {
  superadmin: 'bg-purple-100 text-purple-700',
  admin:      'bg-blue-100 text-[#2b4594]',
  viewer:     'bg-slate-100 text-slate-600',
};

const MOBILE_ROLES = ['employee', 'guard', 'manager', 'admin'];

// ─── Invite user modal ────────────────────────────────────────────────────────
const InviteModal = ({ onClose, onInvited }) => {
  const [email, setEmail]               = useState('');
  const [firstName, setFirstName]       = useState('');
  const [lastName, setLastName]         = useState('');
  const [organization, setOrganization] = useState('');
  const [role, setRole]                 = useState('admin');
  const [accountType, setAccountType]   = useState('portal'); // portal | mobile
  const [mobileRole, setMobileRole]     = useState('guard');
  const [siteId, setSiteId]             = useState('');
  const [sites, setSites]               = useState([]);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState('');
  const [createdCreds, setCreatedCreds] = useState(null);

  useEffect(() => {
    api.get('/projects').then(r => setSites(r.data || [])).catch(() => {});
  }, []);

  const handleCreate = async () => {
    if (!email.trim()) { setError('Email is required'); return; }
    setSaving(true); setError('');
    try {
      if (accountType === 'portal') {
        // Create portal (web dashboard) account
        const res = await api.post('/auth/invite', {
          email: email.trim(), role,
          first_name: firstName.trim() || undefined,
          last_name:  lastName.trim()  || undefined,
          organization: organization.trim() || undefined,
          send_email: true,
        });
        setCreatedCreds({ email: email.trim(), password: res.data.password, role, type: 'Portal account' });
        onInvited({ email: email.trim(), role });
      } else {
        // Create mobile app account (Guard/Manager/Employee)
        const parts = (firstName + ' ' + lastName).trim().split(/\s+/);
        const res = await api.post('/guards/members', {
          first_name: firstName.trim() || email.split('@')[0],
          last_name:  lastName.trim() || undefined,
          email: email.trim(),
          mobileRole,
          role: mobileRole.charAt(0).toUpperCase() + mobileRole.slice(1),
          site_id: siteId || undefined,
          status: 'Current',
          send_welcome: true,
          include_companion: true,
        });
        setCreatedCreds({
          email: email.trim(),
          password: res.data.password || '(sent by welcome email)',
          role: mobileRole,
          type: 'Mobile app account',
          note: 'Welcome email with companion code sent to their inbox.',
        });
        onInvited({ email: email.trim(), role: mobileRole, status: 'invited' });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create account');
    } finally { setSaving(false); }
  };

  // Step 2 — show credentials
  if (createdCreds) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">✓ {createdCreds.type} created</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
            <p className="text-sm font-bold text-green-800">Share these credentials with the user:</p>
            <div>
              <p className="text-xs text-green-600 font-semibold mb-1">EMAIL</p>
              <p className="font-mono text-sm bg-white border border-green-200 rounded-lg px-3 py-2 select-all">{createdCreds.email}</p>
            </div>
            <div>
              <p className="text-xs text-green-600 font-semibold mb-1">PASSWORD</p>
              <p className="font-mono text-sm bg-white border border-green-200 rounded-lg px-3 py-2 select-all font-bold tracking-wider">{createdCreds.password}</p>
            </div>
            <div>
              <p className="text-xs text-green-600 font-semibold mb-1">ROLE</p>
              <p className="text-sm font-semibold capitalize text-slate-800">{createdCreds.role}</p>
            </div>
          </div>
          {createdCreds.note && (
            <p className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">{createdCreds.note}</p>
          )}
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            ⚠ Copy these credentials now — the password will not be shown again.
          </p>
        </div>
        <div className="flex justify-end px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-5 py-2 bg-[#2b4594] hover:bg-[#1e326e] text-white rounded-lg text-sm font-semibold">Done</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Create account</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Account type toggle */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Account type</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: 'portal', label: 'Portal (Web)', desc: 'Access the admin dashboard' },
                { val: 'mobile', label: 'Mobile App',   desc: 'Guard / Manager / Employee' },
              ].map(({ val, label, desc }) => (
                <button key={val} type="button" onClick={() => setAccountType(val)}
                  className={`text-left px-4 py-3 rounded-xl border-2 transition-colors ${accountType === val ? 'border-[#2b4594] bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <p className={`text-sm font-semibold ${accountType === val ? 'text-[#2b4594]' : 'text-slate-800'}`}>{label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">First name</label>
              <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="John"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Last name</label>
              <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Smith"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]" />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Email address <span className="text-red-500">*</span></label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@company.com"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]" />
          </div>

          {/* Portal-specific fields */}
          {accountType === 'portal' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Organization</label>
                <input value={organization} onChange={e => setOrganization(e.target.value)} placeholder="IB Vogt - Horton Solar Farm"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Portal role</label>
                <select value={role} onChange={e => setRole(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]">
                  <option value="admin">Admin — manage their own site</option>
                  <option value="superadmin">Superadmin — full access to all sites</option>
                </select>
              </div>
            </>
          )}

          {/* Mobile-specific fields */}
          {accountType === 'mobile' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Mobile app role</label>
                <select value={mobileRole} onChange={e => setMobileRole(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]">
                  <option value="guard">Security Guard — sign in/out visitors, run evacuations</option>
                  <option value="manager">Manager — view on-site people, receive notifications</option>
                  <option value="employee">Employee — sign self in/out, view calendar</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Assign to site</label>
                <select value={siteId} onChange={e => setSiteId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]">
                  <option value="">Select site…</option>
                  {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  {sites.length === 0 && <option disabled>No sites found — create one in Manage → Sites</option>}
                </select>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
                A welcome email with the companion app activation code will be sent to their email address.
              </div>
            </>
          )}

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
          <button onClick={handleCreate} disabled={saving}
            className="px-5 py-2 bg-[#2b4594] hover:bg-[#1e326e] disabled:opacity-60 text-white rounded-lg text-sm font-semibold">
            {saving ? 'Creating…' : 'Create account'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Create mobile user modal (Guard/Manager) ─────────────────────────────────
const MobileUserModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', mobileRole: 'guard', site_id: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [sites, setSites] = useState([]);

  useEffect(() => {
    api.get('/projects').then(res => setSites(res.data || [])).catch(() => setSites([]));
  }, []);

  const handleCreate = async () => {
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSaving(true); setError('');
    try {
      const parts = form.name.trim().split(/\s+/);
      const res = await api.post('/guards/members', {
        first_name: parts[0],
        last_name: parts.slice(1).join(' ') || undefined,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        mobileRole: form.mobileRole,
        role: form.mobileRole === 'guard' ? 'Guard' : form.mobileRole === 'manager' ? 'Manager' : 'Employee',
        site_id: form.site_id || undefined,
        status: 'Current',
      });
      onCreated(res.data.member);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Create mobile app user</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Full name <span className="text-red-500">*</span></label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="John Smith"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="john@company.com"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Phone</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="+44 7700 900000"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Mobile App Role</label>
            <select value={form.mobileRole} onChange={e => setForm(f => ({ ...f, mobileRole: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]">
              {MOBILE_ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
            <div className="mt-2 text-xs text-slate-500 space-y-1">
              <p><strong>Guard</strong> — sign in/out visitors, run evacuations</p>
              <p><strong>Manager</strong> — view on-site people, receive notifications</p>
              <p><strong>Employee</strong> — sign self in/out, view calendar</p>
              <p><strong>Admin</strong> — full mobile app access</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Site</label>
            <select value={form.site_id} onChange={e => setForm(f => ({ ...f, site_id: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]">
              <option value="">Select site…</option>
              {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              {sites.length === 0 && <option disabled>No sites found — create one in Manage → Sites</option>}
            </select>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
          <button onClick={handleCreate} disabled={saving}
            className="px-5 py-2 bg-[#2b4594] hover:bg-[#1e326e] disabled:opacity-60 text-white rounded-lg text-sm font-semibold">
            {saving ? 'Creating…' : 'Create user'}
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
  const adminRole = localStorage.getItem('adminRole') || '';
  const [activeSection, setActiveSection] = useState('overview');
  const [showInvite, setShowInvite] = useState(false);
  const [showMobileUser, setShowMobileUser] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (activeSection === 'users') {
      fetchUsers();
    }
  }, [activeSection]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const [adminsRes, membersRes] = await Promise.all([
        api.get('/auth/admins'),
        api.get('/guards/members')
      ]);
      const admins = adminsRes.data.map(a => ({ id: a._id, name: a.first_name ? `${a.first_name} ${a.last_name || ''}`.trim() : a.email?.split('@')[0] || 'Unknown', email: a.email, role: a.role, status: 'active', isPortal: true }));
      const members = membersRes.data
        .filter(m => ['guard', 'manager', 'employee'].includes((m.role || '').toLowerCase()))
        .map(m => ({
          id: m.id || m._id,
          name: m.name || m.first_name || m.email?.split('@')[0] || 'Unknown',
          email: m.email || 'No email',
          role: (m.role || '').toLowerCase(),
          status: (m.status || 'current').toLowerCase(),
          isPortal: false,
          site: m.site || ''
        }));
      
      // Filter out superadmin if current user is not superadmin (though only superadmin should be here normally)
      setUsers([...admins, ...members].filter(u => adminRole === 'superadmin' || u.role !== 'superadmin'));
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  if (adminRole !== 'superadmin') {
    return <Navigate to="/admin/manage/sites" replace />;
  }

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
        <SectionCard icon={Shield}      title="Mobile app users"      desc="Create Guard, Manager, and Employee accounts for the companion app" onClick={() => setShowMobileUser(true)} />
        <SectionCard icon={Shield}      title="Roles and permissions" desc="Set up different user roles and what they can do"  onClick={() => setActiveSection('roles')} />
        <SectionCard icon={CreditCard}  title="Subscription details"  desc="Plans and payment details"                        onClick={() => setActiveSection('billing')} />
        <SectionCard icon={FileText}    title="Audit log"             desc="Record of system activity and events"              onClick={() => setActiveSection('audit')} />
      </div>
      {showMobileUser && <MobileUserModal onClose={() => setShowMobileUser(false)} onCreated={(member) => console.log('Created mobile user:', member)} />}
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
              <th className="px-5 py-3 text-left">Name</th>
              <th className="px-5 py-3 text-left">Email</th>
              <th className="px-5 py-3 text-left">Role</th>
              <th className="px-5 py-3 text-left">Type</th>
              <th className="px-5 py-3 text-left">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loadingUsers ? (
              <tr>
                <td colSpan="6" className="px-5 py-8 text-center text-slate-400">Loading accounts...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-5 py-8 text-center text-slate-400">No accounts found.</td>
              </tr>
            ) : (
              users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 group">
                  <td className="px-5 py-3 text-slate-800 font-medium">{u.name || '--'}</td>
                  <td className="px-5 py-3 text-slate-800">{u.email}</td>
                  <td className="px-5 py-3">
                    {u.isPortal ? (
                      <select value={u.role} onChange={e => changeRole(u.id, e.target.value)}
                        className="border border-slate-200 rounded-md px-2 py-1 text-xs focus:outline-none focus:border-[#2b4594] bg-white">
                        {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                      </select>
                    ) : (
                      <span className="capitalize">{u.role}</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.isPortal ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {u.isPortal ? 'Portal' : 'Mobile App'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                      u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>{u.status}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {u.role !== 'superadmin' && (
                      <button onClick={() => removeUser(u.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100" title="Remove account">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
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
