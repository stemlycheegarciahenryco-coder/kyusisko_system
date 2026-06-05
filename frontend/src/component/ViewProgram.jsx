import React, { useState, useEffect } from 'react';
import { X, Loader2, Info, ListChecks, Target } from 'lucide-react';
import api from '../api';

const ViewProgram = ({ scholarship, onClose }) => {
  const [fullData, setFullData] = useState(scholarship);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!fullData.requirements) {
      const fetchDetails = async () => {
        setLoading(true);
        try {
          const res = await api.get(`/scholarships/view-details/${scholarship.id}`);
          setFullData(res.data.data);
        } catch (err) {
          console.error("Failed to fetch full scholarship details:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchDetails();
    }
  }, [scholarship.id]);

  // Safely parses outbound text records without converting raw strings into skewed timezone dates
  const renderCleanDeadline = (deadlineStr) => {
  if (!deadlineStr) return 'No Deadline';
  
  // If the database gave back a full ISO string containing an explicit "T" timestamp
  if (typeof deadlineStr === 'string' && deadlineStr.includes('T')) {
    const localDate = new Date(deadlineStr);
    if (!isNaN(localDate.getTime())) {
      return localDate.toLocaleDateString('en-PH', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
  }

  // Fallback for clean "YYYY-MM-DD" raw strings
  const cleanString = typeof deadlineStr === 'string' ? deadlineStr.split('T')[0] : deadlineStr;
  const parts = cleanString.split('-');
  
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    
    const localDate = new Date(year, month, day);
    return localDate.toLocaleDateString('en-PH', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }
  
  return 'Invalid Date';
};

  if (loading) return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-[2rem] flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-[#093fb4]" size={40} />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Details...</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-[#FFFCFB] rounded-[2.5rem] w-full max-w-2xl max-h-[85vh] flex flex-col border-[3px] border-[#093fb4] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-start bg-white">
          <div className="pr-8">
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none mb-2">
              {fullData.title}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black bg-[#093fb4] text-white px-2 py-0.5 rounded-md uppercase tracking-tighter">
                {fullData.fund_type || 'General Fund'}
              </span>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Program ID: #{fullData.id}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all flex-shrink-0"
          >
            <X size={20} strokeWidth={3} />
          </button>
        </div>
        
        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          
          {/* Description */}
          <section>
            <h4 className="flex items-center gap-2 font-black text-slate-400 uppercase text-[10px] tracking-[0.15em] mb-3">
              <Info size={14} /> Description
            </h4>
            <p className="text-sm font-medium text-slate-600 leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-100">
              {fullData.description}
            </p>
          </section>
          
          {/* Metadata Grid */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
              <h4 className="font-black text-slate-400 uppercase text-[9px] tracking-widest mb-1">Deadline</h4>
              {/* Uses fixed safe rendering function */}
              <p className="font-black text-[#093fb4] text-xs uppercase">
                {renderCleanDeadline(fullData.deadline)}
              </p>
            </div>
            <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
              <h4 className="font-black text-slate-400 uppercase text-[9px] tracking-widest mb-1">Slots Left</h4>
              <p className="font-black text-slate-900 text-xs">{fullData.slots || 'Unrestricted'}</p>
            </div>
            <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
              <h4 className="font-black text-slate-400 uppercase text-[9px] tracking-widest mb-1">GWA Requirement</h4>
              <p className="font-black text-slate-900 text-xs">{fullData.gwa_requirement || 'Any'}</p>
            </div>
            <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
              <h4 className="font-black text-slate-400 uppercase text-[9px] tracking-widest mb-1">Grant Range</h4>
              <p className="font-black text-slate-900 text-xs">{fullData.amount_range || 'TBD'}</p>
            </div>
          </section>

          {/* Criteria Chips */}
          <section>
            <h4 className="flex items-center gap-2 font-black text-slate-400 uppercase text-[10px] tracking-[0.15em] mb-3">
              <Target size={14} /> Target Criteria
            </h4>
            <div className="flex flex-wrap gap-2">
              {fullData.criteria && fullData.criteria.length > 0 ? (
                fullData.criteria.map((item, i) => (
                  <span key={i} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">
                    {item}
                  </span>
                ))
              ) : (
                <p className="text-[11px] font-bold text-slate-300 italic uppercase">No demographic criteria specified</p>
              )}
            </div>
          </section>

          {/* Submission Requirements */}
          <section className="pb-4">
            <h4 className="flex items-center gap-2 font-black text-slate-400 uppercase text-[10px] tracking-[0.15em] mb-4">
              <ListChecks size={14} /> Required Documents
            </h4>
            <div className="space-y-2">
              {fullData.requirements?.length > 0 ? (
                fullData.requirements.map((req, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white border border-slate-100 p-4 rounded-xl group hover:border-[#093fb4]/30 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-[#093fb4]" />
                    <p className="text-xs font-black text-slate-700 uppercase tracking-tight">{req.field_label || req.label}</p>
                    <span className="ml-auto text-[9px] font-bold text-slate-300 uppercase tracking-widest">{req.field_type}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-[11px] font-bold text-slate-400 uppercase">No file submissions required</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Footer Action */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button 
            onClick={onClose}
            className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-black transition-all active:scale-95"
          >
            Close View
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewProgram;