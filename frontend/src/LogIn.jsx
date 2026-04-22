import api from './api';
import { useState, useEffect } from 'react';
import { useNavigate,useLocation } from 'react-router-dom';
import { 
  IconSchool, 
  IconMail, 
  IconKey, 
  IconAlertCircle, 
  IconLogin,
  IconShieldCheck,
  IconEye,
  IconEyeOff,
  IconX,
  IconCircleCheckFilled
} from '@tabler/icons-react';

export default function LogIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State for password toggle
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(null);
  const [verifiedStatus, setVerifiedStatus] = useState(false); // New state for reg subadmins verification
  const navigate = useNavigate();
  const location = useLocation();


useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const isVerified = params.get('verified');
  
  console.log("URL Params detected:", isVerified); // Check your browser console!

  if (isVerified === 'true') {
    setVerifiedStatus(true);
    navigate('/rootlogin', { replace: true }); // Remove query params after showing message
  }
}, [location]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/adminlogin', { email, password });
      
      const { token, role, sub_email,id } = response.data; 
      localStorage.setItem('token', token);
      localStorage.setItem('userRole', role);
      localStorage.setItem('orgId', id); 

      if (role === 'sub_admin' && !sub_email) {
        alert("Error: Organization identity not verified. Contact system admin.");
        return;
      }

      localStorage.setItem('adminEmail', sub_email);

      if (role === 'super_root') {
  navigate('/SuperRootConsole'); // Use the route name you defined for the new UI
} else if (role === 'root_admin') {
  navigate('/RootDashboard');
} else if (role === 'sub_admin') {
  navigate('/OrgDashboard');
}

    } catch (err) {
      const data = err.response?.data;
      alert(data?.error || "Login failed");
      setAttempts(data?.blocked ? 0 : data?.attempts);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50/50 flex items-center justify-center p-4 font-sans relative">
      
      <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl shadow-blue-200/50 p-10 border border-blue-100 relative overflow-hidden">
        
        {/* Close (X) Button */}
        <button 
          onClick={() => navigate('/')} 
          className="absolute top-6 right-6 text-slate-300 hover:text-red-500 transition-colors p-1"
        >
          <IconX size={24} stroke={2.5} />
        </button>
        {/* Verification Success Message */}
{verifiedStatus && (
  <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-3">
    <IconCircleCheckFilled className="text-emerald-500" size={28} />
    <div>
      <p className="text-sm font-bold text-emerald-900">Account Verified!</p>
      <p className="text-[10px] font-medium text-emerald-600 uppercase tracking-wider">
        You can now log in to your portal
      </p>
    </div>
    <button 
      onClick={() => setVerifiedStatus(false)}
      className="ml-auto text-emerald-400 hover:text-emerald-600"
    >
      <IconX size={16} />
    </button>
  </div>
)}
        {/* Top Accent Bar */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 via-blue-600 to-blue-800"></div>

        <div className="text-center mb-10 mt-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-50 text-blue-600 mb-6 border border-blue-100 shadow-sm">
            <IconSchool size={40} stroke={1.5} />
          </div>
          
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter italic">
            Kyus<span className="text-blue-600">ISKO</span>
          </h2>
          
          <div className="mt-4 flex justify-center items-center gap-2 px-6">
            <span className="h-[1px] w-full bg-blue-50"></span>
            <p className="whitespace-nowrap text-[10px] font-bold text-blue-400 uppercase tracking-[0.4em]">
              School & Org Portal
            </p>
            <span className="h-[1px] w-full bg-blue-50"></span>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase ml-2 tracking-widest">
              Organization Email
            </label>
            <div className="relative group">
              <IconMail size={22} stroke={1.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
              <input 
                type="email" 
                required
                placeholder="org@school.edu.ph"
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 font-medium text-slate-700"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase ml-2 tracking-widest">
              Password
            </label>
            <div className="relative group">
              <IconKey size={22} stroke={1.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
              <input 
                type={showPassword ? "text" : "password"} 
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 font-medium text-slate-700"
              />
              {/* Show/Hide Password Toggle */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-600 transition-colors"
              >
                {showPassword ? <IconEyeOff size={20} /> : <IconEye size={20} />}
              </button>
            </div>
          </div>

          {attempts !== null && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700">
              <IconAlertCircle size={22} stroke={2} />
              <p className="text-xs font-bold uppercase tracking-tight">
                {attempts === 0 ? "Access Blocked" : `${attempts} Attempts remaining`}
              </p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 rounded-2xl transition-all flex items-center justify-center gap-3 group shadow-lg shadow-blue-200 active:scale-[0.98] disabled:bg-blue-200 disabled:shadow-none"
          >
            {loading ? (
              <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                LOG IN TO PORTAL
                <IconLogin size={22} stroke={2} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-12 flex items-center justify-between border-t border-blue-50 pt-8">
            <span className="text-[10px] font-bold text-blue-500 uppercase flex items-center gap-1.5">
              <IconShieldCheck size={14} />
              Partner Access
            </span>
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="text-[11px] font-bold text-slate-400 uppercase hover:text-blue-600 transition-colors tracking-widest"
            >
              Account Recovery
            </button>
        </div>
      </div>
    </div>
  );
}