import React, { useState } from 'react';
import { X, QrCode } from 'lucide-react';

export const BADGE_TEMPLATES = {
  '54mm': [
    { id: '54-std-photo',    name: '54mm - Standard With Photo',    selected: true  },
    { id: '54-alt-photo',    name: '54mm - Alternative With Photo', selected: false },
    { id: '54-full-logo',    name: '54mm - Full height logo',       selected: false },
    { id: '54-square-photo', name: '54mm - Square photo',           selected: false },
    { id: '54-minimal',      name: '54mm - Minimal',                selected: false },
    { id: '54-qr',           name: '54mm - With QR code',           selected: false },
  ],
  '62mm': [
    { id: '62-std',   name: '62mm - Standard',           selected: false },
    { id: '62-photo', name: '62mm - Standard With Photo', selected: false },
  ],
  '50mm': [
    { id: '50-std',   name: '50mm - Standard',  selected: false },
    { id: '50-photo', name: '50mm - With Photo', selected: false },
  ],
};

function BadgePreview({ template }) {
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white p-2 flex flex-col items-center gap-1.5 h-36 justify-between">
      <div className="flex-1 w-full bg-slate-50 rounded flex items-center justify-center relative">
        <div className="text-slate-300 text-center px-2">
          <div className="w-8 h-8 rounded-full bg-slate-200 mx-auto mb-1 flex items-center justify-center text-[10px] text-slate-400">▼</div>
          <p className="text-[9px] text-slate-400 font-mono">&#123;Visitor name&#125;</p>
          <p className="text-[8px] text-slate-400 font-mono">&#123;GROUP&#125;</p>
          {template.id.includes('qr') && (
            <div className="mt-1 w-6 h-6 border border-slate-300 mx-auto">
              <QrCode size={20} className="text-slate-300" />
            </div>
          )}
        </div>
        {template.selected && (
          <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#76c043] flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </div>
      <p className="text-[10px] text-slate-500 text-center leading-tight">{template.name}</p>
    </div>
  );
}

export function BadgeLibraryModal({ onClose, onSelect }) {
  const [activeSize, setActiveSize] = useState('54mm');
  const [selectedId, setSelectedId] = useState('54-std-photo');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Badge library</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>
        <div className="flex gap-0 border-b border-slate-200 px-6">
          {Object.keys(BADGE_TEMPLATES).map(size => (
            <button key={size} onClick={() => setActiveSize(size)}
              className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeSize === size ? 'border-[#76c043] text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}>
              {size} Template
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-3 gap-4">
            {BADGE_TEMPLATES[activeSize].map(t => (
              <button key={t.id} onClick={() => setSelectedId(t.id)}
                className={`rounded-xl border-2 p-2 transition-colors ${
                  selectedId === t.id ? 'border-[#76c043]' : 'border-slate-200 hover:border-slate-300'
                }`}>
                <BadgePreview template={{ ...t, selected: selectedId === t.id }} />
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button onClick={() => { onSelect(selectedId); onClose(); }}
            className="px-5 py-2 bg-[#76c043] hover:bg-[#5fa832] text-white rounded-lg text-sm font-semibold">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export function PrintBadgeSection() {
  const [showBadgeLibrary, setShowBadgeLibrary] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState('54mm - Standard With Photo');

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="text-base font-bold text-slate-800 mb-4">Print visitor badge</h2>
      <div className="flex items-start gap-5">
        <div className="flex-shrink-0 w-32 h-20 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden">
          <div className="text-center px-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 mx-auto mb-1 flex items-center justify-center">
              <svg width="16" height="12" viewBox="0 0 20 16" fill="none">
                <path d="M10 8C7.79 8 6 6.21 6 4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0 2c2.67 0 8 1.34 8 4v2H2v-2c0-2.66 5.33-4 8-4z" fill="#94a3b8"/>
              </svg>
            </div>
            <p className="text-[8px] text-slate-400 font-mono">&#123;Visitor name&#125;</p>
            <p className="text-[7px] text-slate-400 font-mono">&#123;GROUP&#125;</p>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-800 mb-1">{selectedBadge}</p>
          <p className="text-xs text-slate-500 mb-3">
            This template uses 54mm media. Use correct media size when printing to avoid issues.
          </p>
          <button onClick={() => setShowBadgeLibrary(true)}
            className="px-4 py-1.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Change badge
          </button>
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-4 flex items-center gap-1">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        To customise photo or badge settings for a specific group, go to{' '}
        <span className="text-[#2b4594] underline cursor-pointer">Visitor groups</span>
        {' '}&gt; Advanced in &amp; out
      </p>
      {showBadgeLibrary && (
        <BadgeLibraryModal
          onClose={() => setShowBadgeLibrary(false)}
          onSelect={(id) => {
            const all = Object.values(BADGE_TEMPLATES).flat();
            setSelectedBadge(all.find(t => t.id === id)?.name || id);
            setShowBadgeLibrary(false);
          }}
        />
      )}
    </div>
  );
}
