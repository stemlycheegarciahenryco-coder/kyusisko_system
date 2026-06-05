import React, { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import api from '../api';

export default function EditFamilyModal({ onClose, studentData, onRefresh }) {
  const [form, setForm] = useState({
    mother_name: studentData?.mother_name || '',
    mother_contact: studentData?.mother_contact || '',
    mother_occupation: studentData?.mother_occupation || '',
    father_name: studentData?.father_name || '',
    father_contact: studentData?.father_contact || '',
    father_occupation: studentData?.father_occupation || '',
    guardian_name: studentData?.guardian_name || '',
    guardian_contact: studentData?.guardian_contact || '',
    guardian_occupation: studentData?.guardian_occupation || '',
    house_address: studentData?.house_address || ''
  });

  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Enforces 11 digits maximum, starting with 9, stripping all text/escape chars
  const handleContactChange = (field, value) => {
    // Strip out everything except numbers
    let cleaned = value.replace(/\D/g, '');

    // Prevent input entirely if the first number typed isn't 9
    if (cleaned.length > 0 && cleaned[0] !== '9') {
      return;
    }

    // Enforce maximum length constraint of 11 characters
    if (cleaned.length > 11) {
      cleaned = cleaned.slice(0, 11);
    }

    setForm(prev => ({ ...prev, [field]: cleaned }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    // Validates phone field requirements before processing submission payload
    const phoneFields = ['mother_contact', 'father_contact', 'guardian_contact'];
    for (const key of phoneFields) {
      const val = form[key];
      if (val && val.length !== 11) {
        setErrorMsg("Contact numbers must be exactly 11 digits long and start with 9.");
        setSaving(false);
        return;
      }
    }

    try {
      const studentId = localStorage.getItem('studentId');
      await api.put(`/students/parent-profile/${studentId}`, form);
      setShowSuccess(true);
    } catch (err) {
      console.error("Error saving family profile info:", err);
      if (err.response?.data?.error) {
        setErrorMsg(err.response.data.error);
      } else {
        setErrorMsg("Failed to update family records. Please check inputs.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    onClose();
    if (onRefresh) onRefresh(); 
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-5 overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden my-auto transition-all">
        
        {showSuccess ? (
          <div className="p-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-[#093fb4]/10 rounded-full flex items-center justify-center text-[#093fb4] mb-5 animate-bounce">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-xl font-black text-black uppercase tracking-tight mb-2">Family Records Updated!</h3>
            <p className="text-sm text-slate-500 font-medium max-w-xs leading-relaxed mb-6">
              Your structural caregiver details and house address configurations have been safely saved.
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
              
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h2 className="text-lg font-bold text-black uppercase tracking-tight">Edit Family Structure</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Provide parents or legal guardian baseline data</p>
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#093fb4] hover:border-[#093fb4] transition-all">
                  <X size={14} />
                </button>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3.5 bg-red-50 border border-red-100 text-red-600 text-xs font-semibold rounded-xl">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* ── MOTHER SECTION ── */}
                <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-100 space-y-3">
                  <p className="text-[10px] font-black text-[#093fb4] uppercase tracking-wider">Mother's Information (Optional)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Mother's Full Name"
                      className="p-2.5 bg-white rounded-lg border border-slate-200 focus:border-[#093fb4] outline-none text-xs font-medium text-black transition-all sm:col-span-2"
                      value={form.mother_name}
                      onChange={e => setForm({ ...form, mother_name: e.target.value })}
                    />
                    <input
                      type="text"
                      maxLength={11}
                      placeholder="Contact Number (e.g. 9123456789)"
                      className="p-2.5 bg-white rounded-lg border border-slate-200 focus:border-[#093fb4] outline-none text-xs font-medium text-black transition-all"
                      value={form.mother_contact}
                      onChange={e => handleContactChange('mother_contact', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Occupation"
                      className="p-2.5 bg-white rounded-lg border border-slate-200 focus:border-[#093fb4] outline-none text-xs font-medium text-black transition-all"
                      value={form.mother_occupation}
                      onChange={e => setForm({ ...form, mother_occupation: e.target.value })}
                    />
                  </div>
                </div>

                {/* ── FATHER SECTION ── */}
                <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-100 space-y-3">
                  <p className="text-[10px] font-black text-[#093fb4] uppercase tracking-wider">Father's Information (Optional)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Father's Full Name"
                      className="p-2.5 bg-white rounded-lg border border-slate-200 focus:border-[#093fb4] outline-none text-xs font-medium text-black transition-all sm:col-span-2"
                      value={form.father_name}
                      onChange={e => setForm({ ...form, father_name: e.target.value })}
                    />
                    <input
                      type="text"
                      maxLength={11}
                      placeholder="Contact Number (e.g. 9123456789)"
                      className="p-2.5 bg-white rounded-lg border border-slate-200 focus:border-[#093fb4] outline-none text-xs font-medium text-black transition-all"
                      value={form.father_contact}
                      onChange={e => handleContactChange('father_contact', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Occupation"
                      className="p-2.5 bg-white rounded-lg border border-slate-200 focus:border-[#093fb4] outline-none text-xs font-medium text-black transition-all"
                      value={form.father_occupation}
                      onChange={e => setForm({ ...form, father_occupation: e.target.value })}
                    />
                  </div>
                </div>

                {/* ── GUARDIAN SECTION ── */}
                <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-100/70 space-y-3">
                  <p className="text-[10px] font-black text-amber-700 uppercase tracking-wider flex items-center gap-1">
                     Guardian Backup Details <span className="text-slate-400 font-normal normal-case">(Optional)</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Guardian Full Name"
                      className="p-2.5 bg-white rounded-lg border border-slate-200 focus:border-[#093fb4] outline-none text-xs font-medium text-black transition-all sm:col-span-2"
                      value={form.guardian_name}
                      onChange={e => setForm({ ...form, guardian_name: e.target.value })}
                    />
                    <input
                      type="text"
                      maxLength={11}
                      placeholder="Guardian Contact Number"
                      className="p-2.5 bg-white rounded-lg border border-slate-200 focus:border-[#093fb4] outline-none text-xs font-medium text-black transition-all"
                      value={form.guardian_contact}
                      onChange={e => handleContactChange('guardian_contact', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Relationship / Occupation"
                      className="p-2.5 bg-white rounded-lg border border-slate-200 focus:border-[#093fb4] outline-none text-xs font-medium text-black transition-all"
                      value={form.guardian_occupation}
                      onChange={e => setForm({ ...form, guardian_occupation: e.target.value })}
                    />
                  </div>
                </div>

                {/* ── HOUSING ADDRESS FIELD ── */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#093fb4] tracking-widest mb-1.5">Family Household Address</label>
                  <textarea
                    placeholder="Enter complete family residential home address..."
                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-[#093fb4] outline-none text-xs text-black font-medium transition-all resize-none min-h-[60px]"
                    value={form.house_address}
                    onChange={e => setForm({ ...form, house_address: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-[#093fb4] text-white py-3 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-[#093fb4]/90 transition-all shadow-lg active:scale-95 disabled:opacity-60"
                >
                  {saving ? "Saving Changes..." : "Update Family Info"}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}