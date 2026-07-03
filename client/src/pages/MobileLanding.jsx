import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Building2, ArrowRight, AlertCircle, Shield, MessageSquare } from 'lucide-react';

const MobileLanding = () => {
    const navigate = useNavigate();
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!code.trim()) {
            setError('Please enter a site code to continue');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const res = await api.post('/projects/verify-code', { code: code.trim() });
            if (res.data.valid) {
                const projectData = { ...res.data.project, code: code.trim() };
                localStorage.setItem('currentProject', JSON.stringify(projectData));
                navigate('/form');
            } else {
                setError(res.data.error || 'Invalid project code. Please try again.');
            }
        } catch (err) {
            setError('Connection error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f0f4ff', display: 'flex', flexDirection: 'column' }}>
            {/* Top accent bar */}
            <div style={{ height: 4, backgroundColor: '#2b4594', width: '100%' }} />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
                {/* Logo */}
                <div style={{ marginBottom: 32, textAlign: 'center' }}>
                    <div style={{
                        display: 'inline-block',
                        backgroundColor: '#fff',
                        borderRadius: 24,
                        padding: 16,
                        boxShadow: '0 8px 32px rgba(43,69,148,0.15)',
                        marginBottom: 20,
                    }}>
                        <img
                            src="/Tipod_Final_Logo_high_pixel.png"
                            style={{ width: 96, height: 96, objectFit: 'contain', display: 'block' }}
                            alt="Tripod Services Logo"
                        />
                    </div>
                    <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', margin: '0 0 6px', letterSpacing: -0.5 }}>
                        Attendance Pro
                    </h1>
                    <p style={{ fontSize: 14, color: '#64748b', margin: 0, fontWeight: 500 }}>
                        Secure site access for Tripod Services
                    </p>
                </div>

                {/* Main Card */}
                <div style={{
                    backgroundColor: '#fff',
                    borderRadius: 28,
                    padding: 28,
                    width: '100%',
                    maxWidth: 400,
                    boxShadow: '0 4px 24px rgba(15,23,42,0.08)',
                    border: '1px solid #e2e8f0',
                    marginBottom: 20,
                }}>
                    {/* Card Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
                        <div style={{ backgroundColor: '#eff6ff', padding: 10, borderRadius: 14 }}>
                            <Building2 size={22} color="#2b4594" />
                        </div>
                        <div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Enter Site Code</div>
                            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2, fontWeight: 500 }}>Provided by your site manager</div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Label */}
                        <div style={{ marginBottom: 8, marginLeft: 2 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1.2px' }}>
                                Site Identifier
                            </span>
                        </div>

                        {/* Input */}
                        <input
                            type="text"
                            placeholder="SITE-001"
                            value={code}
                            onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(''); }}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            style={{
                                width: '100%',
                                boxSizing: 'border-box',
                                fontSize: 22,
                                fontWeight: 900,
                                color: '#0f172a',
                                textAlign: 'center',
                                letterSpacing: '4px',
                                textTransform: 'uppercase',
                                backgroundColor: isFocused ? '#f8fbff' : '#f8fafc',
                                border: `2px solid ${error ? '#ef4444' : isFocused ? '#2b4594' : '#e2e8f0'}`,
                                borderRadius: 16,
                                padding: '16px 20px',
                                outline: 'none',
                                marginBottom: 20,
                                transition: 'all 0.2s ease',
                                boxShadow: isFocused ? '0 0 0 4px rgba(43,69,148,0.12)' : 'none',
                            }}
                        />

                        {/* Error */}
                        {error && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                backgroundColor: '#fef2f2',
                                border: '1px solid #fecaca',
                                borderRadius: 12,
                                padding: '12px 14px',
                                marginBottom: 20,
                            }}>
                                <AlertCircle size={16} color="#dc2626" />
                                <span style={{ color: '#dc2626', fontWeight: 600, fontSize: 13 }}>{error}</span>
                            </div>
                        )}

                        {/* CTA Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                backgroundColor: loading ? '#7a96cc' : '#2b4594',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 16,
                                padding: '18px 24px',
                                fontSize: 17,
                                fontWeight: 800,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 10,
                                boxShadow: '0 6px 20px rgba(43,69,148,0.35)',
                                transition: 'all 0.2s ease',
                                letterSpacing: 0.3,
                            }}
                        >
                            {loading ? 'Verifying...' : (
                                <>
                                    Access Site
                                    <ArrowRight size={20} strokeWidth={2.5} />
                                </>
                            )}
                        </button>

                        {loading && (
                            <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 11, marginTop: 12, fontStyle: 'italic' }}>
                                Connecting to secure server... (May take up to 60s if server is asleep)
                            </p>
                        )}
                    </form>
                </div>

                {/* Footer Links */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <button
                        onClick={() => navigate('/admin-login')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            backgroundColor: '#fff',
                            border: '1px solid #e2e8f0',
                            borderRadius: 50,
                            padding: '10px 20px',
                            cursor: 'pointer',
                            color: '#2b4594',
                            fontWeight: 700,
                            fontSize: 12,
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                        }}
                    >
                        <Shield size={14} color="#2b4594" />
                        Admin Dashboard
                    </button>

                    <p style={{ fontSize: 10, color: '#cbd5e1', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', margin: 0 }}>
                        Tripod Services · Secure Attendance System
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MobileLanding;
