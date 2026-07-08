import React, { useState, useEffect } from 'react';
import { Package, User, Users, GripVertical, Settings, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

const VisitorGroupsList = () => {
  const [groups, setGroups]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [siteId, setSiteId]         = useState(null);   // first available site
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupType, setNewGroupType] = useState('Standard');
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [createError, setCreateError] = useState('');

  const navigate = useNavigate();
  const handleGroupClick = (group) => {
    if (group.type === 'Repeat') navigate('/admin/people');
    else navigate('/admin/activity');
  };

  useEffect(() => { init(); }, []);

  // Load the first site id, then load groups for that site
  const init = async () => {
    setLoading(true);
    try {
      const sitesRes = await api.get('/projects');
      const firstSite = (sitesRes.data || [])[0];
      const resolvedId = firstSite?.id || null;
      setSiteId(resolvedId);

      const res = await api.get(resolvedId ? `/visitor-groups?project_id=${resolvedId}` : '/visitor-groups');
      setGroups(res.data || []);
    } catch (err) {
      console.error(err);
      setGroups([
        { id: '1', name: 'Deliveries', type: 'Delivery', member_count: 0 },
        { id: '2', name: 'Employees',  type: 'Repeat',   member_count: 0 },
        { id: '3', name: 'Visitors',   type: 'Standard', member_count: 0 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await api.get(siteId ? `/visitor-groups?project_id=${siteId}` : '/visitor-groups');
      setGroups(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNewGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    if (!siteId) {
      setCreateError('No site found. Create a site first under Manage > Sites.');
      return;
    }
    setSaving(true);
    setCreateError('');
    try {
      await api.post('/visitor-groups', {
        project_id: siteId,
        name: newGroupName.trim(),
        type: newGroupType,
      });
      setNewGroupName('');
      setNewGroupType('Standard');
      setShowNewGroup(false);
      await fetchGroups();
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Failed to create group');
      console.error('Failed to create group', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this group?')) return;
    try {
      await api.delete(`/visitor-groups/${id}`);
      await fetchGroups();
    } catch (err) {
      console.error('Failed to delete group', err);
    }
  };

  const iconFor = (type) => {
    if (type === 'Delivery') return <Package size={24} className="text-slate-400" />;
    if (type === 'Repeat')   return <User    size={24} className="text-slate-400" />;
    return                          <Users   size={24} className="text-slate-400" />;
  };

  return (
    <div className="max-w-5xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Visitor groups</h1>
          <p className="text-slate-500 text-sm">Manage your different visitor types, standard and repeat, delivery, and their data privacy options</p>
        </div>
        <button
          onClick={() => setShowNewGroup(true)}
          className="px-4 py-2 bg-white border border-slate-300 rounded-md text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors">
          New group
        </button>
      </div>

      {/* New group inline form */}
      {showNewGroup && (
        <form onSubmit={handleNewGroup} className="mb-4 p-4 bg-white border border-[#2b4594] rounded-lg shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <input
              autoFocus
              type="text"
              placeholder="Group name…"
              value={newGroupName}
              onChange={(e) => { setNewGroupName(e.target.value); setCreateError(''); }}
              className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594] focus:ring-1 focus:ring-[#2b4594]"
            />
            <select
              value={newGroupType}
              onChange={(e) => setNewGroupType(e.target.value)}
              className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]">
              <option value="Standard">Standard</option>
              <option value="Repeat">Repeat</option>
              <option value="Delivery">Delivery</option>
            </select>
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-[#2b4594] hover:bg-[#1e326e] disabled:opacity-60 text-white rounded-md text-sm font-semibold transition-colors">
              {saving ? 'Creating…' : 'Create'}
            </button>
            <button type="button" onClick={() => { setShowNewGroup(false); setNewGroupName(''); setCreateError(''); }}
              className="px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
          </div>
          {createError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{createError}</p>
          )}
        </form>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Loading…</div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <div key={group.id} onClick={() => handleGroupClick(group)} className="flex items-center p-4 bg-white border border-slate-100 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
              <div className="text-slate-300 mr-4 cursor-grab">
                <GripVertical size={20} />
              </div>

              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 mr-4">
                {iconFor(group.type)}
              </div>

              <div className="flex-1">
                <h3 className="font-bold text-slate-800">{group.name}</h3>
                <p className="text-xs text-slate-400">{group.type}</p>
              </div>

              {typeof group.member_count === 'number' && (
                <div className="flex items-center text-slate-500 text-sm mr-8 font-semibold">
                  <Users size={16} className="mr-2" />
                  {group.member_count} members
                </div>
              )}

              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(group.id); }}
                  className="p-2 text-slate-400 hover:text-red-500 rounded-md hover:bg-slate-50 transition-colors"
                  title="Deactivate group">
                  <Settings size={20} />
                </button>
              </div>
              <ChevronRight size={18} className="text-slate-300 ml-2 flex-shrink-0" />
            </div>
          ))}

          {groups.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-sm">
              No visitor groups yet. Create your first group above.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VisitorGroupsList;
