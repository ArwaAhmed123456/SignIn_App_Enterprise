import React from 'react';

const Tabs = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="flex space-x-6 border-b border-slate-200">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`pb-4 text-sm font-semibold flex items-center gap-2 transition-colors relative ${
            activeTab === tab.id
              ? 'text-slate-900'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {tab.icon && <span className="mb-0.5">{tab.icon}</span>}
          {tab.label}
          
          {/* Active indicator bar */}
          {activeTab === tab.id && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#59ce4a]" />
          )}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
