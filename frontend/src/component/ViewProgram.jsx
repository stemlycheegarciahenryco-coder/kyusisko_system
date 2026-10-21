import React, { useState, useEffect } from 'react';
import { X, Info, ListChecks, Target } from 'lucide-react';
import api from '../api';

// Remembers details already fetched so re-opening the same program is instant.
// It is still refreshed in the background every time, so it never stays stale.
const detailsCache = new Map();

function Skel({ className = 'h-4 w-16' }) {
  return <span className={`inline-block rounded bg-slate-200 animate-pulse align-middle ${className}`} />;
}

const ViewProgram = ({ scholarship, onClose }) => {
  const [fullData, setFullData] = useState(() => detailsCache.get(scholarship.id) || scholarship);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // The list already has everything => nothing to fetch
    if (scholarship.requirements) return;

    let cancelled = false;
    setLoading(true);
    api.get(`/scholarships/view-details/${scholarship.id}`)
      .then((res) => {
        if (cancelled) return;
        detailsCache.set(scholarship.id, res.data.data);
        setFullData(res.data.data);
      })
      .catch((err) => {
        console.error("Failed to fetch full scholarship details:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [scholarship.id]);

  // The modal opens immediately. Only the parts we don't have yet show a skeleton.
  const pending = loading && !fullData.requirements;
  const show = (value, fallback) =>
    pending && value === undefined ? <Skel /> : (value || fallback);

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

  const metaCard = "bg-white border border-slate-200 p-4 rounded-xl shadow-sm";
  const metaLabel = "font-black text-slate-400 uppercase text-[10px] tracking-widest mb-1";
  const sectionHeading = "flex items-center gap-2 font-black text-[#093fb4] uppercase text-[11px] tracking-widest mb-3";

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
      <div
        className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >

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
              <p className="font-black text-black text-[13px] truncate">{show(fullData.slots, 'Unrestricted')}</p>
            </div>
            <div className={metaCard}>
              <h4 className={metaLabel}>Min GWA</h4>
              <p className="font-black text-black text-[13px] truncate">{show(fullData.gwa_requirement, 'Any')}</p>
            </div>
            <div className={metaCard}>
              <h4 className={metaLabel}>Grant</h4>
              <p className="font-black text-black text-[13px] truncate">{show(fullData.amount_range, 'TBD')}</p>
            </div>
          </section>

          {/* Criteria Chips */}
          <section>
            <h4 className={sectionHeading}>
              <Target size={15} strokeWidth={2.5} /> Target Criteria
            </h4>
            <div className="flex flex-wrap gap-2">
              {pending && !fullData.criteria ? (
                <>
                  <Skel className="h-8 w-28" />
                  <Skel className="h-8 w-24" />
                  <Skel className="h-8 w-32" />
                </>
              ) : fullData.criteria && fullData.criteria.length > 0 ? (
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
              {pending ? (
                <>
                  <div className="h-14 rounded-xl bg-slate-100 animate-pulse" />
                  <div className="h-14 rounded-xl bg-slate-100 animate-pulse" />
                </>
              ) : fullData.requirements?.length > 0 ? (
                fullData.requirements.map((req, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white border border-slate-200 p-4 rounded-xl hover:border-[#093fb4]/50 transition-colors shadow-sm">
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