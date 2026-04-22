import React from 'react';

const FormPreview = ({ fields }) => {
  return (
    <div className="mt-12 pt-8 border-t-2 border-slate-200">
      <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
        <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
        Student Form Preview
      </h3>
      
      {fields.length === 0 ? (
        <div className="bg-slate-100 border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center text-slate-400 font-medium">
          No fields added yet.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-6">
          {fields.map((f, i) => (
            <div key={i} className="space-y-2">
              <label className="block text-sm font-bold text-slate-700 ml-1">
                {f.field_label || "Untitled Field"} {f.is_required && <span className="text-red-500">*</span>}
              </label>
              
              {f.field_type === 'text' && <input disabled className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3" placeholder="Short answer" />}
              {f.field_type === 'textarea' && <textarea disabled className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 h-24" placeholder="Paragraph" />}
              {f.field_type === 'file' && (
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center text-slate-400 bg-slate-50 font-bold text-xs uppercase tracking-widest">
                  Upload PDF/Image
                </div>
              )}
              {f.field_type === 'select' && (
                <select disabled className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-400">
                  <option>Select an option...</option>
                  {f.options?.map((opt, idx) => <option key={idx}>{opt}</option>)}
                </select>
              )}
              {f.field_type === 'number' && <input type="number" disabled className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3" placeholder="0" />}
              {f.field_type === 'date' && <input type="date" disabled className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FormPreview;