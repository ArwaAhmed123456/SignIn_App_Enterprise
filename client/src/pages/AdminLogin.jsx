import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { Lock, Eye, EyeOff } from 'lucide-react';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [token, setToken] = useState('');
    const [view, setView] = useState('login'); // login, forgot, reset
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadSavedCredentials();
    }, []);

    const loadSavedCredentials = () => {
        const savedEmail = localStorage.getItem('admin_remember_email');
        if (savedEmail) {
            setEmail(savedEmail);
            setRememberMe(true);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await api.post('/auth/login', { email, password });
            localStorage.setItem('adminToken', res.data.token);
            localStorage.setItem('adminRole', res.data.user.role);
            localStorage.setItem('adminFirstName', res.data.user.firstName || '');
            localStorage.setItem('adminLastName',  res.data.user.lastName  || '');
            localStorage.setItem('adminOrg',       res.data.user.organization || '');

            // Save or clear credentials based on Remember Me
            if (rememberMe) {
                localStorage.setItem('admin_remember_email', email);
            } else {
                localStorage.removeItem('admin_remember_email');
            }

            navigate('/admin');
        } catch (err) {
            setError('Invalid credentials');
        }
    };

    const handleForgot = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        try {
            const res = await api.post('/auth/forgot-password', { email });
            setMessage(res.data.message || 'Reset code sent. Please check your email.');
            if (res.data.mockToken) {
                console.log("Mock Token:", res.data.mockToken);
                // In a real app, you'd click a link in an email. 
                // For this demo, let's allow jumping to reset view.
                setToken(res.data.mockToken);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Error sending request');
        }
    };

    const handleReset = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/auth/reset-password', { token, newPassword });
            setMessage('Password reset! You can now login.');
            setView('login');
        } catch (err) {
            setError(err.response?.data?.error || 'Reset failed');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-2xl border border-slate-100">
                <div className="flex justify-center mb-8">
                    <img src="/Tipod_Final_Logo_high_pixel.png" className="h-32 w-auto" alt="Logo" />
                </div>
                <h2 className="text-3xl font-extrabold text-center mb-2 text-slate-900 tracking-tight">
                    {view === 'login' ? 'Admin Portal' : view === 'forgot' ? 'Reset Password' : 'New Password'}
                </h2>
                <p className="text-center text-slate-500 mb-8 font-medium">Attendance Management System</p>

                {view === 'login' && (
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                required
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none pr-10"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="rememberMe"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary cursor-pointer"
                                />
                                <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-600 cursor-pointer">
                                    Remember me
                                </label>
                            </div>
                            <button type="button" onClick={() => setView('forgot')} className="text-sm text-secondary hover:text-primary font-bold">Forgot Password?</button>
                        </div>
                        {error && <p className="text-red-500 text-sm font-medium text-center bg-red-50 py-2 rounded-lg">{error}</p>}
                        {message && <p className="text-[#2b4594] text-sm font-medium text-center bg-blue-50 py-2 rounded-lg">{message}</p>}
                        <button
                            type="submit"
                            className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-blue-200 hover:bg-secondary transform hover:-translate-y-0.5 transition"
                        >
                            Login to Dashboard
                        </button>
                    </form>
                )}

                {view === 'forgot' && (
                    <form onSubmit={handleForgot} className="space-y-4">
                        <p className="text-sm text-gray-500 mb-4">Enter your email and we'll send you a password reset token.</p>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                required
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        {message && (
                            <div className="space-y-3">
                                <p className="text-[#2b4594] text-sm text-center whitespace-pre-wrap">{message}</p>
                                {token && (
                                    <button type="button" onClick={() => setView('reset')} className="w-full bg-orange-500 text-white py-2 rounded-lg text-sm font-bold">
                                        DEMO: Continue to Reset
                                    </button>
                                )}
                            </div>
                        )}
                        <button
                            type="submit"
                            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-secondary transition"
                        >
                            Send Reset Token
                        </button>
                        <button type="button" onClick={() => setView('login')} className="w-full text-center text-sm text-gray-500 hover:underline">Back to Login</button>
                    </form>
                )}

                {view === 'reset' && (
                    <form onSubmit={handleReset} className="space-y-4">
                        <p className="text-sm text-gray-500 mb-4">Enter your new password.</p>
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                            <input
                                type={showNewPassword ? 'text' : 'password'}
                                required
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none pr-10"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                            >
                                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        <button
                            type="submit"
                            className="w-full bg-[#2b4594] text-white py-3 rounded-lg font-semibold hover:bg-[#1e326e] transition"
                        >
                            Reset Password
                        </button>
                        <button type="button" onClick={() => setView('login')} className="w-full text-center text-sm text-gray-500 hover:underline">Cancel</button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AdminLogin;
