import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from './api';
import { IconShieldCheck, IconLock, IconArrowLeft, IconEye, IconEyeOff } from '@tabler/icons-react';

export default function VerifyReset() {
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Get email from the URL (?email=...)
  const email = new URLSearchParams(location.search).get('email');

  const handleVerify = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    // 1. Ensure the path matches your router (/auth/reset-password)
    // 2. Ensure you pass 'token: otp'
    await api.post('/auth/reset-password', { 
      email, 
      token: otp, 
      newPassword 
    });
    
    alert("Password reset successful!");
    navigate('/login');
  } catch (err) {
    alert(err.response?.data?.error || "Error updating password.");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-blue-50/50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl p-10 border border-blue-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 to-blue-800"></div>

        <button onClick={() => navigate(-1)} className="mb-6 text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
          <IconArrowLeft size={16} /> Back
        </button>

        <div className="text-center mb-8">
          <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Verify Identity</h3>
          <p className="text-slate-400 text-[11px] mt-2 italic px-6">
            Enter the 6-digit code sent to <span className="text-blue-600 font-bold">{email}</span> and set your new password.
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-5">
          {/* OTP Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase ml-2 tracking-widest">Verification Code</label>
            <input
              type="text"
              required
              maxLength="6"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full text-center text-2xl tracking-[0.5em] font-black py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all text-slate-700"
            />
          </div>

          {/* New Password Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase ml-2 tracking-widest">New Password</label>
            <div className="relative group">
              <IconLock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all text-slate-700 font-medium"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-600">
                {showPassword ? <IconEyeOff size={20} /> : <IconEye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 rounded-2xl transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-3"
          >
            {loading ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div> : "RESET PASSWORD"}
          </button>
        </form>
      </div>
    </div>
  );
}