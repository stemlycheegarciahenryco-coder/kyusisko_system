import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

const ScholarshipRequirements = ({ reqs, setReqs, checked = [], setChecked = () => {}, newReq, setNewReq }) =>{
  const toggleReq = (label) => {
    const updated = checked.includes(label)
      ? checked.filter(i => i !== label)
      : [...checked, label];
    setChecked(updated);
  };

  const addCustomReq = () => {
    if (newReq.trim()) {
      const updatedList = [...reqs, { label: newReq, type: 'file' }]; 
      setReqs(updatedList); 
      setNewReq('');
    }
  };

  const removeReq = (label) => {
    setReqs(reqs.filter(r => r.label !== label));
    setChecked(checked.filter(c => c !== label));
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-black/5 h-full flex flex-col font-['Inter']">
      <h2 className="text-lg font-black text-black mb-6 tracking-tighter leading-tight">Document Requirements</h2>
      <div className="space-y-4 flex-1">
        {reqs.map((req) => (
          <div key={req.label} className="flex items-center justify-between group">
            <label className="flex items-center gap-3 cursor-pointer flex-1 group">
              <input
                type="checkbox"
                className="w-5 h-5 accent-[#093fb4] cursor-pointer"
                onChange={() => toggleReq(req.label)}
                checked={checked.includes(req.label)}
              />
              <span className="font-bold text-black text-sm group-hover:text-[#093fb4] transition-colors">{req.label}</span>
            </label>
            
            <button 
              type="button"
              onClick={() => removeReq(req.label)}
              className="text-black/20 hover:text-[#FF1E1E] transition-colors opacity-90 group-hover:opacity-100"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 flex gap-2">
        <input
          type="text"
          placeholder="Custom Requirement"
          value={newReq}
          onChange={(e) => setNewReq(e.target.value)}
          className="w-full p-3 bg-black/5 rounded-xl outline-none text-sm font-['Inter']"
        />
        <button
          type="button"
          onClick={addCustomReq}
          className="bg-[#093fb4] text-white p-3 rounded-xl hover:bg-[#07369a] transition-all"
        >
          <Plus size={20} />
        </button>
      </div>
    </div>
  );
};

export default ScholarshipRequirements;