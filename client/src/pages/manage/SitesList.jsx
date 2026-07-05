import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin, Plus, Edit2, Trash2, X, Copy, Check,
  Eye, EyeOff, RefreshCw, ExternalLink, QrCode,
  ChevronDown, ArrowLeft, Monitor, Smartphone, Download,
  Bell, ShieldCheck, FileText, Lock,
} from 'lucide-react';
import QRCode from 'react-qr-code';
import api from '../../api';
import * as XLSX from 'xlsx';
import SiteSettings from './SiteSettings';

const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};
const generateCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let r = '';
  for (let i = 0; i < 4; i++) r += chars[Math.floor(Math.random() * chars.length)];
  return `SITE-${r}`;
};

const CopyPill = ({ value }) => {
  const [copied, setCopied] = useState(false);
  const copy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  };
  return (
    <button onClick={copy} className="inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
      {value}
      {copied ? <Check size={11} className="text-[#76c043]" /> : <Copy size={11} className="opacity-60" />}
    </button>
  );
};

// ─── Site create/edit modal ───────────────────────────────────────────────────
const SiteModal = ({ site, onClose, onSaved }) => {
  const isEdit = !!site;
  const [form, setForm] = useState({ name: site?.name || '', code: site?.code || generateCode(), password: '', admin_email: site?.admin_email || '' });
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Site name is required'); return; }
    if (!isEdit && !form.password) { setError('Password is required'); return; }
    if (!isEdit && !form.admin_email.trim()) { setError('Admin email is required'); return; }
    setSaving(true); setError('');
    try {
      if (isEdit) { await api.put(`/projects/${site.id}`, { name: form.name.trim(), code: form.code.trim().toUpperCase() }); }
      else { await api.post('/projects', { name: form.name.trim(), code: form.code.trim().toUpperCase(), password: form.password, admin_email: form.admin_email.trim() }); }
      onSaved(); onClose();
    } catch (err) { setError(err.response?.data?.error || 'Failed to save site'); }
    finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">{isEdit ? 'Edit site' : 'New site'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 rounded-full p-1 hover:bg-slate-100"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Site name <span className="text-red-500">*</span></label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Head Office…" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Site code <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              <input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:border-[#2b4594]" />
              {!isEdit && <button type="button" onClick={() => set('code', generateCode())} className="px-3 py-2 border border-slate-300 rounded-lg text-slate-500 hover:bg-slate-50"><RefreshCw size={15} /></button>}
            </div>
          </div>
          {!isEdit && (<>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Site password <span className="text-red-500">*</span></label>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:border-[#2b4594]" />
                <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showPwd ? <EyeOff size={15} /> : <Eye size={15} />}</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Admin email <span className="text-red-500">*</span></label>
              <input type="email" value={form.admin_email} onChange={e => set('admin_email', e.target.value)} placeholder="admin@company.com" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]" />
            </div>
          </>)}
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        </form>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="px-5 py-2 bg-[#76c043] hover:bg-[#5fa832] disabled:opacity-60 text-white rounded-lg text-sm font-semibold">{saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create site'}</button>
        </div>
      </div>
    </div>
  );
};

