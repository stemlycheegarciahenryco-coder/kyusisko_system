import React, { useState } from 'react';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import axios from 'axios';

export default function OTPVerification({ studentId, method, onVerified, onCancel }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle digit input
  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;
    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

    // Focus next input automatically
    if (element.nextSibling) {
      element.nextSibling.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const code = otp.join('');
      const res = await axios.post('/api/students/verify-otp', { studentId, code });
      
      if (res.data.token) {
        onVerified(res.data); // Pass token/student data back to parent
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid Code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto p-8 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-300">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShieldCheck size={32} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Security Check</h2>
        <p className="text-slate-500 text-sm mt-2 font-medium">
          Enter the 6-digit code sent to your <span className="text-blue-600 font-bold uppercase">{method}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-between gap-2">
          {otp.map((data, index) => (
            <input
              key={index}
              type="text"
              maxLength="1"
              className="w-12 h-14 text-center text-xl font-black bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-blue-600 focus:bg-white focus:ring-0 transition-all outline-none"
              value={data}
              onChange={e => handleChange(e.target, index)}
              onFocus={e => e.target.select()}
            />
          ))}
        </div>

        {error && (
          <p className="text-red-500 text-xs font-bold text-center uppercase tracking-wider italic">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all uppercase text-xs tracking-widest disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Unlock Account'}
        </button>
      </form>

      <button 
        onClick={onCancel}
        className="mt-6 w-full flex items-center justify-center gap-2 text-slate-400 hover:text-slate-600 font-bold text-[10px] uppercase tracking-widest transition-colors"
      >
        <ArrowLeft size={14} /> Back to Login
      </button>
    </div>
  );
}