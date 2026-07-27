import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, FileUp, X, AlertTriangle, ClipboardList, Folder, Shield, BookOpen, Info, Calendar, DollarSign, GraduationCap, Send } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

import api from '../api';
import ScholarshipRequirements from '../component/ScholarshipRequirements';
import OrgCriteria from '../org/OrgCriteria';

const CreateScholarship = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [criteria, setCriteria] = useState([]);
  const [attachments, setAttachments] = useState([]); 
  
  // --- NEW: Toggle State for GWA ---
  const [hasGwa, setHasGwa] = useState(false);

  const [validationModal, setValidationModal] = useState({
    open: false,
    title: '',
    message: ''
  });

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
    amount_range: '', 
    gwa: '', 
    fund_type: '' 
  });

  const inputStyle = "w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#093fb4] focus:ring-2 focus:ring-[#093fb4]/10 outline-none text-sm transition-all font-medium text-slate-800";
  const labelStyle = "block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5";

  const sanitize = (value) => value.replace(/[<>&"']/g, '');

  // Prevent entering negative signs, e/E (scientific notation), and plus signs
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
    // Send GWA only if toggle is turned ON
    data.append('gwa', hasGwa ? (formData.gwa || '') : '');
    data.append('amount_range', formData.amount_range || '');
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
      navigate('/ProgramView');
    } catch (err) { 
      console.error(err);
      showWarning("Submission Error", "Failed to communicate with the server. Please check your data fields."); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="p-8 bg-[#f8fafc] min-h-screen font-['Inter'] relative text-slate-800">
      {/* Warning Modal */}
      {validationModal.open && (
        <div 
          className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
          onClick={() => setValidationModal({ open: false, title: '', message: '' })}
        >
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col items-center text-center animate-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 mb-4 border border-amber-100">
              <AlertTriangle size={22} strokeWidth={2.5} />
            </div>
            <h3 className="text-sm font-black text-slate-950 uppercase tracking-wide mb-1.5">{validationModal.title}</h3>
            <p className="text-slate-500 text-xs font-medium leading-relaxed mb-6 px-2">{validationModal.message}</p>
            <button onClick={() => setValidationModal({ open: false, title: '', message: '' })} className="w-full py-3.5 bg-[#093fb4] text-white font-bold rounded-xl uppercase text-[10px] tracking-wider hover:bg-[#07369a] transition-all">
              Understand
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header and Tips Panel Grid */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
          <div>
            <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 mb-3 font-bold text-xs text-slate-500 uppercase tracking-wider hover:text-[#093fb4] transition-colors">
              <ArrowLeft size={14} strokeWidth={2.5} /> Back
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#093fb4] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#093fb4]/20">
                <GraduationCap size={24} />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900">Create Scholarship Program</h1>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Fill in the program details, requirements and criteria to publish your scholarship.</p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 max-w-sm flex items-start gap-3">
            <div className="p-1.5 bg-blue-100/60 rounded-xl text-[#093fb4] shrink-0">
              <Info size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Note:</h4>
              <p className="text-[14px] text-slate-900 font-medium leading-normal mt-0.5">Provide accurate and complete scholarship program information .</p>
            </div>
          </div>
        </div>

        {/* 3 Column Form Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Column 1: Program Information */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col h-full">
            <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-100">
              <div className="p-2 bg-blue-50 rounded-xl text-[#093fb4]"><ClipboardList size={18} /></div>
              <div>
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">Program Information</h2>
                <p className="text-[11px] text-slate-400 font-medium">Basic details about your scholarship program</p>
              </div>
            </div>
            
            <div className="space-y-4 flex-grow">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">Program Title <span className="text-red-500">*</span></label>
                  <span className="text-[10px] font-bold text-slate-400">{formData.title.length}/100</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><ClipboardList size={16} /></div>
                  <input type="text" maxLength={100} placeholder="Enter program title" className={inputStyle} onChange={(e) => setFormData({...formData, title: sanitize(e.target.value)})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle}>Slots</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><span className="text-xs font-bold font-sans">#</span></div>
                    <input 
                      type="number" 
                      min="0" 
                      placeholder="e.g., 50" 
                      className={inputStyle} 
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
                  <label className={labelStyle}>Deadline <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 z-10"><Calendar size={15} /></div>
                    <DatePicker
                      selected={formData.deadline ? new Date(formData.deadline) : null}
                      onChange={(date) => setFormData({...formData, deadline: date})}
                      dateFormat="yyyy-MM-dd"
                      placeholderText="Select deadline"
                      minDate={new Date()}
                      className={inputStyle}
                      wrapperClassName="w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle}>Amount Range</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><DollarSign size={15} /></div>
                    <input type="text" placeholder="e.g., 5,000 - 10,000" className={inputStyle} value={formData.amount_range} onChange={(e) => setFormData({...formData, amount_range: e.target.value.replace(/[^0-9\s-]/g, '')})} />
                  </div>
                </div>

                {/* --- TOGGLEABLE GWA SECTION --- */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={labelStyle}>Set GWA</label>
                    <button
                      type="button"
                      onClick={() => {
                        const nextState = !hasGwa;
                        setHasGwa(nextState);
                        if (!nextState) {
                          setFormData(prev => ({ ...prev, gwa: '' }));
                        }
                      }}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        hasGwa ? 'bg-[#093fb4]' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        hasGwa ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {hasGwa ? (
                    <div className="relative animate-in fade-in duration-150">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <GraduationCap size={16} />
                      </div>
                      <input 
                        type="number" 
                        step="0.01" 
                        min="0"
                        placeholder="e.g., 2.50" 
                        className={inputStyle} 
                        value={formData.gwa}
                        onKeyDown={preventInvalidNumberKeys}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || Number(val) >= 0) {
                            setFormData({ ...formData, gwa: val });
                          }
                        }} 
                      />
                    </div>
                  ) : (
                    <div className="py-3 px-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Disabled</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className={labelStyle}>Coverage <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><Shield size={15} /></div>
                  <select className="w-full pl-10 pr-8 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#093fb4] outline-none text-sm font-medium appearance-none text-slate-700" onChange={(e) => setFormData({...formData, fund_type: e.target.value})}>
                    <option value="">Select coverage type</option>
                    {["Discount", "Full-Tuition", "Financial-Assistance", "Merit-Based", "Semi-Annual", "Stipend", "Voucher"].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-2">Forms to be Downloaded <span className="text-slate-400 font-medium lowercase">(Agreement / Forms)</span></label>
                <div className="space-y-2">
                  {attachments.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-50 border border-slate-100 p-2 rounded-xl">
                      <span className="text-xs font-bold text-slate-700 truncate max-w-[200px] pl-1">{file.name}</span>
                      <button onClick={() => removeAttachment(idx)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                        <X size={14} strokeWidth={2.5} />
                      </button>
                    </div>
                  ))}
                  <label className="flex flex-col items-center justify-center w-full py-5 border-2 border-dashed border-slate-200 hover:border-[#093fb4]/40 rounded-2xl cursor-pointer hover:bg-blue-50/20 transition-all text-center group">
                    <FileUp size={22} className="text-slate-400 group-hover:text-[#093fb4] transition-colors mb-1.5" />
                    <p className="text-[11px] font-bold text-slate-700 group-hover:text-[#093fb4]">Drag & drop files here or <span className="text-[#093fb4] underline">click to browse</span></p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">PDF, DOCX, JPG, PNG (Max. 10MB)</p>
                    <input type="file" className="hidden" multiple onChange={handleFileChange} />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Document Requirements Panel Component */}
          <ScholarshipRequirements reqs={reqs} setReqs={setReqs} checked={checked} setChecked={setChecked} newReq={newReq} setNewReq={setNewReq} />
          
          {/* Column 3: Criteria Rules Panel Component */}
          <OrgCriteria criteria={criteria} setCriteria={setCriteria} />
        </div>

        {/* Full Width Block: Description Area */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-50 rounded-xl text-[#093fb4]"><BookOpen size={18} /></div>
              <div>
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">Scholarship Description</h2>
                <p className="text-[11px] text-slate-400 font-medium">Provide a detailed description of your scholarship program</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-slate-400">{(formData.description || '').length}/2000</span>
          </div>
          <textarea 
            maxLength={2000}
            className="w-full h-44 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-[#093fb4] focus:ring-2 focus:ring-[#093fb4]/10 transition-all font-medium text-slate-800 text-sm leading-relaxed placeholder:text-slate-400"
            onChange={(e) => setFormData({...formData, description: sanitize(e.target.value)})}
            placeholder="Enter at least 50 characters outlining qualifications, updates, and milestones..."
          />
        </div>

        {/* Bottom Workspace Fixed Form Footer Actions Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)} className="px-6 py-3.5 bg-slate-100 border border-slate-200 hover:bg-slate-200/70 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider transition-all">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-8 py-3.5 bg-[#093fb4] hover:bg-[#07369a] text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-[#093fb4]/10 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <><Send size={14} className="-mt-0.5" /> Create Program</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateScholarship;