import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { IconEye, IconEyeOff, IconAlertTriangle, IconShieldCheck, IconArrowLeft } from '@tabler/icons-react';
import NET from "vanta/src/vanta.net";
import * as THREE from "three";
import api from './api';

export default function StudentLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(null);
  
  // 2FA STATES
  const [step, setStep] = useState('login'); // 'login' or 'otp'
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpData, setOtpData] = useState(null); // stores { studentId, method }

  const navigate = useNavigate();
  const vantaRef = useRef(null);
  const [vantaEffect, setVantaEffect] = useState(null);

  useEffect(() => {
    if (!vantaEffect && vantaRef.current) {
      const effect = NET({
        el: vantaRef.current,
        THREE: THREE,
        mouseControls: true, touchControls: true,
        minHeight: 200.00, minWidth: 200.00,
        scale: 1.00, scaleMobile: 1.00,
        color: 0x3b82f6, backgroundColor: 0x0f172a,
        points: 12.00, maxDistance: 20.00, spacing: 16.00
      });
      setVantaEffect(effect);
    }
    return () => { if (vantaEffect) vantaEffect.destroy(); };
  }, [vantaEffect]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/students/login', { email, password });
      
      // Check if 2FA is needed
      if (res.data.status === 'OTP_REQUIRED') {
        setOtpData(res.data);
        setStep('otp');
      } else {
        // Normal Login
        const sID = res.data.student?.id;
        localStorage.setItem('studentId', sID);
        localStorage.setItem('token', res.data.token);
        navigate(res.data.student.is_profile_complete ? '/scholarships' : '/setup-profile');
      }
    } catch (err) {
      const data = err.response?.data;
      setAttemptsLeft(data?.attemptsLeft);
      setError(data?.error || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');
  const fullOtp = otp.join('');
  
  if (fullOtp.length < 6) {
    setError('Please enter the full 6-digit code.');
    return;
  }
  
  setLoading(true);
  try {
    // UPDATED PATH: Make sure it matches the route we just made
    const res = await api.post('/security/verify-otp', { 
      studentId: otpData.studentId, 
      code: fullOtp 
    });
    
    localStorage.setItem('studentId', res.data.student.id);
    localStorage.setItem('token', res.data.token);
    navigate('/scholarships');
  } catch (err) {
    setError(err.response?.data?.error || 'Invalid or expired code.');
  } finally {
    setLoading(false);
  }
};

  const handleOtpChange = (value, index) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  return (
    <div ref={vantaRef} className="min-h-screen flex items-center justify-center p-4 font-sans">
      <div className="bg-white/10 backdrop-blur-2xl w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 relative z-10">
        
        <button onClick={() => navigate('/')} className="absolute top-6 right-8 text-white/40 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full z-20">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="h-1.5 w-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />

        <div className="p-10 space-y-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-500/30">
              <span className="text-white font-black text-3xl italic">K</span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter italic">Kyus<span className="text-blue-500">ISKO</span></h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">
              {step === 'login' ? 'Student Portal Access' : 'Security Verification'}
            </p>
          </div>

          {step === 'login' ? (
            /* LOGIN FORM */
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest ml-1">Email Address</label>
                <input
                  type="email" required placeholder="Enter your email"
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-blue-500 outline-none text-white font-medium"
                />
              </div>

              <div className="space-y-1.5 relative">
                <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest ml-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required placeholder="••••••••"
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-blue-500 outline-none text-white font-medium"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <IconEyeOff size={20}/> : <IconEye size={20}/>}
                  </button>
                </div>
              </div>

              {error && (
                <div className={`p-4 rounded-2xl border flex items-center gap-3 bg-red-500/10 border-red-500/20`}>
                  <IconAlertTriangle size={20} className="text-red-400 shrink-0" />
                  <p className="text-xs font-bold text-red-400 leading-tight">{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl transition-all shadow-xl disabled:opacity-50 uppercase tracking-widest"
              >
                {loading ? <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'Sign In'}
              </button>
            </form>
          ) : (
            /* OTP FORM */
            <form onSubmit={handleVerifyOTP} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center space-y-2">
                <p className="text-slate-300 text-xs font-medium italic">
                  Enter the 6-digit code sent to your <span className="text-blue-400 font-black">{otpData.method}</span>
                </p>
              </div>

              <div className="flex justify-between gap-2">
                {otp.map((digit, idx) => (
                  <input
                    key={idx} id={`otp-${idx}`}
                    type="text" maxLength="1"
                    className="w-12 h-14 text-center text-xl font-black bg-white/5 border border-white/10 rounded-xl focus:border-blue-500 outline-none text-white transition-all"
                    value={digit}
                    onChange={e => handleOtpChange(e.target.value, idx)}
                    onKeyDown={e => e.key === 'Backspace' && !otp[idx] && idx > 0 && document.getElementById(`otp-${idx-1}`).focus()}
                  />
                ))}
              </div>

              {error && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                  <IconAlertTriangle size={18} className="text-red-400" />
                  <p className="text-[10px] font-black text-red-400 uppercase tracking-wider">{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl transition-all shadow-xl disabled:opacity-50 uppercase tracking-widest flex items-center justify-center gap-2"
              >
                {loading ? <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : (
                  <> <IconShieldCheck size={20}/> Verify & Unlock </>
                )}
              </button>

              <button type="button" onClick={() => setStep('login')}
                className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
              >
                <IconArrowLeft size={14}/> Back to Login
              </button>
            </form>
          )}

          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">
            <Link to="/student-register" className="hover:text-blue-400 transition-colors">Create Account</Link>
            <Link to="/forgot-password" className="hover:text-blue-400 transition-colors">Forgot Password?</Link>
          </div>
        </div>
      </div>
    </div>
  );
}