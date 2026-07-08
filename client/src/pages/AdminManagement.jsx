import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Users, UserPlus, Trash2, ArrowLeft, ShieldCheck, Copy, Check, Eye, EyeOff, Mail, X } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const AdminManagement = () => {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createdAccount, setCreatedAccount] = useState(null); // { email, password, emailSent }
    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [form, setForm] = useState({
        first_name: '', last_name: '', email: '', organization: '', role: 'admin',
    });

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
            toast.error('Failed to fetch admins');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, adminEmail) => {
        if (adminEmail === localStorage.getItem('adminEmail')) {
            toast.error('Cannot delete yourself');
            return;
        }
        if (!window.confirm(`Are you sure you want to delete admin: ${adminEmail}?`)) return;
        try {
            await api.delete(`/auth/admins/${id}`);
            toast.success('Admin deleted successfully');
            fetchAdmins();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Delete failed');
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.email || !form.first_name) {
            toast.error('First name and email are required');
            return;
        }
        setCreateLoading(true);
        try {
            const res = await api.post('/auth/invite', form);
            setCreatedAccount({
                email:     res.data.user?.email || form.email,
                password:  res.data.password,
                emailSent: res.data.email_sent,
                role:      form.role,
                name:      `${form.first_name} ${form.last_name}`.trim(),
            });
            setForm({ first_name: '', last_name: '', email: '', organization: '', role: 'admin' });
            fetchAdmins();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to create admin');
        } finally {
            setCreateLoading(false);
        }
    };

    const copyPassword = () => {
        if (createdAccount?.password) {
            navigator.clipboard.writeText(createdAccount.password).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        }
    };

    const closeModal = () => {
        setShowCreateModal(false);
        setCreatedAccount(null);
        setShowPassword(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <Toaster position="top-right" />
            <div className="max-w-6xl mx-auto">
                {/* Header */}
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
                    <button
                        onClick={() => { setShowCreateModal(true); setCreatedAccount(null); }}
                        className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-secondary transition shadow-lg shadow-blue-100"
                    >
                        <UserPlus size={20} /> Create New Admin
                    </button>
                </div>

                {/* Admin Table */}
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

            {/* Create Admin Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-50 p-2.5 rounded-xl">
                                    <ShieldCheck size={22} className="text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Create Admin Account</h2>
                                    <p className="text-sm text-slate-500 mt-0.5">A secure password will be auto-generated</p>
                                </div>
                            </div>
                            <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-400">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="px-8 py-6">
                            {/* Created Account — show credentials */}
                            {createdAccount ? (
                                <div className="space-y-5">
                                    <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-5 py-4">
                                        <Check size={20} className="text-green-600 flex-shrink-0" />
                                        <div>
                                            <p className="font-bold text-green-800">Account created successfully!</p>
                                            <p className="text-sm text-green-700 mt-0.5">{createdAccount.name} · {createdAccount.email}</p>
                                        </div>
                                    </div>

                                    {/* Email status */}
                                    <div className={`flex items-center gap-2.5 text-sm px-4 py-3 rounded-xl ${createdAccount.emailSent ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                                        <Mail size={16} className="flex-shrink-0" />
                                        {createdAccount.emailSent
                                            ? 'Credentials email sent to the new admin'
                                            : 'Email delivery failed — share the password below manually'}
                                    </div>

                                    {/* Password display */}
                                    <div className="bg-slate-900 rounded-2xl p-5">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Generated Password</p>
                                        <div className="flex items-center gap-3">
                                            <code className={`flex-1 text-xl font-mono font-black tracking-wider ${showPassword ? 'text-green-400' : 'text-slate-600'}`}>
                                                {showPassword ? createdAccount.password : '••••••••••••'}
                                            </code>
                                            <button
                                                onClick={() => setShowPassword(v => !v)}
                                                className="p-2 hover:bg-slate-700 rounded-lg transition text-slate-400"
                                                title={showPassword ? 'Hide password' : 'Show password'}
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                            <button
                                                onClick={copyPassword}
                                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold text-sm transition ${copied ? 'bg-green-600 text-white' : 'bg-primary text-white hover:bg-secondary'}`}
                                            >
                                                {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-3">Share this password with the admin. They should change it after first login.</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="bg-slate-50 rounded-xl px-4 py-3">
                                            <p className="text-slate-400 text-xs font-semibold uppercase mb-1">Email</p>
                                            <p className="font-semibold text-slate-800 truncate">{createdAccount.email}</p>
                                        </div>
                                        <div className="bg-slate-50 rounded-xl px-4 py-3">
                                            <p className="text-slate-400 text-xs font-semibold uppercase mb-1">Role</p>
                                            <p className="font-semibold text-slate-800 capitalize">{createdAccount.role}</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={closeModal}
                                        className="w-full bg-primary text-white py-3.5 rounded-2xl font-bold hover:bg-secondary transition"
                                    >
                                        Done
                                    </button>
                                </div>
                            ) : (
                                /* Create form */
                                <form onSubmit={handleCreate} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">First Name *</label>
                                            <input
                                                type="text" required placeholder="John"
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition text-slate-900"
                                                value={form.first_name}
                                                onChange={e => setForm({ ...form, first_name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Last Name</label>
                                            <input
                                                type="text" placeholder="Doe"
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition text-slate-900"
                                                value={form.last_name}
                                                onChange={e => setForm({ ...form, last_name: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Email Address *</label>
                                        <input
                                            type="email" required placeholder="admin@company.com"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition text-slate-900"
                                            value={form.email}
                                            onChange={e => setForm({ ...form, email: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Organization</label>
                                        <input
                                            type="text" placeholder="Company name (optional)"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition text-slate-900"
                                            value={form.organization}
                                            onChange={e => setForm({ ...form, organization: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Role</label>
                                        <select
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition text-slate-900"
                                            value={form.role}
                                            onChange={e => setForm({ ...form, role: e.target.value })}
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="manager">Manager</option>
                                        </select>
                                    </div>

                                    <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700 flex items-center gap-2">
                                        <ShieldCheck size={15} className="flex-shrink-0" />
                                        A secure temporary password will be auto-generated and shown to you after creation.
                                    </div>

                                    <div className="flex gap-3 pt-1">
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="flex-1 py-3.5 rounded-2xl font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={createLoading}
                                            className="flex-1 bg-primary text-white py-3.5 rounded-2xl font-bold hover:bg-secondary transition flex items-center justify-center gap-2 disabled:opacity-70"
                                        >
                                            {createLoading ? 'Creating...' : <><UserPlus size={18} /> Create Account</>}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminManagement;
