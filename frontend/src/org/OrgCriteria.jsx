import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

const defaultOptions = [
  "4PS", "PWD", "Freshmen", "Student Athlete/Arts", 
  "Working Student", "Indigenous", "OFW", "No Failing Grades"
];

const OrgCriteria = ({ criteria = [], setCriteria }) => {
  const [newCrit, setNewCrit] = useState('');

  const toggleCriteria = (item) => {
    const updated = criteria.includes(item)
      ? criteria.filter(i => i !== item)
      : [...criteria, item];
    setCriteria(updated);
  };

  const addCustomCriteria = () => {
    if (newCrit.trim() && !criteria.includes(newCrit.trim())) {
      setCriteria([...criteria, newCrit.trim()]);
      setNewCrit('');
    }
  };

  const removeCustom = (item) => {
    setCriteria(criteria.filter(i => i !== item));
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-black/5 h-full flex flex-col font-['Inter']">
      <h2 className="text-lg font-black text-black mb-6 tracking-tighter">Criteria</h2>
      
      <div className="space-y-4 flex-1">
        {defaultOptions.map((item) => (
          <label key={item} className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              className="w-5 h-5 accent-[#093fb4] cursor-pointer"
              onChange={() => toggleCriteria(item)}
              checked={criteria.includes(item)}
            />
            <span className="font-bold text-black text-sm group-hover:text-[#093fb4] transition-colors">{item}</span>
          </label>
        ))}

        {criteria.filter(c => !defaultOptions.includes(c)).map((item) => (
          <div key={item} className="flex items-center justify-between group py-1">
            <span className="font-bold text-[#093fb4] text-sm italic">• {item}</span>
            <button 
              type="button"
              onClick={() => removeCustom(item)}
              className="text-black/20 hover:text-[#FF1E1E] transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 flex gap-2">
        <input
          type="text"
          placeholder="Custom Criteria"
          value={newCrit}
          onChange={(e) => setNewCrit(e.target.value)}
          className="w-full p-3 bg-black/5 rounded-xl outline-none text-sm font-['Inter']"
        />
        <button
          type="button"
          onClick={addCustomCriteria}
          className="bg-[#093fb4] text-white p-3 rounded-xl hover:bg-[#07369a] transition-all"
        >
          <Plus size={20} />
        </button>
      </div>
    </div>
  );
};

export default OrgCriteria;