// ─── Delete modal ─────────────────────────────────────────────────────────────
const DeleteModal = ({ site, onClose, onDeleted }) => {
  const [confirm, setConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const handleDelete = async () => {
    if (confirm !== site.name) return;
    setDeleting(true);
    try { await api.delete(`/projects/${site.id}`); onDeleted(); onClose(); }
    catch { setDeleting(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-5">
          <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><Trash2 size={18} className="text-red-600" /></div><h2 className="text-lg font-bold text-slate-800">Delete site</h2></div>
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 mb-5"><p className="font-semibold mb-1">⚠ This action cannot be undone</p><p>All data for <strong>{site.name}</strong> will be permanently deleted.</p></div>
          <p className="text-sm text-slate-600 mb-3">Type <strong>{site.name}</strong> to confirm:</p>
          <input value={confirm} onChange={e => setConfirm(e.target.value)} className="w-full border-2 border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400" />
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
          <button onClick={handleDelete} disabled={confirm !== site.name || deleting} className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white rounded-lg text-sm font-semibold">{deleting ? 'Deleting…' : 'Delete site'}</button>
        </div>
      </div>
    </div>
  );
};

// ─── Kiosk URL card ───────────────────────────────────────────────────────────
const KioskUrlCard = ({ site, onClose }) => {
  // Use VITE_APP_URL env var if set (production deployment).
  // Fall back to LAN IP detection so it works on local WiFi too.
  const getBaseUrl = () => {
    if (import.meta.env.VITE_APP_URL) return import.meta.env.VITE_APP_URL.replace(/\/$/, '');
    // In production the app is served from the same origin
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return window.location.origin;
    }
    // Local dev fallback — use LAN IP so phone can reach it
    return `http://192.168.100.173:${window.location.port || 5173}`;
  };
  const url = `${getBaseUrl()}/checkin/${site.id}`;
  const [copied, setCopied] = useState(false);
  const qrRef = useRef(null);
  const copy = () => { navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); };
  const downloadQR = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas'); canvas.width = 300; canvas.height = 300;
    const ctx = canvas.getContext('2d'); const img = new Image();
    img.onload = () => { ctx.fillStyle = '#fff'; ctx.fillRect(0,0,300,300); ctx.drawImage(img,0,0,300,300);
      const a = document.createElement('a'); a.download = `${site.name}-kiosk-qr.png`; a.href = canvas.toDataURL('image/png'); a.click(); };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Kiosk QR code</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 rounded-full p-1 hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-slate-600">Scan or display this QR at <strong>{site.name}</strong> for visitor self-sign-in.</p>
          <div ref={qrRef} className="flex justify-center p-4 bg-white border border-slate-200 rounded-xl">
            <QRCode value={url} size={180} bgColor="#ffffff" fgColor="#1e293b" level="M" />
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-xs font-mono text-slate-700 break-all">{url}</div>
          <div className="flex gap-2">
            <button onClick={copy} className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">
              {copied ? <><Check size={14} className="text-[#76c043]" /> Copied!</> : <><Copy size={14} /> Copy URL</>}
            </button>
            <button onClick={downloadQR} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#2b4594] hover:bg-[#1e326e] text-white rounded-lg text-sm font-semibold">
              <Download size={14} /> Download QR
            </button>
          </div>
          <a href={url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 text-sm text-[#2b4594] hover:underline font-semibold">
            <ExternalLink size={14} /> Open kiosk page
          </a>
        </div>
      </div>
    </div>
  );
};

// ─── New on-site report modal ─────────────────────────────────────────────────
const NewReportModal = ({ siteName, onClose }) => {
  const [time, setTime] = useState('09:00');
  const [recipients, setRecipients] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">New on-site report for {siteName}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 rounded-full p-1 hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1"><span className="text-red-500">* </span>Send report at</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]" />
            <p className="text-xs text-slate-400 mt-1">GMT+1 · Europe/London</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1"><span className="text-red-500">* </span>Recipients</label>
            <input type="text" value={recipients} onChange={e => setRecipients(e.target.value)} placeholder="email@company.com" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]" />
            <p className="text-xs text-slate-400 mt-1">Separate multiple email addresses with a comma</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
          <button onClick={onClose} className="px-5 py-2 bg-[#76c043] hover:bg-[#5fa832] text-white rounded-lg text-sm font-semibold">Add report</button>
        </div>
      </div>
    </div>
  );
};

