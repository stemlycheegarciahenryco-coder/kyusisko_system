import React, { useState, useEffect } from 'react';
import api from './api';
import Swal from 'sweetalert2';
import { RefreshCw, Upload, Loader2, FileText, AlertCircle } from 'lucide-react';

export default function RenewalCard({ appId, term, sy, onComplete }) {
  const [fields, setFields] = useState([]);
  const [responses, setResponses] = useState({}); 
  const [loadingFields, setLoadingFields] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Define allowed types (matching your backend)
 const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

  const handleFileChange = (fieldId, file) => {
    if (!file) return;

    // 1. VALIDATE FILE TYPE
    if (!ALLOWED_TYPES.includes(file.type)) {
      Swal.fire({
        title: 'Invalid File Format',
        text: 'Please upload only PDF, JPG, or PNG files.',
        icon: 'warning',
        confirmButtonColor: '#2563eb',
        customClass: { popup: 'rounded-[2rem]' }
      });
      return;
    }
    // 2. VALIDATE FILE SIZE (NEW)
    if (file.size > MAX_FILE_SIZE) {
      Swal.fire({
        title: 'File Too Large',
        text: 'File size must be less than 5MB.',
        icon: 'warning',
        confirmButtonColor: '#2563eb',
        customClass: { popup: 'rounded-[2rem]' }
      });
      return;
    }

    setResponses(prev => ({ ...prev, [fieldId]: file }));
  };


  useEffect(() => {
    const fetchRequirements = async () => {
        if (!appId) return;
        try {
            setLoadingFields(true);
            const res = await api.get(`/renew/requirements/${appId}`);
            setFields(res.data.data || []);
        } catch (err) {
            console.error("Error loading renewal fields", err);
        } finally {
            setLoadingFields(false);
        }
    };
    fetchRequirements();
  }, [appId]);

  const handleRenewalSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    const formData = new FormData();
    formData.append('appId', appId);
    formData.append('term', term || 'Not Specified');
    formData.append('sy', sy || 'Not Specified');

    Object.keys(responses).forEach(fieldId => {
      if (responses[fieldId]) {
        formData.append(`field_${fieldId}`, responses[fieldId]);
      }
    });

    try {
      await api.post('/renew/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      await Swal.fire({
        title: 'RENEWAL SUBMITTED',
        text: 'Your updated documents have been sent successfully.',
        icon: 'success',
        confirmButtonColor: '#2563eb',
        customClass: { popup: 'rounded-[2rem]' }
      });
      
      onComplete(); 
    } catch (err) {
      // Catch backend 500 errors and show the specific message
      Swal.fire({
        title: 'Submission Failed',
        text: err.response?.data?.message || 'Server error occurred.',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setUploading(false);
    }
  };

  if (loadingFields) return <div className="p-6 text-center animate-pulse text-xs font-bold text-slate-400">Loading Requirements...</div>;

  return (
    <div className="bg-white border-2 border-blue-50 rounded-[2.5rem] p-8 shadow-sm">
      <div className="mb-6">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Renewal Submission</h3>
        <div className="flex items-center gap-2 mt-1">
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{term} | {sy}</p>
            <span className="text-[10px] text-slate-300">•</span>
            <p className="text-[9px] font-bold text-slate-400 uppercase italic flex items-center gap-1">
                <AlertCircle size={10} /> PDF, JPG, PNG only
            </p>
        </div>
      </div>

      <form onSubmit={handleRenewalSubmit} className="space-y-6">
        <div className="grid gap-4">
          <label className="text-[10px] font-black text-slate-400 ml-1 uppercase border-b border-slate-50 pb-2">
            Required Documents
          </label>
          
          {fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <p className="text-[10px] font-bold text-slate-700 ml-1">
                {field.field_label} {field.is_required && "*"}
              </p>
              <label className="group flex items-center justify-between w-full p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm group-hover:text-blue-600 transition-colors">
                    <FileText size={18} />
                  </div>
                  <span className="text-[11px] font-black text-slate-500 uppercase truncate max-w-[180px]">
                    {responses[field.id] ? responses[field.id].name : "Select File"}
                  </span>
                </div>
                <Upload size={16} className="text-slate-300 group-hover:text-blue-600" />
                <input 
                  type="file" 
                  hidden 
                  accept=".pdf,.jpg,.jpeg,.png" // This restricts the file picker UI
                  required={field.is_required}
                  onChange={(e) => handleFileChange(field.id, e.target.files[0])} 
                />
              </label>
            </div>
          ))}
        </div>

        <button 
          type="submit"
          disabled={uploading}
          className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-slate-200 flex items-center justify-center gap-3 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50"
        >
          {uploading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
          {uploading ? 'Processing...' : 'Complete Renewal'}
        </button>
      </form>
    </div>
  );
}