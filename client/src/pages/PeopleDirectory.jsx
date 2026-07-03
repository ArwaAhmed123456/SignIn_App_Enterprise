import React, { useState, useEffect } from 'react';
import { Search, Filter, Settings, ChevronDown, CheckSquare, Square } from 'lucide-react';
import Tabs from '../components/ui/Tabs';
import SlideOutDrawer from '../components/SlideOutDrawer';
import api from '../api';

const PeopleDirectory = () => {
  const [activeTab, setActiveTab] = useState('current');
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState('add'); // 'add' or 'edit'
  const [guards, setGuards] = useState([]);
  const [selectedGuard, setSelectedGuard] = useState(null);

  useEffect(() => {
    fetchGuards();
  }, []);

  const fetchGuards = async () => {
    try {
      const res = await api.get('/guards');
      setGuards(res.data || []);
    } catch (err) {
      console.error('Failed to fetch guards', err);
    }
  };

  const directoryTabs = [
    { id: 'current', label: 'Current' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'archived', label: 'Archived' },
  ];

  const handleEdit = (guard) => {
    setSelectedGuard(guard);
    setDrawerMode('edit');
    setDrawerOpen(true);
  };

  const handleAdd = () => {
    setSelectedGuard(null);
    setDrawerMode('add');
    setDrawerOpen(true);
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-800">
          People directory for <span className="text-slate-600 font-normal">Employees</span>
        </h1>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
        
        {/* Tabs & Actions Bar */}
        <div className="px-6 pt-4 border-b border-slate-100 flex items-center justify-between">
          <Tabs tabs={directoryTabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>

        {/* Search & Filters */}
        <div className="p-4 px-6 flex items-center justify-between bg-white">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search" 
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-[#2b4594] focus:ring-1 focus:ring-[#2b4594]"
              />
            </div>
            <button className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-800 px-3 py-2">
              <Filter size={16} /> Filters
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-md text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Actions <ChevronDown size={16} />
            </button>
            <button 
              onClick={handleAdd}
              className="flex items-center gap-2 px-4 py-2 bg-[#2b4594] hover:bg-[#1e326e] text-white rounded-md text-sm font-semibold transition-colors shadow-sm"
            >
              Add member <ChevronDown size={16} className="opacity-70" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 sticky top-0 z-10">
              <tr className="border-y border-slate-100 text-slate-500 font-semibold">
                <th className="px-6 py-3 w-12"><Square size={16} className="text-slate-300" /></th>
                <th className="px-6 py-3">Name ↑↓</th>
                <th className="px-6 py-3">Email ↑↓</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Start date</th>
                <th className="px-6 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {guards.map((guard) => (
                <tr key={guard.id} className="hover:bg-slate-50/80 transition-colors group cursor-pointer" onClick={() => handleEdit(guard)}>
                  <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                    <Square size={16} className="text-slate-300 hover:text-slate-400 cursor-pointer" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold tracking-wider">
                        {guard.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-bold text-slate-800">{guard.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{guard.email}</td>
                  <td className="px-6 py-4 text-slate-600">{guard.phone || '-'}</td>
                  <td className="px-6 py-4 text-slate-600">{guard.role || 'Employee'}</td>
                  <td className="px-6 py-4 text-slate-600">
                    {new Date(guard.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Settings size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {guards.length === 0 && (
            <div className="p-8 text-center text-slate-500">No members found.</div>
          )}
        </div>
      </div>

      {/* Add / Edit Member Drawer */}
      <SlideOutDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setDrawerOpen(false)}
        title={drawerMode === 'add' ? 'Add member' : selectedGuard?.name}
        actions={
          <>
            <button 
              onClick={() => setDrawerOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-md text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button className="px-4 py-2 bg-[#2b4594] hover:bg-[#1e326e] text-white rounded-md text-sm font-semibold shadow-sm">
              Save
            </button>
          </>
        }
      >
        <div className="mb-6">
          <Tabs 
            tabs={[
              { id: 'details', label: 'Details' },
              { id: 'notifications', label: 'Notifications' },
              { id: 'safety', label: 'Safety' },
              { id: 'companion', label: 'Companion' }
            ]} 
            activeTab="details" 
            onChange={() => {}} 
          />
        </div>
        
        {/* Mock Form Content matching screenshot 3 */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              <span className="text-red-500">*</span> Which group does this member belong to?
            </label>
            <select className="w-full border border-slate-300 rounded-md p-2 text-sm focus:border-[#2b4594] focus:ring-1 focus:ring-[#2b4594] outline-none">
              <option>Employees</option>
              <option>Contractors</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                <span className="text-red-500">*</span> Full name
              </label>
              <input type="text" className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none" placeholder="Arwa Ahmed" defaultValue={selectedGuard?.name || ''} />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Email address</label>
              <input type="email" className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none bg-blue-50/50" placeholder="arwa95025@gmail.com" defaultValue={selectedGuard?.email || ''} />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Phone number</label>
              <div className="flex border border-slate-300 rounded-md overflow-hidden focus-within:border-[#2b4594]">
                <div className="bg-slate-50 px-3 py-2 border-r border-slate-300 text-sm">🇺🇸</div>
                <input type="tel" className="flex-1 p-2 text-sm outline-none" placeholder="+1 310 210 5238" defaultValue={selectedGuard?.phone || ''} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Role</label>
              <input type="text" className="w-full border border-[#2b4594] rounded-md p-2 text-sm outline-none shadow-[0_0_0_1px_#2b4594]" defaultValue={selectedGuard?.role || 'Employee'} />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Language</label>
              <select className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none">
                <option>English (UK)</option>
              </select>
            </div>
          </div>

          <div className="pt-4">
            <h3 className="font-bold text-slate-800 mb-1">Start and end dates</h3>
            <p className="text-sm text-slate-500 mb-3">This is the period the member is active for. They can only sign in and out during this time</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input type="date" className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none" />
              </div>
              <div>
                <input type="date" className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none" />
                <p className="text-[11px] text-slate-400 mt-1">Leave blank if not required</p>
              </div>
            </div>
          </div>
        </div>

      </SlideOutDrawer>
    </div>
  );
};

export default PeopleDirectory;
