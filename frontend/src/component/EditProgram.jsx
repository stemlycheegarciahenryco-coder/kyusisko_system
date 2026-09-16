import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css"; 
import { Loader2, X } from 'lucide-react'; // FIXED: Imported X icon
import api from '../api'; 
import ScholarshipRequirements from '../component/ScholarshipRequirements';
import OrgCriteria from '../org/OrgCriteria';

const EditProgram = ({ scholarship, onUpdateSuccess, onCancel }) => {
  
  const parseInboundDate = (dateInput) => {
    if (!dateInput) return new Date();
    const parsedDate = new Date(dateInput);
    if (isNaN(parsedDate.getTime())) return new Date();
    const year = parsedDate.getFullYear();
    const month = parsedDate.getMonth(); 
    const day = parsedDate.getDate();
    return new Date(year, month, day);
  };

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
  const [checkedReqs, setCheckedReqs] = useState(
    scholarship.requirements ? scholarship.requirements.map(r => r.label || r.field_label) : []
  );

  const handleUpdate = async () => {
    setLoading(true);
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
      alert("Failed to update: " + (err.response?.data?.message || err.message)); 
    } finally { 
      setLoading(false); 
    }
  };

  const inputCls = "w-full p-4 bg-white/60 border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#093fb4] transition-all shadow-sm";
  const labelCls = "block text-xs font-black text-slate-700 uppercase tracking-widest mb-2 ml-1";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto font-['Inter']">
      <div className="bg-white/90 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/60 custom-scrollbar">
        
        {/* FIXED: Added a flex container for the header to align the Title and X button */}
        <div className="flex justify-between items-start mb-8">
          <h2 className="text-3xl font-black uppercase text-slate-900 tracking-tight">Edit Program</h2>
          <button 
            type="button"
            onClick={onCancel} 
            className="w-12 h-12 flex items-center justify-center bg-white/60 border-2 border-slate-200 text-slate-500 rounded-2xl hover:border-red-200 hover:bg-red-50 hover:text-red-500 transition-all flex-shrink-0 shadow-sm"
          >
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className={labelCls}>Program Title</label>
            <input 
              className={inputCls} 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})} 
              placeholder="Enter scholarship title" 
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelCls}>Deadline Date</label>
              <DatePicker 
                selected={formData.deadline} 
                onChange={(date) => setFormData({...formData, deadline: date})} 
                className={inputCls} 
                dateFormat="yyyy-MM-dd" 
                minDate={new Date()}
                wrapperClassName="w-full"
              />
            </div>
            <div>
              <label className={labelCls}>Available Slots</label>
              <input 
                type="number" 
                className={inputCls} 
                value={formData.slots} 
                onChange={e => setFormData({...formData, slots: e.target.value})} 
                placeholder="e.g. 50" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className={labelCls}>Coverage Type</label>
              <input 
                className={inputCls} 
                value={formData.fund_type} 
                onChange={e => setFormData({...formData, fund_type: e.target.value})} 
                placeholder="e.g. Full tuition" 
              />
            </div>
            <div>
              <label className={labelCls}>Amount Range</label>
              <input 
                className={inputCls} 
                value={formData.amount_range} 
                onChange={e => setFormData({...formData, amount_range: e.target.value})} 
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
                onChange={e => setFormData({...formData, gwa_requirement: e.target.value})} 
                placeholder="e.g. 1.75" 
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Program Description</label>
            <textarea 
              className={`${inputCls} h-36 resize-none`} 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
              placeholder="Write a clear description of the scholarship..." 
            />
          </div>
          
          <div className="pt-6 border-t-2 border-black/5">
            <h3 className="font-black mb-4 text-xs uppercase tracking-[0.2em] text-[#093fb4] ml-1">Requirements</h3>
            <ScholarshipRequirements 
              reqs={formData.requirements || []} 
              setReqs={(updatedReqs) => setFormData(prev => ({ ...prev, requirements: updatedReqs }))} 
              newReq={newReq}
              setNewReq={setNewReq}
              checked={checkedReqs}
              setChecked={setCheckedReqs}
            />
          </div>

          <div className="pt-6 border-t-2 border-black/5">
            <h3 className="font-black mb-4 text-xs uppercase tracking-[0.2em] text-[#093fb4] ml-1">Target Criteria</h3>
            <OrgCriteria 
              criteria={formData.criteria} 
              setCriteria={(c) => setFormData({...formData, criteria: c})} 
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-10">
          <button 
            type="button" 
            onClick={onCancel} 
            className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="button" 
            onClick={handleUpdate} 
            disabled={loading} 
            className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] bg-[#093fb4] text-white hover:bg-[#073496] flex justify-center items-center shadow-xl shadow-[#093fb4]/25 transition-all active:scale-95 disabled:opacity-70"
          >
            {loading ? <Loader2 className="animate-spin" size={20} strokeWidth={2.5} /> : "Update Program"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProgram;