import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from './api';
import { ArrowLeft, Upload, Send, Loader2 } from 'lucide-react';

export default function ApplicationForm() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const [fields, setFields] = useState([]);
  const [scholarship, setScholarship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [sRes, fRes] = await Promise.all([
          api.get(`/scholarships/${id}`),
          api.get(`/scholarships/${id}/fields`) 
        ]);
        setScholarship(sRes.data?.data || sRes.data);
        setFields(fRes.data?.data || []);
      } catch (err) {
        console.error("Error loading application data:", err);
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
      // Set an error message for this specific field
      setErrors(prev => ({ 
        ...prev, 
        [fieldId]: "Invalid format. Please use PDF or DOCX." 
      }));
      // Reset the file value
      setFormData(prev => ({ ...prev, [fieldId]: null }));
      return;
    } else {
      // Clear error if the new file is valid
      setErrors(prev => ({ ...prev, [fieldId]: null }));
    }
  }
  
  setFormData(prev => ({ ...prev, [fieldId]: value }));
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data = new FormData();
      const responses = [];

      fields.forEach(field => {
  const value = formData[field.id];
  
  if (field.field_type === 'file' && value) {
    // CHANGE: Append using the field ID as the key, NOT 'documents'
    // This matches how your backend finds the file: f.fieldname === String(response.form_field_id)
    data.append(String(field.id), value); 
    
    responses.push({ 
      form_field_id: field.id, 
      response_value: value.name, 
      is_file: true 
    });
  } else {
    responses.push({ 
      form_field_id: field.id, 
      response_value: value || "" 
    });
  }
});

      // Send the JSON part
      data.append('responses', JSON.stringify(responses));

      const res = await api.post(`/scholarship/${id}/apply`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        alert("Application sent successfully!");
        navigate('/scholarships');
      }
    } catch (err) {
      console.error("Submission error:", err);
      alert(err.response?.data?.message || "Error submitting application");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen font-bold text-slate-400 animate-pulse">
      Initializing Application Form...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center text-slate-500 hover:text-slate-900 font-medium">
            <ArrowLeft size={20} className="mr-2" /> Back
          </button>
          <div className="text-sm font-bold text-slate-400 uppercase tracking-tighter italic">KyusISKO System</div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 pt-10">
        <header className="mb-10">
          <h1 className="text-4xl font-black text-slate-900">
            Apply for <span className="text-blue-600">{scholarship?.title}</span>
          </h1>
          {/* No slots mention here anymore */}
        </header>

        <form className="space-y-8" onSubmit={handleSubmit}>
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="p-8 space-y-10">
              {fields.map((field) => (
                <div key={field.id} className="flex flex-col gap-3">
                  <label className="text-lg font-bold text-slate-800">
                    {field.field_label} {field.is_required && <span className="text-red-500">*</span>}
                  </label>
                  
                  {field.field_type === 'file' ? (
  <div className="flex flex-col gap-2">
    <div className="relative group">
      <input 
        type="file" 
        accept=".pdf,.doc,.docx"
        onChange={(e) => handleInputChange(field.id, e.target.files[0], field.field_type)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
        required={field.is_required} 
      />
      <div className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center transition-all ${
        errors[field.id] ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50 group-hover:bg-blue-50'
      }`}>
        <Upload className={errors[field.id] ? 'text-red-400' : 'text-slate-400 group-hover:text-blue-500'} size={32} />
        <p className={`text-sm font-bold mt-2 ${errors[field.id] ? 'text-red-500' : 'text-slate-500'}`}>
           {formData[field.id] ? formData[field.id].name : "Upload PDF or DOCX"}
        </p>
      </div>
    </div>
    
    {/* IN-UI ERROR MESSAGE */}
    {errors[field.id] && (
      <p className="text-xs font-black text-red-500 uppercase tracking-widest animate-in fade-in slide-in-from-top-1">
        {errors[field.id]}
      </p>
    )}
  </div>
) : (
                    <input 
                      type="text" 
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500" 
                      required={field.is_required} 
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-3xl shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="animate-spin" /> : <Send size={20} />}
            {submitting ? "Processing..." : "Submit Application Package"}
          </button>
        </form>
      </div>
    </div>
  );
}