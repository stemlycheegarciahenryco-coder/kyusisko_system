import React, { useState, useEffect } from 'react';
import api from '../api';
import { CheckCircle2, AlertCircle, Clock, Upload } from 'lucide-react';

const MAX_FILE_SIZE_MB = 5;

export default function RenewCompliance({ applicationId, onSuccess }) {
  const [compliance, setCompliance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fileMap, setFileMap] = useState({});
  const [sizeErrors, setSizeErrors] = useState({}); 
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const docList = (() => {
    if (!compliance || !compliance.required_docs) return [];
    if (Array.isArray(compliance.required_docs)) {
      return compliance.required_docs;
    }
    if (typeof compliance.required_docs === 'string') {
      try {
        const parsed = JSON.parse(compliance.required_docs);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        return compliance.required_docs.split(/[\n,]/).map(d => d.trim()).filter(Boolean);
      }
    }
    return [];
  })();

  useEffect(() => {
    const fetchRenewal = async () => {
      try {
        const res = await api.get(`/renewals/${applicationId}/renewal-compliance`);
        setCompliance(res.data.data);
        if (res.data.data?.status === 'submitted' || res.data.data?.status === 'renewal_pending') {
          setSubmitted(true);
        }
      } catch (err) {
        console.error("Fetch Renewal Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRenewal();
  }, [applicationId]);

  const handleFileChange = (docLabel, file) => {
    if (file && file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setSizeErrors(prev => ({ ...prev, [docLabel]: `Exceeds ${MAX_FILE_SIZE_MB}MB limit.` }));
      setFileMap(prev => ({ ...prev, [docLabel]: null }));
      return;
    }
    setSizeErrors(prev => ({ ...prev, [docLabel]: null }));
    setFileMap(prev => ({ ...prev, [docLabel]: file }));
  };

  const allFilled = docList.length > 0 && docList.every(d => fileMap[d]);
  const hasErrors = Object.values(sizeErrors).some(Boolean); // 🚀 ADDED: Block operations if validation fails

  const handleSubmit = async () => {
    if (!allFilled || hasErrors) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      
      docList.forEach(label => {
        if (fileMap[label]) {
          formData.append('files', fileMap[label]);
        }
      });

      formData.append('requirement_ids', JSON.stringify(docList)); 
      
      if (compliance?.id) {
        formData.append('compliance_id', compliance.id);
      }

      await api.post(`/renewals/${applicationId}/renew-submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSubmitted(true);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error("Submission Error Details:", err.response?.data);
      alert(err.response?.data?.error || "Failed to submit renewal.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted || compliance?.status === 'submitted' || compliance?.status === 'renewal_pending') {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center">
        <CheckCircle2 size={20} className="text-emerald-500 mx-auto mb-2" />
        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Renewal Submitted</p>
      </div>
    );
  }

  if (loading) return <div className="text-center p-4 animate-pulse text-amber-500 text-[10px] font-black uppercase">Loading Requirements...</div>;
  if (!compliance) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <AlertCircle size={14} className="text-amber-600" />
        <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Renewal Action Required</p>
      </div>

      <div className="bg-white rounded-xl p-3 border border-amber-100 space-y-3">
        <p className="text-[9px] font-black uppercase text-slate-400">Message</p>
        <p className="text-xs font-medium text-slate-700">{compliance.reason}</p>
      </div>

      <div className="space-y-3">
        {docList.map((doc, i) => (
          <div key={i} className="space-y-1">
            <p className="text-[10px] font-black text-slate-600 flex items-center gap-2">
               <span className="w-4 h-4 bg-amber-400 text-white rounded-full flex items-center justify-center text-[8px]">{i+1}</span>
               {doc}
            </p>
            {/* 🚀 FIXED: Dynamic wrapper background border logic matched with standard file rules */}
            <div className={`relative border-2 border-dashed rounded-xl p-3 flex items-center gap-3 transition-colors ${
              sizeErrors[doc] ? 'border-red-400 bg-red-50' : fileMap[doc] ? 'border-emerald-400 bg-emerald-50' : 'border-amber-200 bg-white hover:border-amber-400'
            }`}>
              <input 
                type="file" 
                accept=".pdf,.doc,.docx"
                className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                onChange={(e) => handleFileChange(doc, e.target.files[0])}
              />
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${sizeErrors[doc] ? 'bg-red-100' : fileMap[doc] ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                  {fileMap[doc] ? <CheckCircle2 size={14} className="text-emerald-600" /> : <Upload size={14} className={sizeErrors[doc] ? 'text-red-500' : 'text-amber-600'} />}
                </div>
                <p className={`text-[11px] font-bold truncate ${fileMap[doc] ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {fileMap[doc] ? fileMap[doc].name : 'Click to upload'}
                </p>
              </div>
            </div>
            {sizeErrors[doc] && <p className="text-[9px] text-red-500 font-bold">{sizeErrors[doc]}</p>}
          </div>
        ))}
      </div>

      <button 
        onClick={handleSubmit} 
        disabled={submitting || !allFilled || hasErrors} 
        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-3.5 rounded-xl flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest transition-colors disabled:opacity-40"
      >
        {submitting ? <Clock size={14} className="animate-spin" /> : <Upload size={14} />} 
        {submitting ? "Submitting..." : "Submit All Renewal Docs"}
      </button>
    </div>
  );
}