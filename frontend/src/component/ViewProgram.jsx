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

  const renderCleanDeadline = (deadlineStr) => {
    if (!deadlineStr) return 'No Deadline';
    if (typeof deadlineStr === 'string' && deadlineStr.includes('T')) {
      const localDate = new Date(deadlineStr);
      if (!isNaN(localDate.getTime())) {
        return localDate.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    }
    const cleanString = typeof deadlineStr === 'string' ? deadlineStr.split('T')[0] : deadlineStr;
    const parts = cleanString.split('-');
    
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      
      const localDate = new Date(year, month, day);
      return localDate.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return 'Invalid Date';
  };

  if (loading) return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-md p-10 rounded-[2.5rem] flex flex-col items-center gap-4 shadow-2xl border border-white/60">
        <Loader2 className="animate-spin text-[#093fb4]" size={48} strokeWidth={2.5}/>
        <p className="text-xs font-black uppercase tracking-widest text-slate-500">Loading Details...</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6 font-['Inter']">
      <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] w-full max-w-3xl max-h-[90vh] flex flex-col border border-white/60 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-8 md:p-10 border-b-2 border-black/5 bg-white/50 flex justify-between items-start">
          <div className="pr-8">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight uppercase leading-tight mb-3">
              {fullData.title}
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black bg-[#093fb4] text-white px-3 py-1 rounded-lg uppercase tracking-[0.2em] shadow-sm">
                {fullData.fund_type || 'General Fund'}
              </span>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Program ID: #{fullData.id}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-12 h-12 flex items-center justify-center bg-white/60 border-2 border-slate-200 text-slate-500 rounded-2xl hover:border-red-200 hover:bg-red-50 hover:text-red-500 transition-all flex-shrink-0 shadow-sm"
          >
            {/* FIXED: Changed from stroke={2.5} to strokeWidth={2.5} */}
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>
        
        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto p-8 md:p-10 space-y-10 custom-scrollbar">
          
          {/* Description */}
          <section>
            <h4 className="flex items-center gap-2 font-black text-[#093fb4] uppercase text-xs tracking-[0.2em] mb-4">
              <Info size={18} strokeWidth={2.5}/> Description
            </h4>
            <p className="text-sm md:text-base font-bold text-slate-700 leading-relaxed bg-white/60 p-6 rounded-2xl border-2 border-slate-200 shadow-sm italic">
              "{fullData.description}"
            </p>
          </section>
          
          {/* Metadata Grid */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/60 border-2 border-slate-200 p-5 rounded-2xl shadow-sm">
              <h4 className="font-black text-slate-400 uppercase text-[10px] tracking-widest mb-1.5">Deadline</h4>
              <p className="font-black text-[#093fb4] text-sm uppercase truncate">
                {renderCleanDeadline(fullData.deadline)}
              </p>
            </div>
            <div className="bg-white/60 border-2 border-slate-200 p-5 rounded-2xl shadow-sm">
              <h4 className="font-black text-slate-400 uppercase text-[10px] tracking-widest mb-1.5">Slots</h4>
              <p className="font-black text-slate-900 text-sm truncate">{fullData.slots || 'Unrestricted'}</p>
            </div>
            <div className="bg-white/60 border-2 border-slate-200 p-5 rounded-2xl shadow-sm">
              <h4 className="font-black text-slate-400 uppercase text-[10px] tracking-widest mb-1.5">Min GWA</h4>
              <p className="font-black text-slate-900 text-sm truncate">{fullData.gwa_requirement || 'Any'}</p>
            </div>
            <div className="bg-white/60 border-2 border-slate-200 p-5 rounded-2xl shadow-sm">
              <h4 className="font-black text-slate-400 uppercase text-[10px] tracking-widest mb-1.5">Grant</h4>
              <p className="font-black text-slate-900 text-sm truncate">{fullData.amount_range || 'TBD'}</p>
            </div>
          </section>

          {/* Criteria Chips */}
          <section>
            <h4 className="flex items-center gap-2 font-black text-[#093fb4] uppercase text-xs tracking-[0.2em] mb-4">
              <Target size={18} strokeWidth={2.5}/> Target Criteria
            </h4>
            <div className="flex flex-wrap gap-3">
              {fullData.criteria && fullData.criteria.length > 0 ? (
                fullData.criteria.map((item, i) => (
                  <span key={i} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-md">
                    {item}
                  </span>
                ))
              ) : (
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest bg-white/60 border-2 border-dashed border-slate-200 p-4 rounded-2xl w-full text-center">No demographic criteria specified</p>
              )}
            </div>
          </section>

          {/* Submission Requirements */}
          <section className="pb-4">
            <h4 className="flex items-center gap-2 font-black text-[#093fb4] uppercase text-xs tracking-[0.2em] mb-4">
              <ListChecks size={18} strokeWidth={2.5}/> Required Documents
            </h4>
            <div className="space-y-3">
              {fullData.requirements?.length > 0 ? (
                fullData.requirements.map((req, i) => (
                  <div key={i} className="flex items-center gap-4 bg-white/60 border-2 border-slate-200 p-5 rounded-2xl group hover:border-[#093fb4]/50 transition-colors shadow-sm">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#093fb4] shrink-0" />
                    <p className="text-sm font-black text-slate-900 uppercase tracking-wide truncate">{req.field_label || req.label}</p>
                    <span className="ml-auto text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] shrink-0">{req.field_type}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 bg-white/40 rounded-[2rem] border-2 border-dashed border-slate-200">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No file submissions required</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Footer Action */}
        <div className="p-6 md:p-8 bg-white/80 border-t-2 border-black/5 flex justify-end">
          <button 
            onClick={onClose}
            className="w-full sm:w-auto px-12 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl active:scale-95"
          >
            Close View
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewProgram;