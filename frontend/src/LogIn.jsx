import api from './api';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { 
  IconMail, 
  IconKey, 
  IconAlertCircle, 
  IconLogin,
  IconEye,
  IconEyeOff,
  IconX,
  IconCircleCheckFilled
} from '@tabler/icons-react';

export default function LogIn() {
  const [identifier, setIdentifier] = useState(''); 
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(''); // Replaces attempts state
  const [verifiedStatus, setVerifiedStatus] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isVerified = params.get('verified');
    if (isVerified === 'true') {
      setVerifiedStatus(true);
      navigate('/login', { replace: true });
    }
  }, [location, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await api.post('/auth/portal-login', { 
        identifier: identifier.trim(), 
        password 
      });
      
      // We no longer extract or save 'token' here!
      const { role, data } = response.data; 

      if (role === 'root_admin' || role === 'co_admin') {
        localStorage.setItem('userRole', role);
        navigate('/RootDashboard');

      } else if (role === 'sub_admin') {
        localStorage.setItem('userRole', role);
        localStorage.setItem('orgInfo', JSON.stringify({
          isPasswordChanged: data.isPasswordChanged,
          accountType: data.accountType,
          parentOrgId: data.parentOrgId
        }));
        
        navigate('/OrgDashboard');

      } else if (role === 'student') {
        localStorage.setItem('userRole', role);
       
        if (!data.isProfileComplete) {
          navigate('/student-onboard');
        } else {
          navigate('/scholarships');
        }
      }
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.error === "Invalid Credentials") {
        setErrorMessage("Invalid or Unknown Credentials");
      } else {
        setErrorMessage(errorData?.error || "Invalid or Unknown Credentials");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden bg-[#FFFCFB]">
      <div 
        className="absolute inset-0 bg-no-repeat bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: `url('/bg2.png')` }}
      />

      <div className="max-w-md w-full bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-10 border border-white/40 relative z-10">
        <button 
          onClick={() => navigate('/')} 
          className="absolute top-7 right-7 text-black/30 hover:text-[#FF1E1E] transition-colors p-1"
        >
          <IconX size={24} stroke={2.5} />
        </button>

        {verifiedStatus && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50/80 backdrop-blur-sm border border-emerald-200/60 flex items-center gap-3">
            <IconCircleCheckFilled className="text-emerald-600 shrink-0" size={24} />
            <p className="text-xs font-black text-emerald-950 uppercase tracking-wide">Verified! Please log in.</p>
          </div>
        )}

        <div className="text-center mb-8 mt-2">
          <div className="inline-flex items-center justify-center mb-4">
            <img src="/logo.png" alt="Logo" className="h-24 w-auto object-contain" />
          </div>
          <p className="mt-2 text-sm font-black text-slate-700 uppercase tracking-[0.3em]">
            Portal Login 
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-800 uppercase ml-1 tracking-wider block">
              Email Address / Username
            </label>
            <div className="relative group">
              <IconMail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 group-focus-within:text-[#093fb4] transition-colors" />
              <input 
                type="text" 
                required
                placeholder="Enter your credentials"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white/60 border-2 border-white/80 rounded-2xl focus:bg-white focus:border-[#093fb4] outline-none transition-all placeholder:text-black/30 font-bold text-slate-900 text-base shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-800 uppercase ml-1 tracking-wider block">
              Password
            </label>
            <div className="relative group">
              <IconKey size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 group-focus-within:text-[#093fb4] transition-colors" />
              <input 
                type={showPassword ? "text" : "password"} 
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-3.5 bg-white/60 border-2 border-white/80 rounded-2xl focus:bg-white focus:border-[#093fb4] outline-none transition-all placeholder:text-black/30 font-bold text-slate-900 text-base shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-black/30 hover:text-[#093fb4] transition-colors"
              >
                {showPassword ? <IconEyeOff size={20} /> : <IconEye size={20} />}
              </button>
            </div>
          </div>

          {/* Alert Banner for Invalid Credentials or Lockout Error */}
          {errorMessage && (
            <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-[#FF1E1E]/10 border border-[#FF1E1E]/20 text-[#FF1E1E] backdrop-blur-sm">
              <IconAlertCircle size={20} stroke={2.5} className="shrink-0" />
              <p className="text-xs font-black uppercase tracking-wide">
                {errorMessage}
              </p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#093fb4] hover:bg-[#073496] text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2.5 group shadow-xl shadow-[#093fb4]/25 active:scale-[0.98] disabled:bg-black/10 text-sm tracking-wider uppercase"
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                LOG IN
                <IconLogin size={20} stroke={2.5} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 flex justify-center border-t border-black/10 pt-6">
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="text-xs font-black text-slate-600 hover:text-[#FF1E1E] transition-colors tracking-widest uppercase"
            >
              Forgot Password?
            </button>
        </div>
      </div>
    </div>
  );
}