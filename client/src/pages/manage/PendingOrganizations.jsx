import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { UserPlus, CheckCircle, XCircle, Clock, Shield, Mail, Building2 } from 'lucide-react';

const PendingOrganizations = () => {
  const [pendingOrgs, setPendingOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchPendingOrgs();
  }, []);

  const fetchPendingOrgs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/pending-organizations');
      setPendingOrgs(res.data || []);
    } catch (err) {
      console.error('Failed to fetch pending orgs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setApprovingId(id);
    try {
      await api.post(`/auth/pending-organizations/${id}/approve`);
      await fetchPendingOrgs();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to approve organization');
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (id) => {
    setRejectingId(id);
    try {
      await api.post(`/auth/pending-organizations/${id}/reject`, { notes: rejectNotes });
      setRejectNotes('');
      await fetchPendingOrgs();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reject organization');
    } finally {
      setRejectingId(null);
    }
  };

  const fmtDate = (dateStr) => {
    try { return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return '—'; }
  };

  if (loading && pendingOrgs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2b4594]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/manage')} className="text-sm text-[#2b4594] hover:underline">← Manage</button>
        <h1 className="text-2xl font-bold text-slate-900">Pending Organization Requests</h1>
      </div>

      {pendingOrgs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">No pending requests</h2>
          <p className="text-slate-500">All organization registration requests have been reviewed.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left">Organization</th>
                <th className="px-6 py-4 text-left">Admin</th>
                <th className="px-6 py-4 text-left">Contact</th>
                <th className="px-6 py-4 text-left">Requested</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendingOrgs.map((org) => (
                <tr key={org._id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Building2 size={20} className="text-[#2b4594]" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{org.organization}</p>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Pending</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-800">{org.first_name} {org.last_name}</p>
                    <p className="text-xs text-slate-500">Admin</p>
                  </td>
                  <td className="px-6 py-4">
                    <a href={`mailto:${org.email}`} className="text-[#2b4594] hover:underline">{org.email}</a>
                    {org.phone && <p className="text-xs text-slate-500 mt-1">{org.phone}</p>}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">{fmtDate(org.createdAt)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => handleApprove(org._id)}
                        disabled={approvingId === org._id}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-lg text-sm font-semibold"
                      >
                        <CheckCircle size={16} /> Approve
                      </button>
                      <button
                        onClick={() => handleReject(org._id)}
                        disabled={rejectingId === org._id}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-sm font-semibold"
                      >
                        <XCircle size={16} /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8 bg-[#2b4594]/5 border border-[#2b4594]/20 rounded-xl p-6">
        <h3 className="font-semibold text-[#2b4594] mb-2 flex items-center gap-2">
          <Shield size={18} />
          How to review requests
        </h3>
        <ul className="text-sm text-slate-600 space-y-2">
          <li className="flex gap-2">
            <span className="text-[#2b4594] font-bold">1.</span>
            <span>Review each organization request carefully</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#2b4594] font-bold">2.</span>
            <span>Click "Approve" to create their admin account</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#2b4594] font-bold">3.</span>
            <span>Or click "Reject" and add notes explaining why</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#2b4594] font-bold">4.</span>
            <span>Approved organizations can log in with their credentials</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default PendingOrganizations;
