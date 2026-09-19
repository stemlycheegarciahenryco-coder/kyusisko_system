import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  MessageSquare, 
  ShieldCheck, 
  Smartphone, 
  Key, 
  Lock,
  Eye,
  EyeOff,
  ChevronRight,
  X,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import api from '../api'; 

const inputCls = "w-full pl-14 pr-14 py-4 bg-black/5 border-2 border-transparent rounded-2xl focus:bg-white focus:border-[#093fb4] outline-none transition-all placeholder:text-black/30 font-bold text-black text-sm shadow-sm";
const labelCls = "text-[10px] font-black text-black/50 uppercase ml-1 tracking-[0.2em] block mb-2";

export default function StudentSettings() {
  // --- TAB NAVIGATION STATE ---
  const [activeTab, setActiveTab] = useState('password'); // 'password' or 'mfa'

  // --- MFA STATE ---
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [method, setMethod] = useState('email');
  const [loading, setLoading] = useState(true);

  // --- PASSWORD STATE ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
  const [passwordStatus, setPasswordStatus] = useState(null); 
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // 1. Fetch current MFA settings when page loads
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/students/profile-full/me'); 
        setIs2FAEnabled(res.data.two_factor_enabled);
        setMethod(res.data.preferred_2fa_method || 'email');
      } catch (err) {
        console.error("Error fetching security settings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // 2. Save MFA changes to the DB
  const saveSecuritySettings = async (enabled, selectedMethod) => {
    try {
      await api.put('/students/update-2fa', { 
        two_factor_enabled: enabled,
        preferred_2fa_method: selectedMethod
      });
    } catch (err) {
      console.error("Save Error:", err);
      alert("Failed to save security settings");
    }
  };

  const handleToggleMFA = () => {
    const nextState = !is2FAEnabled;
    setIs2FAEnabled(nextState);
    saveSecuritySettings(nextState, method);
  };

  const handleMethodChange = (newMethod) => {
    setMethod(newMethod);
    saveSecuritySettings(is2FAEnabled, newMethod);
  };

  // 3. Handle Password Change Submit
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', msg: "New passwords do not match." });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordStatus({ type: 'error', msg: "Password must be at least 8 characters long." });
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.put('/students/change-password', {
        currentPassword,
        newPassword
      });

      setPasswordStatus({ type: 'success', msg: "Password updated successfully!" });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Auto-clear success message after 4 seconds
      setTimeout(() => setPasswordStatus(null), 4000);
    } catch (err) {
      setPasswordStatus({ 
        type: 'error', 
        msg: err.response?.data?.error || "Failed to update password. Check your current password." 
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-[#093fb4] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 font-['Inter'] antialiased">
      
      {/* --- TAB NAVIGATION --- */}
      <div className="flex space-x-2 bg-white/60 p-2 rounded-2xl w-fit border-2 border-white/80 shadow-sm relative z-10">
        <button
          type="button"
          onClick={() => setActiveTab('password')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-[0.1em] transition-all ${
            activeTab === 'password' 
              ? 'bg-white text-[#093fb4] shadow-sm border border-white' 
              : 'text-black/40 hover:text-black hover:bg-white/50 border border-transparent'
          }`}
        >
          <Key size={18} strokeWidth={2.5} />
          Change Password
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('mfa')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-[0.1em] transition-all ${
            activeTab === 'mfa' 
              ? 'bg-white text-[#093fb4] shadow-sm border border-white' 
              : 'text-black/40 hover:text-black hover:bg-white/50 border border-transparent'
          }`}
        >
          <ShieldCheck size={18} strokeWidth={2.5} />
          MFA Security
        </button>
      </div>

      <div className="relative">
        
        {/* --- SECTION 1: CHANGE PASSWORD --- */}
        {activeTab === 'password' && (
         <div className="bg-white/70 backdrop-blur-xl border-2 border-white/80 rounded-[2.5rem] shadow-2xl p-8 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-300">
            
            <div className="flex items-center gap-4 pb-8 border-b-2 border-black/5 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-[#093fb4]/10 text-[#093fb4] flex items-center justify-center shrink-0">
                <Key size={28} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="font-black text-black text-2xl md:text-3xl uppercase tracking-tight">Password & Security</h3>
                <p className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em] mt-1">
                  Ensure your account is using a long, random password.
                </p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} noValidate className="space-y-6 max-w-xl">
              
              {/* Current Password */}
              <div className="space-y-2 relative">
                <label className={labelCls}>Current Password</label>
                <div className="relative group">
                  <Lock size={20} strokeWidth={2.5} className="absolute left-5 top-1/2 -translate-y-1/2 text-black/30 group-focus-within:text-[#093fb4] transition-colors" />
                  <input 
                    type={showPassword.current ? "text" : "password"} 
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={inputCls}
                    placeholder="Enter current password"
                  />
                  <button type="button" onClick={() => togglePasswordVisibility('current')} className="absolute right-5 top-1/2 -translate-y-1/2 text-black/30 hover:text-[#093fb4] transition-colors">
                    {showPassword.current ? <EyeOff size={20} strokeWidth={2.5} /> : <Eye size={20} strokeWidth={2.5} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2 relative">
                <label className={labelCls}>New Password</label>
                <div className="relative group">
                  <Lock size={20} strokeWidth={2.5} className="absolute left-5 top-1/2 -translate-y-1/2 text-black/30 group-focus-within:text-[#093fb4] transition-colors" />
                  <input 
                    type={showPassword.new ? "text" : "password"} 
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={inputCls}
                    placeholder="Enter new password"
                  />
                  <button type="button" onClick={() => togglePasswordVisibility('new')} className="absolute right-5 top-1/2 -translate-y-1/2 text-black/30 hover:text-[#093fb4] transition-colors">
                    {showPassword.new ? <EyeOff size={20} strokeWidth={2.5} /> : <Eye size={20} strokeWidth={2.5} />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-2 relative">
                <label className={labelCls}>Confirm New Password</label>
                <div className="relative group">
                  <Lock size={20} strokeWidth={2.5} className="absolute left-5 top-1/2 -translate-y-1/2 text-black/30 group-focus-within:text-[#093fb4] transition-colors" />
                  <input 
                    type={showPassword.confirm ? "text" : "password"} 
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={inputCls}
                    placeholder="Re-type new password"
                  />
                  <button type="button" onClick={() => togglePasswordVisibility('confirm')} className="absolute right-5 top-1/2 -translate-y-1/2 text-black/30 hover:text-[#093fb4] transition-colors">
                    {showPassword.confirm ? <EyeOff size={20} strokeWidth={2.5} /> : <Eye size={20} strokeWidth={2.5} />}
                  </button>
                </div>
              </div>

              {passwordStatus && (
                <div className={`p-5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-3 animate-in fade-in zoom-in-95 ${
                  passwordStatus.type === 'error' 
                    ? 'bg-red-50 border-2 border-red-200 text-red-600' 
                    : 'bg-emerald-50 border-2 border-emerald-200 text-emerald-600'
                }`}>
                  {passwordStatus.type === 'error' 
                    ? <X size={20} strokeWidth={2.5} className="shrink-0" />
                    : <CheckCircle2 size={20} strokeWidth={2.5} className="shrink-0" />
                  }
                  {passwordStatus.msg}
                </div>
              )}

              <div className="pt-4 mt-8 border-t-2 border-black/5">
                <button 
                  type="submit" 
                  disabled={isChangingPassword}
                  className="w-full bg-[#093fb4] hover:bg-[#073496] disabled:bg-[#093fb4]/70 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-[#093fb4]/25 active:scale-95 uppercase text-sm tracking-[0.2em] flex items-center justify-center gap-3"
                >
                  {isChangingPassword ? (
                    <><Loader2 size={20} className="animate-spin" strokeWidth={2.5}/> Updating Password...</>
                  ) : (
                    <>Update Password <ChevronRight size={20} strokeWidth={2.5}/></>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* --- SECTION 2: MULTI-FACTOR AUTHENTICATION --- */}
        {activeTab === 'mfa' && (
          <div className="bg-white/70 backdrop-blur-xl border-2 border-white/80 rounded-[2.5rem] shadow-2xl p-8 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-300">
            
            <div className={`p-8 rounded-[2rem] border-4 transition-all duration-300 ${is2FAEnabled ? 'border-[#093fb4]/20 bg-[#093fb4]/5' : 'border-black/5 bg-white/60'}`}>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-300 ${is2FAEnabled ? 'bg-[#093fb4] text-white shadow-lg shadow-[#093fb4]/25' : 'bg-black/10 text-black/40'}`}>
                    <ShieldCheck size={28} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="font-black text-black text-xl md:text-2xl uppercase tracking-tight">Two-Step Verification</h3>
                    <p className="text-[10px] text-black/50 font-black uppercase tracking-[0.2em] mt-1">
                      Require a code every time you log in.
                    </p>
                  </div>
                </div>
                
                <button 
                  type="button"
                  onClick={handleToggleMFA} 
                  className={`w-16 h-8 rounded-full transition-all relative shrink-0 ${is2FAEnabled ? 'bg-[#093fb4]' : 'bg-black/20'}`}
                >
                  <div className={`absolute top-1 bg-white w-6 h-6 rounded-full transition-all shadow-sm ${is2FAEnabled ? 'left-9' : 'left-1'}`} />
                </button>
              </div>

              {is2FAEnabled && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 pt-8 border-t-2 border-black/5">
                  <p className="text-[10px] font-black text-black/50 uppercase tracking-[0.2em] mb-4">
                    Select Primary MFA Method
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button 
                      type="button"
                      onClick={() => handleMethodChange('email')}
                      className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all group ${
                        method === 'email' 
                          ? 'border-[#093fb4] bg-white text-[#093fb4] shadow-md' 
                          : 'border-transparent bg-black/5 text-black/40 hover:bg-black/10 hover:text-black/70'
                      }`}
                    >
                      <Mail size={28} strokeWidth={2.5} className={method === 'email' ? '' : 'group-hover:scale-110 transition-transform'} /> 
                      <span className="text-[10px] font-black uppercase tracking-widest">Email (Gmail)</span>
                    </button>
                    
                    <button 
                      type="button"
                      onClick={() => handleMethodChange('sms')}
                      className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all group ${
                        method === 'sms' 
                          ? 'border-[#093fb4] bg-white text-[#093fb4] shadow-md' 
                          : 'border-transparent bg-black/5 text-black/40 hover:bg-black/10 hover:text-black/70'
                      }`}
                    >
                      <MessageSquare size={28} strokeWidth={2.5} className={method === 'sms' ? '' : 'group-hover:scale-110 transition-transform'} /> 
                      <span className="text-[10px] font-black uppercase tracking-widest">SMS Text</span>
                    </button>

                    <button 
                      type="button"
                      onClick={() => handleMethodChange('otp')}
                      className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all group ${
                        method === 'otp' 
                          ? 'border-[#093fb4] bg-white text-[#093fb4] shadow-md' 
                          : 'border-transparent bg-black/5 text-black/40 hover:bg-black/10 hover:text-black/70'
                      }`}
                    >
                      <Smartphone size={28} strokeWidth={2.5} className={method === 'otp' ? '' : 'group-hover:scale-110 transition-transform'} /> 
                      <span className="text-[10px] font-black uppercase tracking-widest">Auth App</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}