import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Filter, Settings, ChevronDown, X, Download,
  UserCircle, Calendar, Archive, Trash2, Clock, History,
  Users, User, Briefcase, MoreHorizontal, UserPlus,
} from 'lucide-react';
import QRCode from 'react-qr-code';
import api from '../api';
import * as XLSX from 'xlsx';

// ─── constants ───────────────────────────────────────────────────────
const TABS = [
  { id: 'current',  label: 'Current',  icon: <UserCircle size={15} /> },
  { id: 'upcoming', label: 'Upcoming', icon: <Calendar   size={15} /> },
  { id: 'archived', label: 'Archived', icon: <Archive    size={15} /> },
];

const STATUS_MAP = { current: 'Current', upcoming: 'Upcoming', archived: 'Archived' };

const ALL_COLS = ['Name', 'Photo', 'Email', 'Phone', 'Role', 'Latest activity'];
const DEFAULT_COLS = ['Name', 'Email', 'Phone', 'Role', 'Latest activity'];

const EXPORT_FIELDS = ['Full name', 'Email', 'Phone number', 'Role', 'QR Codes', 'RFID Tags'];

const DRAWER_TABS = ['Details', 'Notifications', 'Safety', 'QR/RFID', 'Documents', 'Companion'];

// ─── tiny helpers ─────────────────────────────────────────────────────
const initials = (name = '') =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??';

const fmtDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
};

const fmtDateTime = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit' });
};

// ─── Avatar ───────────────────────────────────────────────────────────
const Avatar = ({ name, size = 'md', online = false }) => {
  const s = size === 'lg' ? 'w-14 h-14 text-base' : 'w-9 h-9 text-xs';
  return (
    <div className="relative inline-block flex-shrink-0">
      <div className={`${s} rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 select-none`}>
        {initials(name)}
      </div>
      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-slate-400 border-2 border-white" />
    </div>
  );
};

// ─── Tab bar ──────────────────────────────────────────────────────────
const TabBar = ({ active, onChange }) => (
  <div className="flex items-center gap-1">
    {TABS.map(t => (
      <button key={t.id} onClick={() => onChange(t.id)}
        className={`inline-flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
          active === t.id
            ? 'border-[#2b4594] text-slate-900'
            : 'border-transparent text-slate-500 hover:text-slate-800'
        }`}>
        {t.icon}{t.label}
      </button>
    ))}
  </div>
);

// ─── Export modal ─────────────────────────────────────────────────────
const ExportModal = ({ members, onClose }) => {
  const [selected, setSelected] = useState(['Full name']);
  const toggle = (f) => setSelected(s => s.includes(f) ? s.filter(x => x !== f) : [...s, f]);

  const handleExport = () => {
    const rows = members.map(m => {
      const row = {};
      if (selected.includes('Full name'))    row['Full name']    = m.name;
      if (selected.includes('Email'))        row['Email']        = m.email || '';
      if (selected.includes('Phone number')) row['Phone number'] = m.phone || '';
      if (selected.includes('Role'))         row['Role']         = m.role  || '';
      if (selected.includes('QR Codes'))     row['QR Codes']     = '';
      if (selected.includes('RFID Tags'))    row['RFID Tags']    = '';
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Members');
    XLSX.writeFile(wb, 'members-export.xlsx');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">Export members data</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 grid grid-cols-2 gap-3">
          {EXPORT_FIELDS.map(f => (
            <label key={f} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input type="checkbox" checked={selected.includes(f)} onChange={() => toggle(f)}
                className="w-4 h-4 accent-[#2b4594] rounded" />
              {f}
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
          <button onClick={handleExport} className="px-5 py-2 rounded-lg bg-[#2b4594] hover:bg-[#1e326e] text-white text-sm font-semibold">Export</button>
        </div>
      </div>
    </div>
  );
};

// ─── Edit-all members side panel ─────────────────────────────────────
const EditAllPanel = ({ onClose }) => (
  <div className="fixed inset-y-0 right-0 w-[380px] bg-white shadow-2xl z-50 flex flex-col">
    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
      <h2 className="text-lg font-semibold text-slate-800">Edit member settings</h2>
      <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
    </div>
    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">Group</label>
        <select className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]">
          <option>Employees</option><option>Contractors</option><option>Visitors</option>
        </select>
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-700 mb-3">Details</p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Language</label>
            <select className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]">
              <option>Don't change</option><option>English (UK)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Show on sites</label>
            <select className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]">
              <option>Don't change</option><option>All sites</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Select sites</label>
            <select className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]">
              <option>No sites selected</option>
            </select>
          </div>
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-700 mb-1">Host notifications</p>
        <p className="text-xs text-slate-500 mb-3">Notify when a visitor arrives</p>
        <select className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594] mb-4">
          <option>Don't change</option>
        </select>
        <p className="text-xs text-slate-500 mb-1">Notify when a visitor departs</p>
        <select className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]">
          <option>Don't change</option>
        </select>
      </div>
    </div>
  </div>
);

