import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import api from './api';
import { ArrowRight, Bookmark, AlertTriangle, CheckCircle2, Mail, Phone, Calendar, X } from 'lucide-react';
import StudentTopNav from './student/StudentTopNav';
import StudentLeftProfile from './student/StudentLeftProfile';
import StudentRecommendations from './student/StudentRecommendations';

export default function ScholarshipList() {
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportModal, setReportModal] = useState({ open: false, id: null, reason: '' });
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

  const submitReport = async () => {
    if (!reportModal.reason.trim()) return;
    try {
      await api.post(`/recommendations/${reportModal.id}/report`, { reason: reportModal.reason });
      alert("Report submitted successfully.");
      setReportModal({ open: false, id: null, reason: '' });
    } catch (err) {
      console.error("Report error:", err);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center font-black text-slate-400 animate-pulse py-20 uppercase tracking-widest text-xs">
          Scanning Programs...
        </div>
      );
    }

    // 👇 NOW YOU CAN SEE WHAT WENT WRONG
    if (error) {
      return (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <AlertTriangle size={32} className="text-red-400" />
          <p className="font-black text-slate-700 uppercase tracking-widest text-xs">Failed to Load</p>
          <p className="text-slate-400 text-xs max-w-xs">{error}</p>
          <button
            onClick={fetchScholarships}
            className="mt-2 px-6 py-2.5 bg-[#093fb4] text-white font-black rounded-xl uppercase text-[10px] tracking-widest hover:bg-[#FF1E1E] transition-all"
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
          const criteriaList = s.criteria
            ? (typeof s.criteria === 'string'
                ? s.criteria.split(',').map(c => c.trim())
                : s.criteria)
            : [];

          return (
            <div
              key={s.id}
              className="bg-white rounded-3xl border border-black/5 shadow-sm p-6 transition-all hover:shadow-md relative overflow-hidden"
            >
              <button 
                onClick={() => setReportModal({ open: true, id: s.id, reason: '' })} 
                className="absolute top-6 right-6 p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all z-10"
                title="Report this scholarship"
              >
                <AlertTriangle size={18} />
              </button>

              <div className="flex flex-col gap-5">
                {/* Org header */}
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center bg-white border border-slate-100 shadow-sm shrink-0">
                    {s.org_pic ? (
                      <img src={`http://localhost:5000/${s.org_pic}`} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-black text-slate-300">
                        {s.org_name?.substring(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col justify-center">
                    <h1 className="text-[#093fb4] text-[16px] font-black uppercase tracking-tight leading-tight">
                      {s.org_name}
                    </h1>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                      <div className="flex items-center gap-1.5 text-slate-700 font-bold text-[12px]">
                        <Mail size={12} className="text-[#093fb4]" /> {s.org_email || 'N/A'}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-700 font-bold text-[12px]">
                        <Phone size={12} className="text-[#093fb4]" /> {s.org_contact || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Title + criteria tags */}
                <div className="flex flex-col items-center justify-center gap-4 py-2">
                  <h3 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight tracking-tight text-center max-w-2xl">
                    {s.title}
                  </h3>
                  {criteriaList.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {criteriaList.slice(0, 4).map((tag, idx) => (
                        <span
                          key={idx}
                          className="flex items-center gap-1 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-[9px] font-black text-[#093fb4] uppercase"
                        >
                          <CheckCircle2 size={10} strokeWidth={3} className="shrink-0" /> {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 w-full">
                  <p className="text-sm text-slate-800 leading-relaxed text-justify line-clamp-3 font-medium">
                    {s.description || "No description provided for this scholarship."}
                  </p>
                </div>

                {/* Deadline */}
                <div className="flex items-center justify-center py-2 border-y border-dashed border-slate-200">
                  <div className="flex items-center gap-2 text-[#FF1E1E] font-black text-[10px] uppercase tracking-[0.15em]">
                    <Calendar size={14} />
                    Deadline: {new Date(s.deadline).toLocaleDateString('en-US', {
                      month: 'long', day: 'numeric', year: 'numeric'
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleSaveToggle(s.id, s.is_saved)}
                    className={`flex-none px-8 py-4 font-black rounded-2xl flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest transition-all ${
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
                    className="flex-1 bg-[#093fb4] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest hover:bg-[#FF1E1E] transition-all shadow-lg shadow-blue-900/10"
                  >
                    Apply Now <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-['Inter']">
      <StudentTopNav />

      {/* REPORT MODAL */}
      {reportModal.open && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setReportModal({ open: false, id: null, reason: '' })}
        >
          <div 
            className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Report Program</h2>
              <button 
                onClick={() => setReportModal({ open: false, id: null, reason: '' })} 
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={20} className="text-slate-700" />
              </button>
            </div>
            <p className="text-slate-700 text-xs mb-4 font-bold uppercase tracking-wider">Reason for reporting</p>
            <textarea 
              className="w-full h-32 p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-red-500 focus:outline-none text-sm font-semibold mb-6 resize-none"
              placeholder="e.g. This scholarship is already closed or contains suspicious links..."
              value={reportModal.reason}
              onChange={(e) => setReportModal({ ...reportModal, reason: e.target.value })}
            />
            <div className="flex gap-3">
              <button 
                onClick={() => setReportModal({ open: false, id: null, reason: '' })}
                className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={submitReport}
                className="flex-[2] py-4 bg-red-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-900/20"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-6 items-start">
        <div className="w-full lg:sticky lg:top-24">
          <StudentLeftProfile />
        </div>
        <main className="w-full min-w-0">
          {renderContent()}
        </main>
        <div className="hidden lg:block w-full self-start lg:sticky lg:top-24">
          <StudentRecommendations />
        </div>
      </div>
    </div>
  );
}