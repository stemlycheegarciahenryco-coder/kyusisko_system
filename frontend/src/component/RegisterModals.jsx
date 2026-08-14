import React, { useState, useEffect, useRef } from "react";

// BRAND COLORS USED:
// Red: #FF1E1E
// White: #FFFCFB
// Blue: #093fb4

/* ── 1. OTP / EMAIL VERIFICATION MODAL ── */
export function OtpModal({ isOpen, email, onVerify, onClose, loading }) {
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(120);
  const inputRef = useRef(null);

  useEffect(() => {
    let interval;
    if (isOpen && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, timer]);

  useEffect(() => {
    if (isOpen) {
      setTimer(120);
      setOtp("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#FFFCFB] rounded-[2.5rem] p-8 text-center shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-200">
        
        {/* Top Right Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>

        {/* Top Floating Icon Badge with Sparkles */}
        <div className="relative w-16 h-16 mx-auto mb-5">
          <div className="w-16 h-16 bg-blue-50 text-[#093fb4] rounded-full flex items-center justify-center border-4 border-blue-100/50 shadow-sm">
            <svg className="w-7 h-7 translate-x-0.5 -translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="m22 2-7 20-4-9-9-4Z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M22 2 11 13"/></svg>
          </div>
          {/* Sparkles */}
          <span className="absolute -top-1 -right-2 text-blue-400 text-xs font-bold">✦</span>
          <span className="absolute bottom-0 -left-2 text-blue-300 text-sm font-bold">✦</span>
        </div>

        <h2 className="text-xl font-black text-slate-900 mb-1 tracking-tight">Verify Your Email</h2>
        <p className="text-slate-500 text-xs font-medium mb-6 leading-relaxed">
          We've sent a 6-digit verification code to<br />
          <span className="text-[#093fb4] font-bold break-all">{email}</span>
        </p>

        {/* 6-DIGIT CODE INPUT BOXES */}
        <div className="mb-4 relative">
          <p className="text-[11px] font-bold text-slate-400 mb-3">Enter the 6-digit code below</p>
          
          <div 
            onClick={() => inputRef.current?.focus()} 
            className="flex justify-center gap-2 cursor-pointer"
          >
            {Array.from({ length: 6 }).map((_, idx) => {
              const char = otp[idx] || "";
              const isFocused = idx === otp.length || (idx === 5 && otp.length === 6);
              return (
                <div 
                  key={idx}
                  className={`w-11 h-13 rounded-2xl border-2 flex items-center justify-center text-lg font-black transition-all ${
                    isFocused 
                      ? "border-[#093fb4] bg-white ring-4 ring-blue-50 shadow-sm" 
                      : char ? "border-slate-300 bg-slate-50 text-slate-900" : "border-slate-200 bg-slate-50 text-slate-300"
                  }`}
                >
                  {char ? char : <span className="w-2 h-2 rounded-full bg-slate-300 inline-block" />}
                </div>
              );
            })}
          </div>

          {/* Hidden Overlay Input */}
          <input 
            ref={inputRef}
            type="text" 
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </div>

        {/* TIMER PILL BADGE */}
        <div className="mb-4">
          {timer > 0 ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50/80 rounded-full text-slate-600 text-xs font-semibold">
              <svg className="w-3.5 h-3.5 text-[#093fb4]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span>Code expires in <strong className="text-[#093fb4] font-black">{formatTime(timer)}</strong></span>
            </div>
          ) : (
            <div className="text-xs text-slate-500">
              Didn't receive the code?{" "}
              <button 
                type="button"
                onClick={() => setTimer(120)} 
                className="text-[#093fb4] font-bold hover:underline"
              >
                Resend code
              </button>
            </div>
          )}
        </div>

        {/* ACTIONS */}
        <div className="space-y-3">
          <button 
            onClick={() => onVerify(otp)}
            disabled={otp.length !== 6 || loading}
            className="w-full py-3.5 bg-[#093fb4] text-white rounded-2xl font-bold text-sm tracking-wide hover:bg-blue-800 disabled:opacity-40 transition-all shadow-md shadow-blue-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              "Verifying..."
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                Verify Code
              </>
            )}
          </button>

          <div className="relative py-1 flex items-center justify-center">
            <div className="border-t border-slate-100 w-full absolute"></div>
            <span className="bg-[#FFFCFB] px-3 text-[10px] font-extrabold text-slate-300 uppercase tracking-widest relative">OR</span>
          </div>

          <button 
            onClick={onClose} 
            className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors block w-full py-1"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}


/* ── 2. REDESIGNED ERROR MODAL ── */
export function ErrorModal({ isOpen, onClose, message }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#FFFCFB] rounded-[2.5rem] p-8 text-center shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-200">
        
        {/* Top Right Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>

        {/* Top Floating Error Icon Badge */}
        <div className="relative w-16 h-16 mx-auto mb-5">
          <div className="w-16 h-16 bg-red-50 text-[#FF1E1E] rounded-full flex items-center justify-center border-4 border-red-100/60 shadow-sm">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          {/* Sparkles */}
          <span className="absolute -top-1 -right-2 text-red-400 text-xs font-bold">✦</span>
          <span className="absolute bottom-0 -left-2 text-red-300 text-sm font-bold">✦</span>
        </div>

        <h2 className="text-xl font-black text-slate-900 mb-2 tracking-tight uppercase">Wait a minute!</h2>
        
        <div className="bg-red-50/50 border border-red-100/80 rounded-2xl p-4 mb-6">
          <p className="text-slate-600 text-xs font-semibold leading-relaxed break-words">
            {message || "An unexpected error occurred. Please try again."}
          </p>
        </div>

        <div className="space-y-3">
          <button 
            onClick={onClose} 
            className="w-full py-3.5 bg-[#FF1E1E] text-white rounded-2xl font-bold text-sm tracking-wide hover:bg-red-700 transition-all active:scale-98 shadow-md shadow-red-200 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Try Again
          </button>

          <div className="relative py-1 flex items-center justify-center">
            <div className="border-t border-slate-100 w-full absolute"></div>
            <span className="bg-[#FFFCFB] px-3 text-[10px] font-extrabold text-slate-300 uppercase tracking-widest relative">OR</span>
          </div>

          <button 
            onClick={onClose} 
            className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors block w-full py-1"
          >
            Dismiss
          </button>
        </div>

      </div>
    </div>
  );
}


/* ── 3. SUCCESS MODALS ── */
export function OrgSuccessModal({ isOpen, onConfirm }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#FFFCFB] rounded-[2.5rem] p-8 text-center shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-emerald-100/60">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
        </div>
        <h2 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Registration Successful!</h2>
        <p className="text-slate-500 text-xs font-medium leading-relaxed mb-6">
          Your account is now under review by our team. Check your email regularly for updates.
        </p>
        <button 
          onClick={onConfirm} 
          className="w-full py-3.5 bg-[#093fb4] text-white rounded-2xl font-bold text-sm uppercase tracking-wider hover:bg-blue-800 transition-all active:scale-98 shadow-md shadow-blue-200"
        >
          Confirm
        </button>
      </div>
    </div>
  );
}

export function SuccessModal({ isOpen, onConfirm }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#FFFCFB] rounded-[2.5rem] p-8 text-center shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-emerald-100/60">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
        </div>
        <h2 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Registration Successful!</h2>
        <div className="space-y-3 mb-6">
          <p className="text-slate-500 text-xs font-medium leading-relaxed">
            Your account is now <span className="text-[#093fb4] font-bold">Active</span>.
          </p>
          <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-100">
            <p className="text-[11px] text-[#093fb4] font-bold leading-relaxed uppercase tracking-wider">
              You can now Sign in to KyusIsko.
            </p>
          </div>
        </div>
        <button 
          onClick={onConfirm} 
          className="w-full py-3.5 bg-[#093fb4] text-white rounded-2xl font-bold text-sm uppercase tracking-wider hover:bg-blue-800 transition-all active:scale-98 shadow-md shadow-blue-200"
        >
          Proceed to Login
        </button>
      </div>
    </div>
  );
}