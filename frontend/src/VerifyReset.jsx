import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from './api';
import { IconShieldCheck, IconLock, IconArrowLeft, IconEye, IconEyeOff, IconAlertTriangle, IconX } from '@tabler/icons-react';

export default function VerifyReset() {
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();

  // Get email from the URL (?email=...)
  const email = new URLSearchParams(location.search).get('email');

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { 
        email, 
        token: otp, 
        newPassword 
      });
      
      // Navigate to success or login
      navigate('/student-login');
    } catch (err) {
      setError(err.response?.data?.error || "Error updating password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-4 bg-[#FFFCFB] bg-no-repeat relative overflow-hidden font-sans"
      style={{ 
        backgroundImage: `url('/bg2.png')`,
        backgroundSize: '100% 100%',
        backgroundPosition: 'center'
      }}
    >
      {/* Slimmer Rectangular Card */}
      <div className="bg-white w-full max-w-[380px] rounded-[1.5rem] shadow-2xl overflow-hidden border border-slate-100 relative z-10 animate-in fade-in zoom-in duration-300">
        
        <button 
          onClick={() => navigate('/student-login')} 
          className="absolute top-4 right-4 text-slate-300 hover:text-[#FF1E1E] transition-colors p-2 z-20"
        >
          <IconX size={20} />
        </button>

        <div className="h-1.5 w-full bg-[#093fb4]" />

        <div className="p-8 space-y-6">
          <div className="text-center">
          
            <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] mb-1">
              Final Step
            </p>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight italic">
              Verify <span className="text-[#093fb4]">& Reset</span>
            </h2>
            <p className="text-slate-500 text-[10px] font-medium leading-tight mt-2 px-4">
              Enter the code sent to <span className="text-[#093fb4] font-bold">{email}</span>
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            {/* OTP Input */}
            <div className="space-y-1">
              <label className="text-[9px] font-black text-[#093FB4] uppercase tracking-widest ml-1">Verification Code</label>
              <input
                type="text"
                required
                maxLength="6"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="w-full text-center text-xl tracking-[0.5em] font-black py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-[#093FB4] focus:bg-white outline-none transition-all text-slate-900"
              />
            </div>

            {/* New Password Input */}
            <div className="space-y-1">
              <label className="text-[9px] font-black text-[#093FB4] uppercase tracking-widest ml-1">New Password</label>
              <div className="relative group">
                <IconLock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#093FB4] transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-[#093FB4] focus:bg-white outline-none text-sm text-slate-900 font-bold transition-all"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#093FB4]"
                >
                  {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl border flex items-center gap-2 bg-red-50 border-red-100">
                <IconAlertTriangle size={16} className="text-[#FF1E1E] shrink-0" />
                <p className="text-[9px] font-black text-[#FF1E1E] uppercase leading-tight">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#093fb4] hover:bg-[#073496] text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-blue-900/10 disabled:opacity-50 uppercase text-xs tracking-widest"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>

          <button 
            onClick={() => navigate(-1)}
            className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-slate-600 font-black text-[9px] uppercase tracking-widest transition-colors"
          >
            <IconArrowLeft size={14} /> Change Email
          </button>
        </div>
      </div>
    </div>
  );
}