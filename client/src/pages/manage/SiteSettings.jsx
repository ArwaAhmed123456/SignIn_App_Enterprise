import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown, X, Plus, Trash2, Edit2, Download, QrCode,
  Monitor, Smartphone, Check, Copy, ExternalLink, Upload,
  Settings, RefreshCw, Bell, Shield, FileText, Lock,
} from 'lucide-react';
import QRCode from 'react-qr-code';
import api from '../../api';

// ─── constants ───────────────────────────────────────────────────────────────
const TABS = [
  'Details', 'Kiosk', 'Sign in & out flow',
  'Devices & QR posters', 'Evacuation setup', 'On-site report', 'Privacy',
];

const FIELD_TYPES = ['Text','Number','Uppercase','Notify list','Signature','Date','Checkbox','Phone','Email'];
const LANGUAGES   = ['English (UK)','English (US)','French','German','Spanish','Arabic','Chinese Simplified','Portuguese'];
const ACTION_OPTS = [
  'No action required',
  'Optional - Checkbox that can be optionally ticked',
  'Agreement required - Checkbox that must be ticked',
  'Agreement required - Signature must be provided',
];

// ─── shared helpers ───────────────────────────────────────────────────────────
const Btn = ({ children, onClick, variant='outline', disabled=false, className='' }) => {
  const base = 'inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50';
  const styles = {
    outline:  'border border-slate-300 text-slate-700 hover:bg-slate-50 bg-white',
    primary:  'bg-[#76c043] hover:bg-[#5fa832] text-white',
    blue:     'bg-[#2b4594] hover:bg-[#1e326e] text-white',
    danger:   'text-red-600 hover:text-red-700',
    ghost:    'text-slate-600 hover:bg-slate-100',
  };
  return <button onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]} ${className}`}>{children}</button>;
};

const Section = ({ title, desc, action, children }) => (
  <div className="mb-8">
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        {desc && <p className="text-sm text-slate-500 mt-0.5">{desc}</p>}
      </div>
      {action}
    </div>
    {children}
  </div>
);

const EmptyState = ({ icon: Icon, title, desc }) => (
  <div className="flex flex-col items-center gap-3 py-12 text-slate-400">
    <Icon size={40} strokeWidth={1.2} />
    <p className="text-base font-semibold text-slate-600">{title}</p>
    {desc && <p className="text-sm text-center max-w-sm">{desc}</p>}
  </div>
);

const Toggle = ({ checked, onChange }) => (
  <label className="flex items-center gap-2 cursor-pointer">
    <div className={`relative w-10 h-6 rounded-full transition-colors ${checked ? 'bg-[#76c043]' : 'bg-slate-200'}`}
      onClick={() => onChange(!checked)}>
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
    </div>
  </label>
);

const Radio = ({ checked, onChange, label, desc }) => (
  <label className="flex items-start gap-3 cursor-pointer mb-3">
    <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${checked ? 'border-[#76c043]' : 'border-slate-300'}`}
      onClick={onChange}>
      {checked && <div className="w-2 h-2 rounded-full bg-[#76c043]" />}
    </div>
    <div>
      <p className="text-sm font-semibold text-slate-800">{label}</p>
      {desc && <p className="text-xs text-slate-500">{desc}</p>}
    </div>
  </label>
);

// ─── Add Field Modal ──────────────────────────────────────────────────────────
const AddFieldModal = ({ title, groups, onClose, onAdd }) => {
  const [fieldType, setFieldType] = useState('Text');
  const [label, setLabel]         = useState('');
  const [required, setRequired]   = useState(false);
  const [group, setGroup]         = useState(groups[0]?.name || 'Employees');
  const [langs, setLangs]         = useState([]);
  const [displayIn, setDisplayIn] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100"><X size={18}/></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1"><span className="text-red-500">* </span>Select field type</label>
            <select value={fieldType} onChange={e => setFieldType(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]">
              {FIELD_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1"><span className="text-red-500">* </span>Field label</label>
            <input value={label} onChange={e => setLabel(e.target.value)} placeholder=""
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]"/>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" checked={required} onChange={e => setRequired(e.target.checked)} className="w-4 h-4 accent-[#2b4594]"/>
            Is this field required?
          </label>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Also display this field in</label>
            <select value={displayIn} onChange={e => setDisplayIn(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]">
              <option value=""></option><option>Pre-registration</option><option>Sign out</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Translations <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-700 ml-1">BETA</span>
            </label>
            <p className="text-xs text-slate-400 mb-2">Translations are auto-generated in your chosen languages and can be edited if needed</p>
            <div className="flex gap-2">
              <select className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]">
                <option value="">Select languages</option>
                {LANGUAGES.map(l => <option key={l}>{l}</option>)}
              </select>
              <Btn variant="outline">Translate</Btn>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1"><span className="text-red-500">* </span>Select the groups this applies to</label>
            <select value={group} onChange={e => setGroup(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]">
              {groups.map(g => <option key={g.id||g.name} value={g.name}>{g.name}</option>)}
              {groups.length === 0 && <option>Employees</option>}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={() => { if(label.trim()) { onAdd({fieldType,label,required,group,displayIn}); onClose(); }}}>Add field</Btn>
        </div>
      </div>
    </div>
  );
};

// ─── Add Notice Modal ─────────────────────────────────────────────────────────
const AddNoticeModal = ({ groups, onClose, onAdd }) => {
  const [noticeTitle, setNoticeTitle] = useState('');
  const [content, setContent]         = useState('');
  const [action, setAction]           = useState('No action required');
  const [group, setGroup]             = useState(groups[0]?.name || 'Employees');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Add notice</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100"><X size={18}/></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1"><span className="text-red-500">* </span>Title</label>
            <input value={noticeTitle} onChange={e => setNoticeTitle(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]"/>
          </div>
          <div>
            <div className="flex items-center gap-1 mb-2 border-b border-slate-200 pb-1">
              {['Normal','B','I','U','OL','UL','—'].map(t => (
                <button key={t} className="px-2 py-1 text-xs rounded hover:bg-slate-100 text-slate-600 font-semibold">{t}</button>
              ))}
            </div>
            <textarea value={content} onChange={e => setContent(e.target.value)}
              placeholder="Start typing or paste content here" rows={5}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594] resize-none"/>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Attach a file</label>
            <p className="text-xs text-slate-400 mb-2">Images, pdfs, docx, doc, xlsx, xls and ppt (Max size 50mb)</p>
            <button className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800">
              <Upload size={14}/> Upload file
            </button>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Select if an action is required to continue</label>
            <select value={action} onChange={e => setAction(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]">
              {ACTION_OPTS.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Translations <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-700 ml-1">BETA</span>
            </label>
            <div className="flex gap-2">
              <select className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]">
                <option value="">Select languages</option>
                {LANGUAGES.map(l => <option key={l}>{l}</option>)}
              </select>
              <Btn variant="outline">Translate</Btn>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1"><span className="text-red-500">* </span>Select the groups this applies to</label>
            <select value={group} onChange={e => setGroup(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]">
              {groups.map(g => <option key={g.id||g.name} value={g.name}>{g.name}</option>)}
              {groups.length === 0 && <option>Employees</option>}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={() => { if(noticeTitle.trim()) { onAdd({noticeTitle,content,action,group}); onClose(); }}}>Add notice</Btn>
        </div>
      </div>
    </div>
  );
};

// ─── Add Poster Modal ─────────────────────────────────────────────────────────
const AddPosterModal = ({ groups, onClose, onAdd }) => {
  const [posterName, setPosterName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [hideHostList, setHideHostList] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const allGroupNames = groups.map(g => g.name);

  const toggleGroup = (name) => {
    if (name === 'All groups') { setSelectedGroups(selectedGroups.length === allGroupNames.length ? [] : [...allGroupNames]); return; }
    setSelectedGroups(s => s.includes(name) ? s.filter(x => x !== name) : [...s, name]);
  };
  const displayLabel = selectedGroups.length === 0 ? 'All groups' : selectedGroups.length === allGroupNames.length ? 'All groups' : selectedGroups.join(', ');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Add new sign in poster</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100"><X size={18}/></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1"><span className="text-red-500">* </span>Name of poster</label>
            <input value={posterName} onChange={e => setPosterName(e.target.value)} placeholder="E.g. where the poster will be located"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]"/>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1"><span className="text-red-500">* </span>Instructions</label>
            <textarea value={instructions} onChange={e => setInstructions(e.target.value)} rows={4}
              placeholder="E.g. what to do once signed in"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594] resize-none"/>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Available to groups</label>
            <div className="relative">
              <button onClick={() => setDropdownOpen(o => !o)}
                className="w-full flex items-center justify-between border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white hover:bg-slate-50">
                {displayLabel} <ChevronDown size={14} className="text-slate-400"/>
              </button>
              {dropdownOpen && (
                <div className="absolute left-0 top-full mt-1 z-20 w-full bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden">
                  {['All groups', ...allGroupNames.length > 0 ? allGroupNames : ['Employees','Visitors','Deliveries']].map(name => (
                    <label key={name} className="flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 cursor-pointer text-sm">
                      <input type="checkbox"
                        checked={name === 'All groups' ? selectedGroups.length === allGroupNames.length : selectedGroups.includes(name)}
                        onChange={() => toggleGroup(name)} className="w-4 h-4 accent-[#76c043]"/>
                      {name}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-800">Advanced settings</p>
              <button className="text-slate-400 hover:text-slate-600"><Settings size={16}/></button>
            </div>
            <label className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer">
              <input type="checkbox" checked={hideHostList} onChange={e => setHideHostList(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#2b4594]"/>
              <div>
                <p className="font-semibold">Hide host list (if enabled for group)</p>
                <p className="text-xs text-slate-400">Protects privacy of hosts when scanning a static QR code</p>
              </div>
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={() => { if(posterName.trim()) { onAdd({posterName,instructions,groups:selectedGroups,hideHostList,createdAt:new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}); onClose(); }}}>Add poster</Btn>
        </div>
      </div>
    </div>
  );
};

// ─── Add Evacuation Point Modal ───────────────────────────────────────────────
const AddEvacPointModal = ({ groups, onClose, onAdd }) => {
  const [name, setName]         = useState('');
  const [identifier, setIdentifier] = useState('');
  const [location, setLocation] = useState('');
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const allGroupNames = groups.map(g => g.name);
  const toggleGroup = (n) => setSelectedGroups(s => s.includes(n) ? s.filter(x => x !== n) : [...s, n]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Add new evacuation point</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100"><X size={18}/></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1"><span className="text-red-500">* </span>Name of evacuation point</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]"/>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1"><span className="text-red-500">* </span>Enter a letter or number to identify the point</label>
            <input maxLength={2} value={identifier} onChange={e => setIdentifier(e.target.value.toUpperCase())}
              className="w-16 border border-slate-300 rounded-lg px-3 py-2 text-sm text-center font-bold focus:outline-none focus:border-[#2b4594]"/>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-1">Location and photo</p>
            <p className="text-xs text-slate-500 mb-2">This can be enabled to display on the kiosk on sign in</p>
            <p className="text-xs text-slate-600 mb-1">Search for a location and drag the red pin to place</p>
            <div className="flex items-center border border-slate-300 rounded-lg px-3 py-2 gap-2 mb-3">
              <QrCode size={13} className="text-slate-400"/>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Search for a location"
                className="flex-1 text-sm outline-none"/>
            </div>
            <p className="text-xs text-slate-600 mb-1">Photo</p>
            <button className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-800">
              <Upload size={13}/> Upload image
            </button>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Select the groups this applies to</label>
            <div className="relative">
              <button onClick={() => setDropdownOpen(o => !o)}
                className="w-full flex items-center justify-between border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white hover:bg-slate-50">
                {selectedGroups.length === 0 ? 'None selected' : selectedGroups.join(', ')} <ChevronDown size={14} className="text-slate-400"/>
              </button>
              {dropdownOpen && (
                <div className="absolute left-0 top-full mt-1 z-20 w-full bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden">
                  <label className="flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 cursor-pointer text-sm">
                    <input type="checkbox" checked={selectedGroups.length === allGroupNames.length && allGroupNames.length > 0}
                      onChange={() => setSelectedGroups(selectedGroups.length === allGroupNames.length ? [] : [...allGroupNames])} className="w-4 h-4 accent-[#76c043]"/>
                    Select all
                  </label>
                  {(allGroupNames.length > 0 ? allGroupNames : ['Employees','Visitors']).map(n => (
                    <label key={n} className="flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 cursor-pointer text-sm">
                      <input type="checkbox" checked={selectedGroups.includes(n)} onChange={() => toggleGroup(n)} className="w-4 h-4 accent-[#76c043]"/>
                      {n}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={() => { if(name.trim() && identifier.trim()) { onAdd({name,identifier,location,groups:selectedGroups}); onClose(); }}}>Save</Btn>
        </div>
      </div>
    </div>
  );
};

// ─── Tab: Details ─────────────────────────────────────────────────────────────
const TabDetails = ({ site, groups, onSaved }) => {
  const [siteName, setSiteName] = useState(site?.name || '');
  const [contactName, setContactName] = useState('');
  const [replyEmail, setReplyEmail] = useState('');
  const [mobileSignIn, setMobileSignIn] = useState(false);
  const [groupVisibility, setGroupVisibility] = useState(groups.map(g => g.name));
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const allGroupNames = groups.map(g => g.name);

  const save = async () => {
    setSaving(true);
    try { await api.put(`/projects/${site.id}`, { name: siteName, code: site.code }); onSaved?.(); }
    catch { /* ignore */ } finally { setSaving(false); }
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-8">
        {/* General */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-800">General</h3>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Site name</label>
            <input value={siteName} onChange={e => setSiteName(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]"/>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-slate-700">Advanced options</p>
              <Settings size={16} className="text-slate-400"/>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Name of contact for email notifications</label>
                <input value={contactName} onChange={e => setContactName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]"/>
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Reply to email address</label>
                <input type="email" value={replyEmail} onChange={e => setReplyEmail(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]"/>
              </div>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">Mobile sign in</p>
                <p className="text-xs text-slate-500 mt-0.5">Allow members to sign in using the mobile app.
                  <span className="text-[#2b4594] underline cursor-pointer ml-1">Sign in &amp; out must be also enabled in Companion settings for each visitor group</span>
                </p>
              </div>
              <Toggle checked={mobileSignIn} onChange={setMobileSignIn}/>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-red-600 cursor-pointer hover:text-red-700 text-sm font-semibold">
            <Trash2 size={14}/> Delete {site?.type === 'remote' ? 'remote ' : ''}site
          </div>
        </div>

        {/* Group Visibility */}
        <div>
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-800">Group visibility</h3>
            <p className="text-sm text-slate-500">These are the groups that can sign in and out of this site</p>
            <div className="flex flex-wrap gap-2">
              {groupVisibility.map(g => (
                <span key={g} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-full text-xs font-semibold text-slate-700">
                  <Users size={12}/> {g}
                </span>
              ))}
              {groupVisibility.length === 0 && <p className="text-sm text-slate-400">No groups selected</p>}
            </div>
            <Btn variant="outline" onClick={() => setShowGroupModal(true)}>Edit group visibility</Btn>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <Btn variant="primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Btn>
      </div>

      {/* Edit Group Visibility Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Edit group visibility</h2>
              <button onClick={() => setShowGroupModal(false)} className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100"><X size={18}/></button>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm font-semibold text-slate-700 mb-3">Groups visible to this site ({groupVisibility.length})</p>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer col-span-2 p-2 rounded-lg hover:bg-slate-50">
                  <input type="checkbox" checked={groupVisibility.length === allGroupNames.length}
                    onChange={() => setGroupVisibility(groupVisibility.length === allGroupNames.length ? [] : [...allGroupNames])}
                    className="w-4 h-4 accent-[#76c043]"/> All groups
                </label>
                {allGroupNames.map(g => (
                  <label key={g} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer p-2 rounded-lg hover:bg-slate-50">
                    <input type="checkbox" checked={groupVisibility.includes(g)}
                      onChange={() => setGroupVisibility(s => s.includes(g) ? s.filter(x => x !== g) : [...s, g])}
                      className="w-4 h-4 accent-[#76c043]"/> {g}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <Btn variant="primary" onClick={() => setShowGroupModal(false)}>Save</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
// temporary placeholder for missing import
const Users = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;

// ─── Tab: Sign in & out flow ──────────────────────────────────────────────────
const TabSignInFlow = ({ site, groups }) => {
  const [viewingGroup, setViewingGroup] = useState('All groups');
  const [signInFields, setSignInFields]   = useState([
    {id:1, label:'Company',          group:'Visitors',   type:'Text',        required:false},
    {id:2, label:'Visiting',         group:'Visitors',   type:'Notify list', required:false},
    {id:3, label:'Car Reg',          group:'Visitors',   type:'Uppercase',   required:false},
    {id:4, label:'Package recipient',group:'Deliveries', type:'Notify list', required:false},
    {id:5, label:'Number of packages',group:'Deliveries',type:'Number',      required:false},
  ]);
  const [signOutFields, setSignOutFields] = useState([]);
  const [notices, setNotices]             = useState([{id:1, noticeTitle:'Health & Safety', group:'Visitors', action:'No action required'}]);
  const [capturePhoto, setCapturePhoto]   = useState(true);
  const [showSignInModal, setShowSignInModal]   = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showNoticeModal, setShowNoticeModal]   = useState(false);

  const filteredSignIn  = viewingGroup === 'All groups' ? signInFields  : signInFields.filter(f => f.group === viewingGroup);
  const filteredSignOut = viewingGroup === 'All groups' ? signOutFields : signOutFields.filter(f => f.group === viewingGroup);
  const filteredNotices = viewingGroup === 'All groups' ? notices       : notices.filter(n => n.group === viewingGroup);
  const allGroupOptions = ['All groups', ...groups.map(g => g.name)];

  return (
    <div>
      {/* Viewing filter */}
      <div className="flex items-center justify-center mb-6 bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
        <span className="text-sm text-slate-600 mr-3">Viewing fields for</span>
        <select value={viewingGroup} onChange={e => setViewingGroup(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#2b4594] bg-white min-w-[140px]">
          {allGroupOptions.map(g => <option key={g}>{g}</option>)}
        </select>
      </div>

      {/* Sign in fields */}
      <Section title="Sign in fields" action={<Btn variant="outline" onClick={() => setShowSignInModal(true)}>Add sign in field</Btn>}>
        {filteredSignIn.length === 0 ? (
          <EmptyState icon={FileText} title="This site has no sign in questions" desc="Gather feedback or information as visitors arrive"/>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <tr><th className="px-5 py-3 text-left w-8"></th><th className="px-5 py-3 text-left">Label</th><th className="px-5 py-3 text-left">Group</th><th className="px-5 py-3 text-left">Type</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSignIn.map(f => (
                  <tr key={f.id} className="hover:bg-slate-50 group">
                    <td className="px-5 py-3 text-slate-300 cursor-grab">⠿</td>
                    <td className="px-5 py-3 text-slate-800 font-medium">{f.label}</td>
                    <td className="px-5 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{f.group}</span></td>
                    <td className="px-5 py-3 text-slate-500">{f.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Sign in notices */}
      <Section title="Sign in notices" action={<Btn variant="outline" onClick={() => setShowNoticeModal(true)}>Add notice</Btn>}>
        {filteredNotices.length === 0 ? (
          <EmptyState icon={FileText} title="This site has no notices" desc="Add NDAs, safety instructions, or policy reminders to acknowledge on sign in"/>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <tr><th className="px-5 py-3 text-left">Title</th><th className="px-5 py-3 text-left">Group</th><th className="px-5 py-3 text-left">Action</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredNotices.map(n => (
                  <tr key={n.id} className="hover:bg-slate-50 group">
                    <td className="px-5 py-3 text-slate-800 font-medium">{n.noticeTitle}</td>
                    <td className="px-5 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{n.group}</span></td>
                    <td className="px-5 py-3 text-slate-500">{n.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Sign out fields */}
      <Section title="Sign out fields" action={<Btn variant="outline" onClick={() => setShowSignOutModal(true)}>Add sign out field</Btn>}>
        {filteredSignOut.length === 0 ? (
          <EmptyState icon={FileText} title="This site has no sign out questions" desc="Gather feedback or information as visitors depart"/>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <tr><th className="px-5 py-3 text-left w-8"></th><th className="px-5 py-3 text-left">Label</th><th className="px-5 py-3 text-left">Group</th><th className="px-5 py-3 text-left">Type</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSignOut.map(f => (
                  <tr key={f.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 text-slate-300 cursor-grab">⠿</td>
                    <td className="px-5 py-3 text-slate-800 font-medium">{f.label}</td>
                    <td className="px-5 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{f.group}</span></td>
                    <td className="px-5 py-3 text-slate-500">{f.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Capture sign in photo */}
      <Section title="Capture sign in photo">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-6">
            <Radio checked={capturePhoto} onChange={() => setCapturePhoto(true)} label="On"/>
            <Radio checked={!capturePhoto} onChange={() => setCapturePhoto(false)} label="Off"/>
          </div>
        </div>
      </Section>

      {showSignInModal  && <AddFieldModal title="Add sign in field"  groups={groups} onClose={() => setShowSignInModal(false)}  onAdd={f => setSignInFields(s => [...s, {...f, id:Date.now()}])}/>}
      {showSignOutModal && <AddFieldModal title="Add sign out field" groups={groups} onClose={() => setShowSignOutModal(false)} onAdd={f => setSignOutFields(s => [...s, {...f, id:Date.now()}])}/>}
      {showNoticeModal  && <AddNoticeModal groups={groups} onClose={() => setShowNoticeModal(false)} onAdd={n => setNotices(s => [...s, {...n, id:Date.now()}])}/>}
    </div>
  );
};

// ─── Tab: Devices & QR posters ────────────────────────────────────────────────
const TabDevices = ({ site, groups }) => {
  const [posters, setPosters]             = useState([{id:1, posterName:'Test Gate', groups:['Deliveries','Employees','Visitors'], createdAt:'4 Jul 2026'}]);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showPosterModal, setShowPosterModal]   = useState(false);
  const [posterQR, setPosterQR]           = useState(null);
  const [deviceCode] = useState(Math.floor(1000000 + Math.random() * 9000000).toString());

  const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;

  return (
    <div className="space-y-10">
      {/* Devices */}
      <Section title="Devices" desc="Manage which devices are linked to this site"
        action={<Btn variant="outline" onClick={() => setShowConnectModal(true)}>Connect new device</Btn>}>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 text-left">Device name</th>
                <th className="px-5 py-3 text-left">App version</th>
                <th className="px-5 py-3 text-left">OS version</th>
                <th className="px-5 py-3 text-left">Checked in</th>
              </tr>
            </thead>
          </table>
          <EmptyState icon={Monitor} title="No devices connected" desc="Manage which devices are linked to this site"/>
        </div>
      </Section>

      {/* QR code sign in posters */}
      <Section title="QR code sign in posters" desc="Display a static QR code so visitors can sign in using their smartphone"
        action={<Btn variant="outline" onClick={() => setShowPosterModal(true)}>Add new poster</Btn>}>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 text-left">Poster name</th>
                <th className="px-5 py-3 text-left">For groups</th>
                <th className="px-5 py-3 text-left">Date created</th>
                <th className="px-5 py-3 text-left">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {posters.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 group">
                  <td className="px-5 py-3 font-medium text-slate-800">{p.posterName}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.groups.slice(0,2).map(g => <span key={g} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{g}</span>)}
                      {p.groups.length > 2 && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">+{p.groups.length-2}</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{p.createdAt}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setPosterQR(p)} className="flex items-center gap-1 text-xs font-semibold text-[#2b4594] hover:underline">
                        <QrCode size={13}/> QR code
                      </button>
                      <button className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-800">
                        <Download size={13}/> Poster
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {posters.length === 0 && <EmptyState icon={QrCode} title="No QR code sign in posters have been created for this site yet" desc="Add QR code sign in posters for this site"/>}
        </div>
      </Section>

      {/* Connect device modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Enter code to connect</h2>
              <button onClick={() => setShowConnectModal(false)} className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100"><X size={18}/></button>
            </div>
            <div className="px-6 py-8 text-center">
              <p className="text-sm text-slate-600 mb-6">Download Sign In App Visitor Management from the Apple or Google Play store and enter your authorisation code</p>
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-6 py-5 mb-2">
                <p className="text-4xl font-bold text-slate-800 tracking-[0.25em]">{deviceCode}</p>
                <p className="text-xs text-slate-400 mt-2 flex items-center justify-center gap-1">
                  <RefreshCw size={11}/> Waiting for device
                </p>
              </div>
            </div>
            <div className="flex justify-end px-6 py-4 border-t border-slate-100">
              <Btn variant="outline" onClick={() => setShowConnectModal(false)}>Cancel</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Poster QR modal */}
      {posterQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">QR code — {posterQR.posterName}</h2>
              <button onClick={() => setPosterQR(null)} className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100"><X size={18}/></button>
            </div>
            <div className="px-6 py-5 flex flex-col items-center gap-4">
              <div className="p-4 bg-white border border-slate-200 rounded-xl">
                <QRCode value={`${baseUrl}/checkin/${site?.id}`} size={180} bgColor="#fff" fgColor="#1e293b" level="M"/>
              </div>
              <p className="text-xs text-slate-500 font-mono break-all text-center">{baseUrl}/checkin/{site?.id}</p>
              <a href={`${baseUrl}/checkin/${site?.id}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-sm font-semibold text-[#2b4594] hover:underline">
                <ExternalLink size={14}/> Open kiosk page
              </a>
            </div>
          </div>
        </div>
      )}

      {showPosterModal && <AddPosterModal groups={groups} onClose={() => setShowPosterModal(false)} onAdd={p => setPosters(s => [...s, {...p, id:Date.now()}])}/>}
    </div>
  );
};

// ─── Tab: Evacuation setup ────────────────────────────────────────────────────
const TabEvacuation = ({ groups }) => {
  const [points, setPoints]   = useState([]);
  const [showModal, setShowModal] = useState(false);
  return (
    <div>
      <Section title="Evacuation points" desc="Assign groups to an evacuation point for more efficient roll calls"
        action={<Btn variant="outline" onClick={() => setShowModal(true)}>Add evacuation point</Btn>}>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <tr><th className="px-5 py-3 text-left">Name</th><th className="px-5 py-3 text-left">Group</th></tr>
            </thead>
          </table>
          {points.length === 0 ? (
            <EmptyState icon={Shield} title="No evacuation points have been added to this site yet" desc="Assign groups to an evacuation point for more efficient roll calls"/>
          ) : (
            <tbody className="divide-y divide-slate-100">
              {points.map(p => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-800">{p.identifier} — {p.name}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.groups.map(g => <span key={g} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{g}</span>)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          )}
        </div>
      </Section>
      {showModal && <AddEvacPointModal groups={groups} onClose={() => setShowModal(false)} onAdd={p => setPoints(s => [...s, {...p, id:Date.now()}])}/>}
    </div>
  );
};

// ─── Tab: On-site report ──────────────────────────────────────────────────────
const TabOnSiteReport = ({ site }) => {
  const [reports, setReports]     = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [time, setTime]           = useState('09:00');
  const [recipients, setRecipients] = useState('');

  return (
    <div>
      <Section title="Report schedule" desc="Schedule a time to send an email report of who is still signed in"
        action={<Btn variant="outline" onClick={() => setShowModal(true)}>New report</Btn>}>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <tr><th className="px-5 py-3 text-left">Time of report</th><th className="px-5 py-3 text-left">Recipients</th></tr>
            </thead>
          </table>
          {reports.length === 0 ? (
            <EmptyState icon={FileText} title="There are no reports currently scheduled" desc="An email will be sent daily at the set time, listing all those still signed in"/>
          ) : (
            <tbody className="divide-y divide-slate-100">
              {reports.map(r => (
                <tr key={r.id} className="hover:bg-slate-50 group">
                  <td className="px-5 py-3 text-slate-800 font-medium">{r.time}</td>
                  <td className="px-5 py-3 text-slate-500">{r.recipients}</td>
                </tr>
              ))}
            </tbody>
          )}
        </div>
      </Section>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">New on-site report for {site?.name}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100"><X size={18}/></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1"><span className="text-red-500">* </span>Send report at</label>
                <input type="time" value={time} onChange={e => setTime(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]"/>
                <p className="text-xs text-slate-400 mt-1">GMT+1 · Europe/London</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1"><span className="text-red-500">* </span>Recipients</label>
                <input value={recipients} onChange={e => setRecipients(e.target.value)} placeholder="email@company.com"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]"/>
                <p className="text-xs text-slate-400 mt-1">Separate multiple email addresses with a comma</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <Btn variant="outline" onClick={() => setShowModal(false)}>Cancel</Btn>
              <Btn variant="primary" onClick={() => { if(recipients.trim()){ setReports(r => [...r, {id:Date.now(), time, recipients}]); setShowModal(false); }}}>Add report</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Tab: Privacy ─────────────────────────────────────────────────────────────
const TabPrivacy = () => {
  const [autocomplete, setAutocomplete]   = useState(true);
  const [hideSignOutList, setHideSignOutList] = useState(false);

  return (
    <div>
      <Section title="Privacy">
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={autocomplete} onChange={e => setAutocomplete(e.target.checked)} className="w-4 h-4 accent-[#76c043] rounded"/>
            <span className="text-sm text-slate-700">Show autocomplete for returning visitors</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={hideSignOutList} onChange={e => setHideSignOutList(e.target.checked)} className="w-4 h-4 accent-[#2b4594] rounded"/>
            <span className="text-sm text-slate-700">Hide visitor sign out list and require name to be entered</span>
          </label>
        </div>
      </Section>
    </div>
  );
};

// ─── Tab: Kiosk ───────────────────────────────────────────────────────────────
const TabKiosk = () => {
  const [displayMode, setDisplayMode] = useState('single');
  const [displayEvac, setDisplayEvac] = useState(true);
  const [showDateTime, setShowDateTime] = useState(false);
  const [spokenMessages, setSpokenMessages] = useState(false);
  const [qrScanner, setQrScanner] = useState(false);
  const [localDevMgmt, setLocalDevMgmt] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState('Background imagery');

  return (
    <div className="space-y-8">
      {/* Welcome screen preview */}
      <Section title="Welcome screen" desc="Configure your own branded welcome screen">
        <div className="flex gap-8">
          {/* Mock tablet preview */}
          <div className="flex-shrink-0 w-72 bg-gradient-to-br from-[#2b4594] to-[#76c043] rounded-2xl overflow-hidden border-4 border-slate-800 shadow-xl">
            <div className="bg-black flex items-center justify-between px-4 py-1">
              <span className="text-white text-xs">•••</span>
              <span className="text-white text-xs font-bold">{new Date().toTimeString().slice(0,5)}</span>
            </div>
            <div className="p-8 text-white">
              <div className="flex items-center justify-end gap-3 mb-12">
                <button className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center"><QrCode size={13} color="white"/></button>
                <span className="text-sm">🇬🇧</span>
              </div>
              <h1 className="text-4xl font-bold mb-2">Hello,</h1>
              <p className="text-lg opacity-90">Please sign in here.</p>
              <div className="flex items-center gap-2 mt-4 opacity-80">
                <Check size={16}/><span className="text-sm">Sign In App</span>
              </div>
            </div>
            <div className="flex gap-3 px-4 pb-4">
              <button className="flex-1 bg-black text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"><Check size={14}/> Sign in</button>
              <button className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-semibold">⇥ Sign out</button>
            </div>
          </div>
          {/* Settings panel */}
          <div className="flex-1 space-y-4">
            <div className="flex gap-2">
              {['Light','Dark','System'].map(m => (
                <button key={m} onClick={() => {}}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-colors ${m==='System' ? 'border-[#2b4594] bg-blue-50 text-[#2b4594]' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}>{m}</button>
              ))}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Select component</label>
              <select value={selectedComponent} onChange={e => setSelectedComponent(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]">
                <option>Background imagery</option><option>Logo</option><option>Welcome text</option>
              </select>
            </div>
            <p className="text-xs text-slate-400">Supports .jpg and .png images (up to 20MB, at least 2048×1536px) and .mov or .mp4 videos (up to 50MB)</p>
            <button className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-800">
              <Upload size={14}/> Upload media
            </button>
          </div>
        </div>
      </Section>

      {/* QR code scanner */}
      <Section title="QR code scanner">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
            <input type="checkbox" checked={qrScanner} onChange={e => setQrScanner(e.target.checked)} className="w-4 h-4 accent-[#2b4594]"/>
            Enable kiosk camera to scan visitor QR codes
          </label>
        </div>
      </Section>

      {/* Display settings */}
      <Section title="Display settings">
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex gap-4">
            {[['single','Single field per screen','Display sign-in fields one step at a time'],['all','All fields on one screen','Display all sign-in fields on one screen']].map(([val,label,desc]) => (
              <button key={val} onClick={() => setDisplayMode(val)}
                className={`flex-1 flex items-start gap-3 p-4 rounded-xl border-2 transition-colors text-left ${displayMode===val ? 'border-[#2b4594] bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                <Monitor size={20} className={displayMode===val ? 'text-[#2b4594]' : 'text-slate-400'}/>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{label}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
            <input type="checkbox" checked={displayEvac} onChange={e => setDisplayEvac(e.target.checked)} className="w-4 h-4 accent-[#76c043]"/>
            Display evacuation point(s)
          </label>
        </div>
      </Section>

      {/* Confirmation screen */}
      <Section title="Confirmation screen">
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
            <input type="checkbox" checked={showDateTime} onChange={e => setShowDateTime(e.target.checked)} className="w-4 h-4 accent-[#2b4594]"/>
            Display date and time on confirmation screen
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
            <input type="checkbox" checked={spokenMessages} onChange={e => setSpokenMessages(e.target.checked)} className="w-4 h-4 accent-[#2b4594]"/>
            Enable spoken sign in and out messages
          </label>
        </div>
      </Section>

      {/* Local device management */}
      <Section title="Local device management" desc="Allow local device management to enable select kiosk settings (e.g. clock display, QR scanner, languages, and groups) to be managed locally on the device. Please note changes made on the device will not be synced back to the portal.">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
            <input type="checkbox" checked={localDevMgmt} onChange={e => setLocalDevMgmt(e.target.checked)} className="w-4 h-4 accent-[#2b4594]"/>
            Allow local device management
          </label>
        </div>
      </Section>
    </div>
  );
};

// ─── Main SiteSettings component ─────────────────────────────────────────────
const SiteSettings = ({ site, onBack, onSaved }) => {
  const [activeTab, setActiveTab] = useState('Details');
  const [groups, setGroups]       = useState([]);
  const [sites, setSites]         = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState(site?.id);
  const [siteDropOpen, setSiteDropOpen] = useState(false);
  const siteDropRef = useRef(null);

  const selectedSite = sites.find(s => s.id === selectedSiteId) || site;

  useEffect(() => {
    api.get('/projects').then(r => setSites(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedSiteId) return;
    api.get(`/visitor-groups?project_id=${selectedSiteId}`)
      .then(r => setGroups(r.data || []))
      .catch(() => setGroups([]));
  }, [selectedSiteId]);

  useEffect(() => {
    const h = (e) => {
      if (siteDropRef.current && !siteDropRef.current.contains(e.target)) setSiteDropOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Which tabs to show — remote sites have fewer tabs
  const visibleTabs = selectedSite?.type === 'remote'
    ? ['Details', 'Sign in & out flow', 'On-site report']
    : TABS;

  return (
    <div className="max-w-5xl">
      {/* Back + heading */}
      <div className="flex items-center gap-2 mb-6">
        {onBack && (
          <button onClick={onBack} className="text-sm text-[#2b4594] hover:underline flex items-center gap-1 mr-2">
            ← Sites
          </button>
        )}
        <h1 className="text-2xl font-bold text-slate-800">Site settings for</h1>

        {/* Site switcher */}
        <div className="relative" ref={siteDropRef}>
          <button onClick={() => setSiteDropOpen(o => !o)}
            className="flex items-center gap-1 text-2xl font-light text-slate-600 border-b border-dashed border-slate-400 hover:text-slate-800 transition-colors">
            {selectedSite?.name || 'Select site'}
            <ChevronDown size={18} className="text-slate-400" />
          </button>
          {siteDropOpen && sites.length > 0 && (
            <div className="absolute left-0 top-full mt-2 z-30 bg-white border border-slate-200 rounded-xl shadow-xl min-w-[200px] overflow-hidden">
              {sites.map(s => (
                <button key={s.id} onClick={() => { setSelectedSiteId(s.id); setSiteDropOpen(false); setActiveTab('Details'); }}
                  className={`block w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors ${
                    selectedSiteId === s.id ? 'text-[#76c043] font-semibold' : 'text-slate-700'
                  }`}>
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-slate-200 mb-8 overflow-x-auto">
        {visibleTabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-[#76c043] text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'Details'              && <TabDetails     site={selectedSite} groups={groups} onSaved={onSaved} />}
      {activeTab === 'Kiosk'                && <TabKiosk />}
      {activeTab === 'Sign in & out flow'   && <TabSignInFlow  site={selectedSite} groups={groups} />}
      {activeTab === 'Devices & QR posters' && <TabDevices     site={selectedSite} groups={groups} />}
      {activeTab === 'Evacuation setup'     && <TabEvacuation  groups={groups} />}
      {activeTab === 'On-site report'       && <TabOnSiteReport site={selectedSite} />}
      {activeTab === 'Privacy'              && <TabPrivacy />}
    </div>
  );
};

export default SiteSettings;
