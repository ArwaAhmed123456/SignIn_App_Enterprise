import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin, Plus, Edit2, Trash2, X, Copy, Check,
  Eye, EyeOff, RefreshCw, ExternalLink, QrCode,
  ChevronDown, ArrowLeft, Download, Globe,
  Bell, ShieldCheck, FileText, Lock, Monitor,
  Settings, Plus as PlusIcon, Search, ToggleLeft,
} from 'lucide-react';
import QRCode from 'react-qr-code';
import api from '../../api';
import * as XLSX from 'xlsx';

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

const Btn = ({ children, onClick, variant = 'outline', disabled, className = '' }) => {
  const base = 'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50';
  const styles = {
    primary: `bg-[${BLUE}] hover:bg-[${BLUE_DARK}] text-white`,
    outline: 'border border-slate-300 text-slate-700 hover:bg-slate-50 bg-white',
    danger:  'bg-red-600 hover:bg-red-700 text-white',
  };
  return <button onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]} ${className}`}>{children}</button>;
};

// ── Site create modal ─────────────────────────────────────────────────────────
const SiteModal = ({ site, onClose, onSaved }) => {
  const isEdit = !!site;
  const [form, setForm] = useState({
    name: site?.name || '', code: site?.code || generateCode(),
    password: '', admin_email: site?.admin_email || '',
  });
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
      if (isEdit) await api.put(`/projects/${site.id}`, { name: form.name.trim(), code: form.code.trim().toUpperCase() });
      else await api.post('/projects', { name: form.name.trim(), code: form.code.trim().toUpperCase(), password: form.password, admin_email: form.admin_email.trim() });
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
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Head Office" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]" />
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
          <button onClick={handleSubmit} disabled={saving} className="px-5 py-2 bg-[#2b4594] hover:bg-[#1e326e] disabled:opacity-60 text-white rounded-lg text-sm font-semibold">{saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create site'}</button>
        </div>
      </div>
    </div>
  );
};

// ── Group visibility modal ────────────────────────────────────────────────────
const GroupVisibilityModal = ({ groups, visible, onClose, onSave }) => {
  const [selected, setSelected] = useState(visible || groups.map(g => g.id));
  const allChecked = groups.length > 0 && groups.every(g => selected.includes(g.id));
  const toggle = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll = () => setSelected(allChecked ? [] : groups.map(g => g.id));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Edit group visibility</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 rounded-full p-1 hover:bg-slate-100 border border-slate-200"><X size={16} /></button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <p className="text-sm font-semibold text-slate-700">Groups visible to this site ({selected.length})</p>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={allChecked} onChange={toggleAll} className="w-4 h-4 accent-[#2b4594]" />
            <span className="text-sm text-slate-700">All groups</span>
          </label>
          <div className="grid grid-cols-2 gap-2 pt-1">
            {groups.map(g => (
              <label key={g.id} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={selected.includes(g.id)} onChange={() => toggle(g.id)} className="w-4 h-4 accent-[#2b4594]" />
                <span className="text-sm text-slate-700">{g.name}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
          <button onClick={() => { onSave(selected); onClose(); }} className="px-5 py-2 bg-[#2b4594] hover:bg-[#1e326e] text-white rounded-lg text-sm font-semibold">Save</button>
        </div>
      </div>
    </div>
  );
};

// ── Add sign in / notice field modal ──────────────────────────────────────────
const AddFieldModal = ({ title, groups, onClose, onSave }) => {
  const FIELD_TYPES = ['Text','Number','Uppercase','Notify list','Signature','Checkbox'];
  const [fieldType, setFieldType] = useState('Text');
  const [label, setLabel]         = useState('');
  const [required, setRequired]   = useState(false);
  const [groupId, setGroupId]     = useState(groups[0]?.id || '');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 rounded-full p-1 hover:bg-slate-100 border border-slate-200"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1"><span className="text-red-500">* </span>Select field type</label>
            <select value={fieldType} onChange={e => setFieldType(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]">
              {FIELD_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1"><span className="text-red-500">* </span>Field label</label>
            <input value={label} onChange={e => setLabel(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
            <input type="checkbox" checked={required} onChange={e => setRequired(e.target.checked)} className="w-4 h-4 accent-[#2b4594]" /> Is this field required?
          </label>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1"><span className="text-red-500">* </span>Select the groups this applies to</label>
            <select value={groupId} onChange={e => setGroupId(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]">
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
          <button onClick={() => { if(label.trim()) { onSave({ type: fieldType, label, required, groupId }); onClose(); } }} className="px-5 py-2 bg-[#2b4594] hover:bg-[#1e326e] text-white rounded-lg text-sm font-semibold">Add field</button>
        </div>
      </div>
    </div>
  );
};

// ── Add notice modal ──────────────────────────────────────────────────────────
const AddNoticeModal = ({ groups, onClose, onSave }) => {
  const ACTIONS = ['No action required','Optional - Checkbox that can be optionally ticked','Agreement required - Checkbox that must be ticked','Agreement required - Signature must be provided'];
  const LANGS = ['Albanian (Kiosk only)','Bulgarian (Kiosk only)','Catalan','Chinese Simplified (Kiosk only)','Chinese Traditional (Hong Kong) (Kiosk only)','Croatian','Czech','Danish','Dutch','Estonian','Finnish','French','German','Greek','Hungarian','Indonesian','Italian','Japanese','Korean','Latvian','Lithuanian','Malay','Norwegian','Polish','Portuguese','Romanian','Russian','Serbian','Slovak','Slovenian','Spanish','Swedish','Turkish','Ukrainian','Vietnamese'];
  const [title, setTitle]       = useState('');
  const [content, setContent]   = useState('');
  const [action, setAction]     = useState(ACTIONS[0]);
  const [groupId, setGroupId]   = useState(groups[0]?.id || '');
  const [langOpen, setLangOpen] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Add notice</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 rounded-full p-1 hover:bg-slate-100 border border-slate-200"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1"><span className="text-red-500">* </span>Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Content</label>
            <textarea rows={5} value={content} onChange={e => setContent(e.target.value)} placeholder="Start typing or paste content here" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-[#2b4594]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-1">Attach a file</p>
            <p className="text-xs text-slate-400 mb-2">Images, pdfs, docx, doc, xlsx, xls and ppt (Max size 50mb)</p>
            <button className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg px-3 py-1.5"><Download size={14} /> Upload file</button>
          </div>
          <div className="relative">
            <label className="block text-sm font-semibold text-slate-700 mb-1">Select if an action is required to continue</label>
            <button onClick={() => setActionOpen(o => !o)} className="w-full flex items-center justify-between border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white">
              <span className={action === ACTIONS[0] ? 'text-[#2b4594] font-semibold' : ''}>{action}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
            {actionOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30">
                {ACTIONS.map(a => (
                  <button key={a} onClick={() => { setAction(a); setActionOpen(false); }} className={`block w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 ${a === action ? 'text-[#2b4594] font-semibold' : 'text-slate-700'}`}>{a}</button>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <p className="text-sm font-semibold text-slate-700 mb-1">Translations <span className="text-xs bg-[#2b4594] text-white px-1.5 py-0.5 rounded font-bold ml-1">BETA</span></p>
            <p className="text-xs text-slate-400 mb-2">Translations are auto-generated in your chosen languages and can be edited if needed</p>
            <div className="flex gap-2">
              <button onClick={() => setLangOpen(o => !o)} className="flex-1 flex items-center justify-between border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-500 bg-white">
                Select languages <ChevronDown size={14} className="text-slate-400" />
              </button>
              <button className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">Translate</button>
            </div>
            {langOpen && (
              <div className="absolute left-0 top-full mt-1 w-64 max-h-52 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-2">
                {LANGS.map(l => (
                  <label key={l} className="flex items-center gap-2 px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer rounded">
                    <input type="checkbox" className="w-3.5 h-3.5 accent-[#2b4594]" /> {l}
                  </label>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1"><span className="text-red-500">* </span>Select the groups this applies to</label>
            <select value={groupId} onChange={e => setGroupId(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]">
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
          <button onClick={() => { if(title.trim()) { onSave({ title, content, action, groupId }); onClose(); } }} className="px-5 py-2 bg-[#2b4594] hover:bg-[#1e326e] text-white rounded-lg text-sm font-semibold">Add notice</button>
        </div>
      </div>
    </div>
  );
};

// ── Add poster modal ──────────────────────────────────────────────────────────
const AddPosterModal = ({ site, groups, onClose }) => {
  const [name, setName]         = useState('');
  const [instructions, setInst] = useState('');
  const [selGroups, setSelGroups] = useState(groups.map(g => g.id));
  const [advOpen, setAdvOpen]   = useState(false);
  const toggleGroup = (id) => setSelGroups(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const allSel = groups.every(g => selGroups.includes(g.id));

  const getBaseUrl = () => {
    if (import.meta.env.VITE_APP_URL) return import.meta.env.VITE_APP_URL.replace(/\/$/, '');
    if (window.location.hostname !== 'localhost') return window.location.origin;
    return `http://192.168.100.173:${window.location.port || 5173}`;
  };
  const qrUrl = `${getBaseUrl()}/checkin/${site.id}`;
  const qrRef = useRef(null);

  const downloadPoster = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas'); canvas.width = 300; canvas.height = 300;
    const ctx = canvas.getContext('2d'); const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#fff'; ctx.fillRect(0,0,300,300); ctx.drawImage(img,0,0,300,300);
      const a = document.createElement('a'); a.download = `${name||'poster'}-qr.png`; a.href = canvas.toDataURL('image/png'); a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Add new sign in poster</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 rounded-full p-1 hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1"><span className="text-red-500">* </span>Name of poster</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="E.g. where the poster will be located" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1"><span className="text-red-500">* </span>Instructions</label>
            <textarea rows={3} value={instructions} onChange={e => setInst(e.target.value)} placeholder="E.g. what to do once signed in" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-[#2b4594]" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Available to groups</label>
            <div className="border border-slate-300 rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-sm text-slate-600">
                <span>All groups</span><ChevronDown size={14} />
              </div>
              <div className="p-2 space-y-1">
                <label className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-slate-50 rounded">
                  <input type="checkbox" checked={allSel} onChange={() => setSelGroups(allSel ? [] : groups.map(g => g.id))} className="w-4 h-4 accent-[#2b4594]" /> Select all
                </label>
                {groups.map(g => (
                  <label key={g.id} className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-slate-50 rounded">
                    <input type="checkbox" checked={selGroups.includes(g.id)} onChange={() => toggleGroup(g.id)} className="w-4 h-4 accent-[#2b4594]" /> {g.name}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <button onClick={() => setAdvOpen(o => !o)} className="flex items-center justify-between w-full bg-slate-50 rounded-lg px-4 py-3 text-sm font-semibold text-slate-700 border border-slate-200">
            Advanced settings <span>{advOpen ? '−' : '+'}</span>
          </button>
          {advOpen && (
            <label className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 accent-[#2b4594] mt-0.5" />
              <div><p className="font-semibold">Hide host list (if enabled for group)</p><p className="text-xs text-slate-400">Protects privacy of hosts when scanning a static QR code</p></div>
            </label>
          )}
          {name && (
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">QR Preview</p>
              <div ref={qrRef} className="flex justify-center p-3 bg-white border border-slate-200 rounded-lg w-fit">
                <QRCode value={qrUrl} size={120} bgColor="#ffffff" fgColor="#1e293b" level="M" />
              </div>
              <button onClick={downloadPoster} className="mt-2 inline-flex items-center gap-2 text-sm text-[#2b4594] hover:underline font-semibold"><Download size={14} /> Download QR</button>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
          <button onClick={onClose} className="px-5 py-2 bg-[#2b4594] hover:bg-[#1e326e] text-white rounded-lg text-sm font-semibold">Add poster</button>
        </div>
      </div>
    </div>
  );
};

// ── Evacuation point modal ────────────────────────────────────────────────────
const EvacPointModal = ({ groups, onClose, onSave }) => {
  const [name, setName]           = useState('');
  const [identifier, setIdent]    = useState('');
  const [selGroups, setSelGroups] = useState([]);
  const [open, setOpen]           = useState(false);
  const toggle = (id) => setSelGroups(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const allSel = groups.length > 0 && groups.every(g => selGroups.includes(g.id));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Add new evacuation point</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 rounded-full p-1 hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1"><span className="text-red-500">* </span>Name of evacuation point</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1"><span className="text-red-500">* </span>Enter a letter or number to identify the point</label>
            <input maxLength={2} value={identifier} onChange={e => setIdent(e.target.value.toUpperCase())} className="w-20 border border-slate-300 rounded-lg px-3 py-2 text-sm text-center font-bold focus:outline-none focus:border-[#2b4594]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-1">Location and photo</p>
            <p className="text-xs text-slate-500 mb-2">This can be enabled to display on the kiosk on sign in</p>
            <div className="flex items-center border border-slate-300 rounded-lg px-3 py-2 gap-2">
              <Search size={14} className="text-slate-400" />
              <input type="text" placeholder="Search for a location" className="flex-1 text-sm outline-none" />
            </div>
            <p className="text-xs text-slate-500 mt-3 mb-1">Photo</p>
            <button className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800"><Download size={14} /> Upload image</button>
          </div>
          <div className="relative">
            <p className="text-sm font-semibold text-slate-700 mb-2">Select the groups this applies to</p>
            <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-600 bg-white">
              {selGroups.length === 0 ? 'None selected' : selGroups.length === groups.length ? 'All groups' : `${selGroups.length} selected`}
              <ChevronDown size={14} className="text-slate-400" />
            </button>
            {open && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-2">
                <label className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-slate-50 rounded">
                  <input type="checkbox" checked={allSel} onChange={() => setSelGroups(allSel ? [] : groups.map(g => g.id))} className="w-4 h-4 accent-[#2b4594]" /> Select all
                </label>
                {groups.map(g => (
                  <label key={g.id} className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-slate-50 rounded">
                    <input type="checkbox" checked={selGroups.includes(g.id)} onChange={() => toggle(g.id)} className="w-4 h-4 accent-[#2b4594]" /> {g.name}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
          <button onClick={() => { if (name && identifier) { onSave({ name, identifier, groups: selGroups }); onClose(); } }} className="px-5 py-2 bg-[#2b4594] hover:bg-[#1e326e] text-white rounded-lg text-sm font-semibold">Save</button>
        </div>
      </div>
    </div>
  );
};

// ── Site settings view (tabbed) ───────────────────────────────────────────────
const SiteSettings = ({ site, groups, onBack, onDeleted }) => {
  const TABS = ['Details','Sign in & out flow','Devices & QR posters','Evacuation setup','On-site report','Privacy'];
  const [tab, setTab]               = useState('Details');
  const [siteName, setSiteName]     = useState(site.name);
  const [advOpen, setAdvOpen]       = useState(false);
  const [contactName, setContactName] = useState('');
  const [replyEmail, setReplyEmail] = useState('');
  const [visibleGroups, setVisible] = useState(groups.map(g => g.id));
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [signInFields, setSignInFields] = useState([]);
  const [signOutFields, setSignOutFields] = useState([]);
  const [notices, setNotices]       = useState([]);
  const [capturePhoto, setCapturePhoto] = useState(true);
  const [evacPoints, setEvacPoints] = useState([]);
  const [reports, setReports]       = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [privacyAutocomplete, setPrivacyAC] = useState(true);
  const [privacyHideList, setPrivacyHL]     = useState(false);
  const [showAddField, setShowAddField]     = useState(null); // 'signin'|'signout'
  const [showAddNotice, setShowAddNotice]   = useState(false);
  const [showAddPoster, setShowAddPoster]   = useState(false);
  const [showEvacModal, setShowEvacModal]   = useState(false);
  const [posters, setPosters]       = useState([]);
  const [saving, setSaving]         = useState(false);

  const siteRef = useRef(null);
  const [sitePickerOpen, setSitePickerOpen] = useState(false);
  const [allSites, setAllSites] = useState([site]);
  const [currentSite, setCurrentSite] = useState(site);

  useEffect(() => {
    api.get('/projects').then(r => setAllSites(r.data || [site])).catch(() => {});
  }, []);

  const handleSaveDetails = async () => {
    setSaving(true);
    try { await api.put(`/projects/${currentSite.id}`, { name: siteName.trim(), code: currentSite.code }); }
    catch {}
    finally { setSaving(false); }
  };

  const getBaseUrl = () => {
    if (import.meta.env.VITE_APP_URL) return import.meta.env.VITE_APP_URL.replace(/\/$/, '');
    if (window.location.hostname !== 'localhost') return window.location.origin;
    return `http://192.168.100.173:${window.location.port || 5173}`;
  };

  return (
    <div className="max-w-5xl">
      {/* Header with site picker */}
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Site settings for</h1>
        <div className="relative" ref={siteRef}>
          <button onClick={() => setSitePickerOpen(o => !o)} className="flex items-center gap-1 text-2xl font-semibold text-slate-600 border-b border-dashed border-slate-400 hover:text-slate-800">
            {currentSite.name} <ChevronDown size={18} />
          </button>
          {sitePickerOpen && (
            <div className="absolute left-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 w-52">
              {allSites.map(s => (
                <button key={s.id} onClick={() => { setCurrentSite(s); setSiteName(s.name); setSitePickerOpen(false); }}
                  className={`block w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 ${s.id === currentSite.id ? 'text-[#2b4594] font-semibold' : 'text-slate-700'}`}>
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-slate-200 mb-8 overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${tab === t ? 'border-[#2b4594] text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── DETAILS TAB ─────────────────────────────────────── */}
      {tab === 'Details' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
            <h2 className="text-base font-bold text-slate-800">General</h2>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Site name</label>
              <input value={siteName} onChange={e => setSiteName(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]" />
            </div>
            <button onClick={() => setAdvOpen(o => !o)} className="flex items-center justify-between w-full bg-slate-50 rounded-lg px-4 py-3 text-sm font-semibold text-slate-700 border border-slate-200">
              Advanced options <span>{advOpen ? '−' : '+'}</span>
            </button>
            {advOpen && (
              <div className="space-y-4 pt-1">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Name of contact for email notifications</label>
                  <input value={contactName} onChange={e => setContactName(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]" />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Reply to email address</label>
                  <input type="email" value={replyEmail} onChange={e => setReplyEmail(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]" />
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <button onClick={handleSaveDetails} disabled={saving} className="px-5 py-2 bg-[#2b4594] hover:bg-[#1e326e] text-white rounded-lg text-sm font-semibold disabled:opacity-60">{saving ? 'Saving…' : 'Save changes'}</button>
            </div>
            <div className="pt-4 border-t border-slate-100">
              <button onClick={() => { if (window.confirm(`Delete "${currentSite.name}"? This cannot be undone.`)) { api.delete(`/projects/${currentSite.id}`).then(onDeleted); } }}
                className="flex items-center gap-2 text-sm text-red-600 hover:underline">
                <Trash2 size={14} /> Delete {currentSite.name.toLowerCase().includes('remote') ? 'remote site' : 'site'}
              </button>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-800">Group visibility</h2>
            <p className="text-sm text-slate-500">These are the groups that can sign in and out of this site</p>
            <div className="flex flex-wrap gap-2">
              {groups.filter(g => visibleGroups.includes(g.id)).map(g => (
                <span key={g.id} className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-lg text-sm text-slate-700">
                  <Globe size={13} className="text-slate-400" /> {g.name}
                </span>
              ))}
              {visibleGroups.length === 0 && <span className="text-sm text-slate-400">No groups selected</span>}
            </div>
            <button onClick={() => setShowGroupModal(true)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">Edit group visibility</button>
          </div>
        </div>
      )}

      {/* ── SIGN IN & OUT FLOW TAB ───────────────────────────── */}
      {tab === 'Sign in & out flow' && (
        <div className="space-y-8">
          <div className="flex items-center justify-between mb-2">
            <div />
            <select className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]">
              <option>All groups</option>
              {groups.map(g => <option key={g.id}>{g.name}</option>)}
            </select>
          </div>

          {/* Sign in fields */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-800">Sign in fields</h2>
              <button onClick={() => setShowAddField('signin')} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">Add sign in field</button>
            </div>
            {signInFields.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-slate-400 gap-2 border border-slate-200 rounded-xl bg-white">
                <span className="text-2xl">→</span>
                <p className="font-semibold text-slate-600 text-sm">This site has no sign in questions</p>
                <p className="text-xs">Gather feedback or information as visitors arrive</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm"><thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase"><tr><th className="px-4 py-3 text-left">Label</th><th className="px-4 py-3 text-left">Group</th><th className="px-4 py-3 text-left">Type</th><th className="px-4 py-3"></th></tr></thead>
                <tbody className="divide-y divide-slate-100">{signInFields.map((f,i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{f.label}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-600">{groups.find(g=>g.id===f.groupId)?.name||''}</span></td>
                    <td className="px-4 py-3 text-slate-500">{f.type}</td>
                    <td className="px-4 py-3 text-right"><button onClick={() => setSignInFields(s => s.filter((_,j)=>j!==i))} className="text-slate-400 hover:text-red-600 p-1"><Trash2 size={13}/></button></td>
                  </tr>
                ))}</tbody></table>
              </div>
            )}
          </div>

          {/* Sign in notices */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-800">Sign in notices</h2>
              <button onClick={() => setShowAddNotice(true)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">Add notice</button>
            </div>
            {notices.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-slate-400 gap-2 border border-slate-200 rounded-xl bg-white">
                <FileText size={32} strokeWidth={1.2} />
                <p className="font-semibold text-slate-600 text-sm">This site has no notices</p>
                <p className="text-xs">Add NDAs, safety instructions, or policy reminders to acknowledge on sign in</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm"><thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase"><tr><th className="px-4 py-3 text-left">Title</th><th className="px-4 py-3 text-left">Group</th><th className="px-4 py-3 text-left">Action</th><th className="px-4 py-3"></th></tr></thead>
                <tbody className="divide-y divide-slate-100">{notices.map((n,i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{n.title}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-slate-100 rounded text-xs">{groups.find(g=>g.id===n.groupId)?.name||''}</span></td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{n.action}</td>
                    <td className="px-4 py-3 text-right"><button onClick={() => setNotices(s => s.filter((_,j)=>j!==i))} className="text-slate-400 hover:text-red-600 p-1"><Trash2 size={13}/></button></td>
                  </tr>
                ))}</tbody></table>
              </div>
            )}
          </div>

          {/* Sign out fields */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-800">Sign out fields</h2>
              <button onClick={() => setShowAddField('signout')} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">Add sign out field</button>
            </div>
            {signOutFields.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-slate-400 gap-2 border border-slate-200 rounded-xl bg-white">
                <span className="text-2xl">→</span>
                <p className="font-semibold text-slate-600 text-sm">This site has no sign out questions</p>
                <p className="text-xs">Gather feedback or information as visitors depart</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm"><thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase"><tr><th className="px-4 py-3 text-left">Label</th><th className="px-4 py-3 text-left">Group</th><th className="px-4 py-3 text-left">Type</th><th className="px-4 py-3"></th></tr></thead>
                <tbody className="divide-y divide-slate-100">{signOutFields.map((f,i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{f.label}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-slate-100 rounded text-xs">{groups.find(g=>g.id===f.groupId)?.name||''}</span></td>
                    <td className="px-4 py-3 text-slate-500">{f.type}</td>
                    <td className="px-4 py-3 text-right"><button onClick={() => setSignOutFields(s => s.filter((_,j)=>j!==i))} className="text-slate-400 hover:text-red-600 p-1"><Trash2 size={13}/></button></td>
                  </tr>
                ))}</tbody></table>
              </div>
            )}
          </div>

          {/* Capture sign in photo */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-base font-bold text-slate-800 mb-4">Capture sign in photo</h2>
            <div className="flex gap-6">
              {['On','Off'].map(opt => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                  <div onClick={() => setCapturePhoto(opt === 'On')}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer ${(opt === 'On' ? capturePhoto : !capturePhoto) ? 'border-[#2b4594]' : 'border-slate-300'}`}>
                    {(opt === 'On' ? capturePhoto : !capturePhoto) && <div className="w-2.5 h-2.5 rounded-full bg-[#2b4594]" />}
                  </div>
                  <span className="text-sm text-slate-700">{opt}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── DEVICES & QR POSTERS TAB ────────────────────────── */}
      {tab === 'Devices & QR posters' && (
        <div className="space-y-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div><h2 className="text-base font-bold text-slate-800">Devices</h2><p className="text-xs text-slate-500 mt-0.5">Manage which devices are linked to this site</p></div>
              <button className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 bg-white">Connect new device</button>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm"><thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase"><tr><th className="px-4 py-3 text-left">Device name</th><th className="px-4 py-3 text-left">App version</th><th className="px-4 py-3 text-left">OS version</th><th className="px-4 py-3 text-left">Checked in</th></tr></thead>
              <tbody>
                <tr><td colSpan={4} className="py-12 text-center text-slate-400">
                  <Monitor size={32} strokeWidth={1.2} className="mx-auto mb-2" />
                  <p className="font-semibold text-slate-600 text-sm">No devices connected</p>
                  <p className="text-xs">Manage which devices are linked to this site</p>
                </td></tr>
              </tbody></table>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <div><h2 className="text-base font-bold text-slate-800">QR code sign in posters</h2><p className="text-xs text-slate-500 mt-0.5">Display a static QR code so visitors can sign in using their smartphone</p></div>
              <button onClick={() => setShowAddPoster(true)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 bg-white">Add new poster</button>
            </div>
            {posters.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 py-12 flex flex-col items-center gap-2 text-slate-400">
                <QrCode size={32} strokeWidth={1.2} />
                <p className="font-semibold text-slate-600 text-sm">No QR code sign in posters have been created for this site yet</p>
                <p className="text-xs">Add QR code sign in posters for this site</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm"><thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase"><tr><th className="px-4 py-3 text-left">Poster name</th><th className="px-4 py-3 text-left">For groups</th><th className="px-4 py-3 text-left">Date created</th><th className="px-4 py-3 text-left">Download</th></tr></thead>
                <tbody className="divide-y divide-slate-100">{posters.map((p,i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{p.groups?.join(', ')}</td>
                    <td className="px-4 py-3 text-slate-500">{fmtDate(p.createdAt)}</td>
                    <td className="px-4 py-3"><button className="inline-flex items-center gap-1.5 text-sm text-[#2b4594] hover:underline font-semibold"><Download size={13}/> Poster</button></td>
                  </tr>
                ))}</tbody></table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── EVACUATION SETUP TAB ────────────────────────────── */}
      {tab === 'Evacuation setup' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div><h2 className="text-base font-bold text-slate-800">Evacuation points</h2><p className="text-xs text-slate-500 mt-0.5">Assign groups to an evacuation point for more efficient roll calls</p></div>
            <button onClick={() => setShowEvacModal(true)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 bg-white">Add evacuation point</button>
          </div>
          {evacPoints.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 py-12 flex flex-col items-center gap-2 text-slate-400">
              <ShieldCheck size={36} strokeWidth={1.2} />
              <p className="font-semibold text-slate-600 text-sm">No evacuation points have been added to this site yet</p>
              <p className="text-xs">Assign groups to an evacuation point for more efficient roll calls</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm"><thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase"><tr><th className="px-4 py-3 text-left">Name</th><th className="px-4 py-3 text-left">Group</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{evacPoints.map((p,i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{p.name} <span className="ml-2 text-xs font-mono text-slate-400">{p.identifier}</span></td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{p.groups?.map(id => groups.find(g=>g.id===id)?.name).filter(Boolean).join(', ')}</td>
                </tr>
              ))}</tbody></table>
            </div>
          )}
        </div>
      )}

      {/* ── ON-SITE REPORT TAB ──────────────────────────────── */}
      {tab === 'On-site report' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div><h2 className="text-base font-bold text-slate-800">Report schedule</h2><p className="text-xs text-slate-500 mt-0.5">Schedule a time to send an email report of who is still signed in</p></div>
            <button onClick={() => setShowReportModal(true)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 bg-white">New report</button>
          </div>
          {reports.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 py-12 flex flex-col items-center gap-2 text-slate-400">
              <FileText size={32} strokeWidth={1.2} />
              <p className="font-semibold text-slate-600 text-sm">There are no reports currently scheduled</p>
              <p className="text-xs">An email will be sent daily at the set time, listing all those still signed in</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm"><thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase"><tr><th className="px-4 py-3 text-left">Time of report</th><th className="px-4 py-3 text-left">Recipients</th><th className="px-4 py-3"></th></tr></thead>
              <tbody className="divide-y divide-slate-100">{reports.map((r,i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{r.time}</td>
                  <td className="px-4 py-3 text-slate-500">{r.recipients}</td>
                  <td className="px-4 py-3 text-right"><button onClick={() => setReports(s=>s.filter((_,j)=>j!==i))} className="text-slate-400 hover:text-red-600 p-1"><Trash2 size={13}/></button></td>
                </tr>
              ))}</tbody></table>
            </div>
          )}
        </div>
      )}

      {/* ── PRIVACY TAB ─────────────────────────────────────── */}
      {tab === 'Privacy' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-xl space-y-4">
          <h2 className="text-base font-bold text-slate-800">Privacy</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={privacyAutocomplete} onChange={e => setPrivacyAC(e.target.checked)} className="w-4 h-4 accent-[#2b4594]" />
            <span className="text-sm text-slate-700">Show autocomplete for returning visitors</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={privacyHideList} onChange={e => setPrivacyHL(e.target.checked)} className="w-4 h-4 accent-[#2b4594]" />
            <span className="text-sm text-slate-700">Hide visitor sign out list and require name to be entered</span>
          </label>
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────── */}
      {showGroupModal && <GroupVisibilityModal groups={groups} visible={visibleGroups} onClose={() => setShowGroupModal(false)} onSave={setVisible} />}
      {showAddField === 'signin' && <AddFieldModal title="Add sign in field" groups={groups} onClose={() => setShowAddField(null)} onSave={f => setSignInFields(s => [...s, f])} />}
      {showAddField === 'signout' && <AddFieldModal title="Add sign out field" groups={groups} onClose={() => setShowAddField(null)} onSave={f => setSignOutFields(s => [...s, f])} />}
      {showAddNotice && <AddNoticeModal groups={groups} onClose={() => setShowAddNotice(false)} onSave={n => setNotices(s => [...s, n])} />}
      {showAddPoster && <AddPosterModal site={currentSite} groups={groups} onClose={() => setShowAddPoster(false)} />}
      {showEvacModal && <EvacPointModal groups={groups} onClose={() => setShowEvacModal(false)} onSave={p => setEvacPoints(s => [...s, p])} />}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">New on-site report for {currentSite.name}</h2>
              <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-700 rounded-full p-1 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <NewReportForm siteName={currentSite.name} onClose={() => setShowReportModal(false)} onSave={r => { setReports(s => [...s, r]); setShowReportModal(false); }} />
          </div>
        </div>
      )}
    </div>
  );
};

const NewReportForm = ({ siteName, onClose, onSave }) => {
  const [time, setTime] = useState(() => { const d = new Date(); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; });
  const [recipients, setRecipients] = useState('');
  return (
    <div className="px-6 py-5 space-y-4">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1"><span className="text-red-500">* </span>Send report at</label>
        <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]" />
        <p className="text-xs text-slate-400 mt-1">GMT+1 · Europe/London</p>
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1"><span className="text-red-500">* </span>Recipients</label>
        <input value={recipients} onChange={e => setRecipients(e.target.value)} placeholder="email@company.com" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]" />
        <p className="text-xs text-slate-400 mt-1">Separate multiple email addresses with a comma</p>
      </div>
      <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
        <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
        <button onClick={() => { if (recipients.trim()) onSave({ time, recipients }); }} className="px-5 py-2 bg-[#2b4594] hover:bg-[#1e326e] text-white rounded-lg text-sm font-semibold">Add report</button>
      </div>
    </div>
  );
};

// ── Main SitesList page ───────────────────────────────────────────────────────
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
      const list = res.data || [];
      setSites(list);
      // Load groups for first site
      if (list.length > 0) {
        const gr = await api.get(`/visitor-groups?project_id=${list[0].id}`);
        setGroups(gr.data || []);
      }
    } catch { setSites([]); }
    finally { setLoading(false); }
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
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Sites</h1>
          <p className="text-slate-500 text-sm">Configure how visitors should sign in and out of each site, including branding, custom fields and devices</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 bg-white shadow-sm">
          New site
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">Loading sites…</div>
      ) : sites.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 flex flex-col items-center gap-4 text-slate-400">
          <MapPin size={40} strokeWidth={1.2} />
          <div className="text-center">
            <p className="text-base font-semibold text-slate-600">No sites yet</p>
            <p className="text-sm mt-1">Create your first site to start tracking visitors.</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="mt-2 px-5 py-2 bg-[#2b4594] hover:bg-[#1e326e] text-white rounded-lg text-sm font-semibold">
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
                {site.name?.toLowerCase().includes('remote') ? <Globe size={18} className="text-slate-400" /> : <MapPin size={18} className="text-slate-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800">{site.name}</p>
              </div>
              <span className="text-sm text-slate-500 items-center gap-1.5 hidden group-hover:flex">
                → Devices &amp; posters
              </span>
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
