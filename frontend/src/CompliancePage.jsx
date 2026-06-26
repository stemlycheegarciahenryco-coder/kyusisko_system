import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrganization } from './useOrganization'; 
import api from './api'; 

function OrgSuccessModal({ isOpen, onConfirm }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#093fb4]/20 backdrop-blur-md font-['Inter',_sans-serif]">
      <div className="w-full max-w-md bg-[#FFFCFB] rounded-[2.5rem] p-8 text-center shadow-2xl border border-slate-100/50 animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Documents Updated!</h2>
        <div className="space-y-4 mb-8">
          <p className="text-slate-500 text-sm font-semibold leading-relaxed">
            Your compliance updates have been resubmitted successfully. Your account is now back under review by our System Administrator.
          </p>
        </div>
        <button 
          onClick={onConfirm} 
          className="w-full py-4 bg-[#093fb4] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-800 transition-all active:scale-[0.98] shadow-lg shadow-blue-900/10"
        >
          Confirm & Return Home
        </button>
      </div>
    </div>
  );
}

export const CompliancePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { handleComplianceSubmit, loading } = useOrganization();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [orgDetails, setOrgDetails] = useState({
    org_name: '',
    provider_type: '',
    rejection_reason: '',
    required_fields: [] 
  });

  const [dynamicFiles, setDynamicFiles] = useState({});

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await api.get(`/onboarding-orgs/compliance-details/${id}`);
        
        let parsedFields = [];
        try {
          if (response.data.required_fields) {
            parsedFields = typeof response.data.required_fields === 'string' 
              ? JSON.parse(response.data.required_fields) 
              : response.data.required_fields;
          }
        } catch (e) {
          console.error("Failed to parse required_fields", e);
        }

        setOrgDetails({ 
          ...response.data, 
          required_fields: parsedFields 
        });
      } catch (err) {
        setMessage({ 
          type: 'error', 
          text: err.response?.data?.error || 'Failed to load application details.' 
        });
      } finally {
        setFetching(false);
      }
    };
    fetchDetails();
  }, [id]);

  const handleDynamicFileChange = (fieldName, files) => {
    setDynamicFiles(prev => ({
      ...prev,
      [fieldName]: Array.from(files)
    }));
  };

  const handleModalCloseAndRedirect = () => {
    setIsModalOpen(false);
    navigate('/'); // Change '/' to your actual homepage or login path if different
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setMessage({ type: '', text: '' });

    // Strictly using dynamic submission logic now
    const result = await handleComplianceSubmit(id, dynamicFiles, true);

    if (result.success) {
      setDynamicFiles({});
      setIsModalOpen(true);
    } else {
      setMessage({ type: 'error', text: result.error });
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#FFFCFB] font-['Inter',_sans-serif]">
        <p className="text-slate-400 animate-pulse font-black uppercase text-xs tracking-widest">Syncing application context...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center font-['Inter',_sans-serif]">
      <div className="max-w-xl w-full bg-[#FFFCFB] p-8 rounded-[2.5rem] shadow-2xl shadow-blue-900/5 border border-slate-100">
        
        <div className="text-center mb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#093fb4] mb-1">Security & Compliance</p>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Compliance Portal</h2>
          <p className="mt-2 text-xs font-bold text-slate-500">
            Resubmit verification records for <span className="text-[#093fb4] uppercase">{orgDetails.org_name}</span>
          </p>
        </div>

        <div className="border p-5 rounded-2xl mb-6 bg-indigo-50 border-indigo-100">
          <h3 className="text-[10px] font-black uppercase tracking-wider mb-1 text-indigo-700">
            Requested Documents / Notes:
          </h3>
          <p className="text-sm font-semibold leading-relaxed text-indigo-700/90">
            "{orgDetails.rejection_reason || "Please upload your pending dynamic files required below."}"
          </p>
        </div>

        {message.text && message.type === 'error' && (
          <div className="p-4 mb-6 text-xs font-bold uppercase tracking-wide rounded-xl bg-red-50 text-red-600 border border-red-100">
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Specific Requirements</span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>
            
            {orgDetails.required_fields && orgDetails.required_fields.length > 0 ? (
              orgDetails.required_fields.map((field, idx) => (
                <div key={idx} className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Upload {field} <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="file" 
                    multiple
                    required
                    onChange={(e) => handleDynamicFileChange(field, e.target.files)}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-wider file:bg-[#EEF2FF] file:text-[#093fb4] hover:file:bg-blue-100 border border-slate-200/60 bg-white rounded-xl p-2.5 outline-none focus:border-[#093fb4]/30"
                  />
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-4">No specific dynamic document requirements currently specified.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#093fb4] hover:bg-blue-800 disabled:bg-slate-300 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-blue-900/10 flex items-center justify-center"
          >
            {loading ? "Uploading Records..." : "Submit Compliance Updates"}
          </button>
        </form>
      </div>

      <OrgSuccessModal 
        isOpen={isModalOpen} 
        onConfirm={handleModalCloseAndRedirect} 
      />
    </div>
  );
};