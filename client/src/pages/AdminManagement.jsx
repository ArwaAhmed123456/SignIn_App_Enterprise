import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { Users, UserPlus, Trash2, ArrowLeft, ShieldCheck } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const AdminManagement = () => {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const role = localStorage.getItem('adminRole');

    useEffect(() => {
        if (role !== 'superadmin') {
            navigate('/admin');
            return;
        }
        fetchAdmins();
    }, [role, navigate]);

    const fetchAdmins = async () => {
        try {
            const res = await api.get('/auth/admins');
            setAdmins(res.data);
        } catch (err) {
            toast.error("Failed to fetch admins");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, adminEmail) => {
        if (adminEmail === localStorage.getItem('adminEmail')) {
            toast.error("Cannot delete yourself");
            return;
        }

        if (!window.confirm(`Are you sure you want to delete admin: ${adminEmail}?`)) return;

        try {
            await api.delete(`/auth/admins/${id}`);
            toast.success("Admin deleted successfully");
            fetchAdmins();
        } catch (err) {
            toast.error(err.response?.data?.error || "Delete failed");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <Toaster position="top-right" />
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/admin')}
                            className="p-2 hover:bg-white rounded-full transition text-slate-600"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                                <Users className="text-primary" /> Admin Management
                            </h1>
                            <p className="text-slate-500">Manage system administrator accounts</p>
                        </div>
                    </div>
                    <Link
                        to="/admin/signup"
                        className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-secondary transition shadow-lg shadow-blue-100"
                    >
                        <UserPlus size={20} /> Register New Admin
                    </Link>
                </div>

                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-widest">
                                <th className="px-8 py-5">Admin Details</th>
                                <th className="px-8 py-5">Role</th>
                                <th className="px-8 py-5">Organization</th>
                                <th className="px-8 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {admins.map((admin) => (
                                <tr key={admin._id} className="hover:bg-slate-50/50 transition">
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900">{admin.first_name} {admin.last_name}</span>
                                            <span className="text-sm text-slate-500">{admin.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${admin.role === 'superadmin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {admin.role}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-slate-600 font-medium">
                                        {admin.organization || '---'}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        {admin.role !== 'superadmin' && (
                                            <button
                                                onClick={() => handleDelete(admin._id, admin.email)}
                                                className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition"
                                                title="Delete Admin"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {loading && (
                        <div className="p-20 text-center text-slate-400 font-medium">
                            Loading administrators...
                        </div>
                    )}
                    {!loading && admins.length === 0 && (
                        <div className="p-20 text-center text-slate-400 font-medium">
                            No other administrators found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminManagement;
