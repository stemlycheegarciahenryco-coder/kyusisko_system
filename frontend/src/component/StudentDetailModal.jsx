import React, { useState } from 'react';
import { 
  CheckCircle, XCircle, Eye, FileText, Calendar, User, 
  Phone, GraduationCap, Shield, Sparkles, Loader2, 
  AlertCircle, CheckCircle2 
} from 'lucide-react';
import { STATUS_STYLES, STATUS_ICONS } from './StatusStyles';
import api from '../api'; // Ensure this matches your api config path

export default function StudentDetailModal({ 
  selected, 
  setSelected, 
  handleStatus, 
  updating, 
  rejectionReason, 
  setRejectionReason, 
  showRejectInput, 
  setShowRejectInput 
}) {
  const [aiResult, setAiResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  if (!selected) return null;

  const BASE_URL = "http://localhost:5000/";

  const openDoc = (path) => {
    if (!path) return;
    const cleanPath = path.replace(/\\/g, '/');
    window.open(`${BASE_URL}${cleanPath}`, '_blank');
  };

  // AI Verification Function
  const handleAiVerify = async () => {
    setIsAnalyzing(true);
    setAiResult(null);
    try {
      // Hits the backend route we discussed earlier
      const res = await api.post(`/verify-doc/${selected.id}`);
      setAiResult(res.data.analysis);
    } catch (err) {
      console.error("AI Analysis Failed", err);
      alert("AI could not read this document. Please verify manually.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const isHigherLevel = selected.academic_category === 'Senior High' || selected.academic_category === 'Tertiary';
  const isLowerLevel = selected.academic_category === 'Elementary' || selected.academic_category === 'Junior High';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-50">
          <div className="flex items-center gap-2 text-blue-600">
            <GraduationCap size={20} />
            <h3 className="font-black text-slate-800 tracking-tight text-lg uppercase italic">Application Review</h3>
          </div>
          <button 
            onClick={() => { setSelected(null); setShowRejectInput(false); setAiResult(null); }} 
            className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-slate-100 text-slate-400 transition-all hover:rotate-90"
          >✕</button>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          
          {/* PROFILE INFO */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="font-black text-slate-800 text-2xl leading-none">
                {selected.sfirst_name} {selected.slast_name}
              </p>
              <p className="text-slate-400 text-sm font-bold flex items-center gap-1.5 lowercase">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                {selected.student_email}
              </p>
            </div>
            <span className={`shrink-0 inline-flex items-center gap-1.5 text-[10px] font-black px-4 py-2 rounded-xl border uppercase tracking-widest ${STATUS_STYLES[selected.sstatus]}`}>
              {STATUS_ICONS[selected.sstatus]} {selected.sstatus}
            </span>
          </div>

          {/* AI ASSISTANT CARD - NEW SECTION */}
          <div className="bg-slate-900 rounded-[2rem] p-6 text-white overflow-hidden relative shadow-xl shadow-blue-900/20">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Sparkles size={16} className="text-blue-400" />
                  </div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200">KyusIsko AI Assistant</h4>
                </div>
                <button 
                  onClick={handleAiVerify}
                  disabled={isAnalyzing}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-[10px] font-black uppercase rounded-xl transition-all flex items-center gap-2"
                >
                  {isAnalyzing ? <Loader2 size={12} className="animate-spin" /> : 'Run Smart Scan'}
                </button>
              </div>

             {/* Replace the AI Result section with this version */}
{aiResult ? (
  <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-4">
    {/* Identity Status */}
    <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
      <p className="text-[8px] font-bold text-blue-300 uppercase mb-1">Identity Check</p>
      <div className="flex items-center gap-1">
        {aiResult.isMatch ? (
          <CheckCircle2 size={12} className="text-emerald-400" />
        ) : (
          <AlertCircle size={12} className="text-red-400" />
        )}
        <p className={`text-xs font-black uppercase ${aiResult.isMatch ? 'text-emerald-400' : 'text-red-400'}`}>
          {aiResult.isMatch ? 'Matched' : 'Mismatch'}
        </p>
      </div>
    </div>

    {/* Name Extraction */}
    <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
      <p className="text-[8px] font-bold text-blue-300 uppercase mb-1">Found on Doc</p>
      <p className="text-[10px] font-black uppercase truncate text-white">
        {aiResult.extractedName || 'Unknown'}
      </p>
    </div>

    {/* Document Tags Section */}
    {aiResult.foundDocTypes && aiResult.foundDocTypes.length > 0 && (
      <div className="col-span-2 flex flex-wrap gap-1.5 py-1">
        {aiResult.foundDocTypes.map((doc, i) => (
          <span key={i} className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[7px] font-black rounded-lg border border-emerald-500/20 uppercase flex items-center gap-1">
            <Shield size={8} /> {doc}
          </span>
        ))}
      </div>
    )}

    {/* GWA Extraction Card */}
    <div className="col-span-2 bg-blue-600/10 p-4 rounded-2xl border border-blue-500/20">
      <div className="flex justify-between items-center mb-3">
        <div>
          <p className="text-[8px] font-bold text-blue-300 uppercase mb-0.5">Extracted GWA</p>
          <p className="text-2xl font-black text-white">{aiResult.extractedGwa || 'N/A'}</p>
        </div>
        <div className="text-right">
          <p className="text-[8px] font-bold text-blue-300 uppercase mb-0.5">User Input</p>
          <p className="text-lg font-bold text-blue-200/50">{selected.gwa}</p>
        </div>
      </div>
      
      {/* Analysis Details */}
      <div className="pt-2 border-t border-white/5">
        <p className="text-[10px] text-blue-100 font-medium leading-relaxed">
          <span className="font-black text-blue-300 uppercase italic">Analysis:</span> {aiResult.details}
        </p>
      </div>

      {/* Specific Conflicts/Warnings */}
      {!aiResult.isMatch && aiResult.conflicts?.length > 0 && (
        <div className="mt-3 p-2 bg-red-500/10 rounded-xl border border-red-500/20">
          {aiResult.conflicts.map((err, i) => (
            <p key={i} className="text-[9px] text-red-300 flex items-center gap-2 font-bold mb-0.5 last:mb-0">
              <XCircle size={10} /> {err}
            </p>
          ))}
        </div>
      )}
    </div>
  </div>
) : (
  <div className="flex flex-col items-center justify-center py-4 border-2 border-dashed border-white/5 rounded-2xl">
    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Awaiting Smart Scan</p>
  </div>
)}
            </div>
            {/* Decoration Sparkle */}
            <Sparkles size={100} className="absolute -right-8 -bottom-8 text-white/5 rotate-12" />
          </div>

          {/* ACADEMIC PLACEMENT SECTION */}
          <div className="bg-blue-50/30 border border-blue-100/50 rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                <Calendar size={14}/> Academic Status
                </h4>
                {isHigherLevel && (
                    <div className="text-right">
                        <p className="text-[9px] text-slate-400 font-black uppercase mb-0.5">Average GWA</p>
                        <p className="text-2xl font-black text-blue-600 leading-none">{selected.gwa || '0.00'}</p>
                    </div>
                )}
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Level & Grade</p>
                <p className="text-sm font-black text-slate-800 uppercase italic">{selected.academic_category} • {selected.grade_level}</p>
              </div>
            </div>
          </div>

         {/* DOCUMENTS SECTION */}
<div className="space-y-4">
  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verification Documents</h4>
  <div className="grid gap-3">
    
    {/* Slot 1: COE (Always visible) */}
    <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between group hover:border-blue-300 transition-all">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-50 text-blue-500 rounded-lg"><FileText size={18}/></div>
        <div>
          <p className="text-xs font-black text-slate-700">Certificate of Enrollment (COE)</p>
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Required for all levels</p>
        </div>
      </div>
      {selected.sid_card_path ? (
        <button onClick={() => openDoc(selected.sid_card_path)} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black hover:bg-blue-600 transition-all">VIEW PDF</button>
      ) : <span className="text-[10px] font-bold text-red-400 italic">No File</span>}
    </div>

    {/* Slot 2: Report Card / Transcript */}
    {/* Slot 2: Report Card / Transcript */}
<div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between group hover:border-blue-300 transition-all">
  <div className="flex items-center gap-3">
    <div className="p-2 bg-blue-50 text-blue-500 rounded-lg"><FileText size={18}/></div>
    <div>
      <p className="text-xs font-black text-slate-700">
        {isLowerLevel ? "Report Card (SF9 / Form 138)" : "Transcript of Records (TOR)"}
      </p>
      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Academic Verification</p>
    </div>
  </div>

  {/* Check both possible paths: report_card_path (for lower) or sdocument_path (for higher) */}
  {selected.report_card_path || selected.sdocument_path ? (
    <button 
      onClick={() => openDoc(selected.report_card_path || selected.sdocument_path)} 
      className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black hover:bg-blue-600 transition-all"
    >
      VIEW PDF
    </button>
  ) : (
    <span className="text-[10px] font-bold text-red-400 italic">No File</span>
  )}
</div>

    {/* Slot 3: Good Moral (Only for Lower Levels) */}
    {isLowerLevel && (
      <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between group hover:border-blue-300 transition-all">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 text-emerald-500 rounded-lg"><Shield size={18}/></div>
          <div>
            <p className="text-xs font-black text-slate-700">Good Moral Certificate</p>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Character Reference</p>
          </div>
        </div>
        {/* Assuming you have a path for this, or check the relevant field */}
        {selected.good_moral_path ? (
          <button onClick={() => openDoc(selected.good_moral_path)} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black hover:bg-blue-600 transition-all">VIEW PDF</button>
        ) : <span className="text-[10px] font-bold text-slate-300 italic">Optional/Not Found</span>}
      </div>
    )}
  </div>
</div>

          {/* REJECTION INPUT */}
          {showRejectInput && (
            <div className="pt-4 animate-in slide-in-from-bottom-4 duration-300">
              <label className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2 block">Reason for Rejection</label>
              <textarea 
                className="w-full p-5 bg-red-50/50 border border-red-100 rounded-[2rem] text-sm outline-none focus:ring-4 focus:ring-red-100 h-32 resize-none transition-all placeholder:text-red-300"
                placeholder="Explain the reason (Will be emailed to student)..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-8 bg-white border-t border-slate-50">
          {selected.sstatus === 'pending' ? (
            <div className="flex gap-4">
              {!showRejectInput ? (
                <>
                  <button
                    onClick={() => handleStatus(selected.id, 'approved')}
                    className="flex-1 flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-100 transition-all active:scale-95"
                  >
                    <CheckCircle size={18} /> Confirm Registration
                  </button>
                  <button
                    onClick={() => setShowRejectInput(true)}
                    className="flex-[0.5] flex items-center justify-center gap-2 py-4 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 text-xs font-black uppercase tracking-widest rounded-2xl transition-all"
                  >
                    <XCircle size={18} /> Reject
                  </button>
                </>
              ) : (
                <div className="flex w-full gap-3">
                  <button
                    onClick={() => {setShowRejectInput(false); setRejectionReason('');}}
                    className="px-6 py-4 bg-slate-100 text-slate-500 text-[10px] font-black uppercase rounded-2xl"
                  >Cancel</button>
                  <button
  onClick={() => handleStatus(selected.id, 'rejected')}
  // DISABLED if reason is empty to prevent accidental empty rejection emails
  disabled={!rejectionReason.trim() || updating === selected.id}
  className="flex-1 py-4 bg-red-600 text-white text-[10px] font-black uppercase rounded-2xl shadow-xl shadow-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
>
  {updating === selected.id ? 'Processing...' : 'Confirm Rejection'}
</button>
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={() => { setSelected(null); setAiResult(null); }}
              className="w-full py-4 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all"
            >
              Close Record
            </button>
          )}
        </div>
      </div>
    </div>
  );
}