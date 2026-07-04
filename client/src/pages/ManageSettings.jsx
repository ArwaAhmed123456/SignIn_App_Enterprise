import React from 'react';
import { NavLink, Routes, Route, Navigate } from 'react-router-dom';
import { MapPin, Users, Bell, ShieldCheck, Code, Settings as SettingsIcon } from 'lucide-react';
import VisitorGroupsList from './manage/VisitorGroupsList';
import SitesList from './manage/SitesList';

const navItems = [
  { id: 'sites',         label: 'Sites',                  icon: MapPin,         path: '/admin/manage/sites' },
  { id: 'visitor-groups',label: 'Visitor groups',          icon: Users,          path: '/admin/manage/visitor-groups' },
  { id: 'notifications', label: 'Advanced notifications',  icon: Bell,           path: '/admin/manage/notifications' },
  { id: 'safety',        label: 'Safety check',            icon: ShieldCheck,    path: '/admin/manage/safety' },
  { id: 'api',           label: 'Client API',              icon: Code,           path: '/admin/manage/api' },
  { id: 'account',       label: 'Account management',      icon: SettingsIcon,   path: '/admin/manage/account' },
];

const ManageSettings = () => (
  <div className="h-full flex bg-slate-50 overflow-hidden">

    {/* Sidebar */}
    <aside className="w-56 bg-white border-r border-slate-200 flex flex-col h-full flex-shrink-0">
      <div className="px-5 py-6 border-b border-slate-100">
        <h2 className="text-base font-bold text-slate-800">Manage settings</h2>
      </div>

      <nav className="flex-1 py-2 overflow-y-auto">
        {navItems.map(({ id, label, icon: Icon, path }) => (
          <NavLink
            key={id}
            to={path}
            className={({ isActive }) =>
              `flex items-center justify-between px-5 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-slate-50 text-[#2b4594] font-semibold border-l-2 border-[#2b4594]'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-[#2b4594] border-l-2 border-transparent'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-2.5">
                  <Icon size={16} className="flex-shrink-0" />
                  <span>{label}</span>
                </div>
                {isActive && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>

    {/* Main Content */}
    <div className="flex-1 overflow-auto bg-slate-50">
      <div className="max-w-5xl mx-auto p-8">
        <Routes>
          <Route index element={<Navigate to="sites" replace />} />
          <Route path="sites" element={<SitesList />} />
          <Route path="visitor-groups" element={<VisitorGroupsList />} />
          <Route path="*" element={
            <div className="text-slate-500 text-sm py-4">Feature coming soon.</div>
          } />
        </Routes>
      </div>
    </div>

  </div>
);

export default ManageSettings;
