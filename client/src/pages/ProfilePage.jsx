import React, { useState } from 'react';
import api from '../api';

const ProfilePage = () => {
  const firstName = localStorage.getItem('adminFirstName') || '';
  const lastName  = localStorage.getItem('adminLastName')  || '';
  const email     = localStorage.getItem('admin_remember_email') || '';

  const [name, setName]         = useState(`${firstName} ${lastName}`.trim() || 'Admin');
  const [twoFA, setTwoFA]       = useState(false);
  const [displayMode, setDisplayMode] = useState('Auto');
  const [curPwd, setCurPwd]     = useState('');
  const [newPwd, setNewPwd]     = useState('');
  const [pwdMsg, setPwdMsg]     = useState('');
  const [pwdErr, setPwdErr]     = useState('');
  const [saving, setSaving]     = useState(false);

  const handleChangePwd = async (e) => {
    e.preventDefault();
    setPwdErr(''); setPwdMsg('');
    if (newPwd.length < 8) { setPwdErr('Password must be at least 8 characters'); return; }
    setSaving(true);
    try {
      await api.post('/auth/change-password', { currentPassword: curPwd, newPassword: newPwd });
      setPwdMsg('Password changed successfully. Please log in again.');
      setCurPwd(''); setNewPwd('');
    } catch (err) {
      setPwdErr(err.response?.data?.error || 'Failed to change password');
    } finally { setSaving(false); }
  };

  return (
    <div className="h-full overflow-auto bg-slate-50">
      <div className="max-w-3xl mx-auto px-8 py-8 flex flex-col gap-8">
        <h1 className="text-2xl font-bold text-slate-800">My profile</h1>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left — General */}
          <div className="flex-1 bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-5">
            <h2 className="text-base font-bold text-slate-800">General</h2>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Name</label>
              <input value={name} onChange={e => setName(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594] focus:ring-1 focus:ring-[#2b4594]" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Email</label>
              <div className="flex gap-2">
                <input value={email} readOnly
                  className="flex-1 border border-slate-200 rounded-md px-3 py-2 text-sm bg-slate-50 text-slate-500" />
                <button className="px-3 py-2 border border-slate-300 rounded-md text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Change
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Language</label>
              <select className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594]">
                <option>English (UK)</option>
                <option>English (US)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-2">Display Mode</label>
              <div className="flex gap-4">
                {['Auto', 'Light', 'Dark'].map(m => (
                  <label key={m} className="flex items-center gap-2 cursor-pointer">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${displayMode === m ? 'border-[#2b4594]' : 'border-slate-300'}`}>
                      {displayMode === m && <div className="w-2 h-2 rounded-full bg-[#2b4594]" />}
                    </div>
                    <span className="text-sm text-slate-700">{m}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Right — 2FA */}
          <div className="lg:w-80 bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-800">Two-Factor Authentication (2FA)</h2>
            <p className="text-sm text-slate-500">
              2FA can help protect your account by requiring a security code when signing into the user portal
            </p>
            <div className="flex items-center gap-6">
              {['On','Off'].map(opt => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${(opt==='On'&&twoFA)||(opt==='Off'&&!twoFA) ? 'border-[#2b4594]' : 'border-slate-300'}`}>
                    {((opt==='On'&&twoFA)||(opt==='Off'&&!twoFA)) && <div className="w-2 h-2 rounded-full bg-[#2b4594]" />}
                  </div>
                  <span className="text-sm text-slate-700">{opt}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Change password */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 max-w-md">
          <h2 className="text-base font-bold text-slate-800 mb-5">Change password</h2>
          <form onSubmit={handleChangePwd} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Current password</label>
              <input type="password" value={curPwd} onChange={e => setCurPwd(e.target.value)} required
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594] focus:ring-1 focus:ring-[#2b4594]" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">New password</label>
              <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} required
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#2b4594] focus:ring-1 focus:ring-[#2b4594]" />
            </div>
            <div className="bg-slate-50 rounded-md p-3 text-sm text-slate-600 space-y-1">
              <p className="font-semibold">Your password must have</p>
              <ul className="list-disc pl-4 space-y-0.5 text-slate-500">
                <li>8 or more characters</li>
                <li>at least one number and special character</li>
                <li>a mix of uppercase and lowercase letters</li>
              </ul>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-md p-3 text-sm text-slate-600">
              <p className="font-semibold text-slate-700 mb-1">ⓘ Changing your password</p>
              Changing your password will log you out — you will be required to log back in to continue.
            </div>
            {pwdErr && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{pwdErr}</p>}
            {pwdMsg && <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-md">{pwdMsg}</p>}
            <div className="flex justify-end">
              <button type="submit" disabled={saving}
                className="px-4 py-2 border border-slate-300 rounded-md text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                {saving ? 'Saving…' : 'Change password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
