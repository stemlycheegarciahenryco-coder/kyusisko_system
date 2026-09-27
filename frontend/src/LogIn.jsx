import api from './api';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LoadingScreen from './component/LoadingScreen';
import { 
  IconMail, 
  IconKey, 
  IconAlertCircle, 
  IconLogin,
  IconEye,
  IconEyeOff,
  IconX,
  IconCircleCheckFilled,
  IconShieldLock,
  IconMailOpened // 🚀 for the "check your email" waiting state
} from '@tabler/icons-react';

export default function LogIn() {
  const [identifier, setIdentifier] = useState(''); 
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showMfa, setShowMfa] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(''); 
  const [verifiedStatus, setVerifiedStatus] = useState(false);
  const [mfaMethod, setMfaMethod] = useState(null);
  const [chooseMethod, setChooseMethod] = useState(false);
  const [availableMethods, setAvailableMethods] = useState([]);

  // 🚀 New state for the email-approval polling flow
  const [pollToken, setPollToken] = useState(null);
  const [pending, setPending] = useState(false);
  const pollIntervalRef = useRef(null);

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

  // 🚀 Cleanup any running poll on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const redirectByRole = (role, data) => {
    if (role === 'root_admin' || role === 'co_admin') {
      localStorage.setItem('userRole', role);
      navigate('/RootDashboard');
    } else if (role === 'sub_admin') {
      localStorage.setItem('userRole', role);
      localStorage.setItem('orgInfo', JSON.stringify({
        isPasswordChanged: data.isPasswordChanged,
        accountType: data.accountType,
        parentOrgId: data.parentOrgId
      }));
      navigate('/OrgDashboard');
    } else if (role === 'student') {
      localStorage.setItem('userRole', role);
      if (!data.isProfileComplete) {
        navigate('/student-onboard');
      } else {
        navigate('/scholarships');
      }
    }
  };

  // 🚀 Polling loop for email-approval logins
  const startPolling = (token, chosenMethod) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await api.post('/auth/portal-login', {
          identifier: identifier.trim(),
          password,
          mfaMethod: chosenMethod,
          otp: token
        });

        if (!res.data.mfaRequired) {
          // Approved — backend already issued the session
          clearInterval(pollIntervalRef.current);
          setPending(false);
          const { role, data } = res.data;
          redirectByRole(role, data);
        }
        // if still mfaRequired + pending, do nothing and keep polling
      } catch (err) {
        // denied / expired / invalid -> stop polling and show the error
        clearInterval(pollIntervalRef.current);
        setPending(false);
        setErrorMessage(err.response?.data?.error || "Login approval failed.");
      }
    }, 3000);
  };

  // 🚀 Called when the student picks a method on the "choose method" screen
  const chooseMfaMethod = async (chosen) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await api.post('/auth/portal-login', {
        identifier: identifier.trim(),
        password,
        mfaMethod: chosen
      });

      if (response.data.mfaRequired) {
        setChooseMethod(false);
        setMfaMethod(response.data.method || chosen);

        if (response.data.method === 'email_approval') {
          setPollToken(response.data.pollToken);
          setPending(true);
          startPolling(response.data.pollToken, chosen);
        }
      } else {
        // Shouldn't normally happen here, but handle just in case
        const { role, data } = response.data;
        redirectByRole(role, data);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.error || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const payload = { 
        identifier: identifier.trim(), 
        password 
      };
      // Only the TOTP code-entry step submits via this form with a typed code
      if (showMfa && mfaMethod === 'otp') {
        payload.mfaMethod = 'otp';
        payload.otp = otp.trim();
      }

      const response = await api.post('/auth/portal-login', payload);
      
      if (response.data.mfaRequired) {
        setShowMfa(true);
        setLoading(false);

        if (response.data.chooseMethod) {
          // Step 1: MFA is on but no method chosen yet — show the picker
          setChooseMethod(true);
          setAvailableMethods(response.data.availableMethods || []);
        } else {
          setMfaMethod(response.data.method);
        }
        return; 
      }
      
      const { role, data } = response.data; 
      redirectByRole(role, data);

    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.error === "Invalid Credentials") {
        setErrorMessage("Invalid or Unknown Credentials");
      } else {
        setErrorMessage(errorData?.error || "Invalid or Unknown Credentials");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (showMfa) {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      setShowMfa(false);
      setOtp('');
      setMfaMethod(null);
      setChooseMethod(false);
      setAvailableMethods([]);
      setPollToken(null);
      setPending(false);
      setErrorMessage('');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden bg-[#FFFCFB]">
      
      <div 
        className="absolute inset-0 bg-no-repeat bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: `url('/bg2.png')` }}
      />

      <LoadingScreen isLoading={loading} />

      <div className="max-w-md w-full bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-10 border border-white/40 relative z-10">
        <button 
          onClick={handleClose}
          className="absolute top-7 right-7 text-black/30 hover:text-[#FF1E1E] transition-colors p-1"
        >
          <IconX size={24} stroke={2.5} />
        </button>

        {verifiedStatus && !showMfa && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50/80 backdrop-blur-sm border border-emerald-200/60 flex items-center gap-3">
            <IconCircleCheckFilled className="text-emerald-600 shrink-0" size={24} />
            <p className="text-xs font-black text-emerald-950 uppercase tracking-wide">Verified! Please log in.</p>
          </div>
        )}

        <div className="text-center mb-8 mt-2">
          <div className="inline-flex items-center justify-center mb-4">
            <img src="/logo.png" alt="Logo" className="h-24 w-auto object-contain" />
          </div>
          <p className="mt-2 text-sm font-black text-slate-700 uppercase tracking-[0.3em]">
            {showMfa ? "Two-Factor Auth" : "Portal Login"}
          </p>
          {showMfa && (
            <p className="text-xs text-slate-500 mt-2 font-semibold">
              {chooseMethod
                ? "Choose how you'd like to verify it's you."
                : mfaMethod === 'email_approval'
                  ? "We sent an approval link to your email."
                  : "Enter the 6-digit code from your Authenticator app."}
            </p>
          )}
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {!showMfa ? (
            <>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-800 uppercase ml-1 tracking-wider block">
                  Email Address / Username
                </label>
                <div className="relative group">
                  <IconMail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 group-focus-within:text-[#093fb4] transition-colors" />
                  <input 
                    type="text" 
                    required
                    placeholder="Enter your credentials"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-white/60 border-2 border-white/80 rounded-2xl focus:bg-white focus:border-[#093fb4] outline-none transition-all placeholder:text-black/30 font-bold text-slate-900 text-base shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-800 uppercase ml-1 tracking-wider block">
                  Password
                </label>
                <div className="relative group">
                  <IconKey size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 group-focus-within:text-[#093fb4] transition-colors" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3.5 bg-white/60 border-2 border-white/80 rounded-2xl focus:bg-white focus:border-[#093fb4] outline-none transition-all placeholder:text-black/30 font-bold text-slate-900 text-base shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-black/30 hover:text-[#093fb4] transition-colors"
                  >
                    {showPassword ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                  </button>
                </div>
              </div>
            </>
          ) : chooseMethod ? (
            // 🚀 Method picker — shown once, right after password is verified
            <div className="space-y-3 py-2">
              {availableMethods.includes('otp') && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => chooseMfaMethod('otp')}
                  className="w-full flex items-center gap-4 p-5 bg-white/60 border-2 border-white/80 rounded-2xl hover:border-[#093fb4] hover:bg-white transition-all text-left group disabled:opacity-50"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#093fb4]/10 text-[#093fb4] flex items-center justify-center shrink-0">
                    <IconShieldLock size={22} stroke={2.5} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">Authenticator App</p>
                    <p className="text-xs font-semibold text-slate-500">Enter the code from your app</p>
                  </div>
                </button>
              )}

              {availableMethods.includes('email_approval') && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => chooseMfaMethod('email_approval')}
                  className="w-full flex items-center gap-4 p-5 bg-white/60 border-2 border-white/80 rounded-2xl hover:border-[#093fb4] hover:bg-white transition-all text-left group disabled:opacity-50"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#093fb4]/10 text-[#093fb4] flex items-center justify-center shrink-0">
                    <IconMailOpened size={22} stroke={2.5} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">Email Approval</p>
                    <p className="text-xs font-semibold text-slate-500">Approve the login from your inbox</p>
                  </div>
                </button>
              )}
            </div>
          ) : mfaMethod === 'email_approval' ? (
            // 🚀 Waiting-for-approval state — no input, just a spinner + status
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#093fb4]/10 text-[#093fb4] flex items-center justify-center">
                <IconMailOpened size={28} stroke={2.5} className={pending ? "animate-pulse" : ""} />
              </div>
              <p className="text-sm font-bold text-slate-600 text-center">
                {pending 
                  ? "Waiting for you to approve this login from your email…" 
                  : "Approval finished."}
              </p>
              <button
                type="button"
                disabled={loading}
                onClick={() => chooseMfaMethod('email_approval')}
                className="text-xs font-black text-[#093fb4] hover:underline uppercase tracking-widest"
              >
                Resend Approval Email
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-800 uppercase ml-1 tracking-wider block">
                Authenticator Code
              </label>
              <div className="relative group">
                <IconShieldLock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 group-focus-within:text-[#093fb4] transition-colors" />
                <input 
                  type="text" 
                  required
                  maxLength="6"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/60 border-2 border-white/80 rounded-2xl focus:bg-white focus:border-[#093fb4] outline-none transition-all placeholder:text-black/30 font-bold text-slate-900 text-base tracking-[0.5em] text-center shadow-sm"
                />
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-[#FF1E1E]/10 border border-[#FF1E1E]/20 text-[#FF1E1E] backdrop-blur-sm">
              <IconAlertCircle size={20} stroke={2.5} className="shrink-0" />
              <p className="text-xs font-black uppercase tracking-wide">
                {errorMessage}
              </p>
            </div>
          )}

          <div className="space-y-4">
            {/* 🚀 Hidden during the choose-method step and email-approval waiting — both are driven by their own buttons/polling */}
            {!chooseMethod && mfaMethod !== 'email_approval' && (
              <button 
                type="submit" 
                disabled={loading || (showMfa && otp.length !== 6)}
                className="w-full bg-[#093fb4] hover:bg-[#073496] text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2.5 group shadow-xl shadow-[#093fb4]/25 active:scale-[0.98] disabled:bg-[#093fb4]/70 disabled:active:scale-100 text-sm tracking-wider uppercase"
              >
                {loading ? (
                  <span>Verifying...</span>
                ) : (
                  <>
                    {showMfa ? "VERIFY CODE" : "LOG IN"}
                    <IconLogin size={20} stroke={2.5} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            )}

            {!showMfa && (
              <div className="w-full mt-3 flex items-start justify-center gap-2 text-xs">
                <span className="font-bold text-slate-500 pt-[1px]">
                  Don't have an account?
                </span>
                <div className="flex flex-col items-start gap-1.5">
                  
                   <a href="/student-register"
                    className="font-black text-[#093fb4] hover:text-[#073496] hover:underline transition-colors tracking-wide"
                  >
                    Create Student Account
                  </a>
                  
                   <a href="/organization-register"
                    className="font-black text-[#093fb4] hover:text-[#073496] hover:underline transition-colors tracking-wide"
                  >
                    Create Provider Account
                  </a>
                </div>
              </div>
            )}
          </div>
        </form>

        {!showMfa && (
          <div className="mt-8 flex flex-col items-center border-t border-black/10 pt-6">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-xs font-black text-slate-600 hover:text-[#FF1E1E] transition-colors tracking-widest uppercase"
              >
                Forgot Password?
              </button>
          </div>
        )}
      </div>
    </div>
  );
}