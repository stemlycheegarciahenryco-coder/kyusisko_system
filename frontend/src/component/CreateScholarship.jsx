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
  
  // Toggles for optional fields
  const [hasGwa, setHasGwa] = useState(false);
  const [hasAmount, setHasAmount] = useState(false); 

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
    amount_range: '', 
    gwa: '', 
    fund_type: '' 
  });

  // Updated styles for better readability (larger fonts, darker text)
  const inputStyle = "w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#093fb4] focus:ring-4 focus:ring-[#093fb4]/10 outline-none text-sm md:text-base transition-all font-medium text-slate-900 placeholder:text-slate-400";
  const labelStyle = "block text-xs md:text-sm font-bold text-slate-800 uppercase tracking-wide mb-2";

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
    data.append('amount_range', hasAmount ? (formData.amount_range || '') : '');
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
    <div className="p-4 md:p-8 bg-[#f8fafc] min-h-screen font-['Inter'] relative text-slate-900">
      
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
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-4 font-bold text-sm text-slate-500 uppercase tracking-wider hover:text-[#093fb4] transition-colors">
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

        {/* Main 3 Column Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          
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
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><ClipboardList size={18} /></div>
                  <input 
                    type="text" 
                    maxLength={100} 
                    placeholder="Enter official program title" 
                    className={inputStyle} 
                    onChange={(e) => setFormData({...formData, title: sanitize(e.target.value)})} 
                  />
                </div>
              </div>

              {/* Slots & Deadline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-4">
                <div>
                  <label className={labelStyle}>Available Slots</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><span className="text-sm font-bold font-sans">#</span></div>
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
                  <label className={labelStyle}>Application Deadline <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 z-10"><Calendar size={18} /></div>
                    <DatePicker
                      selected={formData.deadline ? new Date(formData.deadline) : null}
                      onChange={(date) => setFormData({...formData, deadline: date})}
                      dateFormat="yyyy-MM-dd"
                      placeholderText="Select closing date"
                      minDate={getTomorrow()}
                      shouldCloseOnSelect={true}
                      className={inputStyle}
                      wrapperClassName="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Toggles: Amount & GWA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-4">
                
                {/* Amount Toggle Component */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={labelStyle}>Amount Range</label>
                    <button
                      type="button"
                      onClick={() => {
                        const nextState = !hasAmount;
                        setHasAmount(nextState);
                        if (!nextState) setFormData(prev => ({ ...prev, amount_range: '' }));
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#093fb4] focus:ring-offset-1 ${hasAmount ? 'bg-[#093fb4]' : 'bg-slate-300'}`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${hasAmount ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {hasAmount ? (
                    <div className="relative animate-in fade-in duration-200">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <DollarSign size={18} />
                      </div>
                      <input 
                        type="text" 
                        placeholder="e.g., 5,000 - 10,000" 
                        className={inputStyle} 
                        value={formData.amount_range} 
                        onChange={(e) => setFormData({...formData, amount_range: e.target.value.replace(/[^0-9\s-]/g, '')})} 
                      />
                    </div>
                  ) : (
                    <div className="py-3.5 px-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Undisclosed</span>
                    </div>
                  )}
                </div>

                {/* GWA Toggle Component */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={labelStyle}>GWA Requirement</label>
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
                        <GraduationCap size={18} />
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
                    <div className="py-3.5 px-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center">
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

              {/* Downloads / Attachments Section */}
              <div className="pt-6 border-t border-slate-100">
                <label className={labelStyle}>
                  Attached Forms <span className="text-slate-500 font-medium normal-case tracking-normal ml-1">(Optional guidelines, templates)</span>
                </label>
                
                <div className="space-y-3 mt-3">
                  {attachments.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                      <span className="text-sm font-semibold text-slate-700 truncate max-w-[80%] pl-1">{file.name}</span>
                      <button onClick={() => removeAttachment(idx)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Remove file">
                        <X size={16} strokeWidth={2.5} />
                      </button>
                    </div>
                  ))}
                  
                  <label className="flex flex-col items-center justify-center w-full py-8 border-2 border-dashed border-slate-300 hover:border-[#093fb4]/60 rounded-2xl cursor-pointer hover:bg-blue-50/30 transition-all text-center group">
                    <FileUp size={28} className="text-slate-400 group-hover:text-[#093fb4] transition-colors mb-3" />
                    <p className="text-sm font-bold text-slate-700 group-hover:text-[#093fb4]">Drag & drop files here or <span className="text-[#093fb4] underline">browse</span></p>
                    <p className="text-xs text-slate-500 font-medium mt-1.5">Supported: PDF, DOCX, JPG, PNG (Max. 10MB)</p>
                    <input type="file" className="hidden" multiple onChange={handleFileChange} />
                  </label>
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

        {/* Action Bar Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-4 pb-12">
          <button 
            type="button" 
            onClick={() => navigate(-1)} 
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