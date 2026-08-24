import React, { useState } from 'react';
import api from './api'; // Your axios instance
import RegisterPassField from './RegisterPassField'; // Your custom password field

export default function ForcePasswordChange({ onComplete }) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Calls your userManagementController.js changePassword endpoint
            await api.put('/user-management/change-password', {
                currentPassword,
                newPassword
            });

            // 1. Update localStorage so the app knows the password is changed
            const orgInfo = JSON.parse(localStorage.getItem('orgInfo') || '{}');
            orgInfo.isPasswordChanged = true;
            localStorage.setItem('orgInfo', JSON.stringify(orgInfo));

            // 2. Tell the parent dashboard to unlock
            onComplete();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#FFFCFB]">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
                <h2 className="text-2xl font-black text-slate-800 uppercase text-center mb-2">
                    Action Required
                </h2>
                <p className="text-sm text-slate-500 text-center mb-6">
                    For your security, you must change your temporary password before accessing the dashboard.
                </p>

                {error && (
                    <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-xs font-bold text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 uppercase">Current / Temp Password</label>
                        <input
                            type="password"
                            required
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-black outline-none focus:border-[#093FB4] focus:bg-white transition-all text-sm"
                            placeholder="Enter current password"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 uppercase">New Password</label>
                        {/* Using your provided RegisterPassField file */}
                        <RegisterPassField
                            name="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            showStrength={true} 
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#093fb4] hover:bg-[#073496] text-white font-black py-4 rounded-2xl transition-all uppercase tracking-wider text-sm mt-4 disabled:opacity-50"
                    >
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}