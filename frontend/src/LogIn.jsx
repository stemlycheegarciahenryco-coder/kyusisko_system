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
  const [attempts, setAttempts] = useState(null);
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
    try {
      // 🚀 Single unified endpoint for all 3 portals
      const response = await api.post('/auth/portal-login', { 
        identifier: identifier.trim(), 
        password 
      });
      
      const { token, role, data } = response.data; 

      localStorage.setItem('token', token);
      localStorage.setItem('userRole', role); 
      
      // 🚀 Dynamic RBAC Client-Side Routing
      if (role === 'root_admin' || role === 'co_admin') {
        localStorage.setItem('systemUid', data.uid);
        localStorage.setItem('adminEmail', data.email);
        navigate('/RootDashboard');
      } else if (role === 'sub_admin') {
        localStorage.setItem('orgId', data.id); 
        localStorage.setItem('adminEmail', data.email);
        navigate('/OrgDashboard');
      } else if (role === 'student') {
        localStorage.setItem('studentId', data.id);
        localStorage.setItem('studentInfo', JSON.stringify(data));
        navigate('/scholarships'); // Redirect to your student view
      }
    } catch (err) {
      const errorData = err.response?.data;
      alert(errorData?.error || "Login failed");
      setAttempts(errorData?.blocked ? 0 : errorData?.attempts);
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

      <div className="max-w-sm w-full bg-white rounded-[2rem] shadow-2xl p-8 border border-black/5 relative z-10">
        <button 
          onClick={() => navigate('/')} 
          className="absolute top-6 right-6 text-black/20 hover:text-[#FF1E1E] transition-colors p-1"
        >
          <IconX size={20} stroke={3} />
        </button>

        {verifiedStatus && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-2">
            <IconCircleCheckFilled className="text-emerald-500" size={20} />
            <p className="text-[10px] font-black text-emerald-900 uppercase">Verified! Please log in.</p>
          </div>
        )}

        <div className="text-center mb-8 mt-2">
          <div className="inline-flex items-center justify-center mb-4">
            <img src="/logo.png" alt="Logo" className="h-18 w-auto" />
          </div>
          <p className="mt-2 text-[14px] font-black text-black-300 uppercase tracking-[0.3em]">
            Portal Login 
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-black uppercase ml-1 tracking-widest">
              Email Address / System ID
            </label>
            <div className="relative group">
              <IconMail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within:text-[#093fb4] transition-colors" />
              <input 
                type="text" 
                required
                placeholder="Enter your credentials"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-black/5 border-2 border-transparent rounded-xl focus:bg-white focus:border-[#093fb4] outline-none transition-all placeholder:text-black/20 font-bold text-black text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-black uppercase ml-1 tracking-widest">
              Password
            </label>
            <div className="relative group">
              <IconKey size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within:text-[#093fb4] transition-colors" />
              <input 
                type={showPassword ? "text" : "password"} 
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-11 py-3 bg-black/5 border-2 border-transparent rounded-xl focus:bg-white focus:border-[#093fb4] outline-none transition-all placeholder:text-black/20 font-bold text-black text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-black/20 hover:text-[#093fb4] transition-colors"
              >
                {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
              </button>
            </div>
          </div>

          {attempts !== null && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#FF1E1E]/5 border border-[#FF1E1E]/10 text-[#FF1E1E]">
              <IconAlertCircle size={18} stroke={3} />
              <p className="text-[10px] font-black uppercase">
                {attempts === 0 ? "Blocked" : `${attempts} Attempts left`}
              </p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#093fb4] hover:bg-[#073496] text-[#FFFCFB] font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 group shadow-lg shadow-[#093fb4]/20 active:scale-[0.98] disabled:bg-black/10 text-xs"
          >
            {loading ? (
              <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                LOG IN
                <IconLogin size={18} stroke={2.5} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 flex justify-center border-t border-black/5 pt-6">
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="text-[10px] font-black text-black/40 uppercase hover:text-[#FF1E1E] transition-colors tracking-widest"
            >
              Forgot Password?
            </button>
        </div>
      </div>
    </div>
  );
}