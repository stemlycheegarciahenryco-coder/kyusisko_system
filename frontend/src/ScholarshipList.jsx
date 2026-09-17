import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import api from './api';
import { ArrowRight, Bookmark, AlertTriangle, Building2Icon, CheckCircle2, Calendar, X, MoreVertical } from 'lucide-react';
import StudentSideNotif from './student/StudentSideNotif';

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

  const handleCheckboxChange = (reason) => {
    setReportModal(prev => {
      const exists = prev.selectedReasons.includes(reason);
      const updated = exists 
        ? prev.selectedReasons.filter(r => r !== reason) 
        : [...prev.selectedReasons, reason];
      return { ...prev, selectedReasons: updated };
    });
  };

  const handleSelectAll = () => {
    if (reportModal.selectedReasons.length === PREDEFINED_REPORTS.length) {
      setReportModal(prev => ({ ...prev, selectedReasons: [] }));
    } else {
      setReportModal(prev => ({ ...prev, selectedReasons: [...PREDEFINED_REPORTS] }));
    }
  };

  const submitReport = async () => {
    const finalReasons = [...reportModal.selectedReasons];
    if (reportModal.otherReason.trim()) {
      finalReasons.push(reportModal.otherReason.trim());
    }

    if (finalReasons.length === 0) {
      alert("Please select at least one reason or type an explanation.");
      return;
    }

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
        <div className="text-center font-black text-black/40 animate-pulse py-20 uppercase tracking-[0.2em] text-xs">
          Searching Programs for you...
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <AlertTriangle size={40} className="text-red-500" strokeWidth={2.5} />
          <p className="font-black text-black uppercase tracking-[0.2em] text-sm">Failed to Load</p>
          <p className="text-black/50 text-xs font-bold max-w-xs leading-relaxed">{error}</p>
          <button
            onClick={fetchScholarships}
            className="mt-4 px-8 py-3 bg-[#093fb4] text-white font-black rounded-xl uppercase text-xs tracking-[0.2em] hover:bg-[#073496] active:scale-95 transition-all shadow-lg"
          >
            Retry
          </button>
        </div>
      );
    }

    if (scholarships.length === 0) {
      return (
        <div className="flex flex-col items-center gap-4 py-24 text-center bg-white/40 border-2 border-dashed border-white/80 rounded-[2.5rem]">
          <CheckCircle2 size={48} className="text-black/20" strokeWidth={2} />
          <p className="font-black text-black/50 uppercase tracking-[0.2em] text-sm">No Scholarships Available</p>
          <p className="text-black/40 text-xs font-bold max-w-xs leading-relaxed">
            Check back later — new programs are added regularly.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6 font-['Inter']">
        {scholarships.map((s) => {
          return (
            <div
              key={s.id}
              className={`bg-white/80 backdrop-blur-xl rounded-[2.5rem] border-2 shadow-xl p-8 md:p-10 transition-all hover:shadow-2xl relative overflow-hidden ${
                s.is_best_match ? 'border-[#093fb4] shadow-blue-900/10' : 'border-white/80'
              }`}
            >
              <div className="flex flex-col gap-6">
                
                {/* Org header & Top Right Corner (Provider Type + 3-Dot Report Icon) */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-5">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center bg-black/5 border-2 border-black/5 shadow-inner shrink-0">
                      {s.org_pic ? (
                        <img src={s.org_pic} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl font-black text-black/30">
                          {s.org_name?.substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-col justify-center gap-2">
                      <h1 className="text-[#093fb4] text-2xl font-black uppercase tracking-tight leading-none">
                        {s.org_name}
                      </h1>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#093fb4]/10 border-2 border-[#093fb4]/20 rounded-xl text-[#093fb4] font-black text-[10px] uppercase tracking-[0.2em] w-fit">
                        <Building2Icon size={14} strokeWidth={2.5} /> {s.provider_type || 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <button 
                      onClick={() => setReportModal({ open: true, id: s.id, selectedReasons: [], otherReason: '' })} 
                      className="p-3 rounded-2xl bg-black/5 text-black/40 hover:text-red-600 hover:bg-red-50 transition-all border-2 border-transparent"
                      title="Report this scholarship"
                    >
                      <MoreVertical size={20} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>

                {/* Matched criteria centered */}
                {s.matched_criteria?.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2 pt-2">
                    {s.matched_criteria.map((c, idx) => (
                      <span
                        key={`matched-${idx}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-green-500/10 text-green-700 border-2 border-green-500/20"
                      >
                        <CheckCircle2 size={14} strokeWidth={3} />
                        {c}
                      </span>
                    ))}
                  </div>
                )}

                {/* Title (Program Name) directly below criteria - CENTERED */}
                <div className="flex flex-col items-center justify-center text-center">
                  <h3 className="text-3xl md:text-4xl font-black text-black leading-tight tracking-tight max-w-2xl uppercase">
                    {s.title}
                  </h3>
                </div>

                {/* PROMINENT RED DEADLINE */}
                <div className="flex items-center justify-center gap-2 text-red-600 font-black text-xs uppercase tracking-[0.2em] bg-red-50 py-3 px-6 rounded-2xl border-2 border-red-200 w-fit mx-auto mt-2 mb-2 shadow-sm">
                  <Calendar size={18} strokeWidth={2.5} />
                  <span>
                    Deadline: {new Date(s.deadline).toLocaleDateString('en-US', {
                      month: 'short', day: '2-digit', year: 'numeric'
                    })}
                  </span>
                </div>

                {/* Description */}
                <div className="p-6 bg-black/5 rounded-2xl border-2 border-transparent w-full">
                  <p className="text-sm text-black/70 leading-relaxed text-justify line-clamp-3 font-bold italic">
                    "{s.description || "No description provided for this scholarship."}"
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t-2 border-black/5">
                  <button 
                    onClick={() => handleSaveToggle(s.id, s.is_saved)}
                    className={`flex-none px-8 py-4 font-black rounded-2xl flex items-center justify-center gap-2 uppercase text-xs tracking-[0.2em] transition-all border-2 ${
                      s.is_saved 
                        ? 'bg-[#093fb4] border-[#093fb4] text-white shadow-xl shadow-[#093fb4]/25' 
                        : 'bg-white/60 border-black/10 text-black/60 hover:border-[#093fb4]/50 hover:text-[#093fb4] hover:bg-white'
                    }`}
                  >
                    <Bookmark 
                      size={18} 
                      strokeWidth={2.5}
                      fill={s.is_saved ? "white" : "none"} 
                      className={s.is_saved ? "animate-in zoom-in duration-300" : ""}
                    /> 
                    {s.is_saved ? 'Saved' : 'Save'}
                  </button>
                  
                  <button 
                    onClick={() => navigate(`/apply/${s.id}`)}
                    className="flex-1 bg-[#093fb4] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 uppercase text-xs tracking-[0.2em] hover:bg-[#073496] transition-all shadow-xl shadow-[#093fb4]/25 active:scale-95"
                  >
                    View and Apply <ArrowRight size={18} strokeWidth={2.5} />
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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-['Inter']"
          onClick={() => setReportModal({ open: false, id: null, selectedReasons: [], otherReason: '' })}
        >
          {/* 
              FIXED: Reduced max-w-xl to max-w-lg (narrower). 
              Added max-h-[90vh] overflow-y-auto to guarantee it never stretches off-screen.
              Reduced padding to p-6 md:p-8 
          */}
          <div 
            className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[2rem] p-6 md:p-8 shadow-2xl border-4 border-black/5 animate-in fade-in zoom-in-95 duration-200 custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-black text-black uppercase tracking-tight leading-none">Report Program</h2>
              <button 
                onClick={() => setReportModal({ open: false, id: null, selectedReasons: [], otherReason: '' })} 
                className="w-10 h-10 rounded-2xl bg-black/5 flex items-center justify-center text-black/40 hover:text-red-600 hover:bg-red-50 transition-all border-2 border-transparent shrink-0"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <div className="mb-4 pb-2 border-b-2 border-black/5">
              <p className="text-black/50 text-[10px] font-black uppercase tracking-[0.2em]">Select reasons for reporting</p>
            </div>

            {/* FIXED: Reduced list max-height to max-h-[200px] */}
            <div className="space-y-3 mb-6 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
              
              <label 
                className={`flex items-start gap-4 p-4 rounded-2xl border-2 text-xs font-black cursor-pointer transition-all ${
                  isAllSelected 
                    ? 'bg-[#093fb4]/10 border-[#093fb4] text-[#093fb4]' 
                    : 'bg-black/5 border-transparent text-black/70 hover:border-black/10'
                }`}
              >
                <input 
                  type="checkbox" 
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  className="mt-0.5 rounded border-black/20 text-[#093fb4] focus:ring-[#093fb4] h-5 w-5 shrink-0 cursor-pointer"
                />
                <span className="leading-tight select-none uppercase tracking-wider">Select All Reasons</span>
              </label>

              <div className="border-t-2 border-black/5 my-2" />

              {PREDEFINED_REPORTS.map((reason, index) => {
                const isChecked = reportModal.selectedReasons.includes(reason);
                return (
                  <label 
                    key={index} 
                    className={`flex items-start gap-4 p-4 rounded-2xl border-2 text-xs font-bold cursor-pointer transition-all ${
                      isChecked 
                        ? 'bg-[#093fb4]/10 border-[#093fb4] text-[#093fb4]' 
                        : 'bg-black/5 border-transparent text-black/70 hover:border-black/10'
                    }`}
                  >
                    <input 
                      type="checkbox" 
                      checked={isChecked}
                      onChange={() => handleCheckboxChange(reason)}
                      className="mt-0.5 rounded border-black/20 text-[#093fb4] focus:ring-[#093fb4] h-5 w-5 shrink-0 cursor-pointer"
                    />
                    <span className="leading-tight select-none">{reason}</span>
                  </label>
                );
              })}
            </div>

            <p className="text-black/50 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Other Details / Specific Reasons</p>
            {/* FIXED: Reduced textarea height slightly to save space */}
            <textarea 
              className="w-full h-24 p-5 rounded-2xl bg-black/5 border-2 border-transparent focus:border-[#093fb4] focus:bg-white text-sm font-bold text-black placeholder-black/30 transition-all outline-none resize-none mb-6 shadow-sm"
              placeholder="Provide additional details or specify other reasons here..."
              value={reportModal.otherReason}
              onChange={(e) => setReportModal({ ...reportModal, otherReason: e.target.value })}
            />

            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => setReportModal({ open: false, id: null, selectedReasons: [], otherReason: '' })}
                className="flex-1 py-3.5 bg-black/5 text-black/60 hover:bg-black/10 font-black rounded-2xl uppercase text-xs tracking-[0.2em] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={submitReport}
                className="flex-[2] py-3.5 bg-red-600 text-white font-black rounded-2xl uppercase text-xs tracking-[0.2em] hover:bg-red-700 transition-all shadow-xl shadow-red-900/20 active:scale-95"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_260px] gap-8 items-start w-full">
        <main className="w-full min-w-0">
          {renderContent()}
        </main>
        <div className="hidden xl:block w-full self-start xl:sticky xl:top-24">
          <StudentSideNotif />
        </div>
      </div>
    </>
  );
}