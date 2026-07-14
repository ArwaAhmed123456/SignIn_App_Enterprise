import React from 'react';
import { NavLink, Routes, Route, Navigate } from 'react-router-dom';
import { MapPin, Users, Bell, ShieldCheck, Code, Settings as SettingsIcon } from 'lucide-react';
import VisitorGroupsList    from './manage/VisitorGroupsList';
import SitesList            from './manage/SitesList';
import AdvancedNotifications from './manage/AdvancedNotifications';
import SafetyCheck          from './manage/SafetyCheck';
import ClientAPI            from './manage/ClientAPI';
import AccountManagement    from './manage/AccountManagement';

const navItems = [
  { id: 'sites',         label: 'Sites',                  icon: MapPin,         path: '/admin/manage/sites' },
  { id: 'visitor-groups',label: 'Visitor groups',          icon: Users,          path: '/admin/manage/visitor-groups' },
  { id: 'notifications', label: 'Advanced notifications',  icon: Bell,           path: '/admin/manage/notifications' },
  { id: 'safety',        label: 'Safety check',            icon: ShieldCheck,    path: '/admin/manage/safety' },
  { id: 'api',           label: 'Client API',              icon: Code,           path: '/admin/manage/api' },
  { id: 'account',       label: 'Account management',      icon: SettingsIcon,   path: '/admin/manage/account' },
];

const ManageSettings = () => {
  const adminRole = localStorage.getItem('adminRole') || '';
  const canManageAccounts = adminRole === 'superadmin' || adminRole === 'admin';
  const visibleNavItems = navItems.filter((item) => canManageAccounts || item.id !== 'account');

  return (
  <div className="h-full flex bg-slate-50 overflow-hidden">

    {/* Sidebar — hidden on mobile, collapsible on tablet */}
    <aside className="hidden md:flex w-52 lg:w-56 bg-white border-r border-slate-200 flex-col h-full flex-shrink-0">
      <div className="px-5 py-6 border-b border-slate-100">
        <h2 className="text-base font-bold text-slate-800">Manage settings</h2>
      </div>

      <nav className="flex-1 py-2 overflow-y-auto">
        {visibleNavItems.map(({ id, label, icon: Icon, path }) => (
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

    {/* Mobile tab bar — only on small screens */}
    <div className="md:hidden w-full absolute top-0 left-0 z-10 bg-white border-b border-slate-200 overflow-x-auto">
      <div className="flex px-2 py-1">
        {visibleNavItems.map(({ id, label, icon: Icon, path }) => (
          <NavLink key={id} to={path}
            className={({ isActive }) =>
              `flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                isActive ? 'text-[#2b4594] bg-[#2b4594]/8' : 'text-slate-500'
              }`
            }>
            <Icon size={18} />
            <span className="text-[10px]">{label.split(' ')[0]}</span>
          </NavLink>
        ))}
      </div>
    </div>

    {/* Main Content */}
    <div className="flex-1 overflow-auto bg-slate-50 mt-0 md:mt-0">
      <div className="w-full max-w-5xl mx-auto p-4 md:p-6 lg:p-8 pt-14 md:pt-6">
        <Routes>
          <Route index element={<Navigate to="sites" replace />} />
          <Route path="sites"          element={<SitesList />} />
          <Route path="visitor-groups" element={<VisitorGroupsList />} />
          <Route path="notifications"  element={<AdvancedNotifications />} />
          <Route path="safety"         element={<SafetyCheck />} />
          <Route path="api"            element={<ClientAPI />} />
          <Route
            path="account"
            element={canManageAccounts ? <AccountManagement /> : <Navigate to="/admin/manage/sites" replace />}
          />
          <Route path="*" element={<Navigate to="sites" replace />} />
        </Routes>
      </div>
    </div>

  </div>
  );
};

export default ManageSettings;
