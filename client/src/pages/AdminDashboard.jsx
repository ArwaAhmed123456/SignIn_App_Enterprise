import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Plus, Folder, LogOut, Clock, Check, X, Eye, EyeOff, LayoutDashboard, Users, Zap, Lock, ShieldCheck, Download } from 'lucide-react';
import { io } from 'socket.io-client';
import toast, { Toaster } from 'react-hot-toast';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

const AdminDashboard = () => {
    const [projects, setProjects] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [guards, setGuards] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showGuardAssignModal, setShowGuardAssignModal] = useState(false);
    const [selectedGuard, setSelectedGuard] = useState(null);
    const [assignProjectId, setAssignProjectId] = useState('');
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    const [projectToDelete, setProjectToDelete] = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);
    const [authPassword, setAuthPassword] = useState('');
    const [showAuthPassword, setShowAuthPassword] = useState(false);
    const [rememberPassword, setRememberPassword] = useState(false);
    const [editProject, setEditProject] = useState({ name: '', code: '' });
    const [newProject, setNewProject] = useState({ name: '', code: '', password: '', confirmPassword: '', admin_email: '' });
    const [resetFlow, setResetFlow] = useState({ step: 1, code: '', token: '', newPassword: '', confirmPassword: '', targetEmail: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formError, setFormError] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    
    // Global Date Range & Worker Filter State for PDF/Excel Exports
    const [globalStartDate, setGlobalStartDate] = useState('');
    const [globalEndDate, setGlobalEndDate] = useState('');
    const [globalWorkerName, setGlobalWorkerName] = useState('');

    const role = localStorage.getItem('adminRole');
    const navigate = useNavigate();

    const formatDateUK = (dateStr) => {
        if (!dateStr) return '-';
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    };

    const getHrsMins = (decimalHours) => {
        if (!decimalHours) return { hrs: 0, mins: 0 };
        const hrs = Math.floor(decimalHours);
        const mins = Math.round((decimalHours - hrs) * 60);
        return { hrs, mins };
    };

    const handleQuickExport = async (project) => {
        const toastId = toast.loading(`Generating report for ${project.name}...`);
        try {
            const res = await api.get(`/logs/project/${project.id}`);
            let logs = res.data.logs;

            // Apply date filtering if specified
            if (globalStartDate && globalEndDate) {
                logs = logs.filter(log => log.date >= globalStartDate && log.date <= globalEndDate);
            }
            
            // Apply worker filtering if specified
            if (globalWorkerName.trim()) {
                const searchLower = globalWorkerName.trim().toLowerCase();
                logs = logs.filter(log => log.name?.toLowerCase().includes(searchLower));
            }

            if (logs.length === 0) {
                toast.dismiss(toastId);
                toast.error("No logs found for the selected criteria.");
                return;
            }

            const doc = new jsPDF();
            doc.setFontSize(18);
            doc.text(project.name, 14, 22);
            doc.setFontSize(11);
            doc.text(`Project Code: ${project.code}`, 14, 30);
            doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 36);

            let y = 45;
            const headers = ["Date", "Name", "Company", "Car", "Type", "In", "Out", "Hrs", "Mins"];
            const xPos = [14, 38, 65, 95, 118, 138, 153, 170, 185];

            doc.setFont(undefined, 'bold');
            headers.forEach((h, i) => doc.text(h, xPos[i], y));
            doc.line(14, y + 2, 195, y + 2);
            y += 10;

            doc.setFont(undefined, 'normal');
            logs.forEach((log) => {
                if (y > 280) {
                    doc.addPage();
                    y = 20;
                }
                const { hrs, mins } = getHrsMins(log.hours);
                doc.text(String(formatDateUK(log.date)), xPos[0], y);
                doc.text(String(log.name).substring(0, 12), xPos[1], y);
                doc.text(String(log.trade || '-').substring(0, 12), xPos[2], y);
                doc.text(String(log.car_reg || '-').substring(0, 10), xPos[3], y);
                doc.text(String(log.user_type || 'Employee').substring(0, 10), xPos[4], y);
                doc.text(String(log.time_in), xPos[5], y);
                doc.text(String(log.time_out || '-'), xPos[6], y);
                doc.text(String(log.time_out ? hrs : '-'), xPos[7], y);
                doc.text(String(log.time_out ? mins : '-'), xPos[8], y);
                y += 8;
            });

            doc.save(`${project.name}_Report.pdf`);
            toast.success("PDF report downloaded successfully!", { id: toastId });
        } catch (err) {
            console.error("PDF Export error:", err);
            toast.error("Failed to generate PDF.", { id: toastId });
        }
    };

    const handleQuickExcelExport = async (project) => {
        const toastId = toast.loading(`Generating Excel for ${project.name}...`);
        try {
            const res = await api.get(`/logs/project/${project.id}`);
            let logs = res.data.logs;

            // Apply date filtering if specified
            if (globalStartDate && globalEndDate) {
                logs = logs.filter(log => log.date >= globalStartDate && log.date <= globalEndDate);
            }
            
            // Apply worker filtering if specified
            if (globalWorkerName.trim()) {
                const searchLower = globalWorkerName.trim().toLowerCase();
                logs = logs.filter(log => log.name?.toLowerCase().includes(searchLower));
            }

            if (logs.length === 0) {
                toast.dismiss(toastId);
                toast.error("No logs found for the selected criteria.");
                return;
            }

            const exportData = logs.map(log => {
                const { hrs, mins } = getHrsMins(log.hours);
                return {
                    Date: formatDateUK(log.date),
                    Name: log.name,
                    Company: log.trade || '-',
                    'Car Reg': log.car_reg || '-',
                    'User Type': log.user_type || 'Employee',
                    'Time In': log.time_in,
                    'Time Out': log.time_out || 'Active',
                    Hours: log.time_out ? hrs : '-',
                    Mins: log.time_out ? mins : '-'
                };
            });

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Logs");

            // Adjust column widths visually
            const colWidths = [
                { wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 12 }, 
                { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 8 }
            ];
            worksheet['!cols'] = colWidths;

            XLSX.writeFile(workbook, `${project.name}_Report.xlsx`);
            toast.success("Excel report downloaded successfully!", { id: toastId });
        } catch (err) {
            console.error("Excel Export error:", err);
            toast.error("Failed to generate Excel.", { id: toastId });
        }
    };

    useEffect(() => {
        fetchProjects();
        fetchPendingRequests();
        fetchGuards();

        // Initialize Socket.io
        // It will use the current host and port, matching the page's protocol (HTTPS in production)
        const socket = io();

        socket.on('newAttendance', (data) => {
            toast.success(
                (t) => (
                    <div className="flex flex-col">
                        <span className="font-bold">New Attendance Log!</span>
                        <span className="text-sm">{data.name} just signed into {data.project_code}</span>
                    </div>
                ),
                { duration: 5000, icon: '🚀' }
            );
            // Optionally refresh stats or logs here
        });

        socket.on('passwordRequest', (data) => {
            toast.error(
                (t) => (
                    <div className="flex flex-col">
                        <span className="font-bold">Password Recovery Request!</span>
                        <span className="text-sm">Worker needs password for project: <strong>{data.code}</strong></span>
                    </div>
                ),
                { duration: 10000, icon: '🔑' }
            );
        });

        return () => socket.disconnect();
    }, []);

    const fetchGuards = async () => {
        try {
            const res = await api.get('/guards');
            setGuards(res.data);
        } catch (err) {
            console.error('Failed to fetch guards', err);
        }
    };

    const fetchProjects = async () => {
        try {
            const res = await api.get('/projects');
            setProjects(res.data);
        } catch (err) {
            if (err.response?.status === 401) navigate('/admin/login');
        }
    };

    const fetchPendingRequests = async () => {
        try {
            const res = await api.get('/requests/pending');
            setPendingRequests(res.data);
        } catch (err) {
            console.error('Failed to fetch requests', err);
        }
    };

    const handleRequestAction = async (id, status) => {
        try {
            await api.put(`/requests/${id}/status`, { status });
            toast.success(`Request ${status}`);
            fetchPendingRequests();
        } catch (err) {
            toast.error('Action failed');
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (newProject.password !== newProject.confirmPassword) {
            setFormError("Passwords do not match");
            return;
        }
        try {
            await api.post('/projects', newProject);
            setShowModal(false);
            setNewProject({ name: '', code: '', password: '', confirmPassword: '', admin_email: '' });
            toast.success("Project created successfully");
            fetchProjects();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error creating project');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        toast.success("Logged out");
        navigate('/admin/login');
    };

    const handleProjectClick = (project) => {
        setSelectedProject(project);
        setShowAuthModal(true);

        // Check if password is saved
        const savedPassword = localStorage.getItem(`project_pass_${project.id}`);
        if (savedPassword) {
            setAuthPassword(savedPassword);
            setRememberPassword(true);
        } else {
            setAuthPassword('');
            setRememberPassword(false);
        }

        setFormError('');
        setShowAuthPassword(false);
    };

    const handleProjectAccess = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/projects/${selectedProject.id}/verify-access`, { password: authPassword });

            // Save password if remember me is checked
            if (rememberPassword) {
                localStorage.setItem(`project_pass_${selectedProject.id}`, authPassword);
            }

            setShowAuthModal(false);
            navigate(`/admin/project/${selectedProject.id}`);
        } catch (err) {
            setFormError('Incorrect project password');
        }
    };

    const handleDeleteProject = async (project) => {
        setProjectToDelete(project);
        setDeleteConfirmation('');
        setShowDeleteModal(true);
    };

    const confirmDeleteProject = async () => {
        if (deleteConfirmation !== projectToDelete.name) {
            toast.error('Project name does not match. Deletion cancelled.');
            return;
        }

        try {
            console.log('Confirmed deletion for project:', projectToDelete.id);
            const res = await api.delete(`/projects/${projectToDelete.id}`);
            console.log('Delete response:', res.data);
            toast.success('Project deleted successfully');
            fetchProjects();
            localStorage.removeItem(`project_pass_${projectToDelete.id}`);
            setShowDeleteModal(false);
            setProjectToDelete(null);
            setDeleteConfirmation('');
        } catch (err) {
            console.error('Delete error:', err.response?.data || err.message);
            toast.error('Failed to delete project: ' + (err.response?.data?.error || 'Server error'));
        }
    };

    const handleEditProject = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/projects/${selectedProject.id}`, {
                name: editProject.name,
                code: editProject.code
            });
            toast.success('Project updated successfully');
            setShowEditModal(false);
            fetchProjects();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to update project');
        }
    };

    const openEditModal = (project) => {
        setSelectedProject(project);
        setEditProject({ name: project.name, code: project.code });
        setShowEditModal(true);
    };

    const openResetModal = () => {
        setShowAuthModal(false);
        setShowResetModal(true);
        setResetFlow({ step: 1, code: selectedProject.code, token: '', newPassword: '', confirmPassword: '', targetEmail: '' });
        setFormError('');
    };

    const generateRandomCode = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let random = '';
        for (let i = 0; i < 4; i++) random += chars.charAt(Math.floor(Math.random() * chars.length));
        setNewProject(prev => ({ ...prev, code: `TRIPOD-${random}` }));
    };

    const handleSendResetCode = async () => {
        setResetLoading(true);
        setFormError('');
        try {
            const res = await api.post('/projects/forgot-password', {
                code: resetFlow.code
            });
            toast.success('Verification code sent to email!');
            setResetFlow({ ...resetFlow, step: 2, targetEmail: res.data.email });
        } catch (err) {
            setFormError(err.response?.data?.error || 'Failed to send reset code');
        } finally {
            setResetLoading(false);
        }
    };

    const handleVerifyToken = async () => {
        setResetLoading(true);
        setFormError('');
        try {
            await api.post('/projects/verify-reset-token', {
                code: resetFlow.code,
                reset_token: resetFlow.token
            });
            setResetFlow({ ...resetFlow, step: 3 });
        } catch (err) {
            setFormError(err.response?.data?.error || 'Invalid or expired code');
        } finally {
            setResetLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (resetFlow.newPassword !== resetFlow.confirmPassword) {
            setFormError('Passwords do not match');
            return;
        }
        setResetLoading(true);
        setFormError('');
        try {
            await api.post('/projects/reset-password', {
                code: resetFlow.code,
                reset_token: resetFlow.token,
                new_password: resetFlow.newPassword
            });
            toast.success('Password reset successfully!');
            setShowResetModal(false);
            setAuthPassword(resetFlow.newPassword);
            setShowAuthModal(true);
        } catch (err) {
            setFormError(err.response?.data?.error || 'Failed to reset password');
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Toaster position="top-right" />
            <nav className="bg-white shadow-lg p-5 flex justify-between items-center px-12 sticky top-0 z-50 border-b-4 border-primary">
                <div className="flex items-center gap-4">
                    <img src="/Tipod_Final_Logo_high_pixel.png" className="h-16 w-auto" alt="Logo" />
                    <h1 className="text-xl font-bold text-primary tracking-tight">Tripod Attendance Pro</h1>
                </div>
                <div className="flex items-center gap-6">
                    {role === 'superadmin' && (
                        <button
                            onClick={() => navigate('/admin/manage')}
                            className="text-secondary hover:text-primary flex items-center gap-2 font-bold transition px-4 py-2 hover:bg-slate-50 rounded-lg border-2 border-transparent hover:border-slate-100"
                        >
                            <ShieldCheck size={20} /> Management
                        </button>
                    )}
                    <button onClick={handleLogout} className="text-slate-600 hover:text-white flex items-center gap-2 font-semibold transition bg-primary/10 px-5 py-2.5 rounded-lg hover:bg-primary">
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto p-8 lg:p-12">
                {/* Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                        <div className="bg-primary/10 p-4 rounded-xl text-primary">
                            <LayoutDashboard size={24} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Total Projects</p>
                            <p className="text-2xl font-bold text-slate-900">{projects.length}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 flex items-center gap-4">
                        <div className="bg-emerald-50 p-4 rounded-xl text-emerald-600 relative">
                            <Users size={24} />
                            <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                        <div className="flex-1">
                            <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Active Mobile Guards</p>
                            {guards.filter(g => g.mobile_paired).length === 0 ? (
                                <p className="text-sm text-slate-400 font-medium">No active guards</p>
                            ) : (
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {guards.filter(g => g.mobile_paired).map(g => (
                                        <span key={g.id} className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 shadow-sm border border-emerald-200">
                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                            {g.name.split(' ')[0]}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 flex items-center gap-4">
                        <div className="bg-orange-50 p-4 rounded-xl text-orange-600">
                            <Clock size={24} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Pending Tasks</p>
                            <p className="text-2xl font-bold text-slate-900">{pendingRequests.length}</p>
                        </div>
                    </div>
                </div>

                {/* Pending Requests Section */}
                {pendingRequests.length > 0 && (
                    <div className="mb-10">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Clock className="text-orange-500" /> Pending Date Requests
                        </h2>
                        <div className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden">
                            {pendingRequests.map(req => (
                                <div key={req.id} className="p-4 border-b border-gray-50 flex items-center justify-between last:border-0 hover:bg-orange-50/10 transition">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-gray-900">{req.user_name}</span>
                                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-mono">{req.project_code}</span>
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            Requested Date: <span className="font-medium text-orange-600">{req.requested_date}</span>
                                            {req.reason && <span className="text-gray-400"> • "{req.reason}"</span>}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleRequestAction(req.id, 'approved')}
                                            className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 border border-green-200 transition"
                                            title="Approve"
                                        >
                                            <Check size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleRequestAction(req.id, 'rejected')}
                                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-200 transition"
                                            title="Reject"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                    <h2 className="text-2xl font-bold text-gray-800">Projects</h2>
                    <div className="flex gap-4 items-center">
                        {/* Global Filters for Quick Export */}
                        <div className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-2 rounded-lg shadow-sm flex-wrap">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide hidden md:inline">Export Filters:</span>
                            
                            <div className="flex items-center gap-2 border-r border-slate-200 pr-3">
                                <input 
                                    type="text" 
                                    placeholder="Worker Name..." 
                                    value={globalWorkerName} 
                                    onChange={(e) => setGlobalWorkerName(e.target.value)} 
                                    className="text-sm text-slate-600 outline-none bg-transparent w-32 focus:w-40 transition-all"
                                />
                            </div>

                            <div className="flex items-center gap-2 pl-1">
                                <input 
                                    type="date" 
                                    value={globalStartDate} 
                                    onChange={(e) => setGlobalStartDate(e.target.value)} 
                                    className="text-sm text-slate-600 outline-none bg-transparent"
                                />
                                <span className="text-slate-400 text-sm font-bold">to</span>
                                <input 
                                    type="date" 
                                    value={globalEndDate} 
                                    onChange={(e) => setGlobalEndDate(e.target.value)} 
                                    className="text-sm text-slate-600 outline-none bg-transparent"
                                />
                            </div>

                            {(globalStartDate || globalEndDate || globalWorkerName) && (
                                <button 
                                    onClick={() => { setGlobalStartDate(''); setGlobalEndDate(''); setGlobalWorkerName(''); }}
                                    className="p-1 text-slate-400 hover:text-red-500 transition ml-2 bg-slate-50 rounded-full"
                                    title="Clear All Filters"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition shadow-sm"
                        >
                            <Plus size={20} /> New Project
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((p) => (
                        <div
                            key={p.id}
                            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition border border-gray-100 group relative"
                        >
                            <div
                                onClick={() => handleProjectClick(p)}
                                className="cursor-pointer"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="bg-primary/10 p-3 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition">
                                        <Folder size={24} />
                                    </div>
                                    <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">{p.code}</span>
                                </div>
                                <h3 className="font-bold text-lg text-gray-800 mb-1">{p.name}</h3>
                                <p className="text-gray-400 text-sm">Created: {new Date(p.created_at).toLocaleDateString()}</p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openEditModal(p);
                                    }}
                                    className="flex-1 py-2 px-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-xs font-medium flex items-center justify-center gap-1"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                                    Edit
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteProject(p);
                                    }}
                                    className="flex-1 py-2 px-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-xs font-medium flex items-center justify-center gap-1"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                    Delete
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleQuickExport(p);
                                    }}
                                    className="flex-1 py-2 px-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition text-xs font-medium flex items-center justify-center gap-1"
                                    title="Download PDF Report"
                                >
                                    <Download size={14} />
                                    PDF
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleQuickExcelExport(p);
                                    }}
                                    className="flex-1 py-2 px-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition text-xs font-medium flex items-center justify-center gap-1 border border-green-200"
                                    title="Download Excel Report"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                    Excel
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
                    <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="bg-primary/20 p-3 rounded-2xl text-primary">
                                <Plus size={24} />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900">New Project</h3>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <input
                                placeholder="Project Name"
                                className="w-full px-4 py-2 border rounded-lg"
                                value={newProject.name}
                                onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                                required
                            />
                            <div className="flex gap-2">
                                <input
                                    placeholder="Project Code (e.g. SITE-001)"
                                    className="flex-1 px-4 py-2 border rounded-lg uppercase"
                                    value={newProject.code}
                                    onChange={e => setNewProject({ ...newProject, code: e.target.value.toUpperCase() })}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={generateRandomCode}
                                    className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200"
                                >
                                    ✨ Generate
                                </button>
                            </div>
                            <input
                                placeholder="Admin Email (for password recovery)"
                                type="email"
                                className="w-full px-4 py-2 border rounded-lg"
                                value={newProject.admin_email}
                                onChange={e => setNewProject({ ...newProject, admin_email: e.target.value })}
                                required
                            />
                            <div className="relative">
                                <input
                                    placeholder="Project Password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="w-full px-4 py-2 border rounded-lg pr-10"
                                    value={newProject.password}
                                    onChange={e => setNewProject({ ...newProject, password: e.target.value })}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <div className="relative">
                                <input
                                    placeholder="Confirm Project Password"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    className="w-full px-4 py-2 border rounded-lg pr-10"
                                    value={newProject.confirmPassword}
                                    onChange={e => setNewProject({ ...newProject, confirmPassword: e.target.value })}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {formError && <p className="text-red-500 text-sm">{formError}</p>}
                            <div className="flex gap-4 mt-6">
                                <button type="button" onClick={() => { setShowModal(false); setFormError(''); }} className="flex-1 py-2 text-gray-600">Cancel</button>
                                <button type="submit" className="flex-1 bg-primary text-white py-2 rounded-lg font-bold">Create Project</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Project Access Auth Modal */}
            {showAuthModal && selectedProject && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
                    <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl border border-slate-100">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="bg-primary/20 p-3 rounded-2xl text-primary">
                                <Lock size={24} />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900">Project Access</h3>
                        </div>
                        <p className="text-slate-600 mb-6">Enter the project password to view logs for <span className="font-bold text-slate-900">{selectedProject.name}</span></p>
                        <form onSubmit={handleProjectAccess} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Project Password</label>
                                <div className="relative">
                                    <input
                                        type={showAuthPassword ? 'text' : 'password'}
                                        placeholder="Enter project password"
                                        className="w-full px-4 py-3 pr-10 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
                                        value={authPassword}
                                        onChange={(e) => setAuthPassword(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowAuthPassword(!showAuthPassword)}
                                        className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                                    >
                                        {showAuthPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Remember Me Checkbox */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="rememberPassword"
                                    checked={rememberPassword}
                                    onChange={(e) => setRememberPassword(e.target.checked)}
                                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-cyan-500"
                                />
                                <label htmlFor="rememberPassword" className="text-sm text-slate-600 cursor-pointer">
                                    Remember password for this project
                                </label>
                            </div>

                            {formError && <p className="text-red-500 text-sm">{formError}</p>}

                            <button
                                type="button"
                                onClick={openResetModal}
                                className="text-primary hover:text-cyan-700 text-sm font-medium underline"
                            >
                                Forgot Password?
                            </button>

                            <div className="flex gap-4 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAuthModal(false);
                                        setFormError('');
                                        setAuthPassword('');
                                        setShowAuthPassword(false);
                                    }}
                                    className="flex-1 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-bold transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-primary text-white py-3 rounded-lg font-bold hover:bg-primary/90 transition shadow-lg"
                                >
                                    Access Project
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Project Modal */}
            {showEditModal && selectedProject && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
                    <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl border border-slate-100">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="bg-blue-100 p-3 rounded-2xl text-blue-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900">Edit Project</h3>
                        </div>
                        <form onSubmit={handleEditProject} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Project Name</label>
                                <input
                                    type="text"
                                    placeholder="Construction Site A"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={editProject.name}
                                    onChange={(e) => setEditProject({ ...editProject, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Project Code</label>
                                <input
                                    type="text"
                                    placeholder="SITE-001"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase font-mono"
                                    value={editProject.code}
                                    onChange={(e) => setEditProject({ ...editProject, code: e.target.value.toUpperCase() })}
                                    required
                                />
                            </div>
                            {formError && <p className="text-red-500 text-sm">{formError}</p>}
                            <div className="flex gap-4 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setFormError('');
                                    }}
                                    className="flex-1 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-bold transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-lg"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Multi-Step Password Reset Modal */}
            {showResetModal && selectedProject && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
                    <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl border border-slate-100">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="bg-orange-100 p-3 rounded-2xl text-orange-600">
                                <Lock size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900">Reset Password</h3>
                                <p className="text-sm text-slate-500">{selectedProject.name}</p>
                            </div>
                        </div>

                        {/* Step 1: Confirm Destination */}
                        {resetFlow.step === 1 && (
                            <div className="space-y-4">
                                <p className="text-slate-600 text-sm">A verification code will be sent to the administrator email associated with this project for security.</p>

                                {formError && <p className="text-red-500 text-sm">{formError}</p>}
                                <div className="flex gap-4 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowResetModal(false);
                                            setShowAuthModal(true);
                                        }}
                                        className="flex-1 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-bold transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSendResetCode}
                                        disabled={resetLoading}
                                        className="flex-1 bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700 transition shadow-lg disabled:opacity-50"
                                    >
                                        {resetLoading ? 'Sending...' : 'Send Reset Code'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Enter Verification Code */}
                        {resetFlow.step === 2 && (
                            <div className="space-y-4">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                    <p className="text-green-800 text-sm">
                                        ✅ Verification code sent to <strong>{resetFlow.targetEmail}</strong>
                                    </p>
                                </div>
                                <p className="text-slate-600">Enter the 6-digit code from your email. The code expires in 15 minutes.</p>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Verification Code</label>
                                    <input
                                        type="text"
                                        placeholder="123456"
                                        maxLength="6"
                                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-center text-2xl font-mono tracking-widest"
                                        value={resetFlow.token}
                                        onChange={(e) => setResetFlow({ ...resetFlow, token: e.target.value.replace(/\D/g, '') })}
                                        autoFocus
                                    />
                                </div>
                                {formError && <p className="text-red-500 text-sm">{formError}</p>}
                                <button
                                    onClick={() => setResetFlow({ ...resetFlow, step: 1 })}
                                    className="text-orange-600 hover:text-orange-700 text-sm font-medium underline"
                                >
                                    Didn't receive code? Try again
                                </button>
                                <div className="flex gap-4 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowResetModal(false);
                                            setShowAuthModal(true);
                                        }}
                                        className="flex-1 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-bold transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleVerifyToken}
                                        disabled={resetLoading || resetFlow.token.length !== 6}
                                        className="flex-1 bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700 transition shadow-lg disabled:opacity-50"
                                    >
                                        {resetLoading ? 'Verifying...' : 'Verify Code'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Set New Password */}
                        {resetFlow.step === 3 && (
                            <div className="space-y-4">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                    <p className="text-green-800 text-sm">
                                        ✅ Code verified! Set your new password below.
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">New Password</label>
                                    <input
                                        type="password"
                                        placeholder="Enter new password"
                                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                        value={resetFlow.newPassword}
                                        onChange={(e) => setResetFlow({ ...resetFlow, newPassword: e.target.value })}
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Confirm Password</label>
                                    <input
                                        type="password"
                                        placeholder="Confirm new password"
                                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                        value={resetFlow.confirmPassword}
                                        onChange={(e) => setResetFlow({ ...resetFlow, confirmPassword: e.target.value })}
                                    />
                                </div>
                                {formError && <p className="text-red-500 text-sm">{formError}</p>}
                                <div className="flex gap-4 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowResetModal(false);
                                            setShowAuthModal(true);
                                        }}
                                        className="flex-1 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-bold transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleResetPassword}
                                        disabled={resetLoading || !resetFlow.newPassword || !resetFlow.confirmPassword}
                                        className="flex-1 bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700 transition shadow-lg disabled:opacity-50"
                                    >
                                        {resetLoading ? 'Resetting...' : 'Reset Password'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Delete Project Confirmation Modal */}
            {showDeleteModal && projectToDelete && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
                    <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl border border-slate-100">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="bg-red-100 p-3 rounded-2xl text-red-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900">Delete Project</h3>
                        </div>

                        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
                            <p className="text-red-800 font-semibold mb-2">⚠️ Warning: This action cannot be undone!</p>
                            <p className="text-red-700 text-sm">
                                Deleting this project will permanently remove all associated attendance logs and data.
                            </p>
                        </div>

                        <div className="mb-6">
                            <p className="text-slate-700 mb-4">
                                To confirm deletion, please type the project name: <span className="font-bold text-slate-900">"{projectToDelete.name}"</span>
                            </p>
                            <input
                                type="text"
                                value={deleteConfirmation}
                                onChange={(e) => setDeleteConfirmation(e.target.value)}
                                placeholder="Type project name here"
                                className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                                autoFocus
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setProjectToDelete(null);
                                    setDeleteConfirmation('');
                                }}
                                className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-lg font-bold hover:bg-slate-200 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmDeleteProject}
                                disabled={deleteConfirmation !== projectToDelete.name}
                                className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Delete Project
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
