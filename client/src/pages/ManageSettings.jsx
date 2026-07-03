import React from 'react';
import { NavLink, Routes, Route, Navigate } from 'react-router-dom';
import { MapPin, Users, Bell, ShieldCheck, Code, Settings as SettingsIcon } from 'lucide-react';
import VisitorGroupsList from './manage/VisitorGroupsList';

const ManageSettings = () => {
  const navItems = [
    { id: 'sites', label: 'Sites', icon: <MapPin size={18} />, path: '/admin/manage/sites' },
    { id: 'visitor-groups', label: 'Visitor groups', icon: <Users size={18} />, path: '/admin/manage/visitor-groups' },
    { id: 'notifications', label: 'Advanced notifications', icon: <Bell size={18} />, path: '/admin/manage/notifications' },
    { id: 'safety', label: 'Safety check', icon: <ShieldCheck size={18} />, path: '/admin/manage/safety' },
    { id: 'api', label: 'Client API', icon: <Code size={18} />, path: '/admin/manage/api' },
    { id: 'account', label: 'Account management', icon: <SettingsIcon size={18} />, path: '/admin/manage/account' },
  ];

  return (
    <div className="h-full flex bg-slate-50">
      
      {/* Sidebar */}
      <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col h-full pt-8">
        <div className="px-6 mb-6">
          <h2 className="text-xl font-bold text-slate-800">Manage settings</h2>
        </div>
        
        <nav className="flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) => `flex items-center justify-between px-6 py-3 transition-colors ${
                isActive 
                  ? 'bg-white border-l-4 border-[#59ce4a] text-slate-900 font-bold shadow-[0_1px_2px_rgba(0,0,0,0.02)]' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 border-l-4 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={item.id === 'visitor-groups' ? 'text-slate-700' : 'text-slate-400'}>{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </div>
              {/* Active chevron indicator */}
              <div className="text-slate-300">
                <span className="opacity-0 group-[.active]:opacity-100">›</span>
              </div>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto bg-white p-8">
        <Routes>
          <Route index element={<Navigate to="visitor-groups" replace />} />
          <Route path="visitor-groups" element={<VisitorGroupsList />} />
          {/* Placeholders for other routes */}
          <Route path="*" element={<div className="text-slate-500">Feature coming soon.</div>} />
        </Routes>
      </div>

    </div>
  );
};

export default ManageSettings;
