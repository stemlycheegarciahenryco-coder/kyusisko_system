import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css"; // Ensure Datepicker CSS styling loads here too
import { Loader2 } from 'lucide-react';
import api from '../api'; 
import ScholarshipRequirements from '../component/ScholarshipRequirements';
import OrgCriteria from '../org/OrgCriteria';

const EditProgram = ({ scholarship, onUpdateSuccess, onCancel }) => {
  
  // 💡 FIX: Parses date text directly without allowing native JS engine to apply a UTC drop
  const parseInboundDate = (dateInput) => {
  if (!dateInput) return new Date();

  // 1. Convert to a native JS Date object safely
  const parsedDate = new Date(dateInput);

  // If it's an invalid date format, fall back to today
  if (isNaN(parsedDate.getTime())) return new Date();

  // 2. Extract the LOCAL browser values directly. 
  // This extracts the real calendar date based on your local system time (GMT+0800),
  // which shifts 2026-05-27T16:00:00.000Z back to May 28, 2026!
  const year = parsedDate.getFullYear();
  const month = parsedDate.getMonth(); // Keeps 0-11 index format for constructor
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

      // 💡 FIXED: Declared cleanly outside the local block scope so payload can capture it correctly
      let formattedDeadline = formData.deadline;
      if (formData.deadline instanceof Date) {
        const year = formData.deadline.getFullYear();
        const month = String(formData.deadline.getMonth() + 1).padStart(2, '0');
        const day = String(formData.deadline.getDate()).padStart(2, '0');
        formattedDeadline = `${year}-${month}-${day}`; // Hard locks format "YYYY-MM-DD"
      } else if (typeof formData.deadline === 'string') {
        formattedDeadline = formData.deadline.split('T')[0];
      }

      const payload = {
        title: formData.title,
        description: formData.description,
        deadline: formattedDeadline, // 💡 Sends clean, non-shifted "YYYY-MM-DD" text string
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

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FFFCFB] p-8 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-4 border-[#093fb4]">
        <h2 className="text-2xl font-black mb-6 uppercase text-[#093fb4]">Edit Program</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black text-black uppercase mb-1 tracking-tight">Program Title</label>
            <input 
              className="w-full p-4 bg-black/5 rounded-xl text-sm border-2 border-transparent focus:border-[#093fb4] outline-none" 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})} 
              placeholder="Title" 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-black uppercase mb-1 tracking-tight">Deadline Date</label>
              {/* 💡 DatePicker Integrated and Controlled Here */}
              <DatePicker 
                selected={formData.deadline} 
                onChange={(date) => setFormData({...formData, deadline: date})} 
                className="w-full p-4 bg-black/5 rounded-xl text-sm border-2 border-transparent focus:border-[#093fb4] outline-none" 
                dateFormat="yyyy-MM-dd" 
                minDate={new Date()}
                wrapperClassName="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-black uppercase mb-1 tracking-tight">Available Slots</label>
              <input 
                type="number" 
                className="w-full p-4 bg-black/5 rounded-xl text-sm border-2 border-transparent focus:border-[#093fb4] outline-none" 
                value={formData.slots} 
                onChange={e => setFormData({...formData, slots: e.target.value})} 
                placeholder="Slots" 
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-black text-black uppercase mb-1 tracking-tight">Coverage Type</label>
              <input 
                className="w-full p-4 bg-black/5 rounded-xl text-sm border-2 border-transparent focus:border-[#093fb4] outline-none" 
                value={formData.fund_type} 
                onChange={e => setFormData({...formData, fund_type: e.target.value})} 
                placeholder="Fund Type" 
              />
            </div>
            <div>
              <label className="block text-xs font-black text-black uppercase mb-1 tracking-tight">Amount Range</label>
              <input 
                className="w-full p-4 bg-black/5 rounded-xl text-sm border-2 border-transparent focus:border-[#093fb4] outline-none" 
                value={formData.amount_range} 
                onChange={e => setFormData({...formData, amount_range: e.target.value})} 
                placeholder="Amount Range" 
              />
            </div>
            <div>
              <label className="block text-xs font-black text-black uppercase mb-1 tracking-tight">Min GWA</label>
              <input 
                type="number" 
                step="0.01"
                className="w-full p-4 bg-black/5 rounded-xl text-sm border-2 border-transparent focus:border-[#093fb4] outline-none" 
                value={formData.gwa_requirement} 
                onChange={e => setFormData({...formData, gwa_requirement: e.target.value})} 
                placeholder="GWA Req." 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-black uppercase mb-1 tracking-tight">Program Description</label>
            <textarea 
              className="w-full p-4 bg-black/5 rounded-xl text-sm h-32 border-2 border-transparent focus:border-[#093fb4] outline-none" 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
              placeholder="Description" 
            />
          </div>
          
          <div className="pt-4 border-t border-black/10">
            <h3 className="font-bold mb-2 text-sm text-[#093fb4]">Requirements</h3>
            <ScholarshipRequirements 
              reqs={formData.requirements || []} 
              setReqs={(updatedReqs) => setFormData(prev => ({ ...prev, requirements: updatedReqs }))} 
              newReq={newReq}
              setNewReq={setNewReq}
              checked={checkedReqs}
              setChecked={setCheckedReqs}
            />
          </div>

          <div className="pt-4 border-t border-black/10">
            <h3 className="font-bold mb-2 text-sm text-[#093fb4]">Criteria</h3>
            <OrgCriteria 
              criteria={formData.criteria} 
              setCriteria={(c) => setFormData({...formData, criteria: c})} 
            />
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button type="button" onClick={onCancel} className="flex-1 py-4 rounded-xl font-black text-sm bg-black/5 text-black hover:bg-black/10">Cancel</button>
          <button type="button" onClick={handleUpdate} disabled={loading} className="flex-1 py-4 rounded-xl font-black text-sm bg-[#093fb4] text-[#FFFCFB] hover:bg-[#07369a] flex justify-center">
            {loading ? <Loader2 className="animate-spin" /> : "Update Program"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProgram;