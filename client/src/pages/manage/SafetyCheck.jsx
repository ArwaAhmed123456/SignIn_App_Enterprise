import React, { useState } from 'react';
import { ShieldCheck, Plus, Trash2, X, AlertTriangle, Eye } from 'lucide-react';

const WATCH_TYPES = ['Banned visitor', 'VIP', 'Expected', 'Flagged'];

const PersonModal = ({ person, onClose, onSave }) => {
  const [form, setForm] = useState(person || { name: '', email: '', type: 'Flagged', notes: '', active: true });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">{person ? 'Edit person' : 'Add person to watch list'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Full name <span className="text-red-500">*</span></label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="Full name"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Email address</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
              placeholder="email@example.com"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Watch type</label>
            <select value={form.type} onChange={e => set('type', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]">
              {WATCH_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              rows={3} placeholder="Reason for adding this person..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-[#2b4594]" />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
          <button onClick={() => { if (form.name.trim()) { onSave({ ...form, id: form.id || Date.now() }); onClose(); } }}
            className="px-5 py-2 bg-[#2b4594] hover:bg-[#1e326e] text-white rounded-lg text-sm font-semibold">Save</button>
        </div>
      </div>
    </div>
  );
};

const TYPE_COLORS = {
  'Banned visitor': 'bg-red-100 text-red-700',
  'VIP':            'bg-purple-100 text-purple-700',
  'Expected':       'bg-green-100 text-green-700',
  'Flagged':        'bg-yellow-100 text-yellow-700',
};

const SafetyCheck = () => {
  const [people, setPeople] = useState([
    { id: 1, name: 'John Smith', email: 'john@example.com', type: 'Banned visitor', notes: 'Previous incident on site', active: true },
    { id: 2, name: 'Jane VIP',   email: 'jane@example.com', type: 'VIP',            notes: 'Board member — greet on arrival', active: true },
  ]);
  const [showModal, setShowModal] = useState(false);
  const [editPerson, setEditPerson] = useState(null);
  const [search, setSearch] = useState('');

  const savePerson = (p) => setPeople(prev => {
    const exists = prev.find(x => x.id === p.id);
    return exists ? prev.map(x => x.id === p.id ? p : x) : [...prev, p];
  });

  const deletePerson = (id) => setPeople(p => p.filter(x => x.id !== id));

  const filtered = people.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Safety check</h1>
          <p className="text-slate-500 text-sm">Manage people to be identified at sign in. Admins are alerted when a flagged person attempts to sign in.</p>
        </div>
        <button onClick={() => { setEditPerson(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#2b4594] hover:bg-[#1e326e] text-white rounded-lg text-sm font-semibold shadow-sm">
          <Plus size={15} /> Add person
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#2b4594] bg-white" />
        <Eye size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 flex flex-col items-center gap-4 text-slate-400">
          <ShieldCheck size={40} strokeWidth={1.2} />
          <p className="text-base font-semibold text-slate-600">No people on the watch list</p>
          <p className="text-sm text-center max-w-sm">Add people who should be identified when they sign in — banned visitors, VIPs, or anyone requiring special attention.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => (
            <div key={p.id} className="bg-white rounded-xl border border-slate-200 px-5 py-4 flex items-center gap-4 group hover:shadow-sm transition-shadow">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 flex-shrink-0">
                {p.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[p.type] || 'bg-slate-100 text-slate-600'}`}>
                    {p.type}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{p.email}</p>
                {p.notes && <p className="text-xs text-slate-400 mt-0.5 truncate max-w-sm">{p.notes}</p>}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditPerson(p); setShowModal(true); }}
                  className="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600">
                  Edit
                </button>
                <button onClick={() => deletePerson(p.id)}
                  className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <PersonModal
          person={editPerson}
          onClose={() => { setShowModal(false); setEditPerson(null); }}
          onSave={savePerson}
        />
      )}
    </div>
  );
};

export default SafetyCheck;
