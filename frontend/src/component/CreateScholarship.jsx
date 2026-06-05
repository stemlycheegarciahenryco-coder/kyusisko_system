import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, FileUp, X, AlertTriangle } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

import api from '../api';
import ScholarshipRequirements from './ScholarshipRequirements';
import OrgCriteria from '../org/OrgCriteria';

const CreateScholarship = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [criteria, setCriteria] = useState([]);
  const [attachments, setAttachments] = useState([]); 
  
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

  const inputStyle = "w-full p-3 bg-black/5 rounded-xl border border-transparent focus:border-black/10 outline-none text-sm transition-all font-['Inter']";
  const labelStyle = "block text-xs font-black text-black uppercase mb-1 font-['Inter'] tracking-tight";

  const sanitize = (value) => value.replace(/[<>&"']/g, '');

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

    // 💡 FIXED: Properly assigning formatted string to variable accessible by FormData append
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
    data.append('deadline', formattedDeadline); // Sends clean "YYYY-MM-DD"
    data.append('slots', formData.slots || '');
    data.append('gwa', formData.gwa || '');
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
    <div className="p-8 bg-[#FFFCFB] min-h-screen font-['Inter'] relative">
      {validationModal.open && (
        <div 
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setValidationModal({ open: false, title: '', message: '' })}
        >
          <div 
            className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl border border-black/5 animate-in zoom-in-95 duration-200 flex flex-col items-center text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 mb-4 border border-amber-100">
              <AlertTriangle size={24} strokeWidth={2.5} />
            </div>
            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight mb-2">{validationModal.title}</h3>
            <p className="text-slate-500 text-xs font-semibold leading-relaxed mb-6 px-2">{validationModal.message}</p>
            <button 
              onClick={() => setValidationModal({ open: false, title: '', message: '' })}
              className="w-full py-3.5 bg-[#093fb4] text-white font-black rounded-xl uppercase text-[10px] tracking-widest hover:bg-[#07369a] transition-all shadow-md shadow-[#093fb4]/10"
            >
              Understand
            </button>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-6 font-black text-sm uppercase tracking-widest hover:text-[#093fb4] transition-colors">
          <ArrowLeft size={18} strokeWidth={3} /> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-black/5 flex flex-col">
            <h2 className="text-lg font-black text-black mb-4 tracking-tighter uppercase">Program Info</h2>
            
            <div className="space-y-4 flex-grow">
              <div>
                <label className={labelStyle}>Program Title</label>
                <input type="text" className={inputStyle} onChange={(e) => setFormData({...formData, title: sanitize(e.target.value)})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle}>Slots</label>
                  <input type="number" min="0" className={inputStyle} onChange={(e) => setFormData({ ...formData, slots: e.target.value })} />
                </div>
                <div>
                  <label className={labelStyle}>Deadline</label>
                  <DatePicker
                    selected={formData.deadline ? new Date(formData.deadline) : null}
                    onChange={(date) => setFormData({...formData, deadline: date})}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="Select Date"
                    minDate={new Date()}
                    className={inputStyle}
                    wrapperClassName="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle}>Amount Range</label>
                  <input 
                    type="text" 
                    placeholder="5000-10000" 
                    className={inputStyle} 
                    value={formData.amount_range}
                    onChange={(e) => setFormData({...formData, amount_range: e.target.value.replace(/[^0-9-]/g, '')})} 
                  />
                </div>
                <div>
                  <label className={labelStyle}> GWA</label>
                  <input type="number" step="0.01" placeholder="optional" className={inputStyle} onChange={(e) => setFormData({...formData, gwa: e.target.value})} />
                </div>
              </div>

              <div>
                <label className={labelStyle}>Coverage</label>
                <select className={inputStyle} onChange={(e) => setFormData({...formData, fund_type: e.target.value})}>
                  <option value="">Select Type</option>
                  {["Discount", "Full-Tuition", "Financial-Assistance", "Merit-Based", "Semi-Annual", "Stipend", "Voucher"].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 mt-2 border-t border-black/5">
                <label className={labelStyle}>Forms to be Downloaded <span className="text-black/30 lowercase font-bold">(Agreement/Forms)</span></label>
                <div className="space-y-2 mt-2">
                  {attachments.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-black/5 p-2 rounded-xl border border-black/5">
                      <span className="text-[10px] font-black text-black truncate max-w-[140px] uppercase pl-1">{file.name}</span>
                      <button onClick={() => removeAttachment(idx)} className="text-[#FF1E1E] hover:bg-red-50 p-1 rounded-lg transition-colors">
                        <X size={14} strokeWidth={3} />
                      </button>
                    </div>
                  ))}
                  <label className="flex flex-col items-center justify-center w-full py-4 border-2 border-dashed border-black/10 rounded-[1.5rem] cursor-pointer hover:bg-black/5 transition-all group">
                    <FileUp size={20} className="text-black/20 group-hover:text-[#093fb4] transition-colors mb-1" />
                    <p className="text-[9px] font-black text-black/40 uppercase tracking-widest">Attach Files</p>
                    <input type="file" className="hidden" multiple onChange={handleFileChange} />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <ScholarshipRequirements reqs={reqs} setReqs={setReqs} checked={checked} setChecked={setChecked} newReq={newReq} setNewReq={setNewReq} />
          <OrgCriteria criteria={criteria} setCriteria={setCriteria} />
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-black/5 mb-6">
          <label className={labelStyle}>Scholarship Description</label>
          <textarea 
            className="w-full h-64 p-4 bg-black/5 rounded-2xl outline-none focus:border-2 border-[#093fb4]/20 transition-all font-['Inter'] text-sm"
            onChange={(e) => setFormData({...formData, description: sanitize(e.target.value)})}
            placeholder="Enter at least 50 characters..."
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-[#093fb4] text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#07369a] transition-all shadow-lg shadow-[#093fb4]/20 active:scale-95"
        >
          {loading ? <Loader2 className="animate-spin mx-auto" /> : "Create Program"}
        </button>
      </div>
    </div>
  );
};

export default CreateScholarship;