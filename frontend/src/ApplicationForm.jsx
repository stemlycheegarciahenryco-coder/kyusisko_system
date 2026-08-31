import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from './api';
import { 
  ArrowLeft, UploadCloud, Send, Loader2, Mail, Globe, MapPin, 
  Phone, CheckCircle2, AlertCircle, FileText, X, Eye, Download, 
  Bookmark, BookOpen, FilePlus2, ShieldCheck, Accessibility, Flag, 
  GraduationCap, Wallet, Star, Ban 
} from 'lucide-react';

const getCriteriaIcon = (label = '') => {
  const l = label.toLowerCase();
  if (l.includes('pwd') || l.includes('disab')) return Accessibility;
  if (l.includes('citizen') || l.includes('filipino')) return Flag;
  if (l.includes('resident')) return Bookmark;
  if (l.includes('enroll') || l.includes('college') || l.includes('student')) return GraduationCap;
  if (l.includes('moral') || l.includes('character')) return ShieldCheck;
  if (l.includes('financial') || l.includes('income') || l.includes('need')) return Wallet;
  if (l.includes('gwa') || l.includes('grade') || l.includes('average')) return Star;
  if (l.includes('no existing') || l.includes('without') || l.includes('not enjoying')) return Ban;
  return CheckCircle2;
};

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className="rounded-2xl bg-blue-50 text-[#093fb4] flex items-center justify-center shrink-0" style={{ width: '3.25rem', height: '3.25rem' }}>
        <Icon size={26} />
      </div>
      <div>
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{title}</h2>
        {subtitle && <p className="text-[15px] text-slate-600 font-semibold mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// 🛠️ NEW HELPER: Safely parses attachments whether they arrive as JSON, Postgres string arrays, or standard arrays.
const parseAttachments = (rawAttachments) => {
  if (!rawAttachments) return [];

  let parsed = rawAttachments;

  if (typeof rawAttachments === 'string') {
    try {
      parsed = JSON.parse(rawAttachments);
    } catch (e) {
      if (rawAttachments.startsWith('{') && rawAttachments.endsWith('}')) {
        // Handle PostgreSQL native array format: "{file1.pdf,file2.pdf}"
        parsed = rawAttachments.slice(1, -1).split(',').map(s => s.replace(/"/g, '').trim());
      } else {
        // Handle standard comma-separated string
        parsed = rawAttachments.split(',').map(s => s.trim());
      }
    }
  }

  if (!Array.isArray(parsed)) {
    parsed = [parsed];
  }

  return parsed
    .map(item => {
      if (!item) return null;
      if (typeof item === 'string') return item.trim();
      if (typeof item === 'object') return item.url || item.path || item.name || null;
      return null;
    })
    .filter(Boolean); // removes any null/empty items
};

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
        }
      } catch (err) {
        console.error("Error loading application data:", err);
        setErrorMessage("Failed to load scholarship details.");
        setShowError(true);
      }
      finally {
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

  // Initial Data Loading Screen updated to match new style
  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-[#FFFCFB] font-['Inter']">
      <div className="bg-white p-8 w-40 h-40 rounded-3xl shadow-2xl flex flex-col items-center justify-center gap-4 border border-slate-100 animate-in fade-in zoom-in duration-300">
        <Loader2 className="animate-spin text-[#5C5CFF]" size={46} strokeWidth={2.5} />
        <p className="text-slate-600 font-medium text-sm">Loading...</p>
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
    <div className="min-h-screen bg-slate-50 font-['Inter'] antialiased relative">
      
      {/* FULLSCREEN LOADING OVERLAY FOR FORM SUBMISSION */}
      {submitting && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[150] flex items-center justify-center transition-all duration-300">
          <div className="bg-white p-8 w-40 h-40 rounded-3xl shadow-2xl flex flex-col items-center justify-center gap-4 border border-slate-100 animate-in fade-in zoom-in duration-300">
            <Loader2 className="animate-spin text-[#5C5CFF]" size={46} strokeWidth={2.5} />
            <p className="text-slate-600 font-medium text-sm">Loading...</p>
          </div>
        </div>
      )}

      <nav className="bg-[#FFFCFB] border-b border-black/5 px-6 py-4 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-600 hover:text-[#093fb4] transition-colors"
          >
            <ArrowLeft size={18} /> Back
          </button>
          <span className="text-xs font-black uppercase tracking-widest text-slate-600">KyusISKO Application</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        
        {/* HERO BANNER */}
        <div className="bg-[#093fb4] rounded-3xl overflow-hidden shadow-xl shadow-blue-900/10 relative">
          {scholarship?.provider_type && (
            <div 
              className="absolute top-6 right-6 w-14 h-14 rounded-full bg-white text-[#093fb4] text-[10px] font-black uppercase tracking-wider flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
              title={`Provider Type: ${scholarship.provider_type}`}
            >
              {scholarship.provider_type.substring(0, 3)}
            </div>
          )}

          <div className="px-10 py-10 flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-8 pr-24">
            <div className="w-32 h-32 md:w-36 md:h-36 rounded-3xl overflow-hidden bg-white shrink-0 border-2 border-white/40 flex items-center justify-center shadow-2xl">
              {scholarship?.org_pic ? (
                <img src={scholarship.org_pic} alt={scholarship.org_name} className="w-full h-full object-cover object-center" />
              ) : (
                <span className="text-[#093fb4] font-black text-4xl">
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
                  Cover Type: {scholarship?.fund_type || 'General'}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border-t border-white/10 px-10 py-6 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-3">
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

        {/* APPLICATION INTERFACE */}
        <div className="space-y-8">
          
          {/* Criteria */}
          {criteria.length > 0 && (
            <section className="bg-white rounded-3xl border border-black/5 p-8 shadow-sm">
              <SectionHeader
                icon={Bookmark}
                title="Criteria"
                subtitle="You must meet all of the following criteria to be eligible."
              />
              <div className="flex flex-wrap gap-3">
                {criteria.map((c, i) => {
                  const Icon = getCriteriaIcon(c);
                  return (
                    <div key={i} className="flex items-center gap-3 px-4 py-3 bg-blue-50/40 border border-blue-100 rounded-xl">
                      <Icon size={20} className="text-[#093fb4] shrink-0" />
                      <span className="text-[15px] font-bold text-slate-800">{c}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Program Overview */}
          {scholarship?.description && (
            <section className="bg-white rounded-3xl border border-black/5 p-8 shadow-sm">
              <SectionHeader
                icon={BookOpen}
                title="Program Overview"
                subtitle="Learn more about this program."
              />
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex items-start gap-4">
                <p className="text-[15px] text-slate-700 leading-[1.8] font-medium italic break-words flex-1">
                  {scholarship.description}
                </p>
              </div>
            </section>
          )}

          {/* Reference Downloads (UPDATED WITH PARSER) */}
          {(() => {
            const attachmentsList = parseAttachments(scholarship?.attachments);
            
            // If the parser finds NO valid files, don't render the section at all.
            if (attachmentsList.length === 0) return null;

            return (
              <section className="bg-white rounded-3xl border border-black/5 p-8 shadow-sm">
                <SectionHeader
                  icon={FileText}
                  title="Reference Documents"
                  subtitle="Download these files for additional program details."
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {attachmentsList.map((file, i) => {
                    const fileName = file.split('/').pop().split('-').slice(1).join('-') || file.split('/').pop() || 'Document';
                    
                    // Generate a safe URL by appending API route if the DB only saved the relative path
                    const fileUrl = file.startsWith('http') 
                      ? file 
                      : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${file.startsWith('/') ? '' : '/'}${file}`;

                    return (
                      <div key={i} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl group transition-all hover:bg-white hover:border-[#093fb4]/20 hover:shadow-md">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#093fb4] shrink-0">
                            <FileText size={20} />
                          </div>
                          <span className="text-sm font-black text-slate-800 truncate max-w-[200px] uppercase">
                            {fileName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setPreviewFile(fileUrl)}
                            className="p-2.5 text-slate-500 hover:text-[#093fb4] hover:bg-[#093fb4]/5 rounded-xl transition-all"
                            title="Preview"
                          >
                            <Eye size={20} />
                          </button>
                          <a 
                            href={fileUrl} 
                            target="_blank"
                            rel="noopener noreferrer"
                            download 
                            className="p-2.5 text-slate-500 hover:text-[#FF1E1E] hover:bg-[#FF1E1E]/5 rounded-xl transition-all"
                          >
                            <Download size={20} />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })()}

          {/* Questionnaire */}
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-black/5 p-8 shadow-sm space-y-8">
            <div className="border-b border-slate-100 pb-6">
              <SectionHeader
                icon={FilePlus2}
                title="Application Submissions"
                subtitle="Please complete all fields below accurately."
              />
            </div>

            <div className="space-y-8">
              {fields.map((field, idx) => (
                <div key={field.id} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-lg bg-[#093fb4] text-white text-sm font-black flex items-center justify-center shrink-0">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <label className="text-base font-black text-slate-900 uppercase tracking-wide">
                      {field.field_label}
                      {field.is_required && <span className="text-[#FF1E1E] ml-1">*</span>}
                    </label>
                  </div>

                  {field.field_type === 'file' ? (
                    <div className="space-y-3">
                      <div className="relative group">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => handleInputChange(field.id, e.target.files[0], field.field_type)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                          required={field.is_required}
                        />
                        <div className={`border-2 border-dashed rounded-2xl py-5 px-4 flex flex-row items-center justify-center text-center gap-4 transition-all ${
                          formData[field.id] ? 'border-[#093fb4] bg-blue-50/50' : 'border-slate-300 bg-slate-50 group-hover:border-[#093fb4]/40'
                        }`}>
                          <UploadCloud size={34} className={formData[field.id] ? 'text-[#093fb4]' : 'text-slate-500'} />
                          <div className="flex flex-col items-start text-left">
                            {formData[field.id] ? (
                              <span className="text-base font-black text-[#093fb4] truncate max-w-[280px]">{formData[field.id].name}</span>
                            ) : (
                              <>
                                <span className="text-base font-black text-slate-900">Drag & drop your file here</span>
                                <span className="text-sm text-slate-600 font-semibold">or click to browse</span>
                              </>
                            )}
                            <span className="text-xs text-slate-500 font-bold uppercase tracking-tight mt-1">
                              Accepted formats: PDF, DOCX &nbsp;•&nbsp; Max file size: 10MB
                            </span>
                          </div>
                        </div>
                      </div>
                      {errors[field.id] && (
                        <p className="text-xs text-[#FF1E1E] font-bold uppercase flex items-center gap-1.5">
                          <AlertCircle size={14} /> {errors[field.id]}
                        </p>
                      )}
                    </div>
                  ) : (
                    <input
                      type="text"
                      onChange={(e) => handleInputChange(field.id, e.target.value, field.field_type)}
                      placeholder={`Enter ${field.field_label.toLowerCase()} details`}
                      className="w-full bg-slate-50 border-2 border-slate-300 rounded-2xl px-5 py-4 text-base font-bold text-slate-800 placeholder:text-slate-500 outline-none focus:bg-white focus:border-[#093fb4] transition-all shadow-sm"
                      required={field.is_required}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#093fb4] hover:bg-[#FF1E1E] text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 uppercase text-sm tracking-[0.15em] transition-all active:scale-[0.98] shadow-lg shadow-blue-900/10"
              >
                {submitting ? 'Processing Application...' : 'Submit Complete Application'}
              </button>
            </div>
          </form>

          {/* Security Banner */}
          <div className="bg-blue-50/60 border border-blue-100 rounded-3xl px-8 py-6 flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-[#093fb4] text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/20">
              <ShieldCheck size={30} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Your Information is Safe</h3>
              <p className="text-[15px] text-slate-600 font-medium mt-0.5">
                All documents and information you provide are secure and will only be used for this application.
              </p>
            </div>
          </div>
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
        <p className="text-sm text-slate-600 mb-8 leading-relaxed font-medium">
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
        <p className="text-sm text-slate-600 mb-8 leading-relaxed font-medium">{message}</p>
        <button onClick={onClose} className="w-full py-5 bg-slate-900 hover:bg-slate-700 text-white rounded-3xl font-black uppercase tracking-[0.2em] text-[11px] transition-all shadow-lg">
          Try Again
        </button>
      </div>
    </div>
  );
}