// ─── Add member modal ────────────────────────────────────────────────
const AddMemberModal = ({ groups, onClose, onSaved }) => {
  const [drawerTab, setDrawerTab] = useState('Details');
  const [form, setForm] = useState({
    group: '', name: '', email: '', phone: '', role: '',
    language: 'English (UK)', show_on_sites: 'All sites',
    start_date: '', end_date: '',
    send_welcome: true, include_companion: false,
    host_notifications: 'group_default', // 'group_default' or 'custom'
    notify_arrives_email: true, notify_arrives_sms: false,
    notify_departs_email: false, notify_departs_sms: false,
    notify_another_member: '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'This field is required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setSaveError('');
    try {
      const [fn, ...rest] = form.name.trim().split(' ');
      await api.post('/guards/members', {
        first_name: fn, last_name: rest.join(' ') || undefined,
        email: form.email || undefined, phone: form.phone || undefined,
        role: form.role || 'Employee',
        start_date: form.start_date || undefined,
        end_date: form.end_date || undefined,
        visitor_group_id: form.group || undefined,
        status: 'Current',
        send_welcome: form.send_welcome && !!form.email,
      });
      onSaved();
      onClose();
    } catch (err) {
      setSaveError(err.response?.data?.error || 'Failed to add member. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">Add member</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 rounded-full p-1 hover:bg-slate-100"><X size={18} /></button>
        </div>
        {/* drawer tabs */}
        <div className="flex gap-0 border-b border-slate-100 px-6">
          {DRAWER_TABS.slice(0, 3).map(t => (
            <button key={t} onClick={() => setDrawerTab(t)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${drawerTab === t ? 'border-[#2b4594] text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {t}{t === 'Details' && errors.name ? <span className="ml-1 w-2 h-2 rounded-full bg-red-500 inline-block" /> : null}
            </button>
          ))}
        </div>
        {/* body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {drawerTab === 'Details' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1"><span className="text-red-500">* </span>Which group does this member belong to?</label>
                <select value={form.group} onChange={e => set('group', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]">
                  <option value="">Select group…</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1"><span className="text-red-500">* </span>Full name</label>
                  <input value={form.name} onChange={e => set('name', e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594] ${errors.name ? 'border-red-400' : 'border-slate-300'}`} />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email address</label>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Phone number</label>
                  <div className="flex border border-slate-300 rounded-lg overflow-hidden focus-within:border-[#2b4594]">
                    <div className="bg-slate-50 px-3 py-2 border-r border-slate-300 text-sm flex items-center gap-1">🇺🇸 <ChevronDown size={12} /></div>
                    <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                      className="flex-1 px-3 py-2 text-sm outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Role</label>
                  <input value={form.role} onChange={e => set('role', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Language</label>
                  <select value={form.language} onChange={e => set('language', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]">
                    <option>English (UK)</option><option>English (US)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Show on sites</label>
                  <select value={form.show_on_sites} onChange={e => set('show_on_sites', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]">
                    <option>All sites</option>
                  </select>
                  <p className="text-xs text-slate-400 mt-1">Able to sign in and appear as host (if enabled)</p>
                </div>
              </div>
              <div className="pt-2">
                <p className="text-sm font-semibold text-slate-800 mb-0.5">Start and end dates</p>
                <p className="text-xs text-slate-500 mb-3">This is the period the member is active for. They can only sign in and out during this time</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Start date and time</label>
                    <div className="relative">
                      <input type="datetime-local" value={form.start_date} onChange={e => set('start_date', e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">End date and time</label>
                    <input type="datetime-local" value={form.end_date} onChange={e => set('end_date', e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]" />
                    <p className="text-xs text-slate-400 mt-1">Leave blank if not required</p>
                  </div>
                </div>
              </div>
              <div className="pt-2">
                <p className="text-sm font-semibold text-slate-800 mb-0.5">Welcome email</p>
                <p className="text-xs text-slate-500 mb-3">Send a welcome email on how to get started with Sign In App</p>
                <label className="flex items-center gap-2 text-sm text-slate-700 mb-2 cursor-pointer">
                  <input type="checkbox" checked={form.send_welcome} onChange={e => set('send_welcome', e.target.checked)} className="w-4 h-4 accent-[#2b4594]" />
                  Send welcome email
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={form.include_companion} onChange={e => set('include_companion', e.target.checked)} className="w-4 h-4 accent-[#2b4594]" />
                  Include Sign In Companion app invite
                </label>
              </div>
            </>
          )}
          {drawerTab === 'Notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Host notifications</h3>
                <p className="text-xs text-slate-500 mb-3">Manage which host notifications this member should receive</p>
                <div className="flex items-center gap-6 mb-6">
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input type="radio" name="host_notif" checked={form.host_notifications === 'group_default'} onChange={() => set('host_notifications', 'group_default')} className="w-4 h-4 accent-[#2b4594]" />
                    Use group default
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input type="radio" name="host_notif" checked={form.host_notifications === 'custom'} onChange={() => set('host_notifications', 'custom')} className="w-4 h-4 accent-[#2b4594]" />
                    Custom
                  </label>
                </div>

                <div className={`space-y-4 ${form.host_notifications === 'group_default' ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-2">Notify when a visitor arrives</p>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                        <input type="checkbox" checked={form.notify_arrives_email} onChange={e => set('notify_arrives_email', e.target.checked)} className="w-4 h-4 accent-[#2b4594] rounded" />
                        Email
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                        <input type="checkbox" checked={form.notify_arrives_sms} onChange={e => set('notify_arrives_sms', e.target.checked)} className="w-4 h-4 accent-[#2b4594] rounded" />
                        SMS
                      </label>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-2">Notify when a visitor departs</p>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                        <input type="checkbox" checked={form.notify_departs_email} onChange={e => set('notify_departs_email', e.target.checked)} className="w-4 h-4 accent-[#2b4594] rounded" />
                        Email
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                        <input type="checkbox" checked={form.notify_departs_sms} onChange={e => set('notify_departs_sms', e.target.checked)} className="w-4 h-4 accent-[#2b4594] rounded" />
                        SMS
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Choose to notify another member on behalf of {form.name || 'this member'}
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input type="text" placeholder="Search members" value={form.notify_another_member} onChange={e => set('notify_another_member', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#2b4594]" />
                </div>
              </div>
            </div>
          )}
          {drawerTab === 'Safety' && (
            <div>
              <h3 className="text-base font-semibold text-slate-800 mb-4">Emergency contacts</h3>
              <button className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-[#2b4594] transition-colors">
                <UserPlus size={16} /> Add contact
              </button>
            </div>
          )}
        </div>
        {/* footer */}
        <div className="px-6 py-4 border-t border-slate-100">
          {saveError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{saveError}</p>
          )}
          <div className="flex justify-end">
            <button onClick={handleSave} disabled={saving}
              className="px-6 py-2 rounded-lg bg-[#2b4594] hover:bg-[#1e326e] disabled:opacity-60 text-white text-sm font-semibold">
              {saving ? 'Adding…' : 'Add member'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── QR/RFID tab (real scannable QR) ─────────────────────────────────
const QrRfidTab = ({ member }) => {
  const qrRef = useRef(null);
  const [rfidValue, setRfidValue] = useState('');
  const [rfidSaved, setRfidSaved] = useState(false);

  // The QR value encodes the member's ID — scannable by kiosk to identify them
  const qrValue = `MEMBER:${member?.id || 'unknown'}`;

  const handleDownload = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 300, 300);
      ctx.drawImage(img, 0, 0, 300, 300);
      const link = document.createElement('a');
      link.download = `${(member?.name || 'member').replace(/\s+/g, '-')}-qrcode.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleSendEmail = async () => {
    if (!member?.email) { alert('This member has no email address.'); return; }
    try {
      await api.post(`/guards/members/${member.id}/generate-mobile-token`);
      alert(`QR code invite sent to ${member.email}`);
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to send email');
    }
  };

  const handleAssignRfid = () => {
    if (!rfidValue.trim()) return;
    setRfidSaved(true);
    setTimeout(() => setRfidSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* QR Code */}
      <div>
        <p className="text-sm font-semibold text-slate-800 mb-1">QR Code</p>
        <p className="text-xs text-slate-500 mb-4">
          A unique QR code for <strong>{member?.name}</strong> — scan at any kiosk to sign in instantly.
        </p>
        <div className="flex items-start gap-5 p-5 bg-slate-50 rounded-xl border border-slate-200">
          {/* Actual scannable QR */}
          <div ref={qrRef}
            className="w-28 h-28 bg-white rounded-lg border border-slate-200 flex items-center justify-center p-2 flex-shrink-0">
            <QRCode
              value={qrValue}
              size={96}
              bgColor="#ffffff"
              fgColor="#1e293b"
              level="M"
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">{member?.name}</p>
            <p className="text-xs text-slate-400 font-mono break-all">{qrValue}</p>
            <div className="flex gap-2 pt-1 flex-wrap">
              <button onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 hover:bg-white transition-colors">
                <Download size={12} /> Download PNG
              </button>
              <button onClick={handleSendEmail}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 hover:bg-white transition-colors">
                ✉ Send by email
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RFID */}
      <div className="pt-2 border-t border-slate-100">
        <p className="text-sm font-semibold text-slate-800 mb-1">RFID Tag</p>
        <p className="text-xs text-slate-500 mb-4">Assign an RFID tag ID to this member for card-based sign-in</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={rfidValue}
            onChange={e => { setRfidValue(e.target.value); setRfidSaved(false); }}
            placeholder="Scan or enter RFID tag ID"
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]"
          />
          <button onClick={handleAssignRfid}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              rfidSaved
                ? 'bg-blue-50 text-[#2b4594] border border-blue-200'
                : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}>
            {rfidSaved ? '✓ Saved' : 'Assign'}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2">No RFID tag currently assigned to this member</p>
      </div>
    </div>
  );
};

// ─── Companion tab (inside MemberDrawer) ─────────────────────────────
const CompanionTab = ({ member }) => {
  const [inviteEmail, setInviteEmail] = useState(member?.email || '');
  const [sending, setSending] = useState(false);
  const [sentMsg, setSentMsg] = useState('');
  const [sendErr, setSendErr] = useState('');
  const [perms, setPerms] = useState({
    sign_in_visitors: true,
    run_evacuations: false,
    view_directory: false,
  });

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) { setSendErr('Email address is required'); return; }
    setSending(true); setSentMsg(''); setSendErr('');
    try {
      await api.post(`/guards/members/${member.id}/send-welcome`, {
        email: inviteEmail.trim(),
        include_companion: true,
      });
      setSentMsg('Welcome email with companion code sent successfully!');
    } catch (err) {
      setSendErr(err.response?.data?.error || 'Failed to send email. Please try again.');
    } finally { setSending(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-slate-800 mb-1">Sign In Companion app</p>
        <p className="text-xs text-slate-500 mb-4">
          The Companion app lets this member sign in and out from their phone, receive host notifications, and run evacuations.
        </p>
      </div>

      {/* Pairing status */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
          <User size={20} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-800">Mobile pairing status</p>
          <p className={`text-xs mt-0.5 font-semibold ${member?.mobile_paired ? 'text-[#2b4594]' : 'text-slate-400'}`}>
            {member?.mobile_paired ? '✓ Device paired' : 'Not paired'}
          </p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
          member?.mobile_paired ? 'bg-blue-50 text-[#2b4594]' : 'bg-slate-200 text-slate-600'
        }`}>
          {member?.mobile_paired ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Send welcome / companion invite */}
      <div>
        <p className="text-sm font-semibold text-slate-700 mb-1">Send welcome email</p>
        <p className="text-xs text-slate-500 mb-3">
          Sends a welcome email with QR code + a 12-character companion app activation code (valid 72 hours).
        </p>
        <div className="flex gap-2 mb-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={e => { setInviteEmail(e.target.value); setSendErr(''); }}
            placeholder="Email address"
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]"
          />
          <button
            onClick={handleSendInvite}
            disabled={sending}
            className="px-4 py-2 bg-[#2b4594] hover:bg-[#1e326e] disabled:opacity-60 text-white rounded-lg text-sm font-semibold whitespace-nowrap"
          >
            {sending ? 'Sending…' : 'Send invite'}
          </button>
        </div>
        {sentMsg && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{sentMsg}</p>
        )}
        {sendErr && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{sendErr}</p>
        )}
      </div>

      {/* App permissions */}
      <div className="pt-2 border-t border-slate-100">
        <p className="text-sm font-semibold text-slate-700 mb-1">App permissions</p>
        <p className="text-xs text-slate-500 mb-3">What this member can do inside the Companion app</p>
        <div className="space-y-2">
          {[
            { key: 'sign_in_visitors', label: 'Sign in & out', desc: 'Allow member to sign in/out via the companion app' },
            { key: 'run_evacuations',  label: 'Run evacuations', desc: 'Allow member to start and manage evacuations' },
            { key: 'view_directory',   label: 'View people directory', desc: 'Allow member to browse the people directory' },
          ].map(({ key, label, desc }) => (
            <label key={key} className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={perms[key]}
                onChange={e => setPerms(p => ({ ...p, [key]: e.target.checked }))}
                className="mt-0.5 w-4 h-4 accent-[#2b4594] rounded flex-shrink-0"
              />
              <div>
                <p className="text-sm font-semibold text-slate-800">{label}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Member slide-out drawer (edit) ──────────────────────────────────
const MemberDrawer = ({ member, groups, onClose, onSaved }) => {
  const [tab, setTab] = useState('Details');
  const [form, setForm] = useState({
    name:       member?.name       || '',
    email:      member?.email      || '',
    phone:      member?.phone      || '',
    role:       member?.role       || 'Employee',
    group:      member?.visitor_group_id || '',
    language:   'English (UK)',
    show_sites: 'All sites',
    start_date: member?.start_date ? new Date(member.start_date).toISOString().slice(0,16) : '',
    end_date:   member?.end_date   ? new Date(member.end_date  ).toISOString().slice(0,16) : '',
    send_welcome:    true,
    include_companion: false,
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) { setSaveError('Full name is required'); return; }
    setSaving(true);
    setSaveError('');
    try {
      const [fn, ...rest] = form.name.trim().split(' ');
      await api.put(`/guards/members/${member.id}`, {
        first_name: fn, last_name: rest.join(' ') || null,
        email: form.email || null, phone: form.phone || null,
        role:  form.role  || 'Employee',
        start_date: form.start_date || null,
        end_date:   form.end_date   || null,
        visitor_group_id: form.group || null,
      });
      onSaved();
      onClose();
    } catch (err) {
      setSaveError(err.response?.data?.error || 'Failed to save. Please try again.');
    } finally { setSaving(false); }
  };

  const handleArchive = async () => {
    if (!confirm('Archive this member?')) return;
    await api.post(`/guards/members/${member.id}/archive`);
    onSaved(); onClose();
  };

  const handleDelete = async () => {
    if (!confirm('Permanently delete this member? This cannot be undone.')) return;
    await api.delete(`/guards/members/${member.id}`);
    onSaved(); onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/20 z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-[520px] bg-white shadow-2xl z-50 flex flex-col">
        {/* top nav */}
        <div className="flex items-center justify-end gap-2 px-4 py-2 border-b border-slate-100">
          <button className="p-1.5 rounded hover:bg-slate-100 text-slate-400"><ChevronDown size={16} className="rotate-180" /></button>
          <button className="p-1.5 rounded hover:bg-slate-100 text-slate-400"><ChevronDown size={16} /></button>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>
        {/* member header */}
        <div className="px-6 py-4 flex items-center gap-4 border-b border-slate-100">
          <Avatar name={member?.name} size="lg" />
          <div>
            <p className="text-lg font-bold text-slate-800">{member?.name}</p>
            <p className="text-sm text-slate-500">{member?.visitor_group || 'Employees'}</p>
            <button className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 mt-1">
              <History size={12} /> View visit history
            </button>
          </div>
        </div>
        {/* tabs */}
        <div className="flex border-b border-slate-100 px-2 overflow-x-auto">
          {DRAWER_TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${tab === t ? 'border-[#2b4594] text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {t}
            </button>
          ))}
        </div>
        {/* content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {tab === 'Details' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1"><span className="text-red-500">* </span>Full name</label>
                  <input value={form.name} onChange={e => set('name', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email address</label>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Phone number</label>
                  <div className="flex border border-slate-300 rounded-lg overflow-hidden focus-within:border-[#2b4594]">
                    <div className="bg-slate-50 px-3 py-2 border-r border-slate-300 text-sm flex items-center gap-1">🇺🇸 <ChevronDown size={12} /></div>
                    <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className="flex-1 px-3 py-2 text-sm outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Role</label>
                  <input value={form.role} onChange={e => set('role', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Language</label>
                  <select value={form.language} onChange={e => set('language', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]">
                    <option>English (UK)</option><option>English (US)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Show on sites</label>
                  <select value={form.show_sites} onChange={e => set('show_sites', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]">
                    <option>All sites</option>
                  </select>
                  <p className="text-xs text-slate-400 mt-1">Able to sign in and appear as host (if enabled)</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Group</label>
                <select value={form.group} onChange={e => set('group', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]">
                  <option value="">Select group…</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  <option value="Employees">Employees</option>
                </select>
              </div>
              <div className="pt-2">
                <p className="text-sm font-semibold text-slate-800 mb-0.5">Start and end dates</p>
                <p className="text-xs text-slate-500 mb-3">This is the period the member is active for. They can only sign in and out during this time</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Start date and time</label>
                    <input type="datetime-local" value={form.start_date} onChange={e => set('start_date', e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">End date and time</label>
                    <input type="datetime-local" value={form.end_date} onChange={e => set('end_date', e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]" />
                    <p className="text-xs text-slate-400 mt-1">Leave blank if not required</p>
                  </div>
                </div>
              </div>
              <div className="pt-2">
                <p className="text-sm font-semibold text-slate-800 mb-0.5">Welcome email</p>
                <p className="text-xs text-slate-500 mb-3">Send a welcome email on how to get started with Sign In App</p>
                <label className="flex items-center gap-2 text-sm text-slate-700 mb-2 cursor-pointer">
                  <input type="checkbox" checked={form.send_welcome} onChange={e => set('send_welcome', e.target.checked)} className="w-4 h-4 accent-[#2b4594]" />
                  Send welcome email
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={form.include_companion} onChange={e => set('include_companion', e.target.checked)} className="w-4 h-4 accent-[#2b4594]" />
                  Include Sign In Companion app invite
                </label>
                <div className="mt-3 rounded-lg bg-teal-50 border border-teal-200 px-4 py-3 text-xs text-teal-700">
                  <span className="font-semibold">ℹ</span> This member uses group default app permissions, but none are currently set for their group. Enable permissions in their <span className="underline cursor-pointer">group settings</span>, or configure them <span className="underline cursor-pointer">here</span>.
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <p className="text-sm font-semibold text-slate-800 mb-3">Actions</p>
                <button onClick={handleArchive} className="flex items-center gap-2 text-sm text-slate-700 hover:text-slate-900 mb-3">
                  <Archive size={15} className="text-slate-400" /> Archive member
                </button>
                <button onClick={handleDelete} className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700">
                  <Trash2 size={15} /> Delete member
                </button>
              </div>
            </>
          )}
          {/* ── Notifications ── */}
          {tab === 'Notifications' && (
            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold text-slate-800 mb-1">Host notifications</p>
                <p className="text-xs text-slate-500 mb-4">Choose how this member is notified when a visitor signs in or out</p>
                <div className="flex gap-6 mb-5">
                  {['Use group default','Custom'].map(opt => (
                    <label key={opt} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input type="radio" name="notif_type" defaultChecked={opt === 'Use group default'}
                        className="w-4 h-4 accent-[#2b4594]" />
                      {opt}
                    </label>
                  ))}
                </div>
                <div className="space-y-4 opacity-50 pointer-events-none">
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-2">Notify when a visitor arrives</p>
                    <div className="flex gap-4">
                      {['Email','SMS','Push'].map(m => (
                        <label key={m} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                          <input type="checkbox" className="w-4 h-4 accent-[#2b4594] rounded" /> {m}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-2">Notify when a visitor departs</p>
                    <div className="flex gap-4">
                      {['Email','SMS','Push'].map(m => (
                        <label key={m} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                          <input type="checkbox" className="w-4 h-4 accent-[#2b4594] rounded" /> {m}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <p className="text-sm font-semibold text-slate-800 mb-1">Notify on behalf of</p>
                <p className="text-xs text-slate-500 mb-3">Route notifications to another member when this member is the host</p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input type="text" placeholder="Search members…"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#2b4594]" />
                </div>
              </div>
            </div>
          )}

          {/* ── Safety ── */}
          {tab === 'Safety' && (
            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold text-slate-800 mb-1">Emergency contacts</p>
                <p className="text-xs text-slate-500 mb-4">People to notify in an emergency for this member</p>
                <div className="rounded-xl border border-dashed border-slate-300 px-5 py-8 text-center">
                  <p className="text-sm text-slate-500 mb-3">No emergency contacts added yet</p>
                  <button className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    <UserPlus size={15} /> Add contact
                  </button>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <p className="text-sm font-semibold text-slate-800 mb-1">Safety induction</p>
                <p className="text-xs text-slate-500 mb-3">Require this member to complete a safety induction before signing in</p>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-[#2b4594] rounded" />
                  Require safety induction
                </label>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <p className="text-sm font-semibold text-slate-800 mb-1">Evacuation</p>
                <p className="text-xs text-slate-500 mb-3">Include this member in evacuation roll calls</p>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#2b4594] rounded" />
                  Include in evacuation reports
                </label>
              </div>
            </div>
          )}

          {/* ── QR/RFID ── */}
          {tab === 'QR/RFID' && (
            <QrRfidTab member={member} />
          )}

          {/* ── Documents ── */}
          {tab === 'Documents' && (
            <div className="space-y-5">
              <div>
                <p className="text-sm font-semibold text-slate-800 mb-1">Member documents</p>
                <p className="text-xs text-slate-500 mb-4">Upload and manage documents associated with this member (ID, certifications, contracts)</p>
              </div>
              <div className="rounded-xl border-2 border-dashed border-slate-200 px-6 py-10 text-center hover:border-[#2b4594] transition-colors cursor-pointer">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"
                  strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 mx-auto mb-3">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
                <p className="text-sm font-semibold text-slate-600">Drop files here or click to upload</p>
                <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG up to 10MB</p>
                <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden" />
              </div>
              <p className="text-xs text-slate-400 text-center">No documents uploaded yet</p>
            </div>
          )}

          {/* ── Companion ── */}
          {tab === 'Companion' && (
            <CompanionTab member={member} />
          )}
        </div>
        {/* footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50">
          {saveError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{saveError}</p>
          )}
          <div className="flex items-center justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-white">Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="px-5 py-2 rounded-lg bg-[#2b4594] hover:bg-[#1e326e] disabled:opacity-60 text-white text-sm font-semibold">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// ─── Main page ────────────────────────────────────────────────────────
const PeopleDirectory = () => {
  const [activeTab, setActiveTab]   = useState('current');
  const [members, setMembers]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [search, setSearch]         = useState('');
  const [groups, setGroups]         = useState([]);

  // selections
  const [selected, setSelected]     = useState([]);

  // panel / modal state
  const [editMember, setEditMember] = useState(null);   // MemberDrawer
  const [showAdd, setShowAdd]       = useState(false);  // AddMemberModal
  const [showExport, setShowExport] = useState(false);  // ExportModal
  const [showEditAll, setShowEditAll] = useState(false);// EditAllPanel

  // dropdowns
  const [actionsOpen, setActionsOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showColSettings, setShowColSettings] = useState(false);
  const [visibleCols, setVisibleCols] = useState(DEFAULT_COLS);

  // filters
  const [filterEmail, setFilterEmail] = useState(false);
  const [filterPhone, setFilterPhone] = useState(false);
  const [filterRole,  setFilterRole]  = useState(false);
  const [filterEmailVal, setFilterEmailVal] = useState('');
  const [filterPhoneVal, setFilterPhoneVal] = useState('');
  const [filterRoleVal,  setFilterRoleVal]  = useState('');

  const actionsRef    = useRef(null);
  const colRef        = useRef(null);
  const filtersRef    = useRef(null);

  // close dropdowns on outside click
  useEffect(() => {
    const h = (e) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target)) setActionsOpen(false);
      if (colRef.current     && !colRef.current.contains(e.target))     setShowColSettings(false);
      if (filtersRef.current && !filtersRef.current.contains(e.target)) setShowFilters(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: STATUS_MAP[activeTab] });
      if (search) params.set('search', search);
      const res = await api.get(`/guards/members?${params}`);
      setMembers(res.data || []);
    } catch { setMembers([]); }
    finally { setLoading(false); }
  }, [activeTab, search]);

  const fetchGroups = useCallback(async () => {
    try {
      const res = await api.get('/visitor-groups');
      setGroups(res.data || []);
    } catch { setGroups([]); }
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);
  useEffect(() => { fetchGroups(); },  [fetchGroups]);

  // derived list after filters
  const visible = members.filter(m => {
    if (filterEmail && filterEmailVal && !m.email?.toLowerCase().includes(filterEmailVal.toLowerCase())) return false;
    if (filterPhone && filterPhoneVal && !m.phone?.includes(filterPhoneVal)) return false;
    if (filterRole  && filterRoleVal  && !m.role?.toLowerCase().includes(filterRoleVal.toLowerCase()))  return false;
    return true;
  });

  const allChecked = visible.length > 0 && visible.every(m => selected.includes(m.id));
  const toggleAll  = () => setSelected(allChecked ? [] : visible.map(m => m.id));
  const toggleOne  = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const handleBulkArchive = async () => {
    if (!selected.length) return;
    await Promise.all(selected.map(id => api.post(`/guards/members/${id}/archive`)));
    setSelected([]); fetchMembers();
  };

  const handleBulkDelete = async () => {
    if (!selected.length || !confirm(`Delete ${selected.length} member(s)?`)) return;
    await Promise.all(selected.map(id => api.delete(`/guards/members/${id}`)));
    setSelected([]); fetchMembers();
  };

  const handleRestore = async () => {
    if (!selected.length) return;
    await Promise.all(selected.map(id => api.put(`/guards/members/${id}`, { status: 'Current' })));
    setSelected([]); fetchMembers();
  };

  const toggleCol = (col) => setVisibleCols(c => c.includes(col) ? c.filter(x => x !== col) : [...c, col]);

  // column for "latest activity" or "start date" depending on tab
  const lastColLabel = activeTab === 'upcoming' ? 'Start date' : activeTab === 'archived' ? 'Archived date' : 'Latest activity';
  const lastColValue = (m) => {
    if (activeTab === 'upcoming') return m.start_date ? fmtDate(m.start_date) : '—';
    if (activeTab === 'archived') return m.updated_at ? fmtDate(m.updated_at) : '—';
    return '—';
  };

  return (
    <div className="h-full overflow-auto bg-[#f8fafc]">
      <div className="max-w-[1600px] mx-auto px-8 py-8 flex flex-col gap-6">

        {/* heading */}
        <h1 className="text-2xl font-bold text-slate-800">
          People directory for <span className="font-normal text-slate-500">Employees</span>
        </h1>

        {/* card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">

          {/* tab bar */}
          <div className="px-6 pt-1 border-b border-slate-200">
            <TabBar active={activeTab} onChange={(t) => { setActiveTab(t); setSelected([]); }} />
          </div>

          {/* toolbar */}
          <div className="px-6 py-3 flex items-center gap-3 flex-wrap">
            {/* search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input type="text" placeholder="Search" value={search} onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm w-48 focus:outline-none focus:border-[#2b4594]" />
            </div>

            {/* filters */}
            <div className="relative" ref={filtersRef}>
              <button onClick={() => setShowFilters(o => !o)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-semibold transition-colors ${showFilters ? 'border-[#2b4594] bg-blue-50 text-[#1e326e]' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
                <Filter size={14} /> Filters
              </button>
              {showFilters && (
                <div className="absolute left-0 top-full mt-2 w-64 rounded-xl border border-slate-200 bg-white shadow-xl z-20 p-3 space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide px-1 mb-2">Add filter</p>
                  {[['Email', filterEmail, setFilterEmail, filterEmailVal, setFilterEmailVal],
                    ['Phone', filterPhone, setFilterPhone, filterPhoneVal, setFilterPhoneVal],
                    ['Role',  filterRole,  setFilterRole,  filterRoleVal,  setFilterRoleVal]].map(([label, checked, setChecked, val, setVal]) => (
                    <div key={label}>
                      <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer px-1">
                        <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} className="w-4 h-4 accent-[#2b4594]" />
                        {label}
                      </label>
                      {checked && (
                        <input placeholder={`Filter by ${label.toLowerCase()}…`} value={val} onChange={e => setVal(e.target.value)}
                          className="mt-1.5 w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#2b4594]" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1" />

            {/* Actions */}
            <div className="relative" ref={actionsRef}>
              <button onClick={() => setActionsOpen(o => !o)}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Actions <ChevronDown size={14} />
              </button>
              {actionsOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-slate-200 bg-white shadow-xl z-20 overflow-hidden">
                  <button onClick={() => { setShowExport(true); setActionsOpen(false); }}
                    className="block w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">Export All</button>
                  <button onClick={() => { setShowEditAll(true); setActionsOpen(false); }}
                    className="block w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">Edit all members</button>
                  {activeTab === 'archived' ? (
                    <button onClick={() => { handleRestore(); setActionsOpen(false); }}
                      className="block w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">Restore</button>
                  ) : (
                    <button onClick={() => { handleBulkArchive(); setActionsOpen(false); }}
                      className="block w-full text-left px-4 py-2.5 text-sm text-slate-500 hover:bg-slate-50">Archive</button>
                  )}
                  <button onClick={() => { handleBulkDelete(); setActionsOpen(false); }}
                    className="block w-full text-left px-4 py-2.5 text-sm text-slate-500 hover:bg-slate-50">Delete</button>
                </div>
              )}
            </div>

            {/* Add member */}
            <button onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#2b4594] hover:bg-[#1e326e] text-white text-sm font-semibold">
              Add member <ChevronDown size={14} />
            </button>
          </div>

          {/* table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-y border-slate-100 bg-white text-slate-500 text-xs font-semibold">
                <tr>
                  <th className="pl-6 pr-3 py-3 w-10">
                    <input type="checkbox" checked={allChecked} onChange={toggleAll}
                      className="w-4 h-4 accent-[#2b4594] rounded" />
                  </th>
                  <th className="px-3 py-3 min-w-[200px]">
                    <button className="inline-flex items-center gap-1">Name <span className="opacity-50">↑↓</span></button>
                  </th>
                  {visibleCols.includes('Email') && (
                    <th className="px-3 py-3 min-w-[200px]">
                      <button className="inline-flex items-center gap-1">Email <span className="opacity-50">↑↓</span></button>
                    </th>
                  )}
                  {visibleCols.includes('Phone') && <th className="px-3 py-3 min-w-[140px]">Phone</th>}
                  {visibleCols.includes('Role')  && <th className="px-3 py-3 min-w-[100px]">Role</th>}
                  {visibleCols.includes('Latest activity') && (
                    <th className="px-3 py-3 min-w-[140px]">{lastColLabel}</th>
                  )}
                  {/* col settings gear */}
                  <th className="pr-6 py-3 w-10 text-right">
                    <div className="relative inline-block" ref={colRef}>
                      <button onClick={() => setShowColSettings(o => !o)}
                        className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                        <Settings size={15} />
                      </button>
                      {showColSettings && (
                        <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-slate-200 bg-white shadow-xl z-20 p-3">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Visible columns</p>
                          {ALL_COLS.map(c => (
                            <label key={c} className="flex items-center gap-2 py-1 text-sm text-slate-700 cursor-pointer">
                              <input type="checkbox" checked={visibleCols.includes(c)} onChange={() => toggleCol(c)}
                                className="w-4 h-4 accent-[#2b4594]" />
                              {c}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && (
                  <tr><td colSpan={10} className="py-12 text-center text-slate-400 text-sm">Loading…</td></tr>
                )}
                {!loading && visible.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                        <p className="text-base font-semibold text-slate-600">
                          The Employees group has no {activeTab} members
                        </p>
                        <p className="text-sm">
                          {activeTab === 'archived'
                            ? 'Keep your records up to date by archiving past members from the Directory. Data remains archived until you choose to anonymise it.'
                            : 'Add your first member using the button above.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && visible.map(m => (
                  <tr key={m.id} onClick={() => setEditMember(m)}
                    className="hover:bg-slate-50/70 cursor-pointer group">
                    <td className="pl-6 pr-3 py-3" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.includes(m.id)} onChange={() => toggleOne(m.id)}
                        className="w-4 h-4 accent-[#2b4594] rounded" />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={m.name} />
                        <span className="font-semibold text-slate-800">{m.name}</span>
                      </div>
                    </td>
                    {visibleCols.includes('Email') && (
                      <td className="px-3 py-3 text-slate-600">{m.email || '—'}</td>
                    )}
                    {visibleCols.includes('Phone') && (
                      <td className="px-3 py-3 text-slate-600">{m.phone || '—'}</td>
                    )}
                    {visibleCols.includes('Role') && (
                      <td className="px-3 py-3 text-slate-600">{m.role || 'None'}</td>
                    )}
                    {visibleCols.includes('Latest activity') && (
                      <td className="px-3 py-3 text-slate-500">{lastColValue(m)}</td>
                    )}
                    <td className="pr-6 py-3 text-right">
                      <button className="p-1.5 rounded hover:bg-slate-100 text-slate-300 group-hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={e => { e.stopPropagation(); setEditMember(m); }}>
                        <MoreHorizontal size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* modals / panels */}
      {editMember && (
        <MemberDrawer member={editMember} groups={groups}
          onClose={() => setEditMember(null)} onSaved={fetchMembers} />
      )}
      {showAdd && (
        <AddMemberModal groups={groups}
          onClose={() => setShowAdd(false)} onSaved={fetchMembers} />
      )}
      {showExport && (
        <ExportModal members={visible} onClose={() => setShowExport(false)} />
      )}
      {showEditAll && (
        <>
          <div className="fixed inset-0 bg-slate-900/20 z-40" onClick={() => setShowEditAll(false)} />
          <EditAllPanel onClose={() => setShowEditAll(false)} />
        </>
      )}
    </div>
  );
};

export default PeopleDirectory;
