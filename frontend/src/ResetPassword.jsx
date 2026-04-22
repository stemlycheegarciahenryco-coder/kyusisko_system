import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from './api';
import { IconKey, IconShieldCheck } from '@tabler/icons-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm]         = useState('');
  const [loading, setLoading]         = useState(false);
  const [done, setDone]               = useState(false);
  const [error, setError]             = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirm) return setError("Passwords do not match.");
    if (newPassword.length < 8) return setError("Password must be at least 8 characters.");

    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { email, token, newPassword });
      setDone(true);
      setTimeout(() => navigate('/rootlogin'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Invalid or expired link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50/50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl shadow-blue-200/50 p-10 border border-blue-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 via-blue-600 to-blue-800"></div>

        {done ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-50 text-blue-600 mb-6 border border-blue-100">
              <IconShieldCheck size={40} stroke={1.5} />
            </div>
            <h3 className="text-2xl font-black text-slate-800">Password Reset!</h3>
            <p className="text-slate-400 text-sm mt-3">Redirecting you to login...</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-10 mt-6">
              <h2 className="text-4xl font-black text-slate-800 tracking-tighter italic">
                Kyus<span className="text-blue-600">ISKO</span>
              </h2>
              <p className="text-slate-400 text-sm mt-3 font-medium">Set your new password.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {['New Password', 'Confirm Password'].map((label, i) => (
                <div key={i} className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase ml-2 tracking-widest">{label}</label>
                  <div className="relative group">
                    <IconKey size={22} stroke={1.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      onChange={(e) => i === 0 ? setNewPassword(e.target.value) : setConfirm(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 font-medium text-slate-700"
                    />
                  </div>
                </div>
              ))}

              {error && (
                <p className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3">
                  ⚠️ {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-200 active:scale-[0.98] disabled:bg-blue-200 disabled:shadow-none"
              >
                {loading
                  ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                  : "RESET PASSWORD"
                }
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}