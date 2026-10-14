import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, FileUp, X, AlertTriangle, ClipboardList, Folder, Shield, BookOpen, Info, Calendar, PhilippinePeso, GraduationCap, Send } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

import api from '../api';
import ScholarshipRequirements from '../component/ScholarshipRequirements';
import OrgCriteria from '../org/OrgCriteria';
import { useUnsavedChanges, useGuardedNavigate, clearUnsavedChanges } from '../component/unsavedGuard';

// Click-to-open "i" reminder popover (closes on outside click)
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

const CreateScholarship = () => {
  const navigate = useNavigate();
  const guardedNavigate = useGuardedNavigate();
  const [loading, setLoading] = useState(false);
  const [criteria, setCriteria] = useState([]);
  const [attachments, setAttachments] = useState([]); 
  
  // Toggles for optional fields
  const [hasGwa, setHasGwa] = useState(false);
  const [hasBudget, setHasBudget] = useState(false);

  const [validationModal, setValidationModal] = useState({
    open: false,
    title: '',
    message: ''
  });

  const getTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  };

  const [reqs, setReqs] = useState([
    { label: 'Curriculum Vitae', type: 'file' },
    { label: 'Birth Certificate', type: 'file' },
    { label: 'Seminar Certificate', type: 'file' },
    { label: 'Indigency', type: 'file' },
    { label: 'Income Tax Return', type: 'file' },
    { label: 'Transcript of Records', type: 'file' },
    { label: 'Certificate of Enrollment', type: 'file' }
  ]);
  const [checked, setChecked] = useState([]);
  const [newReq, setNewReq] = useState('');
  
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    deadline: '', 
    slots: '', 
    budget: '',
    gwa: '', 
    fund_type: '' 
  });

  // Anything typed/selected/uploaded counts as unsaved work
  const isDirty =
    Object.values(formData).some((v) => v !== '' && v !== null && v !== undefined) ||
    attachments.length > 0 ||
    checked.length > 0 ||
    newReq.trim() !== '' ||
    criteria.length > 0 ||
    hasGwa ||
    hasBudget;

  useUnsavedChanges(isDirty);

  const inputStyle = "w-full h-[52px] pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#093fb4] focus:ring-4 focus:ring-[#093fb4]/10 outline-none text-sm md:text-base transition-all font-medium text-slate-900 placeholder:text-slate-400";
  const labelStyle = "block text-xs md:text-sm font-bold text-slate-800 uppercase tracking-wide mb-2";

  // Fixed-height label row so inputs line up even when a label wraps to 2 lines
  const numberInputStyle = `${inputStyle} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`;
  const labelRowStyle = "flex items-end justify-between gap-2 min-h-[2.5rem] mb-2";
  const rowLabelStyle = "block text-xs md:text-sm font-bold text-slate-800 uppercase tracking-wide leading-tight";

  const sanitize = (value) => value.replace(/[<>&"']/g, '');

  const preventInvalidNumberKeys = (e) => {
    if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
      e.preventDefault();
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const showWarning = (title, message) => {
    setValidationModal({ open: true, title, message });
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.deadline || !formData.description || !formData.fund_type) {
      showWarning("Missing Information", "Please fill in all the required core fields (Title, Deadline, Coverage, and Description).");
      return;
    }

    const finalRequirements = [
      ...checked.map(label => ({ label, type: 'file' })), 
      ...(newReq.trim() ? [{ label: newReq, type: 'file' }] : [])
    ];

    if (finalRequirements.length === 0) {
      showWarning("Requirements Required", "Please select or add at least one Document Requirement before creating the program.");
      return;
    }

    if (criteria.length === 0) {
      showWarning("Criteria Required", "Please select or add at least one eligibility Criteria for matching your target students.");
      return;
    }

    setLoading(true);

    let formattedDeadline = formData.deadline;
    if (formData.deadline instanceof Date) {
      const year = formData.deadline.getFullYear();
      const month = String(formData.deadline.getMonth() + 1).padStart(2, '0');
      const day = String(formData.deadline.getDate()).padStart(2, '0');
      formattedDeadline = `${year}-${month}-${day}`; 
    }

    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('deadline', formattedDeadline);
    data.append('slots', formData.slots || '');
    data.append('gwa', hasGwa ? (formData.gwa || '') : '');
    data.append('budget', hasBudget ? (formData.budget || '') : '');
    data.append('fund_type', formData.fund_type);
    data.append('requirements', JSON.stringify(finalRequirements));
    data.append('criteria', JSON.stringify(criteria));

    attachments.forEach((file) => {
      data.append('attachments', file);
    });

    try {
      await api.post('/scholarships', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      clearUnsavedChanges(); // published successfully -> nothing left to lose
      navigate('/ProgramView');
    } catch (err) { 
      console.error(err);
      showWarning("Submission Error", "Failed to communicate with the server. Please check your data fields."); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="p-4 md:p-8 bg-[#f8fafc] min-h-screen  relative text-slate-900">
      
      {/* Warning Modal */}
      {validationModal.open && (
        <div 
          className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          onClick={() => setValidationModal({ open: false, title: '', message: '' })}
        >
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl border border-slate-200 flex flex-col items-center text-center animate-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 mb-5 border border-amber-100">
              <AlertTriangle size={28} strokeWidth={2.5} />
            </div>
            <h3 className="text-base md:text-lg font-black text-slate-900 uppercase tracking-wide mb-2">{validationModal.title}</h3>
            <p className="text-slate-600 text-sm md:text-base font-medium leading-relaxed mb-8 px-2">{validationModal.message}</p>
            <button onClick={() => setValidationModal({ open: false, title: '', message: '' })} className="w-full py-4 bg-[#093fb4] text-white font-bold rounded-xl uppercase text-xs md:text-sm tracking-wider hover:bg-[#07369a] transition-all shadow-md">
              Understand
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4">
          <div>
            <button onClick={() => guardedNavigate(-1)} className="flex items-center gap-2 mb-4 font-bold text-sm text-slate-500 uppercase tracking-wider hover:text-[#093fb4] transition-colors">
              <ArrowLeft size={16} strokeWidth={2.5} /> Back
            </button>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[#093fb4] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#093fb4]/20 shrink-0">
                <GraduationCap size={28} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">Create Scholarship Program</h1>
                <p className="text-sm text-slate-500 font-medium mt-1">Fill in the program details, requirements, and criteria to publish your scholarship.</p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-5 max-w-sm flex items-start gap-4">
            <div className="p-2 bg-blue-100 rounded-xl text-[#093fb4] shrink-0">
              <Info size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">Important Note:</h4>
              <p className="text-sm text-slate-700 font-medium leading-relaxed">Provide accurate and complete information to help students determine their eligibility.</p>
            </div>
          </div>
        </div>

        {/* Main 3 Column Layout (Now aligned beautifully) */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
          
          {/* Column 1: Core Details */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-full">
            <div className="flex items-center gap-3 pb-5 mb-6 border-b border-slate-100">
              <div className="p-2.5 bg-blue-50 rounded-xl text-[#093fb4]"><ClipboardList size={20} /></div>
              <div>
                <h2 className="text-base font-black text-slate-900 uppercase tracking-wide">Program Information</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Basic details about your scholarship</p>
              </div>
            </div>
            
            <div className="space-y-6 flex-grow">
              {/* Title Field */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className={labelStyle}>Program Title <span className="text-red-500">*</span></label>
                  <span className="text-xs font-bold text-slate-400">{formData.title.length}/100</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"></div>
                  <input 
                    type="text" 
                    maxLength={100} 
                    placeholder="Enter Program Title" 
                    className={inputStyle} 
                    onChange={(e) => setFormData({...formData, title: sanitize(e.target.value)})} 
                  />
                </div>
              </div>

              {/* Slots & Deadline */}
              <div className="grid grid-cols-2 gap-4 items-start">
                <div>
                  <div className={labelRowStyle}><label className={rowLabelStyle}>Available Slots</label></div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"></div>
                    <input 
                      type="number" 
                      min="0" 
                      placeholder="Slots" 
                      className={numberInputStyle} 
                      value={formData.slots}
                      onKeyDown={preventInvalidNumberKeys}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || Number(val) >= 0) {
                          setFormData({ ...formData, slots: val });
                        }
                      }} 
                    />
                  </div>
                </div>
                <div>
                  <div className={labelRowStyle}><label className={rowLabelStyle}>Application Deadline <span className="text-red-500">*</span></label></div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 z-10"></div>
                    <DatePicker
                      selected={formData.deadline ? new Date(formData.deadline) : null}
                      onChange={(date) => setFormData({...formData, deadline: date})}
                      dateFormat="yyyy-MM-dd"
                      placeholderText="Select date"
                      minDate={getTomorrow()}
                      shouldCloseOnSelect={true}
                      className={inputStyle}
                      wrapperClassName="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Toggles: Total Budget & GWA */}
              <div className="grid grid-cols-2 gap-4 items-start">
                {/* Total Program Budget Toggle Component */}
                <div>
                  <div className="flex items-end min-h-[2.5rem] mb-2">
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 min-w-0">
                      <label className={rowLabelStyle}>Total Budget</label>
                      <InfoTip label="Total budget info">
                        Total fund for this program. Per-student amounts are set later in <span className="font-bold text-slate-800">Disbursement Management</span>.
                      </InfoTip>
                    </div>
                  </div>
                  <div className="mb-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        const nextState = !hasBudget;
                        setHasBudget(nextState);
                        if (!nextState) setFormData(prev => ({ ...prev, budget: '' }));
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#093fb4] focus:ring-offset-1 ${hasBudget ? 'bg-[#093fb4]' : 'bg-slate-300'}`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${hasBudget ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {hasBudget ? (
                    <div className="relative animate-in fade-in duration-200">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <PhilippinePeso size={18} />
                      </div>
                      <input 
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="e.g., 500000" 
                        className={numberInputStyle} 
                        value={formData.budget}
                        onKeyDown={preventInvalidNumberKeys}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || Number(val) >= 0) {
                            setFormData({ ...formData, budget: val });
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-[52px] px-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Not Set</span>
                    </div>
                  )}
                </div>

                {/* GWA Toggle Component */}
                <div>
                  <div className="flex items-end min-h-[2.5rem] mb-2">
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 min-w-0">
                      <label className={rowLabelStyle}>GWA Criteria</label>
                      <InfoTip label="GWA format reminder" align="right">
                        Enter the minimum GWA as a <span className="font-bold text-slate-800">percentage</span> (e.g. <span className="font-bold text-slate-800">85</span>), not the 1.00–5.00 scale (e.g. 1.25, 1.50).
                      </InfoTip>
                    </div>
                  </div>
                  <div className="mb-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        const nextState = !hasGwa;
                        setHasGwa(nextState);
                        if (!nextState) setFormData(prev => ({ ...prev, gwa: '' }));
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#093fb4] focus:ring-offset-1 ${hasGwa ? 'bg-[#093fb4]' : 'bg-slate-300'}`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${hasGwa ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {hasGwa ? (
                    <div className="relative animate-in fade-in duration-200">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                       
                      </div>
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
                          if (val === '' || (Number(val) >= 0 && Number(val) <= 100)) {
                            setFormData({ ...formData, gwa: val });
                          }
                        }} 
                      />
                      <span className="absolute inset-y-0 right-4 flex items-center text-sm font-bold text-slate-400 pointer-events-none">%</span>
                    </div>
                  ) : (
                    <div className="h-[52px] px-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">No Requirement</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Coverage Field */}
              <div>
                <label className={labelStyle}>Funding Coverage <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><Shield size={18} /></div>
                  <select 
                    className={`${inputStyle} appearance-none pr-10`}
                    onChange={(e) => setFormData({...formData, fund_type: e.target.value})}
                  >
                    <option value="">Select funding type</option>
                    {["Discount", "Full-Tuition", "Financial-Assistance", "Merit-Based", "Semi-Annual", "Stipend", "Voucher"].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Document Requirements Panel */}
          <ScholarshipRequirements 
            reqs={reqs} 
            setReqs={setReqs} 
            checked={checked} 
            setChecked={setChecked} 
            newReq={newReq} 
            setNewReq={setNewReq} 
          />
          
          {/* Column 3: Criteria Rules Panel */}
          <OrgCriteria 
            criteria={criteria} 
            setCriteria={setCriteria} 
          />
        </div>

        {/* Full Width Block: Description Area */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm mt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 mb-5 border-b border-slate-100 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 rounded-xl text-[#093fb4]"><BookOpen size={20} /></div>
              <div>
                <h2 className="text-base font-black text-slate-900 uppercase tracking-wide">Program Description</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Provide a detailed overview of the scholarship</p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              {(formData.description || '').length} / 2000 characters
            </span>
          </div>
          
          <textarea 
            maxLength={2000}
            className="w-full h-56 p-5 bg-slate-50 border border-slate-300 rounded-2xl outline-none focus:bg-white focus:border-[#093fb4] focus:ring-4 focus:ring-[#093fb4]/10 transition-all font-medium text-slate-800 text-sm md:text-base leading-relaxed placeholder:text-slate-400 resize-y"
            onChange={(e) => setFormData({...formData, description: sanitize(e.target.value)})}
            placeholder="Outline the scholarship qualifications, expected milestones, maintaining requirements, and any other relevant information for the applicants..."
          />
        </div>

        {/* Full Width Block: Attached Form Upload */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm mt-6">
          <div className="flex items-center gap-3 pb-5 mb-5 border-b border-slate-100">
            <div className="p-2.5 bg-blue-50 rounded-xl text-[#093fb4]"><FileUp size={20} /></div>
            <div>
              <h2 className="text-base font-black text-slate-900 uppercase tracking-wide">Attached Form Upload</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Upload optional guidelines, templates, or forms for applicants</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {attachments.map((file, idx) => (
              <div key={idx} className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                <span className="text-sm font-semibold text-slate-700 truncate max-w-[80%] pl-1">{file.name}</span>
                <button onClick={() => removeAttachment(idx)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Remove file">
                  <X size={16} strokeWidth={2.5} />
                </button>
              </div>
            ))}
            
            <label className="flex flex-col items-center justify-center w-full py-10 border-2 border-dashed border-slate-300 hover:border-[#093fb4]/60 rounded-2xl cursor-pointer hover:bg-blue-50/30 transition-all text-center group">
              <FileUp size={32} className="text-slate-400 group-hover:text-[#093fb4] transition-colors mb-3" />
              <p className="text-sm font-bold text-slate-700 group-hover:text-[#093fb4]">Drag & drop files here or <span className="text-[#093fb4] underline">browse</span></p>
              <p className="text-xs text-slate-500 font-medium mt-1.5">Supported: PDF, DOCX, JPG, PNG (Max. 10MB)</p>
              <input type="file" className="hidden" multiple onChange={handleFileChange} />
            </label>
          </div>
        </div>

        {/* Action Bar Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-4 pb-12">
          <button 
            type="button" 
            onClick={() => guardedNavigate(-1)} 
            className="w-full sm:w-auto px-8 py-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-sm uppercase tracking-wider transition-all shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full sm:w-auto px-10 py-4 bg-[#093fb4] hover:bg-[#07369a] text-white rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-xl shadow-[#093fb4]/20 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <><Send size={18} className="-mt-0.5" /> Publish Program</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateScholarship;