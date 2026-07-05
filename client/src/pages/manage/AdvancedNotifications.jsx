import React, { useState } from 'react';
import { Bell, Plus, Trash2, X, Mail, Smartphone, MessageSquare } from 'lucide-react';

const CHANNELS = [
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'sms',   label: 'SMS',   icon: Smartphone },
  { id: 'push',  label: 'Push',  icon: Bell },
];

const TRIGGERS = [
  'Visitor signs in',
  'Visitor signs out',
  'Visitor pre-registered',
  'Employee signs in',
  'Employee signs out',
  'Evacuation started',
  'Evacuation ended',
];

const defaultRule = () => ({
  id: Date.now(),
  trigger: TRIGGERS[0],
  channels: ['email'],
  recipients: '',
  groups: 'All groups',
  active: true,
});

const RuleModal = ({ rule, onClose, onSave }) => {
  const [form, setForm] = useState(rule || defaultRule());
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleChannel = (ch) => setForm(f => ({
    ...f,
    channels: f.channels.includes(ch) ? f.channels.filter(c => c !== ch) : [...f.channels, ch],
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">{rule ? 'Edit notification rule' : 'New notification rule'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Trigger</label>
            <select value={form.trigger} onChange={e => set('trigger', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]">
              {TRIGGERS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Notify via</label>
            <div className="flex gap-3">
              {CHANNELS.map(({ id, label, icon: Icon }) => (
                <button key={id} type="button" onClick={() => toggleChannel(id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                    form.channels.includes(id)
                      ? 'border-[#2b4594] bg-blue-50 text-[#2b4594]'
                      : 'border-slate-300 text-slate-500 hover:bg-slate-50'
                  }`}>
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Groups</label>
            <select value={form.groups} onChange={e => set('groups', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]">
              <option>All groups</option>
              <option>Employees</option>
              <option>Visitors</option>
              <option>Deliveries</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Recipients</label>
            <input value={form.recipients} onChange={e => set('recipients', e.target.value)}
              placeholder="email@company.com, another@company.com"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]" />
            <p className="text-xs text-slate-400 mt-1">Separate multiple addresses with a comma</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
          <button onClick={() => { onSave(form); onClose(); }}
            className="px-5 py-2 bg-[#2b4594] hover:bg-[#1e326e] text-white rounded-lg text-sm font-semibold">Save rule</button>
        </div>
      </div>
    </div>
  );
};

const AdvancedNotifications = () => {
  const [rules, setRules] = useState([
    { id: 1, trigger: 'Visitor signs in', channels: ['email'], recipients: 'host@company.com', groups: 'All groups', active: true },
    { id: 2, trigger: 'Evacuation started', channels: ['email', 'sms'], recipients: 'safety@company.com', groups: 'All groups', active: true },
  ]);
  const [showModal, setShowModal] = useState(false);
  const [editRule, setEditRule] = useState(null);

  const saveRule = (rule) => {
    setRules(r => {
      const exists = r.find(x => x.id === rule.id);
      return exists ? r.map(x => x.id === rule.id ? rule : x) : [...r, rule];
    });
  };

  const deleteRule = (id) => setRules(r => r.filter(x => x.id !== id));
  const toggleActive = (id) => setRules(r => r.map(x => x.id === id ? { ...x, active: !x.active } : x));

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Advanced notifications</h1>
          <p className="text-slate-500 text-sm">Send custom notifications to specific recipients when events occur at your sites.</p>
        </div>
        <button onClick={() => { setEditRule(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#2b4594] hover:bg-[#1e326e] text-white rounded-lg text-sm font-semibold shadow-sm">
          <Plus size={15} /> New rule
        </button>
      </div>

      {rules.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 flex flex-col items-center gap-4 text-slate-400">
          <Bell size={40} strokeWidth={1.2} />
          <p className="text-base font-semibold text-slate-600">No notification rules yet</p>
          <p className="text-sm">Create a rule to automatically notify people when events occur.</p>
          <button onClick={() => setShowModal(true)}
            className="mt-2 px-5 py-2 bg-[#2b4594] hover:bg-[#1e326e] text-white rounded-lg text-sm font-semibold">
            Create first rule
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map(rule => (
            <div key={rule.id} className="bg-white rounded-xl border border-slate-200 px-5 py-4 flex items-center gap-4 group hover:shadow-sm transition-shadow">
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${rule.active ? 'bg-green-500' : 'bg-slate-300'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{rule.trigger}</p>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-xs text-slate-500">{rule.groups}</span>
                  <span className="text-xs text-slate-400">→</span>
                  <span className="text-xs text-slate-500 truncate max-w-[200px]">{rule.recipients || 'No recipients'}</span>
                  <div className="flex gap-1">
                    {rule.channels.map(ch => (
                      <span key={ch} className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">{ch}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => toggleActive(rule.id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                    rule.active ? 'border-green-200 bg-green-50 text-green-700' : 'border-slate-200 bg-slate-50 text-slate-500'
                  }`}>
                  {rule.active ? 'Active' : 'Inactive'}
                </button>
                <button onClick={() => { setEditRule(rule); setShowModal(true); }}
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 text-xs font-semibold">
                  Edit
                </button>
                <button onClick={() => deleteRule(rule.id)}
                  className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <RuleModal
          rule={editRule}
          onClose={() => { setShowModal(false); setEditRule(null); }}
          onSave={saveRule}
        />
      )}
    </div>
  );
};

export default AdvancedNotifications;
