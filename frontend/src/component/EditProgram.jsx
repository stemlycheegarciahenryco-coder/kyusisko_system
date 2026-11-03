import React, { useState, useEffect, useRef } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, X, ClipboardList, BookOpen, AlertTriangle, Info, ArrowLeft, GraduationCap } from 'lucide-react';
import api from '../api';
import ScholarshipRequirements from '../component/ScholarshipRequirements';
import OrgCriteria from '../org/OrgCriteria';

// Same default checklist as CreateScholarship.jsx
const DEFAULT_REQS = [
  { label: 'Curriculum Vitae', type: 'file' },
  { label: 'Birth Certificate', type: 'file' },
  { label: 'Seminar Certificate', type: 'file' },
  { label: 'Indigency', type: 'file' },
  { label: 'Income Tax Return', type: 'file' },
  { label: 'Transcript of Records', type: 'file' },
  { label: 'Certificate of Enrollment', type: 'file' },
];

const FUND_TYPES = ["Discount", "Full-Tuition", "Financial-Assistance", "Merit-Based", "Semi-Annual", "Stipend", "Voucher"];

const sanitize = (value) => value.replace(/[<>&"']/g, '');

const preventInvalidNumberKeys = (e) => {
  if (['-', 'e', 'E', '+'].includes(e.key)) e.preventDefault();
};

// DB date -> local Date (no timezone shift), or null when empty
const parseInboundDate = (dateInput) => {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

const hasValue = (v) => v !== null && v !== undefined && v !== '';

// Click-to-open "i" reminder popover (same as CreateScholarship)
function InfoTip({ label, title = 'Reminder', align = 'left', children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div className="relative flex items-center shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        className={`rounded-full transition-colors cursor-pointer ${open ? 'text-[#093fb4]' : 'text-slate-400 hover:text-[#093fb4]'}`}
      >
        <Info size={20} />
      </button>
      {open && (
        <div className={`absolute top-full mt-2 z-30 w-64 bg-white border border-blue-200 rounded-2xl shadow-xl p-4 text-left ${align === 'right' ? 'right-0' : 'left-0'}`}>
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <p className="text-xs font-black text-[#093fb4] uppercase tracking-wide">{title}</p>
            <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <X size={14} />
            </button>
          </div>
          <div className="text-xs text-slate-600 font-medium leading-relaxed normal-case tracking-normal">{children}</div>
        </div>
      )}
    </div>
  );
}

const Toggle = ({ on, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#093fb4] focus:ring-offset-1 ${on ? 'bg-[#093fb4]' : 'bg-slate-300'}`}
  >
    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${on ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
);

const EditProgram = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const goBack = () => navigate(-1);

  const [loading, setLoading] = useState(false);
  const [detailsReady, setDetailsReady] = useState(false);
  const [detailsError, setDetailsError] = useState(false);
  const [warning, setWarning] = useState({ open: false, title: '', message: '' });

  const [hasGwa, setHasGwa] = useState(false);
  const [hasBudget, setHasBudget] = useState(false);

  // Same shape as CreateScholarship's formData (budget/gwa instead of amount_range/gwa_requirement)
  const [formData, setFormData] = useState({
    title: '', description: '', deadline: null,
    slots: '', budget: '', gwa: '', fund_type: '',
  });

  const [reqs, setReqs] = useState(DEFAULT_REQS);
  const [checked, setChecked] = useState([]);
  const [newReq, setNewReq] = useState('');
  const [criteria, setCriteria] = useState([]);

  // Load the saved program (list endpoint doesn't include requirements) and
  // pre-fill every field exactly like the Create form would look when filled in.
  useEffect(() => {
    let cancelled = false;
    api.get(`/scholarships/view-details/${id}`)
      .then((res) => {
        if (cancelled) return;
        const d = res.data.data || {};

        setFormData({
          title: d.title || '',
          description: d.description || '',
          deadline: parseInboundDate(d.deadline),
          slots: hasValue(d.slots) ? String(d.slots) : '',
          budget: hasValue(d.total_budget) ? String(Number(d.total_budget)) : '',
          gwa: hasValue(d.gwa_requirement) ? String(Number(d.gwa_requirement)) : '',
          fund_type: d.fund_type || '',
        });
        setHasBudget(hasValue(d.total_budget));
        setHasGwa(hasValue(d.gwa_requirement));

        // Saved requirements -> checked. Any saved one that isn't a default is added to the list.
        const saved = (d.requirements || [])
          .map((r) => ({ label: r.field_label || r.label, type: r.field_type || r.type || 'file' }))
          .filter((r) => r.label);
        const savedLabels = saved.map((r) => r.label);
        const extras = saved.filter((r) => !DEFAULT_REQS.some((x) => x.label === r.label));
        setReqs([...DEFAULT_REQS, ...extras]);
        setChecked(savedLabels);

        setCriteria(Array.isArray(d.criteria) ? d.criteria : []);
        setDetailsReady(true);
      })
      .catch((err) => {
        console.error('Failed to load program details for editing:', err);
        if (!cancelled) setDetailsError(true);
      });
    return () => { cancelled = true; };
  }, [id]);

  const showWarning = (title, message) => setWarning({ open: true, title, message });

  const handleUpdate = async () => {
    if (!formData.title || !formData.deadline || !formData.description || !formData.fund_type) {
      showWarning("Missing Information", "Please fill in all the required core fields (Title, Deadline, Coverage, and Description).");
      return;
    }

    const finalRequirements = [
      ...checked.map((label) => ({
        label,
        type: reqs.find((r) => r.label === label)?.type || 'file',
      })),
      ...(newReq.trim() ? [{ label: newReq.trim(), type: 'file' }] : []),
    ];

    if (finalRequirements.length === 0) {
      showWarning("Requirements Required", "Please select or add at least one Document Requirement.");
      return;
    }
    if (criteria.length === 0) {
      showWarning("Criteria Required", "Please select or add at least one eligibility Criteria.");
      return;
    }

    setLoading(true);
    try {
      const d = formData.deadline;
      const formattedDeadline = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      await api.patch(`/scholarships/${id}`, {
        title: formData.title,
        description: formData.description,
        deadline: formattedDeadline,
        slots: formData.slots || '',
        gwa: hasGwa ? (formData.gwa || '') : '',
        budget: hasBudget ? (formData.budget || '') : '',
        fund_type: formData.fund_type,
        requirements: finalRequirements,
        criteria,
      });
      goBack();
    } catch (err) {
      console.error('Update error:', err);
      showWarning("Update Error", err.response?.data?.message || err.message || "Failed to update the program.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = "w-full h-11 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#093fb4] focus:ring-4 focus:ring-[#093fb4]/10 outline-none text-sm transition-all font-medium text-slate-900 placeholder:text-slate-400";
  const labelStyle = "block text-xs font-bold text-slate-800 uppercase tracking-wide mb-2";
  const numberInputStyle = `${inputStyle} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`;
  const labelRowStyle = "flex items-end justify-between gap-2 min-h-[2rem] mb-2";
  const rowLabelStyle = "block text-xs font-bold text-slate-800 uppercase tracking-wide leading-tight";

  const skeleton = <div className="h-40 rounded-2xl bg-slate-100 animate-pulse" />;

  return (
    <div className="p-4 md:p-8 bg-[#f8fafc] min-h-screen relative text-slate-900">
      {/* Warning modal */}
      {warning.open && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          onClick={() => setWarning({ open: false, title: '', message: '' })}
        >
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl border border-slate-200 flex flex-col items-center text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 mb-5 border border-amber-100">
              <AlertTriangle size={28} strokeWidth={2.5} />
            </div>
            <h3 className="text-sm md:text-base font-black text-slate-900 uppercase tracking-wide mb-2">{warning.title}</h3>
            <p className="text-slate-600 text-sm font-medium leading-relaxed mb-6 px-2">{warning.message}</p>
            <button
              onClick={() => setWarning({ open: false, title: '', message: '' })}
              className="w-full py-3 bg-[#093fb4] text-white font-bold rounded-xl uppercase text-xs tracking-wider hover:bg-[#07369a] transition-all shadow-md"
            >
              Understand
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="pb-4">
          <button onClick={goBack} className="flex items-center gap-2 mb-3 font-bold text-xs text-slate-500 uppercase tracking-wider hover:text-[#093fb4] transition-colors">
            <ArrowLeft size={16} strokeWidth={2.5} /> Back
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#093fb4] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#093fb4]/20 shrink-0">
              <GraduationCap size={24} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">Edit Scholarship Program</h1>
              <p className="text-xs md:text-[13px] text-slate-500 font-medium mt-1">Update the program details, requirements, and criteria.</p>
            </div>
          </div>
        </div>

        {detailsError ? (
          <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-[12px] font-bold text-rose-600">
            Could not load the program details. Please close this window and try again.
          </div>
        ) : !detailsReady ? (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">{skeleton}{skeleton}{skeleton}</div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">

              {/* Column 1: Core details */}
              <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-full">
                <div className="flex items-center gap-3 pb-5 mb-6 border-b border-slate-100">
                  <div className="p-2.5 bg-blue-50 rounded-xl text-[#093fb4]"><ClipboardList size={20} /></div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Program Information</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Basic details about your scholarship</p>
                  </div>
                </div>

                <div className="space-y-5 flex-grow">
                  {/* Title */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className={labelStyle}>Program Title <span className="text-red-500">*</span></label>
                      <span className="text-xs font-bold text-slate-400">{formData.title.length}/100</span>
                    </div>
                    <input
                      type="text"
                      maxLength={100}
                      placeholder="Enter Program Title"
                      className={inputStyle}
                      value={formData.title}
                      onChange={(e) => setFormData((p) => ({ ...p, title: sanitize(e.target.value) }))}
                    />
                  </div>

                  {/* Slots & Deadline */}
                  <div className="grid grid-cols-2 gap-4 items-start">
                    <div>
                      <div className={labelRowStyle}><label className={rowLabelStyle}>Available Slots</label></div>
                      <input
                        type="number"
                        min="0"
                        placeholder="Slots"
                        className={numberInputStyle}
                        value={formData.slots}
                        onKeyDown={preventInvalidNumberKeys}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || Number(val) >= 0) setFormData((p) => ({ ...p, slots: val }));
                        }}
                      />
                    </div>
                    <div>
                      <div className={labelRowStyle}><label className={rowLabelStyle}>Application Deadline <span className="text-red-500">*</span></label></div>
                      <DatePicker
                        selected={formData.deadline}
                        onChange={(date) => setFormData((p) => ({ ...p, deadline: date }))}
                        dateFormat="yyyy-MM-dd"
                        placeholderText="Select date"
                        shouldCloseOnSelect
                        className={inputStyle}
                        wrapperClassName="w-full"
                      />
                    </div>
                  </div>

                  {/* Budget & GWA toggles */}
                  <div className="grid grid-cols-2 gap-4 items-start">
                    <div>
                      <div className="flex items-end min-h-[2rem] mb-2">
                        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 min-w-0">
                          <label className={rowLabelStyle}>Total Budget</label>
                          <InfoTip label="Total budget info">
                            Total fund for this program. Per-student amounts are set later in <span className="font-bold text-slate-800">Disbursement Management</span>.
                          </InfoTip>
                        </div>
                      </div>
                      <div className="mb-2.5">
                        <Toggle
                          on={hasBudget}
                          onClick={() => {
                            const next = !hasBudget;
                            setHasBudget(next);
                            if (!next) setFormData((p) => ({ ...p, budget: '' }));
                          }}
                        />
                      </div>
                      {hasBudget ? (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="₱ e.g., 500000"
                          className={numberInputStyle}
                          value={formData.budget}
                          onKeyDown={preventInvalidNumberKeys}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || Number(val) >= 0) setFormData((p) => ({ ...p, budget: val }));
                          }}
                        />
                      ) : (
                        <div className="h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Not Set</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-end min-h-[2rem] mb-2">
                        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 min-w-0">
                          <label className={rowLabelStyle}>GWA Criteria</label>
                          <InfoTip label="GWA format reminder" align="right">
                            Enter the minimum GWA as a <span className="font-bold text-slate-800">percentage</span> (e.g. <span className="font-bold text-slate-800">85</span>), not the 1.00–5.00 scale (e.g. 1.25, 1.50).
                          </InfoTip>
                        </div>
                      </div>
                      <div className="mb-2.5">
                        <Toggle
                          on={hasGwa}
                          onClick={() => {
                            const next = !hasGwa;
                            setHasGwa(next);
                            if (!next) setFormData((p) => ({ ...p, gwa: '' }));
                          }}
                        />
                      </div>
                      {hasGwa ? (
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            placeholder="e.g., 85"
                            className={`${numberInputStyle} pr-10`}
                            value={formData.gwa}
                            onKeyDown={preventInvalidNumberKeys}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || (Number(val) >= 0 && Number(val) <= 100)) setFormData((p) => ({ ...p, gwa: val }));
                            }}
                          />
                          <span className="absolute inset-y-0 right-4 flex items-center text-sm font-bold text-slate-400 pointer-events-none">%</span>
                        </div>
                      ) : (
                        <div className="h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">No Requirement</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Coverage */}
                  <div>
                    <label className={labelStyle}>Funding Coverage <span className="text-red-500">*</span></label>
                    <select
                      className={`${inputStyle} appearance-none pr-10`}
                      value={formData.fund_type}
                      onChange={(e) => setFormData((p) => ({ ...p, fund_type: e.target.value }))}
                    >
                      <option value="">Select funding type</option>
                      {/* keep a previously saved value selectable even if it isn't in the standard list */}
                      {formData.fund_type && !FUND_TYPES.includes(formData.fund_type) && (
                        <option value={formData.fund_type}>{formData.fund_type}</option>
                      )}
                      {FUND_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Column 2: Requirements (saved ones come pre-checked) */}
              <ScholarshipRequirements
                reqs={reqs}
                setReqs={setReqs}
                checked={checked}
                setChecked={setChecked}
                newReq={newReq}
                setNewReq={setNewReq}
              />

              {/* Column 3: Criteria (saved ones come pre-filled) */}
              <OrgCriteria criteria={criteria} setCriteria={setCriteria} />
            </div>

            {/* Description */}
            <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-5 mb-5 border-b border-slate-100 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 rounded-xl text-[#093fb4]"><BookOpen size={20} /></div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Program Description</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Provide a detailed overview of the scholarship</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                  {formData.description.length} / 2000 characters
                </span>
              </div>
              <textarea
                maxLength={2000}
                className="w-full h-48 p-4 bg-slate-50 border border-slate-300 rounded-2xl outline-none focus:bg-white focus:border-[#093fb4] focus:ring-4 focus:ring-[#093fb4]/10 transition-all font-medium text-slate-800 text-sm leading-relaxed placeholder:text-slate-400 resize-y"
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: sanitize(e.target.value) }))}
                placeholder="Outline the scholarship qualifications, expected milestones, maintaining requirements..."
              />
            </div>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-2">
              <button
                type="button"
                onClick={goBack}
                className="w-full sm:w-auto px-6 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs md:text-[13px] uppercase tracking-wider transition-all shadow-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdate}
                disabled={loading}
                className="w-full sm:w-auto px-8 py-3 bg-[#093fb4] hover:bg-[#07369a] text-white rounded-xl font-black text-xs md:text-[13px] uppercase tracking-wider transition-all shadow-xl shadow-[#093fb4]/20 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Update Program'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditProgram;