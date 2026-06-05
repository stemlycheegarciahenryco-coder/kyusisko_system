import React from "react";

// COLORS USED:
// Red: #FF1E1E
// White: #FFFCFB
// Blue: #093fb4

export function OrgSuccessModal({ isOpen, onConfirm }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#093fb4]/20 backdrop-blur-md">
            <div className="w-full max-w-md bg-[#FFFCFB] rounded-[2.5rem] p-8 text-center shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Registration Successful!</h2>
                <div className="space-y-4 mb-8">
                    <p className="text-slate-500 font-medium leading-relaxed">
                        Your account is now  under review by our team, check your email regularly for more update.
                    </p>
                    
                </div>
                <button 
                    onClick={onConfirm} 
                    className="w-full py-4 bg-[#093fb4] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-800 transition-all active:scale-95 shadow-lg shadow-blue-200"
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#093fb4]/20 backdrop-blur-md">
            <div className="w-full max-w-md bg-[#FFFCFB] rounded-[2.5rem] p-8 text-center shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Registration Successful!</h2>
                <div className="space-y-4 mb-8">
                    <p className="text-slate-500 font-medium leading-relaxed">
                        Your account is now <span className="text-[#093fb4] font-bold">Active</span>.
                    </p>
                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                        <p className="text-xs text-[#093fb4] font-bold leading-relaxed uppercase tracking-wider">
                            You can now Sign in to KyusIsko.
                        </p>
                    </div>
                </div>
                <button 
                    onClick={onConfirm} 
                    className="w-full py-4 bg-[#093fb4] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-800 transition-all active:scale-95 shadow-lg shadow-blue-200"
                >
                    Proceed to Login
                </button>
            </div>
        </div>
    );
}

export function OtpModal({ isOpen, email, onVerify, onClose, loading }) {
    const [otp, setOtp] = React.useState("");
    const [timer, setTimer] = React.useState(120);

    // 1. Move the Hook ABOVE the conditional return
    React.useEffect(() => {
        let interval;
        // Move the 'isOpen' check inside the effect instead
        if (isOpen && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isOpen, timer]);

    // 2. Reset the timer when the modal opens
    React.useEffect(() => {
        if (isOpen) {
            setTimer(120);
            setOtp(""); // Clear previous OTP input too
        }
    }, [isOpen]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // 3. NOW you can do your early return
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-xl">
            <div className="w-full max-w-sm bg-[#FFFCFB] rounded-[2.5rem] p-8 text-center shadow-2xl border border-blue-100">
                <div className="w-16 h-16 bg-blue-100 text-[#093fb4] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                </div>
                
                <h2 className="text-xl font-black text-slate-900 mb-1 uppercase italic">Verify Email</h2>
                <p className="text-slate-500 text-xs font-medium mb-6">Sent to <span className="text-[#093fb4]">{email}</span></p>
                
                <input 
                    type="text" 
                    maxLength="6"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="w-full text-center text-3xl font-black tracking-[1rem] p-4 bg-white border-2 border-slate-100 rounded-2xl mb-4 outline-none focus:border-[#093fb4] transition-all"
                />

                {/* Timer UI */}
                <div className="mb-6">
                    {timer > 0 ? (
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Code expires in <span className="text-[#093fb4] font-black">{formatTime(timer)}</span>
                        </p>
                    ) : (
                        <button 
                            type="button"
                            onClick={() => setTimer(120)} // In production, call your resend API here
                            className="text-[11px] font-black text-[#FF1E1E] uppercase tracking-wider hover:underline"
                        >
                            Code Expired. Resend?
                        </button>
                    )}
                </div>

                <div className="space-y-3">
                    <button 
                        onClick={() => onVerify(otp)}
                        disabled={otp.length !== 6 || loading}
                        className="w-full py-4 bg-[#093fb4] text-white rounded-xl font-black uppercase tracking-widest hover:bg-blue-800 disabled:opacity-50 transition-all shadow-lg shadow-blue-100"
                    >
                        {loading ? "Verifying..." : "Verify Code"}
                    </button>
                    <button 
                        onClick={onClose} 
                        className="text-[10px] font-bold text-slate-400 uppercase hover:text-red-500 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}


export function ErrorModal({ isOpen, onClose, message }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
            <div className="w-full max-w-md bg-[#FFFCFB] rounded-[2.5rem] p-8 text-center shadow-2xl border border-rose-100 animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-rose-100 text-[#FF1E1E] rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Wait a minute!</h2>
                <div className="space-y-4 mb-8">
                    <p className="text-slate-500 font-medium leading-relaxed">{message}</p>
                </div>
                <button 
                    onClick={onClose} 
                    className="w-full py-4 bg-[#FF1E1E] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-rose-200"
                >
                    Try Again
                </button>
            </div>
        </div>
    );
}