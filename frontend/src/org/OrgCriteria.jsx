import React, { useState } from 'react';
import { Plus, Trash2, Shield, GripVertical, Check, Sparkles } from 'lucide-react';

// Quick-add suggestions — still plain strings, same shape as any custom
// criteria. These aren't "special" anymore; the AI matcher reads every
// criterion the same way, whether it came from this checklist or was
// typed freeform below.
const defaultOptions = [
  "4PS", "PWD", "Freshman", "Student Athlete/Arts",
  "Working Student", "Indigenous", "OFW", "No Failing Grades"
];

const OrgCriteria = ({ criteria = [], setCriteria }) => {
  const [newCrit, setNewCrit] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const toggleCriteria = (item) => {
    const updated = criteria.includes(item)
      ? criteria.filter(i => i !== item)
      : [...criteria, item];
    setCriteria(updated);
  };

  const addCustomCriteria = () => {
    const label = newCrit.trim();
    if (label && !criteria.includes(label)) {
      setCriteria([...criteria, label]);
      setNewCrit('');
      setIsAdding(false);
    }
  };

  const removeCustom = (item) => {
    setCriteria(criteria.filter(i => i !== item));
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs h-full flex flex-col font-['Inter']">
      <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-100 shrink-0">
        <div className="p-2 bg-purple-50 rounded-xl text-purple-600"><Shield size={18} /></div>
        <div>
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">Criteria</h2>
          <p className="text-[11px] text-slate-400 font-medium">Eligibility criteria for applicants — matched by AI against each applicant's profile</p>
        </div>
      </div>

      <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[380px] pr-1">
        {defaultOptions.map((item) => {
          const isSelected = criteria.includes(item);
          return (
            <div key={item} className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-150 ${isSelected ? 'bg-blue-50/30 border-blue-100' : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50'}`}>
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <GripVertical size={15} className="text-slate-300 shrink-0 cursor-grab" />
                <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      className="peer h-5 w-5 appearance-none rounded-md border border-slate-300 bg-white checked:bg-[#093fb4] checked:border-[#093fb4] transition-all cursor-pointer"
                      onChange={() => toggleCriteria(item)}
                      checked={isSelected}
                    />
                    <Check size={12} strokeWidth={3} className="absolute text-white opacity-0 peer-checked:opacity-100 left-1 pointer-events-none transition-opacity" />
                  </div>
                  <span className={`text-sm font-bold truncate transition-colors ${isSelected ? 'text-[#093fb4]' : 'text-slate-700'}`}>
                    {item}
                  </span>
                </label>
              </div>
            </div>
          );
        })}

        {/* Custom, freeform criteria — e.g. "Roman Catholic", "Male",
            "Civil Engineering major", "Must have led a community project".
            All matched the same way: the AI reads this text directly
            against the student's profile, no fixed field required. */}
        {criteria.filter(c => !defaultOptions.includes(c)).map((item) => (
          <div key={item} className="flex items-center justify-between p-3 rounded-xl border bg-purple-50/20 border-purple-100/60 animate-in fade-in duration-150">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <Sparkles size={15} className="text-purple-400 shrink-0" />
              <span className="text-sm font-bold text-[#093fb4] truncate">{item}</span>
            </div>
            <button
              type="button"
              onClick={() => removeCustom(item)}
              className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all ml-2"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100 shrink-0">
        {isAdding ? (
          <div className="flex gap-2 animate-in fade-in zoom-in-95 duration-150">
            <input
              type="text"
              autoFocus
              placeholder="e.g. Roman Catholic, Male, Civil Engineering major..."
              value={newCrit}
              onChange={(e) => setNewCrit(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustomCriteria()}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium text-slate-800 focus:border-[#093fb4] focus:bg-white transition-all"
            />
            <button type="button" onClick={addCustomCriteria} className="bg-[#093fb4] text-white px-4 rounded-xl hover:bg-[#07369a] text-xs font-bold transition-all whitespace-nowrap">
              Save
            </button>
            <button type="button" onClick={() => { setIsAdding(false); setNewCrit(''); }} className="bg-slate-100 text-slate-500 border border-slate-200 px-3 rounded-xl hover:bg-slate-200/60 text-xs transition-all">
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="w-full py-3 bg-purple-50/50 hover:bg-purple-50 border border-dashed border-purple-200 hover:border-purple-300 text-purple-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-[0.99]"
          >
            <Plus size={15} strokeWidth={2.5} /> Add Any Custom Criteria
          </button>
        )}
      </div>
    </div>
  );
};

export default OrgCriteria;