import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  MessageSquare, 
  ShieldCheck, 
  Smartphone, 
  Key, 
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import api from '../api'; 

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
       
        const res = await api.get(`/students/${sID}`); 
        
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
        studentId: sID, 
        two_factor_enabled: enabled, 
        preferred_2fa_method: selectedMethod 
      });
      
      console.log("Security settings updated in DB for student:", sID);
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
     
      
      await api.put(`/students/change-password`, {
        studentId: sID,
        currentPassword,
        newPassword
      });

      setPasswordStatus({ type: 'success', msg: "Password updated successfully!" });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
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

  if (loading) return <div className="p-10 text-slate-500 font-bold text-center">Loading Security Settings...</div>;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      

      {/* --- TAB NAVIGATION --- */}
      <div className="flex space-x-2 mb-8 bg-slate-100 p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('password')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'password' 
              ? 'bg-white text-slate-900 shadow-sm' 
              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'
          }`}
        >
          <Key size={18} />
          Change Password
        </button>
        <button
          onClick={() => setActiveTab('mfa')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'mfa' 
              ? 'bg-white text-slate-900 shadow-sm' 
              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'
          }`}
        >
          <ShieldCheck size={18} />
          Two-Factor Auth
        </button>
      </div>

      <div className="space-y-8 relative">
        
        {/* --- SECTION 1: CHANGE PASSWORD --- */}
        {activeTab === 'password' && (
         <div className="min-h-[480px] bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 rounded-2xl bg-slate-100 text-slate-600">
                <Key size={24} />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-xl tracking-tight">Change Password</h3>
                <p className="text-xs text-slate-500 font-bold mt-1">Ensure your account is using a long, random password.</p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-md">
              
              {/* Current Password */}
              <div className="space-y-2 relative">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Current Password</label>
                <div className="relative group">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <input 
                    type={showPassword.current ? "text" : "password"} 
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all font-bold text-slate-700 text-sm"
                  />
                  <button type="button" onClick={() => togglePasswordVisibility('current')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600">
                    {showPassword.current ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2 relative">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">New Password</label>
                <div className="relative group">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <input 
                    type={showPassword.new ? "text" : "password"} 
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all font-bold text-slate-700 text-sm"
                  />
                  <button type="button" onClick={() => togglePasswordVisibility('new')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600">
                    {showPassword.new ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-2 relative">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Confirm New Password</label>
                <div className="relative group">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <input 
                    type={showPassword.confirm ? "text" : "password"} 
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all font-bold text-slate-700 text-sm"
                  />
                  <button type="button" onClick={() => togglePasswordVisibility('confirm')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600">
                    {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {passwordStatus && (
                <div className={`p-4 rounded-xl text-xs font-black uppercase tracking-wide border ${passwordStatus.type === 'error' ? 'bg-red-50/50 border-red-200 text-red-600' : 'bg-emerald-50/50 border-emerald-200 text-emerald-600'}`}>
                  {passwordStatus.msg}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isChangingPassword}
                className="w-full bg-slate-900 hover:bg-black text-white font-black py-3.5 rounded-2xl transition-all disabled:opacity-50 text-xs tracking-wider uppercase mt-4"
              >
                {isChangingPassword ? 'Updating...' : 'Save New Password'}
              </button>
            </form>
          </div>
        )}

        {/* --- SECTION 2: MULTI-FACTOR AUTHENTICATION --- */}
        {activeTab === 'mfa' && (
          <div className="min-h-[480px] bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className={`p-8 rounded-[2rem] border-2 transition-all ${is2FAEnabled ? 'border-blue-600 bg-blue-50/30' : 'border-slate-100 bg-slate-50'}`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${is2FAEnabled ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-xl tracking-tight">Two-Step Verification</h3>
                    <p className="text-xs text-slate-500 font-bold mt-1">Receive a code every time you log in to secure your account.</p>
                  </div>
                </div>
                
                <button onClick={handleToggleMFA} className={`w-14 h-8 rounded-full transition-all relative ${is2FAEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}>
                  <div className={`absolute top-1 bg-white w-6 h-6 rounded-full transition-all ${is2FAEnabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              {is2FAEnabled && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 pt-4 border-t border-slate-200/50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Primary MFA Method</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button 
                      onClick={() => handleMethodChange('email')}
                      className={`flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 transition-all ${method === 'email' ? 'border-blue-600 bg-white text-blue-600 shadow-sm' : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'}`}
                    >
                      <Mail size={24} /> 
                      <span className="text-xs font-black tracking-wide">Email (Gmail)</span>
                    </button>
                    
                    <button 
                      onClick={() => handleMethodChange('sms')}
                      className={`flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 transition-all ${method === 'sms' ? 'border-blue-600 bg-white text-blue-600 shadow-sm' : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'}`}
                    >
                      <MessageSquare size={24} /> 
                      <span className="text-xs font-black tracking-wide">SMS Text</span>
                    </button>

                    <button 
                      onClick={() => handleMethodChange('otp')}
                      className={`flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 transition-all ${method === 'otp' ? 'border-blue-600 bg-white text-blue-600 shadow-sm' : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'}`}
                    >
                      <Smartphone size={24} /> 
                      <span className="text-xs font-black tracking-wide">Authenticator App</span>
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