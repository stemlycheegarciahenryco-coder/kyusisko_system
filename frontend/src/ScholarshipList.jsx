import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import api from './api';
import { ArrowRight, Bookmark, AlertTriangle, Building2Icon, CheckCircle2, Calendar, X } from 'lucide-react';
import StudentRecommendations from './student/StudentRecommendations';

// 📋 Pre-defined lists of report reasons
const PREDEFINED_REPORTS = [
  "Suspicious Scholarship Program",
  "The Provider or Program required have a membership payment amount first",
  "Scam/ Fraud Account Provider or Program",
  "Social Media or Website information is not legitimate",
  "Unverified Contact Information"
];

export default function ScholarshipList() {
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // ⚙️ State structure to handle multiple checkboxes and other reasons
  const [reportModal, setReportModal] = useState({ 
    open: false, 
    id: null, 
    selectedReasons: [], 
    otherReason: '' 
  });
  const navigate = useNavigate();

  const fetchScholarships = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/recommendations/all');
      const data = res.data.data;
      setScholarships(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.response?.data?.error || err.message || 'Failed to load scholarships.');
      setScholarships([]); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchScholarships(); }, []);

  const handleSaveToggle = async (id, currentStatus) => {
    try {
      if (currentStatus) {
        await api.delete(`/recommendations/${id}/unsave`);
      } else {
        await api.post(`/recommendations/${id}/save`);
      }
      setScholarships(prev => prev.map(s => 
        s.id === id ? { ...s, is_saved: !currentStatus } : s
      ));
    } catch (err) {
      console.error("Save toggle error:", err);
      alert("Failed to update save status. Please try again.");
    }
  };

  // 🔄 Handles toggling individual reason checkboxes
  const handleCheckboxChange = (reason) => {
    setReportModal(prev => {
      const exists = prev.selectedReasons.includes(reason);
      const updated = exists 
        ? prev.selectedReasons.filter(r => r !== reason) 
        : [...prev.selectedReasons, reason];
      return { ...prev, selectedReasons: updated };
    });
  };

  // 🟦 Handles the embedded Select All checkbox toggle
  const handleSelectAll = () => {
    if (reportModal.selectedReasons.length === PREDEFINED_REPORTS.length) {
      setReportModal(prev => ({ ...prev, selectedReasons: [] }));
    } else {
      setReportModal(prev => ({ ...prev, selectedReasons: [...PREDEFINED_REPORTS] }));
    }
  };

  // 🚀 Combines checkboxes + text area details and submits report
  const submitReport = async () => {
    const finalReasons = [...reportModal.selectedReasons];
    if (reportModal.otherReason.trim()) {
      finalReasons.push(reportModal.otherReason.trim());
    }

    if (finalReasons.length === 0) {
      alert("Please select at least one reason or type an explanation.");
      return;
    }

    // Join with a recognizable separator bar
    const combinedReason = finalReasons.join(' | ');

    try {
      await api.post(`/recommendations/${reportModal.id}/report`, { reason: combinedReason });
      alert("Report submitted successfully.");
      setReportModal({ open: false, id: null, selectedReasons: [], otherReason: '' });
    } catch (err) {
      console.error("Report error:", err);
      alert("Failed to submit report. Please try again.");
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center font-black text-slate-400 animate-pulse py-20 uppercase tracking-widest text-xs">
          Scholarship Programs for you...
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <AlertTriangle size={32} className="text-red-400" />
          <p className="font-black text-slate-700 uppercase tracking-widest text-xs">Failed to Load</p>
          <p className="text-slate-400 text-xs max-w-xs">{error}</p>
          <button
            onClick={fetchScholarships}
            className="mt-2 px-6 py-2.5 bg-[#093fb4] text-white font-black rounded-xl uppercase text-[12px] tracking-widest hover:bg-[#FF1E1E] transition-all"
          >
            Retry
          </button>
        </div>
      );
    }

    if (scholarships.length === 0) {
      return (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <CheckCircle2 size={32} className="text-slate-300" />
          <p className="font-black text-slate-400 uppercase tracking-widest text-xs">No Scholarships Available</p>
          <p className="text-slate-400 text-xs max-w-xs">
            Check back later — new programs are added regularly.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        {scholarships.map((s) => {

          return (
            <div
              key={s.id}
              className={`bg-white rounded-3xl border shadow-sm p-6 transition-all hover:shadow-md relative overflow-hidden ${
                s.is_best_match ? 'border-[#093fb4]/30 shadow-blue-900/5' : 'border-black/5'
              }`}
            >
              {/* Best match banner */}
              {s.is_best_match && (
                <div className="absolute top-0 left-0 right-0 bg-[#093fb4] px-5 py-1.5 flex items-center gap-2">
                  <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">
                    ✦ Best Scholarship For You
                  </span>
                </div>
              )}

              {/* Open modal structure */}
              <button 
                onClick={() => setReportModal({ open: true, id: s.id, selectedReasons: [], otherReason: '' })} 
                className={`absolute right-6 p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all z-10 ${s.is_best_match ? 'top-14' : 'top-6'}`}
                title="Report this scholarship"
              >
                <AlertTriangle size={18} />
              </button>

              <div className={`flex flex-col gap-5 ${s.is_best_match ? 'mt-6' : ''}`}>
                {/* Org header */}
                <div className="flex items-center gap-4">
                  {/* Increased size to w-20 h-20 and made circular with rounded-full */}
                  <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center bg-white border border-slate-100 shadow-sm shrink-0">
                    {s.org_pic ? (
                      <img src={s.org_pic} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-black text-slate-300">
                        {s.org_name?.substring(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-col justify-center">
                    {/* Increased text size for org_name */}
                    <h1 className="text-[#093fb4] text-xl md:text-2xl font-black uppercase tracking-tight leading-tight">
                      {s.org_name}
                    </h1>
                    {/* Increased text size for provider_type and removed Mail/Phone */}
                    <div className="flex items-center gap-1.5 text-slate-700 font-bold text-base md:text-lg mt-1">
                      <Building2Icon size={18} className="text-[#093fb4]" /> {s.provider_type || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Title */}
                <div className="flex flex-col items-center justify-center gap-4 py-2">
                  <h3 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight tracking-tight text-center max-w-2xl">
                    {s.title}
                  </h3>
                </div>

                {/* Deadline (Moved above description) */}
                <div className="flex items-center justify-center py-2 border-y border-dashed border-slate-200">
                  <div className="flex items-center gap-2 text-[#FF1E1E] font-black text-[13px] uppercase tracking-[0.15em]">
                    <Calendar size={16} />
                    Deadline: {new Date(s.deadline).toLocaleDateString('en-US', {
                      month: 'long', day: 'numeric', year: 'numeric'
                    })}
                  </div>
                </div>

                {/* Description */}
                <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 w-full">
                  <p className="text-sm text-slate-800 leading-relaxed text-justify line-clamp-3 font-medium">
                    {s.description || "No description provided for this scholarship."}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleSaveToggle(s.id, s.is_saved)}
                    className={`flex-none px-8 py-4 font-black rounded-2xl flex items-center justify-center gap-2 uppercase text-[12px] tracking-widest transition-all ${
                      s.is_saved 
                        ? 'bg-[#093fb4] text-white shadow-lg shadow-blue-900/20' 
                        : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-[#093fb4]'
                    }`}
                  >
                    <Bookmark 
                      size={16} 
                      fill={s.is_saved ? "white" : "none"} 
                      className={s.is_saved ? "animate-in zoom-in duration-300" : ""}
                    /> 
                    {s.is_saved ? 'Saved' : 'Save'}
                  </button>
                  
                  <button 
                    onClick={() => navigate(`/apply/${s.id}`)}
                    className="flex-1 bg-[#093fb4] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 uppercase text-[12px] tracking-widest hover:bg-[#FF1E1E] transition-all shadow-lg shadow-blue-900/10"
                  >
                    View and Apply <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const isAllSelected = reportModal.selectedReasons.length === PREDEFINED_REPORTS.length;

  return (
    <>
      {/* 🛡️ MULTI-CHECKBOX REPORT MODAL */}
      {reportModal.open && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setReportModal({ open: false, id: null, selectedReasons: [], otherReason: '' })}
        >
          <div 
            className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Report Program</h2>
              <button 
                onClick={() => setReportModal({ open: false, id: null, selectedReasons: [], otherReason: '' })} 
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={20} className="text-slate-700" />
              </button>
            </div>

            {/* Checklist Label Header */}
            <div className="mb-3 pb-2 border-b border-slate-100">
              <p className="text-slate-700 text-[11px] font-black uppercase tracking-wider">Select reasons for reporting</p>
            </div>

            {/* Interactive Checkbox Layout List */}
            <div className="space-y-2 mb-5 max-h-[250px] overflow-y-auto pr-1">
              
              {/* 🔄 Embedded Select All Checkbox Row */}
              <label 
                className={`flex items-start gap-3 p-3 rounded-xl border text-xs font-black cursor-pointer transition-all ${
                  isAllSelected 
                    ? 'bg-[#093fb4]/5 border-[#093fb4] text-[#093fb4]' 
                    : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300'
                }`}
              >
                <input 
                  type="checkbox" 
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  className="mt-0.5 rounded border-slate-300 text-[#093fb4] focus:ring-[#093fb4] h-4 w-4 shrink-0 cursor-pointer"
                />
                <span className="leading-tight select-none uppercase tracking-wider text-[11px]">Select All Reasons</span>
              </label>

              {/* Decorative dividing line beneath the control checkbox */}
              <div className="border-t border-slate-100 my-1" />

              {PREDEFINED_REPORTS.map((reason, index) => {
                const isChecked = reportModal.selectedReasons.includes(reason);
                return (
                  <label 
                    key={index} 
                    className={`flex items-start gap-3 p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                      isChecked 
                        ? 'bg-blue-50/40 border-[#093fb4] text-[#093fb4]' 
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <input 
                      type="checkbox" 
                      checked={isChecked}
                      onChange={() => handleCheckboxChange(reason)}
                      className="mt-0.5 rounded border-slate-300 text-[#093fb4] focus:ring-[#093fb4] h-4 w-4 shrink-0 cursor-pointer"
                    />
                    <span className="leading-tight select-none">{reason}</span>
                  </label>
                );
              })}
            </div>

            {/* Optional Additional Textarea description */}
            <p className="text-slate-700 text-[11px] font-black uppercase tracking-wider mb-2">Other Details / Specific Reasons</p>
            <textarea 
              className="w-full h-24 p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-[#093fb4] focus:outline-none text-sm font-semibold mb-6 resize-none"
              placeholder="Provide additional details or specify other reasons here..."
              value={reportModal.otherReason}
              onChange={(e) => setReportModal({ ...reportModal, otherReason: e.target.value })}
            />

            {/* Form actions */}
            <div className="flex gap-3">
              <button 
                onClick={() => setReportModal({ open: false, id: null, selectedReasons: [], otherReason: '' })}
                className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl uppercase text-[12px] tracking-widest hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={submitReport}
                className="flex-[2] py-4 bg-red-600 text-white font-black rounded-2xl uppercase text-[12px] tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-900/20"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_260px] gap-6 items-start w-full">
        <main className="w-full min-w-0">
          {renderContent()}
        </main>
        <div className="hidden xl:block w-full self-start xl:sticky xl:top-24">
          <StudentRecommendations />
        </div>
      </div>
    </>
  );
}