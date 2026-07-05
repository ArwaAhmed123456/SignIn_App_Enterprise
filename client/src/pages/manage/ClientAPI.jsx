import React, { useState } from 'react';
import { Code, Copy, Check, Plus, Trash2, Eye, EyeOff, RefreshCw } from 'lucide-react';

const generateKey = () => 'sk_live_' + Array.from({ length: 32 }, () =>
  'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join('');

const ClientAPI = () => {
  const [keys, setKeys] = useState([
    { id: 1, name: 'Production key', key: generateKey(), created: '4 Jul 2026', lastUsed: 'Today', active: true },
  ]);
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [revealed, setRevealed] = useState({});
  const [copied, setCopied] = useState({});
  const [newKeyCreated, setNewKeyCreated] = useState(null);

  const toggleReveal = (id) => setRevealed(r => ({ ...r, [id]: !r[id] }));

  const copyKey = (id, key) => {
    navigator.clipboard.writeText(key).then(() => {
      setCopied(c => ({ ...c, [id]: true }));
      setTimeout(() => setCopied(c => ({ ...c, [id]: false })), 2000);
    });
  };

  const createKey = () => {
    if (!newKeyName.trim()) return;
    const newKey = { id: Date.now(), name: newKeyName.trim(), key: generateKey(),
      created: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      lastUsed: 'Never', active: true };
    setKeys(k => [...k, newKey]);
    setNewKeyCreated(newKey);
    setNewKeyName('');
    setShowCreate(false);
  };

  const deleteKey = (id) => {
    if (!confirm('Delete this API key? This cannot be undone.')) return;
    setKeys(k => k.filter(x => x.id !== id));
  };

  const maskKey = (key) => key.slice(0, 12) + '••••••••••••••••••••' + key.slice(-4);

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Client API</h1>
          <p className="text-slate-500 text-sm">
            Generate API keys to allow external access to your Sign In App data. Keep your keys secret — do not share them publicly.
          </p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#2b4594] hover:bg-[#1e326e] text-white rounded-lg text-sm font-semibold shadow-sm">
          <Plus size={15} /> New API key
        </button>
      </div>

      {/* New key just created — show once */}
      {newKeyCreated && (
        <div className="mb-5 bg-green-50 border border-green-200 rounded-xl px-5 py-4">
          <p className="text-sm font-semibold text-green-800 mb-1">✓ API key created — copy it now</p>
          <p className="text-xs text-green-700 mb-3">This is the only time the full key will be shown.</p>
          <div className="flex items-center gap-2 bg-white border border-green-200 rounded-lg px-3 py-2">
            <code className="flex-1 text-xs font-mono text-slate-700 break-all">{newKeyCreated.key}</code>
            <button onClick={() => copyKey('new', newKeyCreated.key)}
              className="flex items-center gap-1 text-xs font-semibold text-green-700">
              {copied['new'] ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
            </button>
          </div>
          <button onClick={() => setNewKeyCreated(null)} className="mt-3 text-xs text-green-600 hover:underline">Dismiss</button>
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="mb-5 bg-white border border-slate-200 rounded-xl px-5 py-4">
          <p className="text-sm font-semibold text-slate-700 mb-3">New API key</p>
          <div className="flex gap-2">
            <input value={newKeyName} onChange={e => setNewKeyName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createKey()}
              placeholder="Key name (e.g. Production, Mobile app…)"
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]" />
            <button onClick={createKey}
              className="px-4 py-2 bg-[#2b4594] hover:bg-[#1e326e] text-white rounded-lg text-sm font-semibold">Create</button>
            <button onClick={() => { setShowCreate(false); setNewKeyName(''); }}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
          </div>
        </div>
      )}

      {/* Keys list */}
      {keys.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 flex flex-col items-center gap-4 text-slate-400">
          <Code size={40} strokeWidth={1.2} />
          <p className="text-base font-semibold text-slate-600">No API keys yet</p>
          <p className="text-sm">Create an API key to integrate Sign In App with your own systems.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map(k => (
            <div key={k.id} className="bg-white rounded-xl border border-slate-200 px-5 py-4 group hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{k.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Created {k.created} · Last used: {k.lastUsed}</p>
                </div>
                <button onClick={() => deleteKey(k.id)}
                  className="p-2 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                <code className="flex-1 text-xs font-mono text-slate-600 break-all">
                  {revealed[k.id] ? k.key : maskKey(k.key)}
                </code>
                <button onClick={() => toggleReveal(k.id)} className="text-slate-400 hover:text-slate-700 flex-shrink-0">
                  {revealed[k.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button onClick={() => copyKey(k.id, k.key)} className="text-slate-400 hover:text-slate-700 flex-shrink-0">
                  {copied[k.id] ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Docs */}
      <div className="mt-8 bg-slate-50 border border-slate-200 rounded-xl p-5">
        <p className="text-sm font-semibold text-slate-800 mb-2">API usage</p>
        <p className="text-xs text-slate-500 mb-3">Include your API key in the Authorization header for all requests:</p>
        <div className="bg-white border border-slate-200 rounded-lg px-4 py-3 font-mono text-xs text-slate-700">
          Authorization: Bearer sk_live_your_key_here
        </div>
        <p className="text-xs text-slate-400 mt-3">
          Base URL: <span className="font-mono">{window.location.origin}/api</span>
        </p>
      </div>
    </div>
  );
};

export default ClientAPI;
