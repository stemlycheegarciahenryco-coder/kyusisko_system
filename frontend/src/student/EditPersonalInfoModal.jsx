import React, { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import api from '../api';

export default function EditPersonalInfoModal({ onClose, studentData }) {
  const [form, setForm] = useState({
    scontact_number: studentData?.scontact_number || '',
    sstreet: studentData?.sstreet || '',
    sbarangay: studentData?.sbarangay || '',
    sgender: studentData?.sgender || '',
    religion: studentData?.religion || '',
    other_religion: studentData?.other_religion || ''
  });

  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Enforces 11 digits maximum, starting with 9
  const handleContactChange = (value) => {
    let cleaned = value.replace(/\D/g, '');
    if (cleaned.length > 0 && cleaned[0] !== '9') return;
    if (cleaned.length > 11) cleaned = cleaned.slice(0, 11);
    setForm(prev => ({ ...prev, scontact_number: cleaned }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    if (form.scontact_number && form.scontact_number.length !== 11) {
      setErrorMsg("Contact number must be exactly 11 digits long and start with 9.");
      setSaving(false);
      return;
    }

    try {
      const studentId = localStorage.getItem('studentId');
      await api.put(`/students/personal-info/${studentId}`, form);
      setShowSuccess(true);
    } catch (err) {
      console.error("Error updating personal info:", err);
      setErrorMsg("Failed to update records. Please check your inputs.");
    } finally {
      setSaving(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    window.location.reload(); 
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-5 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden my-auto transition-all">
        
        {showSuccess ? (
          <div className="p-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-[#093fb4]/10 rounded-full flex items-center justify-center text-[#093fb4] mb-5 animate-bounce">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-xl font-black text-black uppercase tracking-tight mb-2">Information Updated!</h3>
            <p className="text-sm text-slate-500 font-medium max-w-xs leading-relaxed mb-6">
              Your personal criteria and demographics have been saved successfully.
            </p>
            <button
              onClick={handleSuccessClose}
              className="w-full max-w-xs bg-[#093fb4] text-white py-3 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-[#093fb4]/90 transition-all shadow-md active:scale-95"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="h-1 bg-[#093fb4]" />
            <div className="p-7 max-h-[85vh] overflow-y-auto scrollbar-thin text-left">
              
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-bold text-black uppercase tracking-tight">Edit Personal Info</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Update your baseline demographics</p>
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#093fb4] hover:border-[#093fb4] transition-all">
                  <X size={14} />
                </button>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-semibold rounded-xl">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#093fb4] tracking-widest mb-1.5">Contact Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 9123456789"
                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-[#093fb4] outline-none text-sm font-medium text-black transition-all"
                    value={form.scontact_number}
                    onChange={e => handleContactChange(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#093fb4] tracking-widest mb-1.5">Street Address</label>
                    <input
                      type="text"
                      placeholder="House No. & Street"
                      className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-[#093fb4] outline-none text-sm font-medium text-black transition-all"
                      value={form.sstreet}
                      onChange={e => setForm({ ...form, sstreet: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#093fb4] tracking-widest mb-1.5">Barangay</label>
                    <input
                      type="text"
                      placeholder="Barangay"
                      className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-[#093fb4] outline-none text-sm font-medium text-black transition-all"
                      value={form.sbarangay}
                      onChange={e => setForm({ ...form, sbarangay: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#093fb4] tracking-widest mb-1.5">Gender</label>
                    <select
                      className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-[#093fb4] outline-none text-sm font-medium text-slate-800 cursor-pointer transition-all"
                      value={form.sgender}
                      onChange={e => setForm({ ...form, sgender: e.target.value })}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Non-Binary">Non-Binary</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#093fb4] tracking-widest mb-1.5">Religion</label>
                    <select
                      className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-[#093fb4] outline-none text-sm font-medium text-slate-800 cursor-pointer transition-all"
                      value={form.religion}
                      onChange={e => setForm({ ...form, religion: e.target.value, other_religion: e.target.value === 'Others' ? form.other_religion : '' })}
                    >
                      <option value="">Select Religion</option>
                      <option value="Roman Catholic">Roman Catholic</option>
                      <option value="Iglesia ni Cristo">Iglesia ni Cristo</option>
                      <option value="Islam">Islam</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                </div>

                {form.religion === 'Others' && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#093fb4] tracking-widest mb-1.5">Specify Religion</label>
                    <input
                      type="text"
                      placeholder="Enter religion..."
                      className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-[#093fb4] outline-none text-sm font-medium text-black transition-all"
                      value={form.other_religion}
                      onChange={e => setForm({ ...form, other_religion: e.target.value })}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-[#093fb4] text-white py-3 mt-4 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-[#093fb4]/90 transition-all shadow-lg active:scale-95 disabled:opacity-60"
                >
                  {saving ? "Saving Changes..." : "Save Information"}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}