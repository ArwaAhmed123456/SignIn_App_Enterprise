import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, LogOut, MessageSquare, HelpCircle } from 'lucide-react';
import api from '../api';

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('adminRole');
    navigate('/admin/login');
  };

  const isManageActive = location.pathname.startsWith('/admin/manage');

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">

      {/* Main Navigation Bar */}
      <div className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shadow-sm z-10">
        
        <div className="flex items-center h-full">
          {/* Logo */}
          <div className="flex items-center justify-center mr-8">
            <div className="w-8 h-8 bg-gradient-to-br from-[#2b4594] to-[#1e326e] rounded-md transform rotate-45 flex items-center justify-center shadow-inner">
                <div className="w-4 h-4 bg-white rounded-sm transform -rotate-45" />
            </div>
          </div>

          {/* Nav Links */}
          <nav className="flex space-x-2 h-full">
            <NavLink 
              to="/admin/activity" 
              className={({ isActive }) => `px-4 h-full flex items-center font-semibold text-sm transition-colors border-b-4 ${isActive ? 'border-[#2b4594] text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              Activity
            </NavLink>
            <NavLink 
              to="/admin/people" 
              className={({ isActive }) => `px-4 h-full flex items-center font-semibold text-sm transition-colors border-b-4 ${isActive ? 'border-[#2b4594] text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              People
            </NavLink>
            <NavLink 
              to="/admin/attendance" 
              className={({ isActive }) => `px-4 h-full flex items-center font-semibold text-sm transition-colors border-b-4 ${isActive ? 'border-[#2b4594] text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              Attendance
            </NavLink>
            <NavLink 
              to="/admin/manage" 
              className={() => `px-4 h-full flex items-center font-semibold text-sm transition-colors border-b-4 ${isManageActive ? 'border-[#2b4594] text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              Manage <span className="ml-1 text-slate-400 text-xs">▼</span>
            </NavLink>
          </nav>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-6 h-full">
          <div className="flex flex-col items-center justify-center cursor-pointer text-slate-500 hover:text-slate-800">
            <ShieldCheck size={20} />
            <span className="text-[10px] font-semibold mt-0.5">Evacuation</span>
          </div>
          <div className="flex flex-col items-center justify-center cursor-pointer text-slate-500 hover:text-slate-800">
            <HelpCircle size={20} />
            <span className="text-[10px] font-semibold mt-0.5">Support</span>
          </div>
          <div className="flex flex-col items-center justify-center cursor-pointer text-slate-500 hover:text-slate-800" onClick={handleLogout}>
            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
              AF
            </div>
            <span className="text-[10px] font-semibold mt-0.5">Profile</span>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <main className="flex-1 overflow-hidden relative">
        <Outlet />
        
        <div className="absolute bottom-4 right-4 w-12 h-12 bg-[#2b4594] rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:bg-[#1e326e] transition-colors">
            <MessageSquare size={24} color="white" />
        </div>
      </main>

    </div>
  );
};

export default AdminLayout;
