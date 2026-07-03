import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Clock, User, Briefcase, Car, Calendar, ArrowLeft, CheckCircle, AlertCircle, Building2 } from 'lucide-react';

const MobileForm = () => {
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [fieldErrors, setFieldErrors] = useState({});

    // Permission state
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState(null); // 'pending', 'approved', 'rejected'
    const [permissionRequestId, setPermissionRequestId] = useState(null);
    const [restrictedDate, setRestrictedDate] = useState('');
    const [checkInterval, setCheckInterval] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        trade: '',
        car_reg: '',
        user_type: 'Employee',
        date: new Date().toISOString().split('T')[0],
        time_in: '',
        time_out: '',
        reason: ''
    });

    const [calculatedHours, setCalculatedHours] = useState(0);

    useEffect(() => {
        const p = localStorage.getItem('currentProject');
        if (!p) {
            navigate('/');
            return;
        }
        const parsed = JSON.parse(p);
        if (!parsed.code) {
            localStorage.removeItem('currentProject');
            navigate('/');
            return;
        }
        setProject(parsed);
    }, [navigate]);

    useEffect(() => {
        if (formData.time_in && formData.time_out && formData.date) {
            const start = new Date(`${formData.date}T${formData.time_in}`);
            const end = new Date(`${formData.date}T${formData.time_out}`);
            let diffMs = end - start;
            if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000; // Handle overnight shifts
            if (diffMs === 0) diffMs = 24 * 60 * 60 * 1000; // Treat same time as 24-hour shift
            let diffHrs = diffMs / (1000 * 60 * 60);
            setCalculatedHours(diffHrs.toFixed(2));
        } else {
            setCalculatedHours(0);
        }
    }, [formData.time_in, formData.time_out, formData.date]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (fieldErrors[e.target.name]) {
            setFieldErrors({ ...fieldErrors, [e.target.name]: null });
        }
    };

    const validate = () => {
        const errors = {};
        if (!formData.name.trim()) errors.name = "Full Name is required";
        if (!formData.trade.trim()) errors.trade = "Company is required";
        if (!formData.car_reg.trim()) errors.car_reg = "Car Registration is required";
        if (!formData.date) errors.date = "Date is required";
        if (!formData.time_in) errors.time_in = "Time In is required";
        if (!formData.time_out) errors.time_out = "Time Out is required";

        if (formData.time_in && formData.time_out && formData.date) {
            const start = new Date(`${formData.date}T${formData.time_in}`);
            const end = new Date(`${formData.date}T${formData.time_out}`);
            if (end <= start) {
                errors.time_out = "Time Out must be after Time In";
            }
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!project) return;

        if (!validate()) {
            setError('Please fill in all required fields correctly.');
            window.scrollTo(0, 0);
            return;
        }

        setLoading(true);
        setError('');

        try {
            await api.post('/logs', {
                ...formData,
                project_code: project.code
            });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to submit log');
            window.scrollTo(0, 0);
        } finally {
            setLoading(false);
        }
    };

    // Date Restriction Logic
    const isDateRestricted = (dateStr) => {
        const today = new Date().toISOString().split('T')[0];
        return dateStr !== today;
    };

    const handleDateChange = (e) => {
        const selectedDate = e.target.value;
        setFormData({ ...formData, date: selectedDate });

        if (isDateRestricted(selectedDate)) {
            setRestrictedDate(selectedDate);
            // Check if we already have an approved request for this date/user? 
            // For simplicity, we just trigger the modal. Realistically we should check if they already have permission.
            // But since we don't hold session, we'll ask again or requires them to wait.
            // If they just got approved, permissionStatus would be 'approved'.
            if (permissionStatus !== 'approved') {
                setShowPermissionModal(true);
            }
        }
    };

    const submitPermissionRequest = async () => {
        if (!formData.name) {
            alert('Please enter your name first');
            return;
        }
        try {
            const res = await api.post('/requests', {
                project_code: project.code,
                user_name: formData.name,
                requested_date: restrictedDate,
                reason: formData.reason || 'Needed for log' // Optional reason
            });
            setPermissionRequestId(res.data.id);
            setPermissionStatus('pending');
            // Start polling
            const interval = setInterval(() => checkRequestStatus(res.data.id), 3000);
            setCheckInterval(interval);
        } catch (err) {
            alert('Failed to submit request');
        }
    };

    const checkRequestStatus = async (id) => {
        try {
            const res = await api.get(`/requests/${id}`);
            if (res.data.status === 'approved') {
                setPermissionStatus('approved');
                setShowPermissionModal(false);
                if (checkInterval) clearInterval(checkInterval);
            } else if (res.data.status === 'rejected') {
                setPermissionStatus('rejected');
                if (checkInterval) clearInterval(checkInterval);
            }
        } catch (err) {
            console.error('Polling error', err);
        }
    };

    // Cleanup interval
    useEffect(() => {
        return () => {
            if (checkInterval) clearInterval(checkInterval);
        };
    }, [checkInterval]);

    const handleReset = () => {
        setSuccess(false);
        setFormData({
            name: '',
            trade: '',
            car_reg: '',
            user_type: 'Employee',
            date: new Date().toISOString().split('T')[0],
            time_in: '',
            time_out: '',
            reason: ''
        });
        setPermissionStatus(null);
        setPermissionRequestId(null);
        setShowPermissionModal(false);
        if (checkInterval) clearInterval(checkInterval);
        setFieldErrors({});
        navigate('/');
    };

    if (!project) return null;

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-green-100 p-6 rounded-full text-green-700 mb-6 border border-green-200 shadow-sm">
                    <CheckCircle size={48} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Submission Successful</h2>
                <p className="text-gray-500 mb-8">Your daily log has been recorded securely.</p>
                <button
                    onClick={handleReset}
                    className="bg-primary text-white font-medium py-3 px-8 rounded-lg shadow-md hover:bg-secondary transition w-full max-w-xs"
                >
                    Return to Home
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
            {/* Professional Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-xl mx-auto px-4 py-4 flex items-center gap-4">
                    <button onClick={() => navigate('/')} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 text-slate-600 mb-0.5">
                            <Building2 size={14} />
                            <span className="text-xs font-semibold uppercase tracking-wider">{project.code}</span>
                        </div>
                        <h1 className="text-lg font-bold text-gray-900 leading-tight">{project.name}</h1>
                    </div>
                </div>
            </div>

            <div className="max-w-xl mx-auto p-4 pb-20">

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r shadow-sm flex items-start gap-3">
                        <AlertCircle size={20} className="mt-0.5" />
                        <div>
                            <p className="font-bold text-sm">Submission Error</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Section: User Details */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 space-y-5">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">Worker Details</h3>

                        {/* User Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">I am a...</label>
                            <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200">
                                {['Employee', 'Visitor'].map(type => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, user_type: type })}
                                        className={`flex-1 py-2 rounded-md text-sm font-medium transition ${formData.user_type === type
                                            ? 'bg-white text-slate-900 shadow-sm border border-gray-100'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition ${fieldErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                                    placeholder="John Doe"
                                />
                            </div>
                            {fieldErrors.name && <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Company <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input
                                    name="trade"
                                    value={formData.trade}
                                    onChange={handleChange}
                                    className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition ${fieldErrors.trade ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                                    placeholder="Acme Corp"
                                />
                            </div>
                            {fieldErrors.trade && <p className="text-red-500 text-xs mt-1">{fieldErrors.trade}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Car Registration <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Car className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input
                                    name="car_reg"
                                    value={formData.car_reg}
                                    onChange={handleChange}
                                    className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition ${fieldErrors.car_reg ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                                    placeholder="ABC-123"
                                />
                            </div>
                            {fieldErrors.car_reg && <p className="text-red-500 text-xs mt-1">{fieldErrors.car_reg}</p>}
                        </div>
                    </div>

                    {/* Section: Time Log */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 space-y-5">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">Entry Log</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-3 text-gray-400" size={18} />
                                    <input
                                        type="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleDateChange}
                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Time In <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-3 text-gray-400" size={18} />
                                    <input
                                        type="time"
                                        name="time_in"
                                        value={formData.time_in}
                                        onChange={handleChange}
                                        className={`w-full pl-10 pr-2 py-2.5 bg-white border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${fieldErrors.time_in ? 'border-red-300' : 'border-gray-300'}`}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Time Out <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-3 text-gray-400" size={18} />
                                    <input
                                        type="time"
                                        name="time_out"
                                        value={formData.time_out}
                                        onChange={handleChange}
                                        className={`w-full pl-10 pr-2 py-2.5 bg-white border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${fieldErrors.time_out ? 'border-red-300' : 'border-gray-300'}`}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Duration info */}
                        <div className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-lg border border-slate-100">
                            <span className="text-sm font-medium text-slate-600">Total Duration</span>
                            <span className="text-lg font-bold text-slate-800">{calculatedHours} hrs</span>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Reason / Notes</label>
                            <textarea
                                name="reason"
                                rows="3"
                                value={formData.reason}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                placeholder="Regular daily work..."
                            ></textarea>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-white text-lg font-bold py-4 rounded-xl shadow-lg hover:bg-secondary transition active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Submitting...' : 'Submit Log'}
                    </button>
                </form>
            </div>

            {/* Footer Branding */}
            <div className="text-center mt-8 opacity-40">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest">Secure Site System</p>
            </div>
            {/* Permission Modal */}
            {showPermissionModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm text-center">
                        <Calendar size={48} className="mx-auto text-primary mb-4" />
                        <h3 className="text-xl font-bold mb-2">Restricted Date Selected</h3>
                        <p className="text-gray-600 mb-6 text-sm">
                            You have selected a date that is not today ({restrictedDate}).
                            You need admin approval to proceed.
                        </p>

                        {!permissionStatus && (
                            <div className="space-y-3">
                                <p className="text-xs text-gray-500 mb-2">Ensure your name is entered in the form behind.</p>
                                <button
                                    onClick={submitPermissionRequest}
                                    className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-secondary transition"
                                >
                                    Request Permission
                                </button>
                                <button
                                    onClick={() => {
                                        setShowPermissionModal(false);
                                        // Reset date to today
                                        setFormData({ ...formData, date: new Date().toISOString().split('T')[0] });
                                    }}
                                    className="w-full py-3 text-gray-500 hover:text-gray-800"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}

                        {permissionStatus === 'pending' && (
                            <div className="space-y-4">
                                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                                <p className="font-bold text-gray-800">Waiting for Admin Approval...</p>
                                <p className="text-xs text-gray-500">Please ask an admin to approve your request.</p>
                            </div>
                        )}

                        {permissionStatus === 'rejected' && (
                            <div className="space-y-4">
                                <div className="text-red-500 font-bold text-xl">Request Rejected</div>
                                <button
                                    onClick={() => {
                                        setShowPermissionModal(false);
                                        setPermissionStatus(null);
                                        setFormData({ ...formData, date: new Date().toISOString().split('T')[0] });
                                    }}
                                    className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-bold"
                                >
                                    Close
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MobileForm;