// ─── Add evacuation point modal ───────────────────────────────────────────────
const EvacPointModal = ({ onClose }) => {
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Add new evacuation point</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 rounded-full p-1 hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1"><span className="text-red-500">* </span>Name of evacuation point</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1"><span className="text-red-500">* </span>Enter a letter or number to identify the point</label>
            <input maxLength={2} value={identifier} onChange={e => setIdentifier(e.target.value.toUpperCase())} className="w-20 border border-slate-300 rounded-lg px-3 py-2 text-sm text-center font-bold focus:outline-none focus:border-[#2b4594]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-1">Location and photo</p>
            <p className="text-xs text-slate-500 mb-2">This can be enabled to display on the kiosk on sign in</p>
            <div className="flex items-center border border-slate-300 rounded-lg px-3 py-2 gap-2">
              <QrCode size={14} className="text-slate-400" />
              <input type="text" placeholder="Search for a location" className="flex-1 text-sm outline-none" />
            </div>
            <p className="text-xs text-slate-500 mt-3 mb-1">Photo</p>
            <button className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800"><Download size={14} /> Upload image</button>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">Select the groups this applies to</p>
            {['Employees','Visitors','Deliveries'].map(g => (
              <label key={g} className="flex items-center gap-2 text-sm text-slate-700 mb-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-[#2b4594]" /> {g}
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
          <button onClick={onClose} className="px-5 py-2 bg-[#76c043] hover:bg-[#5fa832] text-white rounded-lg text-sm font-semibold">Save</button>
        </div>
      </div>
    </div>
  );
};

// ─── Main SitesList page ──────────────────────────────────────────────────────
const SitesList = () => {
  const [sites, setSites]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showAdd, setShowAdd]       = useState(false);
  const [editSite, setEditSite]     = useState(null);
  const [deleteSite, setDeleteSite] = useState(null);
  const [openSite, setOpenSite]     = useState(null); // opens SiteSettings

  const fetchSites = async () => {
    setLoading(true);
    try {
      const res = await api.get('/projects');
      setSites(res.data || []);
    } catch {
      setSites([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSites(); }, []);

  // ── Site settings view ───────────────────────────────────────────────────
  if (openSite) {
    return (
      <SiteSettings
        site={openSite}
        onBack={() => { setOpenSite(null); fetchSites(); }}
        onSaved={fetchSites}
      />
    );
  }

  return (
    <div className="max-w-4xl">
      {/* heading */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Sites</h1>
          <p className="text-slate-500 text-sm">
            Configure how visitors sign in and out of each site, including branding, custom fields and devices.
          </p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 bg-white shadow-sm">
          New site
        </button>
      </div>

      {/* list */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">Loading sites…</div>
      ) : sites.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 flex flex-col items-center gap-4 text-slate-400">
          <MapPin size={40} strokeWidth={1.2} />
          <div className="text-center">
            <p className="text-base font-semibold text-slate-600">No sites yet</p>
            <p className="text-sm mt-1">Create your first site to start tracking visitors.</p>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="mt-2 px-5 py-2 bg-[#2b4594] hover:bg-[#1e326e] text-white rounded-lg text-sm font-semibold">
            Create first site
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
          {sites.map(site => (
            <div key={site.id}
              className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 group cursor-pointer"
              onClick={() => setOpenSite(site)}>
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                <MapPin size={18} className="text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800">{site.name}</p>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">{site.code}</p>
              </div>
              <span className="text-sm text-slate-500 items-center gap-1.5 hidden group-hover:flex">
                → Devices &amp; posters
              </span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={e => e.stopPropagation()}>
                <button onClick={() => setEditSite(site)}
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => setDeleteSite(site)}
                  className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* modals */}
      {showAdd    && <SiteModal onClose={() => setShowAdd(false)} onSaved={fetchSites} />}
      {editSite   && <SiteModal site={editSite} onClose={() => setEditSite(null)} onSaved={fetchSites} />}
      {deleteSite && <DeleteModal site={deleteSite} onClose={() => setDeleteSite(null)} onDeleted={fetchSites} />}
    </div>
  );
};

export default SitesList;
