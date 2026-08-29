import React, { useState } from 'react';
import { Plus, Trash2, Folder, GripVertical, Check } from 'lucide-react';

const ScholarshipRequirements = ({ reqs, setReqs, checked = [], setChecked = () => {}, newReq, setNewReq }) => {
  const [isAdding, setIsAdding] = useState(false);

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
      // Auto check newly injected custom item
      setChecked([...checked, newReq.trim()]);
      setNewReq('');
      setIsAdding(false);
    }
  };

  const removeReq = (label) => {
    setReqs(reqs.filter(r => r.label !== label));
    setChecked(checked.filter(c => c !== label));
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs h-full flex flex-col font-['Inter']">
      <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-100 shrink-0">
        <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600"><Folder size={18} /></div>
        <div>
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">Document Requirements</h2>
          <p className="text-[11px] text-slate-400 font-medium">List of required documents from applicants</p>
        </div>
      </div>

      {/* Active Items Feed View */}
      {/* UPDATED: Removed max-h-[380px] to allow flex-1 to push the footer perfectly to the bottom */}
      <div className="space-y-2.5 flex-1 overflow-y-auto min-h-[200px] pr-1">
        {reqs.map((req) => {
          const isSelected = checked.includes(req.label);
          return (
            <div key={req.label} className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-150 ${isSelected ? 'bg-blue-50/30 border-blue-100' : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50'}`}>
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                {/* Visual Accent Drag Handle Component Indicator */}
                <GripVertical size={15} className="text-slate-300 shrink-0 cursor-grab active:cursor-grabbing" />
                <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      className="peer h-5 w-5 appearance-none rounded-md border border-slate-300 bg-white checked:bg-[#093fb4] checked:border-[#093fb4] transition-all cursor-pointer"
                      onChange={() => toggleReq(req.label)}
                      checked={isSelected}
                    />
                    <Check size={12} strokeWidth={3} className="absolute text-white opacity-0 peer-checked:opacity-100 left-1 pointer-events-none transition-opacity" />
                  </div>
                  <span className={`text-sm font-bold truncate transition-colors ${isSelected ? 'text-[#093fb4]' : 'text-slate-700'}`}>
                    {req.label}
                  </span>
                </label>
              </div>
              
              <button 
                type="button"
                onClick={() => removeReq(req.label)}
                className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all ml-2"
              >
                <Trash2 size={15} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Adding / Insertion Row Controls Container */}
      <div className="mt-5 pt-4 border-t border-slate-100 shrink-0">
        {isAdding ? (
          <div className="flex gap-2 animate-in fade-in zoom-in-95 duration-150">
            <input
              type="text"
              autoFocus
              placeholder="Enter custom document requirement name..."
              value={newReq}
              onChange={(e) => setNewReq(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustomReq()}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium text-slate-800 focus:border-[#093fb4] focus:bg-white transition-all"
            />
            <button type="button" onClick={addCustomReq} className="bg-[#093fb4] text-white px-4 rounded-xl hover:bg-[#07369a] text-xs font-bold transition-all whitespace-nowrap">
              Save
            </button>
            <button type="button" onClick={() => { setIsAdding(false); setNewReq(''); }} className="bg-slate-100 text-slate-500 border border-slate-200 px-3 rounded-xl hover:bg-slate-200/60 text-xs transition-all">
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="w-full py-3 bg-emerald-50/50 hover:bg-emerald-50 border border-dashed border-emerald-200 hover:border-emerald-300 text-emerald-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-[0.99]"
          >
            <Plus size={15} strokeWidth={2.5} /> Add Custom Requirement
          </button>
        )}
      </div>
    </div>
  );
};

export default ScholarshipRequirements;