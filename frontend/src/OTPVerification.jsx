import React, { useState, useEffect, useRef } from 'react';
import { IconShieldCheck, IconArrowLeft, IconAlertTriangle, IconX, IconRefresh } from '@tabler/icons-react';
import api from './api';

// How long the "Resend Code" button stays disabled after a send.
const RESEND_COOLDOWN = 30; // seconds

export default function OTPVerification({ studentId, method, onVerified, onCancel }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN);
  const [resendMsg, setResendMsg] = useState('');
  const inputsRef = useRef([]);

  // Countdown for the resend cooldown.
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const clearOtpInputs = () => {
    setOtp(['', '', '', '', '', '']);
    // Refocus the first box so the user immediately sees it's ready for a new code.
    setTimeout(() => inputsRef.current[0]?.focus(), 50);
  };

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;
    const newOtp = [...otp.map((d, idx) => (idx === index ? element.value : d))];
    setOtp(newOtp);

    // Focus next input
    if (element.value && element.nextSibling) {
      element.nextSibling.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      e.target.previousSibling.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) {
      setError('Enter full 6-digit code');
      return;
    }

    setLoading(true);
    setError('');
    setResendMsg('');

    try {
      const res = await api.post('/students/verify-otp', { studentId, code });
      if (res.data) {
        onVerified(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or Expired Code');
      // Wipe the boxes so an invalid/expired code doesn't just sit there silently -
      // the cleared inputs + the red error banner make the failure obvious.
      clearOtpInputs();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setError('');
    setResendMsg('');
    try {
      // NOTE: adjust this endpoint to whatever your backend actually exposes
      // for re-sending a code (it should generate a new OTP and call your
      // emailService.sendEmailOTP, or the SMS equivalent, for `method`).
      await api.post('/students/resend-otp', { studentId, method });
      setResendMsg('A new code has been sent.');
      setResendCooldown(RESEND_COOLDOWN);
      clearOtpInputs();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not resend the code. Please try again.');
    } finally {
      setResendLoading(false);
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
      {/* Slim Rectangular Card */}
      <div className="bg-white w-full max-w-[380px] rounded-[1.5rem] shadow-2xl overflow-hidden border border-slate-100 relative z-10 animate-in fade-in zoom-in duration-300">

        {/* Close/Cancel Button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-slate-300 hover:text-[#FF1E1E] transition-colors p-2 z-20"
        >
          <IconX size={20} />
        </button>

        {/* Top Accent Bar */}
        <div className="h-1.5 w-full bg-[#093fb4]" />

        <div className="p-8 space-y-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-50 text-[#093fb4] rounded-xl flex items-center justify-center mx-auto mb-3">
              <IconShieldCheck size={28} />
            </div>
            <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] mb-1">
              Security Verification
            </p>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight italic">
              Verify <span className="text-[#093fb4]">OTP</span>
            </h2>
            <p className="text-slate-500 text-[10px] font-medium leading-tight mt-2 px-4">
              Enter the 6-digit code sent to your <span className="text-[#093fb4] font-bold">{method}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-between gap-1.5">
              {otp.map((data, index) => (
                <input
                  key={index}
                  ref={(el) => (inputsRef.current[index] = el)}
                  type="text"
                  maxLength="1"
                  className="w-11 h-14 text-center text-xl font-black bg-slate-50 border border-slate-100 rounded-xl focus:border-[#093fb4] focus:bg-white transition-all outline-none"
                  value={data}
                  onChange={e => handleChange(e.target, index)}
                  onKeyDown={e => handleKeyDown(e, index)}
                  onFocus={e => e.target.select()}
                />
              ))}
            </div>

            {error && (
              <div className="p-3 rounded-xl border flex items-center gap-2 bg-red-50 border-red-100">
                <IconAlertTriangle size={16} className="text-[#FF1E1E] shrink-0" />
                <p className="text-[9px] font-black text-[#FF1E1E] uppercase">{error}</p>
              </div>
            )}

            {resendMsg && !error && (
              <div className="p-3 rounded-xl border flex items-center gap-2 bg-emerald-50 border-emerald-100">
                <p className="text-[9px] font-black text-emerald-600 uppercase">{resendMsg}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#093fb4] hover:bg-[#073496] text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-blue-900/10 disabled:opacity-50 uppercase text-xs tracking-widest"
            >
              {loading ? "Verifying..." : "Verify Code"}
            </button>
          </form>

          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || resendLoading}
            className="w-full flex items-center justify-center gap-2 text-[#093fb4] hover:text-[#073496] disabled:text-slate-300 font-black text-[9px] uppercase tracking-widest transition-colors"
          >
            <IconRefresh size={14} className={resendLoading ? 'animate-spin' : ''} />
            {resendLoading
              ? 'Sending...'
              : resendCooldown > 0
                ? `Resend Code (${resendCooldown}s)`
                : 'Resend Code'}
          </button>

          <button
            onClick={onCancel}
            className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-slate-600 font-black text-[9px] uppercase tracking-widest transition-colors"
          >
            <IconArrowLeft size={14} /> Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}