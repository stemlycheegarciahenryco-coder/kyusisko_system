import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from './api';
import { ArrowLeft, Upload, Send, Loader2, Mail, Globe, MapPin, Phone, CheckCircle2, AlertCircle, FileText, X, Eye, Download } from 'lucide-react';

export default function ApplicationForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [fields, setFields] = useState([]);
  const [scholarship, setScholarship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [previewFile, setPreviewFile] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/applications/details-scholarships/${id}`);
        if (res.data && res.data.success) {
          setScholarship(res.data.data.scholarship);
          setFields(res.data.data.fields || []);
          console.log("Fetched Scholarship Data:", res.data.data.scholarship)
        }
      } catch (err) {
        console.error("Error loading application data:", err);
        setErrorMessage("Failed to load scholarship details.");
        setShowError(true);
      } finally {
        setLoading(false);
      }
    };
    if (id) loadData();
  }, [id]);

  const handleInputChange = (fieldId, value, fieldType) => {
    if (fieldType === 'file' && value) {
      const allowedExtensions = ['pdf', 'docx', 'doc'];
      const fileExt = value.name.split('.').pop().toLowerCase();
      if (!allowedExtensions.includes(fileExt)) {
        setErrors(prev => ({ ...prev, [fieldId]: "Invalid format. Please use PDF or DOCX." }));
        setFormData(prev => ({ ...prev, [fieldId]: null }));
        return;
      } else {
        setErrors(prev => ({ ...prev, [fieldId]: null }));
      }
    }
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const missingRequired = fields.some(f => f.is_required && !formData[f.id]);
    if (missingRequired) {
      setErrorMessage("Please complete all required fields before submitting.");
      setShowError(true);
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      const responses = [];

      fields.forEach(field => {
        const value = formData[field.id];
        if (field.field_type === 'file' && value) {
          data.append(String(field.id), value);
          responses.push({ form_field_id: field.id, response_value: value.name, is_file: true });
        } else {
          responses.push({ form_field_id: field.id, response_value: value || "" });
        }
      });

      data.append('responses', JSON.stringify(responses));
      
      const res = await api.post(`/applications/${id}/apply`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setShowSuccess(true);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Something went wrong while submitting your application.");
      setShowError(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-[#FFFCFB] font-['Inter']">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#093fb4] border-t-transparent rounded-full animate-spin" />
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">Loading...</p>
      </div>
    </div>
  );

  const criteria = scholarship?.criteria
    ? (typeof scholarship.criteria === 'string'
        ? scholarship.criteria.split(',').map(c => c.trim()).filter(Boolean)
        : scholarship.criteria)
    : [];

  const fullAddress = [scholarship?.street_address, scholarship?.barangay, scholarship?.city, scholarship?.region]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="min-h-screen bg-slate-50 font-['Inter'] antialiased">
      <nav className="bg-[#FFFCFB] border-b border-black/5 px-6 py-4 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-[#093fb4] transition-colors"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">KyusISKO Application</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        
        {/* ── HERO BANNER ── */}
        <div className="bg-[#093fb4] rounded-3xl overflow-hidden shadow-xl shadow-blue-900/10 relative">
          
          {/* Dynamic Provider Type Badge (Top Right Corner Circle) */}
          {scholarship?.provider_type && (
            <div 
              className="absolute top-6 right-6 w-14 h-14 rounded-full bg-white text-[#093fb4] text-[10px] font-black uppercase tracking-wider flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
              title={`Provider Type: ${scholarship.provider_type}`}
            >
              {scholarship.provider_type.substring(0, 3)}
            </div>
          )}

          <div className="px-10 py-10 flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-8 pr-24">
            <div className="w-24 h-24 rounded-3xl overflow-hidden bg-white/20 shrink-0 border-2 border-white/30 flex items-center justify-center shadow-2xl">
              {scholarship?.org_pic ? (
                <img src={`http://localhost:5000/${scholarship.org_pic}`} alt={scholarship.org_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-black text-3xl">
                  {scholarship?.org_name?.substring(0, 2).toUpperCase() || '??'}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-white/85 text-[11px] font-black uppercase tracking-[0.2em] mb-2">
                {scholarship?.org_name || 'Organization'}
              </p>
              <h1 className="text-white font-black text-3xl lg:text-4xl leading-tight tracking-tighter mb-5">
                {scholarship?.title}
              </h1>
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-3">
                {scholarship?.deadline && (
                  <div className="inline-flex items-center gap-2 bg-[#FF1E1E] text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full">
                    Deadline: {new Date(scholarship.deadline).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                )}
                <div className="inline-flex items-center gap-2 bg-white/10 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full backdrop-blur-md">
                  Amount: {scholarship?.amount_range || 'Vary'}
                </div>
                <div className="inline-flex items-center gap-2 bg-white/10 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full backdrop-blur-md">
                  {scholarship?.fund_type || 'General'}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Details Footer Section */}
          <div className="bg-white/5 border-t border-white/10 px-10 py-5 flex flex-col gap-y-3 sm:flex-row sm:flex-wrap justify-center md:justify-start sm:gap-x-8">
            {fullAddress && (
              <div className="flex items-center gap-2.5 text-sm font-medium text-white">
                <MapPin size={16} className="text-white/80 shrink-0" />
                <span>{fullAddress}</span>
              </div>
            )}
            {scholarship?.contact_number && (
              <div className="flex items-center gap-2.5 text-sm font-medium text-white">
                <Phone size={16} className="text-white/80 shrink-0" />
                <span>{scholarship.contact_number}</span>
              </div>
            )}
            {scholarship?.sub_email && (
              <a href={`mailto:${scholarship.sub_email}`} className="flex items-center gap-2.5 text-sm font-medium text-white hover:text-white/80 transition-colors">
                <Mail size={16} className="text-white/80 shrink-0" /> 
                <span>{scholarship.sub_email}</span>
              </a>
            )}
            {scholarship?.website && (
              <a href={scholarship.website} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 text-sm font-medium text-white hover:text-white/80 transition-colors">
                <Globe size={16} className="text-white/80 shrink-0" /> 
                <span>{scholarship.website}</span>
              </a>
            )}
          </div>
        </div>

        {/* ── UNIFIED APPLICATION INTERFACE ── */}
        <div className="space-y-8">
          
          {/* 1. Eligibility Section */}
          {criteria.length > 0 && (
            <section className="bg-white rounded-3xl border border-black/5 p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-6 bg-[#093fb4] rounded-full" />
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Requirements & Eligibility</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {criteria.map((c, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-[#093fb4] flex items-center justify-center shrink-0">
                      <CheckCircle2 size={16} className="text-white" />
                    </div>
                    <span className="text-[13px] text-slate-700 font-black uppercase tracking-tight">{c}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 2. Program Overview Section */}
          {scholarship?.description && (
            <section className="bg-white rounded-3xl border border-black/5 p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-6 bg-[#093fb4] rounded-full" />
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Program Overview</h2>
              </div>
              <p className="text-[14px] text-slate-600 leading-[1.8] font-medium italic break-words px-2">
                "{scholarship.description}"
              </p>
            </section>
          )}

          {/* 3. Reference Downloads Section */}
          {scholarship?.attachments && scholarship.attachments.length > 0 && (
            <section className="bg-white rounded-3xl border border-black/5 p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-6 bg-[#093fb4] rounded-full" />
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Reference Documents</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {scholarship.attachments.map((file, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl group transition-all hover:bg-white hover:border-[#093fb4]/20 hover:shadow-md">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#093fb4] shrink-0">
                        <FileText size={20} />
                      </div>
                      <span className="text-[13px] font-black text-slate-700 truncate max-w-[200px] uppercase">
                        {file.split('-').slice(1).join('-')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setPreviewFile(`http://localhost:5000/${file}`)}
                        className="p-2.5 text-slate-400 hover:text-[#093fb4] hover:bg-[#093fb4]/5 rounded-xl transition-all"
                        title="Preview"
                      >
                        <Eye size={18} />
                      </button>
                      <a 
                        href={`http://localhost:5000/${file}`} 
                        download 
                        className="p-2.5 text-slate-400 hover:text-[#FF1E1E] hover:bg-[#FF1E1E]/5 rounded-xl transition-all"
                      >
                        <Download size={18} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 4. Complete Questionnaire Section */}
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-black/5 p-8 shadow-sm space-y-8">
            <div className="border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-2 h-6 bg-[#093fb4] rounded-full" />
                <h2 className="text-[12px] font-black uppercase tracking-[0.2em] text-[#093fb4]">Application Submissions Questionnaire</h2>
              </div>
              <p className="text-xs text-slate-500 font-bold mt-1.5 pl-5">Please complete all fields below accurately.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {fields.map((field, idx) => (
                <div key={field.id} className="space-y-2.5">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                    <span className="text-[#093fb4]">0{idx + 1}.</span>
                    {field.field_label}
                    {field.is_required && <span className="text-[#FF1E1E]">*</span>}
                  </label>

                  {field.field_type === 'file' ? (
                    <div className="relative group">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleInputChange(field.id, e.target.files[0], field.field_type)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                        required={field.is_required}
                      />
                      <div className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center min-h-[110px] text-center gap-2 transition-all ${
                        formData[field.id] ? 'border-[#093fb4] bg-blue-50/50' : 'border-slate-200 bg-slate-50 group-hover:border-[#093fb4]/30'
                      }`}>
                        <Upload size={20} className={formData[field.id] ? 'text-[#093fb4]' : 'text-slate-400'} />
                        <span className={`text-[11px] font-black truncate w-full px-4 uppercase ${formData[field.id] ? 'text-[#093fb4]' : 'text-slate-600'}`}>
                          {formData[field.id] ? formData[field.id].name : 'Click or Drag to Upload File'}
                        </span>
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">Accepted formats: PDF, DOCX</span>
                      </div>
                      {errors[field.id] && (
                        <p className="text-[10px] text-[#FF1E1E] font-bold uppercase mt-1 flex items-center gap-1">
                          <AlertCircle size={12} /> {errors[field.id]}
                        </p>
                      )}
                    </div>
                  ) : (
                    <input
                      type="text"
                      onChange={(e) => handleInputChange(field.id, e.target.value, field.field_type)}
                      placeholder={`Enter ${field.field_label.toLowerCase()} details`}
                      className="w-full bg-slate-50 border-2 border-slate-200/60 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 placeholder:text-slate-400 outline-none focus:bg-white focus:border-[#093fb4] transition-all shadow-sm"
                      required={field.is_required}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="w-full md:w-auto md:px-12 bg-[#093fb4] hover:bg-[#FF1E1E] text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 uppercase text-[11px] tracking-[0.2em] transition-all active:scale-[0.98] shadow-lg shadow-blue-900/10"
              >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                {submitting ? 'Processing Application...' : 'Submit Complete Application'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* PDF Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md">
          <div className="w-full max-w-5xl h-[90vh] bg-white rounded-3xl flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <FileText className="text-[#093fb4]" size={20} />
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">Document Preview</h3>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-[#FF1E1E] hover:text-white rounded-2xl transition-all"
              >
                <X size={20} strokeWidth={3} />
              </button>
            </div>
            <div className="flex-1 bg-slate-200">
              <iframe src={previewFile} className="w-full h-full border-none" title="PDF Preview" />
            </div>
          </div>
        </div>
      )}

      <SuccessModal isOpen={showSuccess} onConfirm={() => navigate('/scholarships')} />
      <ErrorModal isOpen={showError} onClose={() => setShowError(false)} message={errorMessage} />
    </div>
  );
}

function SuccessModal({ isOpen, onConfirm }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-lg">
      <div className="w-full max-w-sm bg-white rounded-[40px] p-10 text-center shadow-2xl border border-white/20 animate-in fade-in slide-in-from-bottom-4">
        <div className="w-20 h-20 bg-[#093fb4] rounded-[30px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-900/30">
          <Send size={32} className="text-white" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-3">Great Success!</h2>
        <p className="text-[13px] text-slate-500 mb-8 leading-relaxed font-medium">
          Your application has been shot through the pipes to the organization.
        </p>
        <button onClick={onConfirm} className="w-full py-5 bg-[#093fb4] hover:bg-[#FF1E1E] text-white rounded-3xl font-black uppercase tracking-[0.2em] text-[11px] transition-all shadow-lg">
          Back to Programs
        </button>
      </div>
    </div>
  );
}

function ErrorModal({ isOpen, onClose, message }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-lg">
      <div className="w-full max-w-sm bg-white rounded-[40px] p-10 text-center shadow-2xl border border-white/20 animate-in fade-in slide-in-from-bottom-4">
        <div className="w-20 h-20 bg-[#FF1E1E] rounded-[30px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-900/30">
          <AlertCircle size={32} className="text-white" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-3">Wait a minute...</h2>
        <p className="text-[13px] text-slate-500 mb-8 leading-relaxed font-medium">{message}</p>
        <button onClick={onClose} className="w-full py-5 bg-slate-900 hover:bg-slate-700 text-white rounded-3xl font-black uppercase tracking-[0.2em] text-[11px] transition-all shadow-lg">
          Try Again
        </button>
      </div>
    </div>
  );
}