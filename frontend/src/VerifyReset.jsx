import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from './api';
import { 
  IconLock, 
  IconArrowLeft, 
  IconEye, 
  IconEyeOff, 
  IconAlertTriangle, 
  IconX,
  IconClock,
  IconCircleCheck
} from '@tabler/icons-react';

export default function VerifyReset() {
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Resend Timer States
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  // Get email from URL params
  const email = new URLSearchParams(location.search).get('email');

  // Countdown timer effect
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Resend Code logic
  const handleResendCode = async () => {
    if (!canResend || resendLoading) return;
    setResendLoading(true);
    setResendSuccess('');
    setError('');
    
    try {
      await api.post('/auth/forgot-password', { email });
      setResendSuccess('A new code has been sent to your email.');
      setTimer(60);
      setCanResend(false);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to resend code.");
    } finally {
      setResendLoading(false);
    }
  };

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
      
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || "Error updating password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-6 bg-[#FFFCFB] bg-no-repeat relative overflow-hidden font-sans"
      style={{ 
        backgroundImage: `url('/bg2.png')`,
        backgroundSize: '100% 100%',
        backgroundPosition: 'center'
      }}
    >
      <div className="bg-white/90 backdrop-blur-xl w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden border border-white/60 relative z-10 animate-in fade-in zoom-in duration-300">
        
        <button 
          onClick={() => navigate('/login')} 
          className="absolute top-5 right-5 text-slate-400 hover:text-[#FF1E1E] transition-colors p-2 z-20"
        >
          <IconX size={24} />
        </button>

        <div className="h-2 w-full bg-[#093fb4]" />

        <div className="p-8 md:p-10 space-y-6">
          <div className="text-center">
            <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mb-1">
              Final Step
            </p>
            <h2 className="text-2xl md:text-3xl font-black text-slate-800 uppercase tracking-tight italic">
              Password Reset
            </h2>
            <p className="text-slate-600 text-xs md:text-sm font-semibold leading-normal mt-2 px-2">
              Enter the 6-digit code that sent  <br />
              
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-5">
            {/* OTP Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-xs font-black text-[#093FB4] uppercase tracking-wider block">
                  Verification Code
                </label>
                {/* OTP Timer Display */}
                <span className="text-xs font-black text-slate-500 flex items-center gap-1">
                  <IconClock size={14} className="text-[#093FB4]" />
                  {timer > 0 ? `${timer}s` : 'Expired'}
                </span>
              </div>
              <input
                type="text"
                required
                maxLength="6"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="w-full text-center text-2xl tracking-[0.5em] font-black py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#093FB4] focus:bg-white outline-none transition-all text-slate-900 shadow-sm"
              />
            </div>

            {/* Resend Code Button & Timer */}
            <div className="text-right">
              <button
                type="button"
                disabled={!canResend || resendLoading}
                onClick={handleResendCode}
                className="text-xs font-black uppercase tracking-wider transition-colors text-[#093FB4] hover:text-[#073496] disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                {resendLoading ? "Resending..." : canResend ? "Resend Code" : `Resend in ${timer}s`}
              </button>
            </div>

            {/* New Password Input */}
            <div className="space-y-2">
              <label className="text-xs font-black text-[#093FB4] uppercase tracking-wider ml-1 block">
                New Password
              </label>
              <div className="relative group">
                <IconLock size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#093FB4] transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#093FB4] focus:bg-white outline-none text-base text-slate-900 font-bold transition-all shadow-sm"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#093FB4] transition-colors"
                >
                  {showPassword ? <IconEyeOff size={22} /> : <IconEye size={22} />}
                </button>
              </div>
            </div>

            {resendSuccess && (
              <div className="p-3.5 rounded-xl border flex items-center gap-2.5 bg-emerald-50 border-emerald-200 text-emerald-700">
                <IconCircleCheck size={20} className="shrink-0 text-emerald-600" />
                <p className="text-xs font-black uppercase">{resendSuccess}</p>
              </div>
            )}

            {error && (
              <div className="p-3.5 rounded-xl border flex items-center gap-2.5 bg-red-50 border-red-200">
                <IconAlertTriangle size={20} className="text-[#FF1E1E] shrink-0" />
                <p className="text-xs font-black text-[#FF1E1E] uppercase leading-tight">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#093fb4] hover:bg-[#073496] text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-blue-900/15 disabled:opacity-50 uppercase text-sm tracking-widest"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>

          <button 
            onClick={() => navigate(-1)}
            className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-slate-800 font-black text-xs uppercase tracking-wider transition-colors pt-2"
          >
            <IconArrowLeft size={16} /> Change Email
          </button>
        </div>
      </div>
    </div>
  );
}