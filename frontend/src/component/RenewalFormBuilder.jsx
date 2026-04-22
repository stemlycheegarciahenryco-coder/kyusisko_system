import React, { useState } from 'react';
import { Plus, Trash2, Send } from 'lucide-react';
import api from '../api';
import Swal from 'sweetalert2';

const RenewalFormBuilder = ({ applicationId, studentName, meta, onComplete }) => {
  const [fields, setFields] = useState([
    { field_label: 'Recent Grade Slip', is_required: true }
  ]);
  const [loading, setLoading] = useState(false);

  const addField = () => setFields([...fields, { field_label: '', is_required: true }]);
  const removeField = (index) => setFields(fields.filter((_, i) => i !== index));

  const handleFinalSend = async () => {
    if (fields.some(f => !f.field_label.trim())) {
      return Swal.showValidationMessage('Fill all fields');
    }

    setLoading(true);
    try {
      // POST to your new table logic
      await api.post(`/renew/setup/${applicationId}`, {
        targetTerm: meta.term,
        targetSY: meta.sy,
        requirements: fields.map((f, i) => ({ ...f, sort_order: i }))
      });

      // Show success inside the builder context
      onComplete(); // This triggers fetchApplicants() in OrgApplicants
      Swal.fire({
        icon: 'success',
        title: 'RENEWAL SENT',
        text: `Requirements sent to ${studentName}`,
        customClass: { popup: 'rounded-[2rem]' }
      });
    } catch (err) {
      Swal.fire('Error', 'Failed to save requirements', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-left p-2">
      <div className="mb-4 bg-blue-50 p-3 rounded-xl border border-blue-100">
        <p className="text-[10px] font-black text-blue-600 uppercase">Target: {meta.term} ({meta.sy})</p>
      </div>

      <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 mb-4">
        {fields.map((field, index) => (
          <div key={index} className="flex gap-2 items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
            <input
              className="flex-1 bg-transparent text-sm font-bold outline-none"
              placeholder="Requirement Name..."
              value={field.field_label}
              onChange={(e) => {
                const updated = [...fields];
                updated[index].field_label = e.target.value;
                setFields(updated);
              }}
            />
            <button onClick={() => removeField(index)} className="text-slate-300 hover:text-red-500">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <button onClick={addField} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-[10px] font-black text-slate-400 uppercase mb-4 hover:bg-slate-50">
        + Add Requirement
      </button>

      <button 
        onClick={handleFinalSend}
        disabled={loading}
        className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2"
      >
        {loading ? 'Processing...' : <><Send size={14} /> Send to Student</>}
      </button>
    </div>
  );
};

export default RenewalFormBuilder;