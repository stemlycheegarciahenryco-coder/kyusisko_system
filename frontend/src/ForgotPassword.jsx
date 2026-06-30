import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';
import { IconMail, IconX, IconAlertTriangle, IconUserExclamation } from '@tabler/icons-react';

// NEW: Dialog shown when the entered email isn't found in the system,
// instead of a plain inline error message.
function NotRegisteredModal({ isOpen, email, onClose, onTryAgain }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#093fb4]/20 backdrop-blur-md font-sans">
      <div className="w-full max-w-sm bg-white rounded-[2rem] p-8 text-center shadow-2xl border border-slate-100/50">
        <div className="w-16 h-16 bg-red-50 text-[#FF1E1E] rounded-2xl flex items-center justify-center mx-auto mb-5">
          <IconUserExclamation size={32} stroke={2} />
        </div>
        <h2 className="text-lg font-black text-slate-900 mb-2 uppercase tracking-tight">Email Not Found</h2>
        <p className="text-slate-500 text-xs font-bold leading-relaxed mb-6">
          We couldn't find an account registered with <span className="text-slate-800">{email}</span>. Please check the email address and try again.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
          >
            Close
          </button>
          <button
            onClick={onTryAgain}
            className="flex-1 py-3 bg-[#093fb4] hover:bg-blue-800 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNotRegistered, setShowNotRegistered] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      navigate(`/verify-reset?email=${encodeURIComponent(email)}`);
    } catch (err) {
      // NEW: A 404 specifically means the email isn't registered — show the
      // dialog instead of (or in addition to) the inline error message.
      if (err.response?.status === 404) {
        setShowNotRegistered(true);
      } else {
        setError(err.response?.data?.error || "Failed to send code.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-4 bg-[#FFFCFB] bg-no-repeat relative overflow-hidden font-sans"
      style={{ 
        backgroundImage: `url('/bg2.png')`,
        backgroundSize: '100% 100%', // This stretches the BG to fit exactly
        backgroundPosition: 'center'
      }}
    >
      {/* Slimmer Rectangular Card */}
      <div className="bg-white w-full max-w-[380px] rounded-[1.5rem] shadow-2xl overflow-hidden border border-slate-100 relative z-10">
        
        <button 
          onClick={() => navigate(-1)} 
          className="absolute top-4 right-4 text-slate-300 hover:text-[#FF1E1E] transition-colors p-2 z-20"
        >
          <IconX size={20} />
        </button>

        <div className="h-1.5 w-full bg-[#093fb4]" />

        <div className="p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight italic">
              Reset <span className="text-[#093fb4]">Password</span>
            </h2>
            <p className="text-black-500 text-[11px] font-bold leading-tight mt-4 px-5">
              Enter your email to receive a 6-digit recovery code.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-[#093FB4] uppercase tracking-widest ml-1">
                Student / Admin Email
              </label>
              <div className="relative group">
                <IconMail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#093FB4] transition-colors" />
                <input
                  type="email"
                  required
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-[#093FB4] focus:bg-white outline-none text-sm text-slate-900 font-bold transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl border flex items-center gap-2 bg-red-50 border-red-100">
                <IconAlertTriangle size={16} className="text-[#FF1E1E] shrink-0" />
                <p className="text-[9px] font-black text-[#FF1E1E] uppercase">{error}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#093FB4] hover:bg-[#073496] text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-blue-900/10 disabled:opacity-50 uppercase text-xs tracking-widest"
            >
              {loading ? "Sending..." : "Send Code"}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-50 flex flex-col gap-2">
            <div className="flex items-center justify-center gap-4">
              <button 
                onClick={() => navigate('/student-login')} 
                className="text-[9px] font-black text-slate-500 hover:text-[#093FB4] transition-colors uppercase"
              >
                Student Sign In
              </button>
              <span className="text-slate-200">|</span>
              <button 
                onClick={() => navigate('/rootlogin')} 
                className="text-[9px] font-black text-[#FF1E1E] hover:text-red-700 transition-colors uppercase"
              >
                Admin Sign In
              </button>
            </div>
          </div>
        </div>
      </div>

      <NotRegisteredModal
        isOpen={showNotRegistered}
        email={email}
        onClose={() => setShowNotRegistered(false)}
        onTryAgain={() => {
          setShowNotRegistered(false);
          setEmail('');
        }}
      />
    </div>
  );
}