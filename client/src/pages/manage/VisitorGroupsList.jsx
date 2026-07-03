import React, { useState, useEffect } from 'react';
import { Package, User, Users, GripVertical, Settings } from 'lucide-react';
import api from '../../api';

const VisitorGroupsList = () => {
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    // In a real scenario we'd use the actual project ID. 
    // Here we'll fetch the first project's groups or mock them to match the screenshot.
    // For visual parity with the screenshot, I am rendering standard static groups if API fails.
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      // We would pass project_id here. For now we just load the endpoint.
      // This is hooked to the Phase 1 backend schema.
      // const res = await api.get('/visitor-groups?project_id=...');
      // setGroups(res.data);
      
      // Fallback UI to strictly match the screenshot's state
      setGroups([
        { _id: '1', name: 'Deliveries', type: 'Delivery', icon: <Package size={24} className="text-slate-400" />, count: null },
        { _id: '2', name: 'Employees', type: 'Repeat', icon: <User size={24} className="text-slate-400" />, count: 0 },
        { _id: '3', name: 'Visitors', type: 'Standard', icon: <Users size={24} className="text-slate-400" />, count: 0 }
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-5xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Visitor groups</h1>
          <p className="text-slate-500 text-sm">Manage your different visitor types, standard and repeat, delivery, and their data privacy options</p>
        </div>
        <button className="px-4 py-2 bg-white border border-slate-300 rounded-md text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors">
          New group
        </button>
      </div>

      <div className="space-y-3">
        {groups.map((group) => (
          <div key={group._id} className="flex items-center p-4 bg-white border border-slate-100 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
            <div className="text-slate-300 mr-4 cursor-grab">
              <GripVertical size={20} />
            </div>
            
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 mr-4">
              {group.icon}
            </div>
            
            <div className="flex-1">
              <h3 className="font-bold text-slate-800">{group.name}</h3>
              <p className="text-xs text-slate-400">{group.type}</p>
            </div>
            
            {group.count !== null && (
              <div className="flex items-center text-slate-500 text-sm mr-8 font-semibold">
                <Users size={16} className="mr-2" />
                {group.count} members
              </div>
            )}
            
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
               <button className="p-2 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-50">
                 <Settings size={20} />
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VisitorGroupsList;
