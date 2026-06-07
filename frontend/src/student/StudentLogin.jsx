import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { IconEye, IconEyeOff, IconAlertTriangle, IconShieldCheck, IconArrowLeft, IconX } from '@tabler/icons-react';
import api from '../api';

export default function StudentLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [step, setStep] = useState('login'); 
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpData, setOtpData] = useState(null);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/students/login', { email, password });
      
      if (res.data.status === 'OTP_REQUIRED') {
        setOtpData(res.data);
        setStep('otp');
      } else {
        localStorage.setItem('studentId', res.data.student?.id);
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userRole', 'student');
        navigate(res.data.student.is_profile_complete ? '/scholarships' : '/student-onboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value, index) => {
    if (!/^[0-9]$/.test(value) && value !== "") return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length < 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }
    
    setLoading(true);
    try {
      const res = await api.post('/security/verify-otp', { 
        email: otpData.email,
        code: fullOtp 
      });
      
      localStorage.setItem('studentId', res.data.student.id);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userRole', 'student');
      navigate(res.data.student.is_profile_complete ? '/scholarships' : '/student-onboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#FFFCFB] font-['Inter'] relative overflow-hidden">
      
      {/* FULL COLOR BACKGROUND */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#093FB4]/5 mix-blend-multiply"></div>
        <img src="/bg2.png" alt="Background" className="w-full h-full object-cover opacity-90" />
      </div>

      <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#093FB4]/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* LOGIN CARD */}
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 relative z-10">
        
        <button 
          onClick={() => navigate('/')} 
          className="absolute top-6 right-8 text-gray-300 hover:text-[#FF1E1E] transition-all p-2 rounded-full z-20"
        >
          <IconX size={20} strokeWidth={3} />
        </button>

        <div className="h-2 w-full bg-[#093fb4]" />

        <div className="p-10 space-y-8">
          <div className="text-center space-y-4">
            <img src="/logo.png" alt="Logo" className="h-16 w-auto mx-auto" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#093FB4]">
              {step === 'login' ? 'Student login  ' : 'Security Check'}
            </h2>
          </div>

          {step === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-black uppercase tracking-widest ml-1">Email Address</label>
                <input
                  type="email" required placeholder="Email Address"
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:border-[#093FB4] focus:bg-white outline-none text-black font-bold  transition-all"
                />
              </div>

              <div className="space-y-2 relative">
                <label className="text-[9px] font-black text-black uppercase tracking-widest ml-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required placeholder="••••••••"
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:border-[#093FB4] focus:bg-white outline-none text-black font-bold transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40 hover:text-[#093FB4]"
                  >
                    {showPassword ? <IconEyeOff size={18}/> : <IconEye size={18}/>}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-2xl border flex items-center gap-3 bg-red-50 border-red-100">
                  <IconAlertTriangle size={18} className="text-[#FF1E1E] shrink-0" />
                  <p className="text-[9px] font-black text-[#FF1E1E] uppercase leading-tight">{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-[#093FB4] hover:bg-[#073496] text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-blue-900/20 disabled:opacity-50 uppercase tracking-[0.2em] text-[10px]"
              >
                {loading ? <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="text-center">
                <p className="text-black text-[10px] font-black uppercase tracking-tight">
                  Code sent to <span className="text-[#093FB4]">{otpData?.method}</span>
                </p>
              </div>

              <div className="flex justify-between gap-1.5">
                {otp.map((digit, idx) => (
                  <input
                    key={idx} id={`otp-${idx}`}
                    type="text" maxLength="1"
                    className="w-full h-12 text-center text-lg font-black bg-gray-50 border border-gray-100 rounded-xl focus:border-[#093FB4] focus:bg-white outline-none text-black transition-all"
                    value={digit}
                    onChange={e => handleOtpChange(e.target.value, idx)}
                    onKeyDown={e => e.key === 'Backspace' && !otp[idx] && idx > 0 && document.getElementById(`otp-${idx-1}`).focus()}
                  />
                ))}
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-[#FF1E1E] hover:bg-red-700 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-red-900/20 disabled:opacity-50 uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2"
              >
                {loading ? <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : (
                  <> <IconShieldCheck size={18}/> Verify Code </>
                )}
              </button>

              <button type="button" onClick={() => setStep('login')}
                className="w-full flex items-center justify-center gap-2 text-black/40 hover:text-black transition-colors text-[9px] font-black uppercase tracking-widest"
              >
                <IconArrowLeft size={12}/> Back to Login
              </button>
            </form>
          )}

          <div className="flex items-center justify-between text-[11px] font-black text-black/80 uppercase tracking-widest px-2 pt-6 border-t border-gray-50">
            <Link to="/student-register" className="hover:text-[#093FB4] transition-colors">Sign Up</Link>
            <Link to="/forgot-password" className="hover:text-[#093FB4] transition-colors">Forgot Password?</Link>
          </div>
        </div>
      </div>
    </div>
  );
}