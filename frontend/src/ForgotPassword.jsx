import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';
import { IconMail, IconArrowLeft, IconShieldCheck, IconLogin, IconX } from '@tabler/icons-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Hit the backend
      await api.post('/auth/forgot-password', { email });
      
      // 2. SUCCESS: Navigate immediately to the verification page
      // We pass the email in the URL so the next page knows who it's for
      navigate(`/verify-reset?email=${encodeURIComponent(email)}`);
      
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to send code. Please try again.";
      alert(errorMsg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50/50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl shadow-blue-200/50 p-10 border border-blue-100 relative overflow-hidden">
        
        {/* Back/Close Button */}
        <button 
          onClick={() => navigate(-1)} 
          className="absolute top-6 right-6 text-slate-300 hover:text-red-500 transition-colors p-1"
        >
          <IconX size={24} stroke={2.5} />
        </button>

        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 via-blue-600 to-blue-800"></div>

        <div className="text-center mb-10 mt-6">
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter italic uppercase">
            Kyus<span className="text-blue-600">ISKO</span>
          </h2>
          <div className="mt-4 space-y-1">
            <h3 className="text-lg font-bold text-slate-700 uppercase tracking-tight">Reset Password</h3>
            <p className="text-slate-400 text-[11px] leading-relaxed px-4 italic">
              Enter your verified student or admin email account and a 6-digit code will be sent to you.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase ml-2 tracking-widest">
              Account Email
            </label>
            <div className="relative group">
              <IconMail size={22} stroke={1.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="email"
                required
                placeholder="student or admin@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 font-medium text-slate-700"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-200 active:scale-[0.98] disabled:bg-blue-200"
          >
            {loading ? (
              <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              "SEND VERIFICATION CODE"
            )}
          </button>
        </form>

        <div className="mt-10 border-t border-slate-100 pt-8 text-center">
          <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-4">Already remember?</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => navigate('/login')} className="text-xs font-black text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-2">
              <IconLogin size={16} /> SIGN IN AS ADMIN
            </button>
            <span className="hidden sm:block text-slate-200">|</span>
            <button onClick={() => navigate('/student-login')} className="text-xs font-black text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-2">
               STUDENT SIGN IN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}