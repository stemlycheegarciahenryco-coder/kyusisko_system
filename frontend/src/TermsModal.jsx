import React, { useRef, useState, useEffect } from "react";


export function OtpModal({ isOpen, email, onVerify, onClose, loading, onResend }) {
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(120);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

  // Resend is available much sooner than the 2-minute code-expiry window —
  // this is a short, separate cooldown just to stop rapid double-clicks.
  const RESEND_COOLDOWN = 10; // seconds
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN);

  // Backend allows 2 resends per 15 minutes (see otpSendLimiter). Mirror that
  // limit on the client so a 3rd click shows an immediate, clear message
  // instead of relying only on a 429 round-trip.
  const MAX_RESENDS = 2;
  const LOCKOUT_SECONDS = 15 * 60;
  const [resendCount, setResendCount] = useState(0);
  const [lockoutSecondsLeft, setLockoutSecondsLeft] = useState(0);

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
    let interval;
    if (isOpen && resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, resendCooldown]);

  useEffect(() => {
    let interval;
    if (isOpen && lockoutSecondsLeft > 0) {
      interval = setInterval(() => {
        setLockoutSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, lockoutSecondsLeft]);

  useEffect(() => {
    if (isOpen) {
      setTimer(120);
      setOtp("");
      setResendMsg("");
      setResendCooldown(RESEND_COOLDOWN);
      setResendCount(0);
      setLockoutSecondsLeft(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  // Wraps the parent's onVerify so a wrong/expired code visibly clears the
  // input instead of silently doing nothing.
  const handleVerifyClick = async () => {
    try {
      const result = await onVerify(otp);
      if (result === false) {
        setOtp("");
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    } catch (err) {
      setOtp("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleResend = async () => {
    if (resending || resendCooldown > 0 || lockoutSecondsLeft > 0) return;

    if (resendCount >= MAX_RESENDS) {
      setLockoutSecondsLeft(LOCKOUT_SECONDS);
      setResendMsg("");
      return;
    }

    setResending(true);
    setResendMsg("");
    try {
      if (!onResend) {
        // Previously this silently skipped the call and still reported
        // success below — meaning a parent that forgot to wire up onResend
        // would show "A new code has been sent." without ever hitting the
        // backend. Now it fails loudly instead.
        throw new Error("onResend handler is not wired up in the parent component.");
      }
      await onResend();
      setTimer(120);
      setOtp("");
      setResendCount((prev) => prev + 1);
      setResendCooldown(RESEND_COOLDOWN);
      setResendMsg("A new code has been sent.");
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err) {
      console.error("Resend OTP failed:", err);
      // The backend's own limiter (2 per 15 min) can still fire even if our
      // client-side count somehow gets out of sync — surface that clearly.
      if (err?.response?.status === 429) {
        setLockoutSecondsLeft(LOCKOUT_SECONDS);
      } else {
        setResendMsg(err?.response?.data?.error || "Couldn't resend the code. Please try again.");
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#FFFCFB] rounded-[2.5rem] p-8 text-center shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-200">
        
        {/* Top Right Close Button */}
        <button 
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>

        <h2 className="text-xl font-black text-slate-900 mb-1 tracking-tight mt-2">Verify Your Email</h2>
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

        {/* TIMER PILL BADGE / RESEND */}
        <div className="mb-4 space-y-2">
          {timer > 0 && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50/80 rounded-full text-slate-600 text-xs font-semibold">
              <svg className="w-3.5 h-3.5 text-[#093fb4]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span>Code expires in <strong className="text-[#093fb4] font-black">{formatTime(timer)}</strong></span>
            </div>
          )}

          {lockoutSecondsLeft > 0 ? (
            <div className="text-[11px] font-bold text-[#FF1E1E] bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              Too many OTP requests. Please wait {formatTime(lockoutSecondsLeft)} before requesting another code.
            </div>
          ) : (
            <div className="text-xs text-slate-500">
              Didn't receive the code?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || resending}
                className={`font-bold transition-colors ${
                  resendCooldown > 0
                    ? "text-slate-300 cursor-not-allowed"
                    : "text-[#093fb4] hover:underline disabled:opacity-50"
                }`}
              >
                {resending
                  ? "Sending..."
                  : resendCooldown > 0
                    ? `Resend code (${resendCooldown}s)`
                    : "Resend code"}
              </button>
            </div>
          )}

          {resendMsg && (
            <p className="mt-2 text-[10px] font-bold text-slate-400">{resendMsg}</p>
          )}
        </div>

        {/* ACTIONS */}
        <div className="space-y-3">
          <button 
            type="button"
            onClick={handleVerifyClick}
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
            type="button"
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

export default function TermsModal({ isOpen, onClose, onAccept }) {
    const scrollRef = useRef(null);
    const [hasReadToBottom, setHasReadToBottom] = useState(false);
    const [isCheck, setIsCheck] = useState(false);

    // Reset states when the modal is closed or reopened
    useEffect(() => {
        if (!isOpen) {
            setHasReadToBottom(false);
            setIsCheck(false);
        }
    }, [isOpen]);

    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            // Checks if user is within 10px of the bottom
            if (scrollTop + clientHeight >= scrollHeight - 10) setHasReadToBottom(true);
        }
    };

    if (!isOpen) return null;

    const canAccept = hasReadToBottom && isCheck;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">

            {/* Embedded CSS for a thinner, neat scrollbar */}
            <style>
                {`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f5f9; 
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1; 
                    border-radius: 10px;
                    border: 2px solid #f1f5f9;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8; 
                }
                `}
            </style>

            <div className="bg-white border border-slate-200 w-full max-w-lg rounded-[2rem] p-6 md:p-8 shadow-2xl flex flex-col">
                <h3 className="text-2xl font-black text-slate-900 mb-1.5 uppercase tracking-tight">
                    Terms of Service
                </h3>
                <p className="text-[#093FB4] text-[10px] font-black uppercase tracking-[0.15em] mb-5">
                    {hasReadToBottom ? "Please check the box below to continue" : "Scroll to the bottom to unlock"}
                </p>

                {/* Scrollable Content Area */}
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="max-h-[45vh] overflow-y-scroll pr-4 text-slate-600 text-sm leading-relaxed font-medium space-y-4 border-b border-slate-100 pb-6 custom-scrollbar"
                >
                    <h4 className="font-black text-center text-slate-900 text-base uppercase tracking-widest border-b border-slate-100 pb-3 mb-4">
                        KyusISKO User Agreement<br />
                        <span className="text-xs text-[#093fb4] mt-1 block">Terms and Conditions</span>
                    </h4>

                    <div>
                        <p className="font-black text-slate-900 text-[15px] mb-1">1. Introduction</p>
                        <p>Welcome to KyusISKO: Scholarship and Financial Aid Recommendation and Management System. By accessing and using this platform, you agree to comply with and be bound by the following Terms and Conditions.</p>
                    </div>

                    <div>
                        <p className="font-black text-slate-900 text-[15px] mb-1">2. Purpose of the System</p>
                        <p>KyusISKO provides a centralized platform for students to access scholarship information and receive recommendations based on qualifications.</p>
                    </div>

                    <div>
                        <p className="font-black text-slate-900 text-[15px] mb-1">3. User Roles and Responsibilities</p>
                        <ul className="list-disc pl-4 space-y-1.5">
                            <li><strong className="text-slate-800">Students:</strong> Provide accurate, updated personal and academic information.</li>
                            <li><strong className="text-slate-800">Organizations:</strong> Ensure all posted opportunities are legitimate.</li>
                            <li><strong className="text-slate-800">Administrators:</strong> Manage system data and monitor activity.</li>
                        </ul>
                    </div>

                    <div>
                        <p className="font-black text-slate-900 text-[15px] mb-1">4. Data Privacy and Protection</p>
                        <p>KyusISKO protects user data in accordance with privacy principles. Personal info is used solely for scholarship matching and is not shared with unauthorized third parties.</p>
                    </div>

                    <div>
                        <p className="font-black text-slate-900 text-[15px] mb-1">5. Document Verification</p>
                        <p>The system uses automated tools (including Google Gemini API) to analyze documents. Final decisions are made by administrators or organizations.</p>
                    </div>

                    <div>
                        <p className="font-black text-slate-900 text-[15px] mb-1">6. System Limitations</p>
                        <p>The system does not guarantee approval or acceptance. Recommendations depend on user accuracy.</p>
                    </div>

                    <div>
                        <p className="font-black text-slate-900 text-[15px] mb-1">7. Acceptable Use Policy</p>
                        <p>Users must not provide false info or attempt unauthorized access. Violation results in termination.</p>
                    </div>

                    <div>
                        <p className="font-black text-slate-900 text-[15px] mb-1">8. Intellectual Property</p>
                        <p>Content is the property of the KyusISKO development team.</p>
                    </div>

                    <div>
                        <p className="font-black text-slate-900 text-[15px] mb-1">9. Disclaimer</p>
                        <p>KyusISKO is not liable for scholarship outcomes or technical downtime.</p>
                    </div>

                    <div>
                        <p className="font-black text-slate-900 text-[15px] mb-1">10. Modifications</p>
                        <p>Terms may be updated at any time.</p>
                    </div>

                    <div>
                        <p className="font-black text-slate-900 text-[15px] mb-1">11. Acceptance</p>
                        <p>By using KyusISKO, users confirm they have read and agreed to these Terms.</p>
                    </div>

                    {/* Checkbox Section (Placed at the bottom inside the scrollable content) */}
                    <div
                        className={`flex items-center gap-3 mt-8 p-4 bg-slate-50 border border-slate-100 rounded-xl transition-opacity ${
                            !hasReadToBottom ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                    >
                        <input
                            type="checkbox"
                            id="terms-check"
                            disabled={!hasReadToBottom}
                            checked={isCheck}
                            onChange={(e) => setIsCheck(e.target.checked)}
                            className="w-5 h-5 rounded border-slate-300 text-[#093FB4] focus:ring-[#093FB4] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <label
                            htmlFor="terms-check"
                            className={`text-xs font-black text-slate-800 uppercase tracking-wider select-none ${
                                !hasReadToBottom ? "cursor-not-allowed text-slate-400" : "cursor-pointer"
                            }`}
                        >
                            I have read and understood the terms.
                        </label>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-5">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 text-slate-500 font-black hover:text-[#FF1E1E] transition-colors uppercase text-[11px] tracking-widest bg-slate-50 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100"
                    >
                        Cancel
                    </button>
                    <button
                        disabled={!canAccept}
                        onClick={onAccept}
                        className={`flex-[2] py-3 rounded-xl font-black uppercase tracking-widest transition-all text-[11px] flex items-center justify-center gap-2 ${
                            canAccept
                                ? 'bg-[#093FB4] hover:bg-[#073496] text-white shadow-lg shadow-[#093FB4]/25 active:scale-95 cursor-pointer'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                        }`}
                    >
                        {!hasReadToBottom ? "Scroll to Bottom" : !isCheck ? "Check the Box" : "I Agree & Continue"}
                    </button>
                </div>
            </div>
        </div>
    );
}
