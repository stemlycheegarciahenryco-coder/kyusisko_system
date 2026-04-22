import React, { useState } from 'react';
import { useParams } from "react-router-dom";
import { useScholarshipFields } from './hook/useScholarshipFields';
import FormPreview from './component/FormPreview';
import { Plus, Trash2, GripVertical, Save, FileUp } from 'lucide-react';
import api from './api';

const ScholarshipFormBuilder = () => {
  const { scholarshipId } = useParams();
  const { fields, setFields, loading: fetching } = useScholarshipFields(scholarshipId);
  const [loading, setLoading] = useState(false);

  // 1. Reduced to only File Upload
  const fieldTypes = [
    { value: 'file', label: 'File Upload (PDF/Image)' },
  ];

  const addField = () => {
    const newField = {
      field_label: '',
      field_type: 'file', // 2. Defaulting to 'file'
      is_required: true,
      options: [],
      validation_rules: {},
      sort_order: fields.length
    };
    setFields([...fields, newField]);
  };

  const removeField = (index) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index, key, value) => {
    const updated = [...fields];
    updated[index][key] = value;
    setFields(updated);
  };

  const handleSave = async () => {
    if (fields.length === 0) return alert("Please add at least one requirement.");
    
    const hasEmptyLabels = fields.some(field => !field.field_label.trim());
    if (hasEmptyLabels) {
        alert("Please fill in all requirement names.");
        return;
    }

    setLoading(true);
    try {
      await api.post(`/scholarships/${scholarshipId}/fields`, { fields });
      alert("Application requirements saved!");
    } catch (err) {
      console.error("Save error:", err.response?.data || err.message);
      alert("Failed to save layout.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-10 text-center font-bold">Loading Layout...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Document Requirements</h2>
          <p className="text-slate-500 font-medium">List the files students must upload to apply</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl transition-all font-bold shadow-lg shadow-blue-100 active:scale-95"
        >
          {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
          {loading ? 'Saving...' : 'Save Requirements'}
        </button>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={index} className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm hover:border-blue-200 transition-all relative group">
            <div className="flex gap-4 items-center">
              <div className="text-slate-300">
                <GripVertical size={20} />
              </div>
              
              <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Document Name */}
                <div className="md:col-span-8">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Document Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Birth Certificate or Grade Slip"
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-xl p-3 focus:border-blue-500 focus:bg-white outline-none transition-all"
                    value={field.field_label}
                    onChange={(e) => updateField(index, 'field_label', e.target.value)}
                  />
                </div>

                {/* Status Indicator (Locked to File) */}
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">Type</label>
                  <div className="flex items-center justify-center gap-2 text-blue-600 bg-blue-50 py-3 rounded-xl font-bold text-xs">
                    <FileUp size={14} /> FILE
                  </div>
                </div>

                {/* Required Toggle */}
                <div className="md:col-span-2 flex flex-col items-center">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Required</label>
                  <input
                    type="checkbox"
                    className="w-6 h-6 accent-blue-600 rounded-lg"
                    checked={field.is_required}
                    onChange={(e) => updateField(index, 'is_required', e.target.checked)}
                  />
                </div>
              </div>

              <button 
                onClick={() => removeField(index)}
                className="p-2 text-slate-300 hover:text-red-500 transition-colors"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addField}
        className="mt-6 w-full py-6 border-2 border-dashed border-slate-200 rounded-[2rem] flex items-center justify-center gap-2 text-slate-400 font-bold hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all group"
      >
        <Plus size={20} className="group-hover:scale-125 transition-transform" />
        Add Document Requirement
      </button>

      <FormPreview fields={fields} />
    </div>
  );
};

export default ScholarshipFormBuilder;