import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Loader2, X } from 'lucide-react';
import api from '../api';
import ScholarshipRequirements from '../component/ScholarshipRequirements';
import OrgCriteria from '../org/OrgCriteria';

// Memoized so typing in the title / description doesn't re-render these heavier
// sections on every keystroke (they only re-render when their own props change).
const MemoRequirements = memo(ScholarshipRequirements);
const MemoCriteria = memo(OrgCriteria);

const parseInboundDate = (dateInput) => {
  if (!dateInput) return new Date();
  const parsedDate = new Date(dateInput);
  if (isNaN(parsedDate.getTime())) return new Date();
  return new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
};

const EditProgram = ({ scholarship, onUpdateSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    title: scholarship.title || '',
    description: scholarship.description || '',
    deadline: parseInboundDate(scholarship.deadline),
    slots: scholarship.slots || '',
    fund_type: scholarship.fund_type || '',
    amount_range: scholarship.amount_range || '',
    gwa_requirement: scholarship.gwa_requirement || '',
    requirements: scholarship.requirements || [],
    criteria: scholarship.criteria || []
  });

  const [newReq, setNewReq] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [checkedReqs, setCheckedReqs] = useState(
    scholarship.requirements ? scholarship.requirements.map(r => r.label || r.field_label) : []
  );

  // If the list didn't include requirements/criteria, load them first. Saving before
  // they're loaded would send an empty list and could wipe the program's requirements.
  const [detailsReady, setDetailsReady] = useState(!!scholarship.requirements);
  const [detailsError, setDetailsError] = useState(false);

  useEffect(() => {
    if (scholarship.requirements) return;
    let cancelled = false;
    api.get(`/scholarships/view-details/${scholarship.id}`)
      .then((res) => {
        if (cancelled) return;
        const d = res.data.data || {};
        setFormData(prev => ({
          ...prev,
          requirements: d.requirements || [],
          criteria: d.criteria || [],
          slots: prev.slots || d.slots || '',
          fund_type: prev.fund_type || d.fund_type || '',
          amount_range: prev.amount_range || d.amount_range || '',
          gwa_requirement: prev.gwa_requirement || d.gwa_requirement || '',
        }));
        setCheckedReqs((d.requirements || []).map(r => r.label || r.field_label));
        setDetailsReady(true);
      })
      .catch((err) => {
        console.error('Failed to load program details for editing:', err);
        if (!cancelled) setDetailsError(true);
      });
    return () => { cancelled = true; };
  }, [scholarship.id]);

  // Stable callbacks so the memoized children don't re-render needlessly
  const setReqs = useCallback(
    (updatedReqs) => setFormData(prev => ({ ...prev, requirements: updatedReqs })),
    []
  );
  const setCriteria = useCallback(
    (c) => setFormData(prev => ({ ...prev, criteria: c })),
    []
  );
  const today = useMemo(() => new Date(), []);

  const handleUpdate = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const normalizedRequirements = formData.requirements.map(req => ({
        label: req.label || req.field_label,
        type: req.type || req.field_type || 'file'
      }));

      let formattedDeadline = formData.deadline;
      if (formData.deadline instanceof Date) {
        const year = formData.deadline.getFullYear();
        const month = String(formData.deadline.getMonth() + 1).padStart(2, '0');
        const day = String(formData.deadline.getDate()).padStart(2, '0');
        formattedDeadline = `${year}-${month}-${day}`;
      } else if (typeof formData.deadline === 'string') {
        formattedDeadline = formData.deadline.split('T')[0];
      }

      const payload = {
        title: formData.title,
        description: formData.description,
        deadline: formattedDeadline,
        slots: formData.slots,
        fund_type: formData.fund_type,
        amount_range: formData.amount_range,
        gwa: formData.gwa_requirement,
        requirements: normalizedRequirements,
        criteria: formData.criteria
      };

      await api.patch(`/scholarships/${scholarship.id}`, payload);
      onUpdateSuccess();
    } catch (err) {
      console.error("Update error:", err);
      setErrorMsg("Failed to update: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-[13px] font-medium text-black placeholder-slate-400 focus:outline-none focus:border-[#093fb4] transition-all";
  const labelCls = "block text-[11px] font-black text-slate-600 uppercase tracking-widest mb-1.5 ml-0.5";
  const sectionCls = "font-black mb-3 text-[11px] uppercase tracking-widest text-[#093fb4] ml-0.5";

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white p-6 md:p-8 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 custom-scrollbar">

        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-black uppercase text-black tracking-tight">
            Edit <span className="text-[#093fb4]">Program</span>
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="w-10 h-10 flex items-center justify-center bg-white border border-slate-300 text-slate-500 rounded-xl hover:border-red-200 hover:bg-red-50 hover:text-red-500 transition-all shrink-0"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className={labelCls}>Program Title</label>
            <input
              className={inputCls}
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter scholarship title"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>Deadline Date</label>
              <DatePicker
                selected={formData.deadline}
                onChange={(date) => setFormData(prev => ({ ...prev, deadline: date }))}
                className={inputCls}
                dateFormat="yyyy-MM-dd"
                minDate={today}
                wrapperClassName="w-full"
              />
            </div>
            <div>
              <label className={labelCls}>Available Slots</label>
              <input
                type="number"
                className={inputCls}
                value={formData.slots}
                onChange={e => setFormData(prev => ({ ...prev, slots: e.target.value }))}
                placeholder="e.g. 50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className={labelCls}>Coverage Type</label>
              <input
                className={inputCls}
                value={formData.fund_type}
                onChange={e => setFormData(prev => ({ ...prev, fund_type: e.target.value }))}
                placeholder="e.g. Full tuition"
              />
            </div>
            <div>
              <label className={labelCls}>Amount Range</label>
              <input
                className={inputCls}
                value={formData.amount_range}
                onChange={e => setFormData(prev => ({ ...prev, amount_range: e.target.value }))}
                placeholder="e.g. 5000-10000"
              />
            </div>
            <div>
              <label className={labelCls}>Min GWA</label>
              <input
                type="number"
                step="0.01"
                className={inputCls}
                value={formData.gwa_requirement}
                onChange={e => setFormData(prev => ({ ...prev, gwa_requirement: e.target.value }))}
                placeholder="e.g. 1.75"
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Program Description</label>
            <textarea
              className={`${inputCls} h-28 resize-none`}
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Write a clear description of the scholarship..."
            />
          </div>

          <div className="pt-5 border-t border-slate-200">
            <h3 className={sectionCls}>Requirements</h3>
            {detailsReady ? (
              <MemoRequirements
                reqs={formData.requirements || []}
                setReqs={setReqs}
                newReq={newReq}
                setNewReq={setNewReq}
                checked={checkedReqs}
                setChecked={setCheckedReqs}
              />
            ) : (
              <div className="h-16 rounded-xl bg-slate-100 animate-pulse" />
            )}
          </div>

          <div className="pt-5 border-t border-slate-200">
            <h3 className={sectionCls}>Target Criteria</h3>
            {detailsReady ? (
              <MemoCriteria
                criteria={formData.criteria}
                setCriteria={setCriteria}
              />
            ) : (
              <div className="h-16 rounded-xl bg-slate-100 animate-pulse" />
            )}
          </div>
        </div>

        {(errorMsg || detailsError) && (
          <div className="mt-6 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-[12px] font-bold text-rose-600">
            {detailsError
              ? 'Could not load the program requirements. Please close this window and try again.'
              : errorMsg}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpdate}
            disabled={loading || !detailsReady}
            className="flex-1 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest bg-[#093fb4] text-white hover:bg-[#073496] flex justify-center items-center shadow-md shadow-[#093fb4]/20 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" size={18} strokeWidth={2.5} /> : "Update Program"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProgram;