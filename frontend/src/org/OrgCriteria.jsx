import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Shield, GripVertical, Check, Sparkles, BookOpen } from 'lucide-react';
import api from '../api';

// Standard eligibility criteria tags aligned with student database profile flags
// Standard eligibility criteria tags aligned with student database profile flags
const defaultOptions = [
  "Government Beneficiary (eg.4PS,AKAP,TUPAD etc...)",
  "PWD(eg..Blind,Hearing etc...)",
  "Working Student",
  "Indigenous/ Ethnic Student(eg..aeta,badjao like that)",
  "Athlete",
  "Freshman",
  "No Failing Grades"
];

const OrgCriteria = ({ criteria = [], setCriteria }) => {
  const [newCrit, setNewCrit] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');

  // Fetch degree programs from public.courses table on load
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/lookup/courses');
        const data = res.data?.data || res.data || [];
        const activeCourses = Array.isArray(data)
          ? data.filter(c => c.is_active !== false).map(c => c.name)
          : [];
        setCourses(activeCourses);
      } catch (err) {
        console.error("Failed to load course list:", err);
      }
    };
    fetchCourses();
  }, []);

  const toggleCriteria = (item) => {
    const updated = criteria.includes(item)
      ? criteria.filter(i => i !== item)
      : [...criteria, item];
    setCriteria(updated);
  };

  // Sanitizes inputs by stripping special chars, HTML tags, and redundant spaces
  const sanitizeCustomCriteria = (input) => {
    return input
      .replace(/[<>&"']/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const addCustomCriteria = () => {
    const cleaned = sanitizeCustomCriteria(newCrit);
    if (!cleaned) return;

    // Standardizes casing (e.g. "roman catholic" -> "Roman Catholic")
    const formatted = cleaned.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());

    if (!criteria.includes(formatted)) {
      setCriteria([...criteria, formatted]);
      setNewCrit('');
      setIsAdding(false);
    }
  };

  const handleCourseSelect = (courseName) => {
    if (courseName && !criteria.includes(courseName)) {
      setCriteria([...criteria, courseName]);
      setSelectedCourse('');
    }
  };

  const removeCriteria = (item) => {
    setCriteria(criteria.filter(i => i !== item));
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs h-full flex flex-col font-['Inter']">
      <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-100 shrink-0">
        <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
          <Shield size={18} />
        </div>
        <div>
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">Criteria</h2>
          <p className="text-[11px] text-slate-400 font-medium">Eligibility criteria for applicants — matched against applicant profiles</p>
        </div>
      </div>

      <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[380px] pr-1">
        {/* Pre-defined Standard Criteria Checklist */}
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

        {/* Selected Degree Programs & Custom Tags */}
        {criteria.filter(c => !defaultOptions.includes(c)).map((item) => (
          <div key={item} className="flex items-center justify-between p-3 rounded-xl border bg-purple-50/20 border-purple-100/60 animate-in fade-in duration-150">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <Sparkles size={15} className="text-purple-400 shrink-0" />
              <span className="text-sm font-bold text-[#093fb4] truncate">{item}</span>
            </div>
            <button
              type="button"
              onClick={() => removeCriteria(item)}
              className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all ml-2"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100 shrink-0 space-y-3">
        
        {/* Dynamic Course Picker from public.courses */}
        <div>
          <div className="relative">
            <select
              value={selectedCourse}
              onChange={(e) => handleCourseSelect(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold text-slate-700 focus:border-[#093fb4] focus:bg-white transition-all appearance-none cursor-pointer"
            >
              <option value="">+ Add Specific Degree Program / Course</option>
              {courses.map((courseName, idx) => (
                <option key={idx} value={courseName} disabled={criteria.includes(courseName)}>
                  {courseName} {criteria.includes(courseName) ? '✓ (Added)' : ''}
                </option>
              ))}
            </select>
            <BookOpen size={15} className="absolute left-3 top-3 text-slate-400 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Custom Criteria Input with Sanitization */}
        {isAdding ? (
          <div className="flex gap-2 animate-in fade-in zoom-in-95 duration-150">
            <input
              type="text"
              autoFocus
              maxLength={60}
              placeholder="e.g. Islam, Roman Catholic, Single Parent..."
              value={newCrit}
              onChange={(e) => setNewCrit(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomCriteria())}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-medium text-slate-800 focus:border-[#093fb4] focus:bg-white transition-all"
            />
            <button 
              type="button" 
              onClick={addCustomCriteria} 
              className="bg-[#093fb4] text-white px-4 rounded-xl hover:bg-[#07369a] text-xs font-bold transition-all whitespace-nowrap"
            >
              Save
            </button>
            <button 
              type="button" 
              onClick={() => { setIsAdding(false); setNewCrit(''); }} 
              className="bg-slate-100 text-slate-500 border border-slate-200 px-3 rounded-xl hover:bg-slate-200/60 text-xs transition-all"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="w-full py-2.5 bg-purple-50/50 hover:bg-purple-50 border border-dashed border-purple-200 hover:border-purple-300 text-purple-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-[0.99]"
          >
            <Plus size={15} strokeWidth={2.5} /> Add Custom Tag (Religion, Status, etc.)
          </button>
        )}
      </div>
    </div>
  );
};

export default OrgCriteria;