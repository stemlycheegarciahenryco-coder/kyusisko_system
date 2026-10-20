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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl flex flex-col items-center gap-3 shadow-2xl border border-slate-200">
        <Loader2 className="animate-spin text-[#093fb4]" size={36} strokeWidth={2.5} />
        <p className="text-[12px] font-black uppercase tracking-widest text-slate-500">Loading Details...</p>
      </div>
    </div>
  );

  const metaCard = "bg-white border border-slate-200 p-4 rounded-xl shadow-sm";
  const metaLabel = "font-black text-slate-400 uppercase text-[10px] tracking-widest mb-1";
  const sectionHeading = "flex items-center gap-2 font-black text-[#093fb4] uppercase text-[11px] tracking-widest mb-3";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-white flex justify-between items-start">
          <div className="pr-6 min-w-0">
            <h2 className="text-2xl font-black text-black tracking-tight uppercase leading-tight mb-2">
              {fullData.title}
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-black bg-[#093fb4] text-white px-3 py-1 rounded-full uppercase tracking-widest">
                {fullData.fund_type || 'General Fund'}
              </span>
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Program ID: #{fullData.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-white border border-slate-300 text-slate-500 rounded-xl hover:border-red-200 hover:bg-red-50 hover:text-red-500 transition-all shrink-0"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

          {/* Description */}
          <section>
            <h4 className={sectionHeading}>
              <Info size={15} strokeWidth={2.5} /> Description
            </h4>
            <p className="text-[13px] font-medium text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200 italic">
              "{fullData.description}"
            </p>
          </section>

          {/* Metadata Grid */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className={metaCard}>
              <h4 className={metaLabel}>Deadline</h4>
              <p className="font-black text-[#093fb4] text-[13px] uppercase truncate">
                {renderCleanDeadline(fullData.deadline)}
              </p>
            </div>
            <div className={metaCard}>
              <h4 className={metaLabel}>Slots</h4>
              <p className="font-black text-black text-[13px] truncate">{fullData.slots || 'Unrestricted'}</p>
            </div>
            <div className={metaCard}>
              <h4 className={metaLabel}>Min GWA</h4>
              <p className="font-black text-black text-[13px] truncate">{fullData.gwa_requirement || 'Any'}</p>
            </div>
            <div className={metaCard}>
              <h4 className={metaLabel}>Grant</h4>
              <p className="font-black text-black text-[13px] truncate">{fullData.amount_range || 'TBD'}</p>
            </div>
          </section>

          {/* Criteria Chips */}
          <section>
            <h4 className={sectionHeading}>
              <Target size={15} strokeWidth={2.5} /> Target Criteria
            </h4>
            <div className="flex flex-wrap gap-2">
              {fullData.criteria && fullData.criteria.length > 0 ? (
                fullData.criteria.map((item, i) => (
                  <span key={i} className="bg-slate-800 text-white px-3.5 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest">
                    {item}
                  </span>
                ))
              ) : (
                <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest bg-white border border-dashed border-slate-300 p-4 rounded-xl w-full text-center">
                  No demographic criteria specified
                </p>
              )}
            </div>
          </section>

          {/* Submission Requirements */}
          <section>
            <h4 className={sectionHeading}>
              <ListChecks size={15} strokeWidth={2.5} /> Required Documents
            </h4>
            <div className="space-y-2.5">
              {fullData.requirements?.length > 0 ? (
                fullData.requirements.map((req, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white border border-slate-200 p-4 rounded-xl group hover:border-[#093fb4]/50 transition-colors shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-[#093fb4] shrink-0" />
                    <p className="text-[13px] font-black text-black uppercase tracking-wide truncate">{req.field_label || req.label}</p>
                    <span className="ml-auto text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">{req.field_type}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 bg-white rounded-xl border border-dashed border-slate-300">
                  <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">No file submissions required</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Footer Action */}
        <div className="p-5 bg-white border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-10 py-3 bg-slate-800 text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all shadow-md active:scale-95"
          >
            Close View
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewProgram;