import React, { useState, useEffect } from 'react';
import { Mail, MessageSquare, ShieldCheck } from 'lucide-react';
import api from '../api'; // Ensure this points to your axios instance

export default function StudentSettings() {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [method, setMethod] = useState('email');
  const [loading, setLoading] = useState(true);

  // 1. Fetch current settings when page loads
  useEffect(() => {
    const fetchSettings = async () => {
    try {
      // Get the stored ID from login
      const sID = localStorage.getItem('studentId'); 
      
      // Use the actual ID number in the URL so getStudentById works
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

  // 2. Function to save changes to the DB
  const saveSecuritySettings = async (enabled, selectedMethod) => {
    try {
      const sID = localStorage.getItem('studentId'); // GET THE ID HERE
      
      await api.put('/students/update-2fa', { 
        studentId: sID, // SEND THE ID TO THE BACKEND
        two_factor_enabled: enabled, 
        preferred_2fa_method: selectedMethod 
      });
      
      console.log("Security settings updated in DB for student:", sID);
    } catch (err) {
      console.error("Save Error:", err);
      alert("Failed to save security settings");
    }
  };

  const handleToggle = () => {
    const nextState = !is2FAEnabled;
    setIs2FAEnabled(nextState);
    saveSecuritySettings(nextState, method);
  };

  const handleMethodChange = (newMethod) => {
    setMethod(newMethod);
    saveSecuritySettings(is2FAEnabled, newMethod);
  };

  if (loading) return <div className="p-10 text-white text-center">Loading Security...</div>;

  return (
    // jek: full width, responsive padding for all devices
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-200">
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">Security</h2>
        <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mb-10">Two-Step Verification</p>

        <div className="space-y-6">
          <div className={`p-8 rounded-[2rem] border-2 transition-all ${is2FAEnabled ? 'border-blue-600 bg-blue-50/30' : 'border-slate-100 bg-slate-50'}`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${is2FAEnabled ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900">Double-Check Login</h3>
                  <p className="text-xs text-slate-500 font-bold">Receive a code every time you log in</p>
                </div>
              </div>
              
              <button onClick={handleToggle} className={`w-14 h-8 rounded-full transition-all relative ${is2FAEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}>
                <div className={`absolute top-1 bg-white w-6 h-6 rounded-full transition-all ${is2FAEnabled ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            {is2FAEnabled && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Select Method</p>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => handleMethodChange('email')}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${method === 'email' ? 'border-blue-600 bg-white text-blue-600' : 'border-transparent bg-white/50 text-slate-400'}`}
                  >
                    <Mail size={20} /> <span className="text-sm font-black">GMAIL</span>
                  </button>
                  
                  {/*<button 
                    onClick={() => handleMethodChange('sms')}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${method === 'sms' ? 'border-blue-600 bg-white text-blue-600' : 'border-transparent bg-white/50 text-slate-400'}`}
                  >
                    <MessageSquare size={18} /> <span className="text-xs font-black">SMS</span>
                  </button>*/}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}