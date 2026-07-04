import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldCheck, HelpCircle, MessageSquare, User, LogOut, BellDot, BookOpen, MapPin, Users, Bell, Code, Settings as SettingsIcon } from 'lucide-react';

const AdminLayout = () => {
  const navigate     = useNavigate();
  const location     = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [manageOpen,  setManageOpen]  = useState(false);
  const profileRef   = useRef(null);
  const supportRef   = useRef(null);
  const manageRef    = useRef(null);

  const isManageActive = location.pathname.startsWith('/admin/manage');
  const isSupportActive = location.pathname.startsWith('/admin/support');

  const firstName    = localStorage.getItem('adminFirstName') || '';
  const lastName     = localStorage.getItem('adminLastName')  || '';
  const adminEmail   = localStorage.getItem('admin_remember_email') || '';
  const organization = localStorage.getItem('adminOrg') || '';
  const fullName     = firstName || lastName
    ? `${firstName} ${lastName}`.trim()
    : adminEmail.split('@')[0] || 'Admin';
  const initials     = fullName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'AD';

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRole');
    localStorage.removeItem('adminFirstName');
    localStorage.removeItem('adminLastName');
    localStorage.removeItem('adminOrg');
    navigate('/admin/login');
  };

  useEffect(() => {
    const h = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (supportRef.current && !supportRef.current.contains(e.target)) setSupportOpen(false);
      if (manageRef.current  && !manageRef.current.contains(e.target))  setManageOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">

      {/* Nav Bar */}
      <div className="bg-white border-b border-slate-200 h-[72px] flex items-center justify-between px-6 shadow-sm z-10">
        <div className="flex items-center h-full">
          <div className="flex items-center justify-center mr-8">
            <img src="/Tipod_Final_Logo_high_pixel.png" alt="Tripod" className="h-8 w-auto object-contain" />
          </div>

          <nav className="flex h-full">
            {[
              { to: '/admin/activity',   label: 'Activity'   },
              { to: '/admin/people',     label: 'People'     },
              { to: '/admin/attendance', label: 'Attendance' },
            ].map(({ to, label }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) =>
                  `px-5 h-full flex items-center text-[15px] font-semibold transition-colors border-b-2 ${
                    isActive ? 'border-[#76c043] text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`
                }
              >{label}</NavLink>
            ))}

            {/* Manage mega-menu */}
            <div className="relative h-full flex items-center" ref={manageRef}>
              <button onClick={() => setManageOpen(o => !o)}
                className={`px-5 h-full flex items-center text-[15px] font-semibold transition-colors border-b-2 gap-1 ${
                  isManageActive ? 'border-[#76c043] text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}>
                Manage
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="mt-0.5 text-slate-400">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {manageOpen && (
                <div className="absolute left-0 top-full mt-0 w-[480px] bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="grid grid-cols-2 gap-0 p-5">
                    <div className="space-y-1 pr-4 border-r border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 pb-1">Manage settings</p>
                      {[
                        { to: '/admin/manage/sites',          icon: MapPin,       label: 'Sites',                  desc: 'Site setup, branding, sign in flows and devices' },
                        { to: '/admin/manage/visitor-groups', icon: Users,        label: 'Visitor groups',         desc: 'Manage visitor types, data privacy and configurations' },
                      ].map(({ to, icon: Icon, label, desc }) => (
                        <Link key={to} to={to} onClick={() => setManageOpen(false)}
                          className="flex items-start gap-3 px-2 py-2 rounded-lg hover:bg-slate-50 transition-colors group">
                          <Icon size={18} className="text-slate-400 mt-0.5 flex-shrink-0 group-hover:text-[#2b4594]" />
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{label}</p>
                            <p className="text-xs text-slate-500">{desc}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <div className="space-y-1 pl-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 pb-1">Visitors</p>
                      {[
                        { to: '/admin/manage/notifications', icon: Bell,         label: 'Advanced notifications', desc: 'Send custom notifications to specific recipients' },
                        { to: '/admin/manage/safety',        icon: ShieldCheck,  label: 'Safety check',           desc: 'Manage people to be identified at sign in' },
                      ].map(({ to, icon: Icon, label, desc }) => (
                        <Link key={to} to={to} onClick={() => setManageOpen(false)}
                          className="flex items-start gap-3 px-2 py-2 rounded-lg hover:bg-slate-50 transition-colors group">
                          <Icon size={18} className="text-slate-400 mt-0.5 flex-shrink-0 group-hover:text-[#2b4594]" />
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{label}</p>
                            <p className="text-xs text-slate-500">{desc}</p>
                          </div>
                        </Link>
                      ))}
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 pt-3 pb-1">Account</p>
                      {[
                        { to: '/admin/manage/account', icon: SettingsIcon, label: 'Account management', desc: 'Manage subscription, user roles and permissions' },
                        { to: '/admin/manage/api',     icon: Code,         label: 'Client API',          desc: 'Add an API key for external access to your data' },
                      ].map(({ to, icon: Icon, label, desc }) => (
                        <Link key={to} to={to} onClick={() => setManageOpen(false)}
                          className="flex items-start gap-3 px-2 py-2 rounded-lg hover:bg-slate-50 transition-colors group">
                          <Icon size={18} className="text-slate-400 mt-0.5 flex-shrink-0 group-hover:text-[#2b4594]" />
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{label}</p>
                            <p className="text-xs text-slate-500">{desc}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-slate-100 px-5 py-3">
                    <Link to="/admin/manage" onClick={() => setManageOpen(false)}
                      className="text-sm font-semibold text-[#2b4594] hover:text-[#1e326e]">
                      View all settings →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-5 h-full">
          <NavLink to="/admin/evacuation"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 transition-colors ${isActive ? 'text-red-600' : 'text-slate-500 hover:text-slate-800'}`
            }>
            <ShieldCheck size={18} strokeWidth={1.75} />
            <span className="text-[10px] font-semibold">Evacuation</span>
          </NavLink>

          <div className="relative" ref={supportRef}>
            <button onClick={() => setSupportOpen(o => !o)}
              className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${isSupportActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}>
              <HelpCircle size={18} strokeWidth={1.75} />
              <span className="text-[10px] font-semibold">Support</span>
            </button>
            {supportOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl z-50">
                <Link to="/admin/support/whats-new" onClick={() => setSupportOpen(false)}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50">
                  <span className="inline-flex items-center gap-2">
                    <BellDot size={15} className="text-[#2b4594]" /> What&apos;s new
                  </span>
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                </Link>
                <Link to="/admin/support/collections/getting-started" onClick={() => setSupportOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50">
                  <BookOpen size={15} className="text-[#2b4594]" /> Getting started
                </Link>
                <Link to="/admin/support" onClick={() => setSupportOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50">
                  <HelpCircle size={15} className="text-[#2b4594]" /> Support
                </Link>
              </div>
            )}
          </div>

          <div className="relative" ref={profileRef}>
            <button onClick={() => setProfileOpen(o => !o)}
              className="flex flex-col items-center justify-center gap-0.5 text-slate-500 hover:text-slate-800 transition-colors">
              <div className="w-6 h-6 rounded-full bg-[#2b4594] flex items-center justify-center text-[10px] font-bold text-white">
                {initials}
              </div>
              <span className="text-[10px] font-semibold">Profile</span>
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 bg-white border border-slate-200 rounded-lg shadow-xl z-50 w-56">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-bold text-slate-800">{fullName}</p>
                  {organization && <p className="text-xs text-slate-500 mt-0.5">{organization}</p>}
                  {!organization && adminEmail && <p className="text-xs text-slate-500 mt-0.5">{adminEmail}</p>}
                </div>
                <div className="py-1">
                  <Link to="/admin/profile" onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                    <User size={15} className="text-slate-400" /> My profile
                  </Link>
                  <button onClick={handleLogout}
                    className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                    <LogOut size={15} className="text-slate-400" /> Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Page Content */}
      <main className="flex-1 overflow-hidden relative">
        <Outlet />
        <div className="fixed bottom-6 right-6 z-50">
          <button className="w-10 h-10 bg-[#2b4594] hover:bg-[#1e326e] text-white rounded-full shadow-lg flex items-center justify-center transition-colors">
            <MessageSquare size={18} />
          </button>
        </div>
      </main>

    </div>
  );
};

export default AdminLayout;
