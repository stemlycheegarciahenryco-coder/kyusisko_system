// MyCompliance.jsx
import React, { useState, useEffect } from 'react';
import api from '../api';
import { CheckCircle2, AlertCircle, Clock, Upload } from 'lucide-react';

const MAX_FILE_SIZE_MB = 5;

export default function MyCompliance({ applicationId }) {
  const [compliance, setCompliance] = useState(null);
  const [loadingCompliance, setLoadingCompliance] = useState(true);
  const [fileMap, setFileMap] = useState({});
  const [sizeErrors, setSizeErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Helper to safely parse requirements
  const docList = (() => {
    if (!compliance || !compliance.required_docs) return [];
    if (Array.isArray(compliance.required_docs)) return compliance.required_docs;
    if (typeof compliance.required_docs === 'string') {
      return compliance.required_docs.split(/[\n,]/).map(d => d.trim()).filter(Boolean);
    }
    return [];
  })();

  useEffect(() => {
    if (!applicationId) return;

    const fetchCompliance = async () => {
      setLoadingCompliance(true);
      try {
        // This component now ONLY handles standard application compliance
        const res = await api.get(`/applications/${applicationId}/compliance`);
        setCompliance(res.data.data);
        if (res.data.data?.status === 'submitted') setSubmitted(true);
      } catch (err) {
        console.error("Fetch Compliance Error:", err);
      } finally {
        setLoadingCompliance(false);
      }
    };

    fetchCompliance();
  }, [applicationId]);

  const handleFileChange = (docLabel, file) => {
    if (file && file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setSizeErrors(prev => ({ ...prev, [docLabel]: `File exceeds ${MAX_FILE_SIZE_MB}MB limit.` }));
      setFileMap(prev => ({ ...prev, [docLabel]: null }));
      return;
    }
    setSizeErrors(prev => ({ ...prev, [docLabel]: null }));
    setFileMap(prev => ({ ...prev, [docLabel]: file }));
  };

  const allFilled = docList.length > 0 && docList.every(d => fileMap[d]);
  const hasErrors = Object.values(sizeErrors).some(Boolean);

  const handleSubmit = async () => {
    if (!allFilled || hasErrors) return;
    setSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      const labelsSent = [];

      docList.forEach(label => {
        if (fileMap[label]) {
          formData.append('files', fileMap[label]);
          labelsSent.push(label);
        }
      });

      // Send labels so backend can map them to requirement IDs
      formData.append('requirement_labels', JSON.stringify(labelsSent));
      if (compliance?.id) formData.append('compliance_id', compliance.id);

      await api.post(`/applications/${applicationId}/comply-submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSubmitted(true);
    } catch (err) {
      console.error("Submission error:", err);
      setError('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-5 text-center">
        <CheckCircle2 size={22} className="text-emerald-500 mx-auto mb-2" />
        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Documents Submitted</p>
        <p className="text-[9px] text-emerald-500 mt-1 font-medium">The organization will review your documents.</p>
      </div>
    );
  }

  if (loadingCompliance) {
    return (
      <div className="bg-[#093fb4]/5 border border-[#093fb4]/10 rounded-xl px-4 py-4 text-center">
        <p className="text-[10px] text-[#093fb4] font-bold animate-pulse">Loading compliance details...</p>
      </div>
    );
  }

  if (!compliance) return null;

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-4 space-y-4">
      <div className="flex items-center gap-2">
        <AlertCircle size={14} className="text-[#093fb4] shrink-0" />
        <p className="text-[10px] font-black uppercase tracking-widest text-[#093fb4]">Action Required: Application Compliance</p>
      </div>

      <div className="bg-white rounded-xl px-4 py-3 border border-blue-50 space-y-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Instruction</p>
          <p className="text-xs font-medium text-slate-700 leading-relaxed">{compliance.reason}</p>
        </div>
      </div>

      <div className="space-y-3">
        {docList.map((doc, i) => (
          <div key={i} className="space-y-1">
            <p className="text-[10px] font-black text-slate-600 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-[#093fb4] text-white text-[8px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
              {doc}
            </p>
            <div className="relative group">
              <input 
                type="file" 
                accept=".pdf,.doc,.docx" 
                onChange={(e) => handleFileChange(doc, e.target.files[0])} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              />
              <div className={`border-2 border-dashed rounded-xl p-3 flex items-center gap-3 transition-colors ${sizeErrors[doc] ? 'border-red-400 bg-red-50' : fileMap[doc] ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-white group-hover:border-[#093fb4]'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${sizeErrors[doc] ? 'bg-red-100' : fileMap[doc] ? 'bg-emerald-100' : 'bg-blue-100'}`}>
                  {fileMap[doc] ? <CheckCircle2 size={15} className="text-emerald-600" /> : <Upload size={15} className="text-[#093fb4]" />}
                </div>
                <div className="min-w-0">
                  <p className={`text-[11px] font-black truncate ${fileMap[doc] ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {fileMap[doc] ? fileMap[doc].name : 'Upload Document'}
                  </p>
                </div>
              </div>
            </div>
            {sizeErrors[doc] && <p className="text-[9px] text-red-500 font-bold">{sizeErrors[doc]}</p>}
          </div>
        ))}
      </div>

      {error && <p className="text-[10px] text-red-500 text-center font-bold">{error}</p>}

      <button 
        onClick={handleSubmit} 
        disabled={submitting || !allFilled || hasErrors} 
        className="w-full bg-[#093fb4] hover:bg-[#072e82] text-white font-black py-3.5 rounded-xl flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest transition-colors disabled:opacity-40"
      >
        {submitting ? 'Submitting...' : 'Submit Documents'}
      </button>
    </div>
  );
}