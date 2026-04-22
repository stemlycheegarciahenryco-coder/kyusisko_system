import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import RenewalFormBuilder from '../component/RenewalFormBuilder'; // Check your path (component vs components)
import { FileText, ExternalLink, ArrowLeft, Mail, RefreshCw, X } from 'lucide-react';
import Swal from 'sweetalert2';

export default function OrgApplicants() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // NEW: State for the builder modal
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);

  const fetchApplicants = async () => {
    try {
      const res = await api.get(`/scholarship/${id}/applications`);
      setApplications(res.data.data);
    } catch (err) {
      console.error("Failed to fetch applicants", err);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchApplicants(); }, [id]);

  const handleInitiateRenewal = async (appId, studentName) => {
    // Step 1: Collect Meta Data using Swal
    const { value: meta } = await Swal.fire({
      title: `<span class="font-black text-sm uppercase text-slate-800">Renewal Setup</span>`,
      html:
        '<div class="text-left mb-2 text-[10px] font-black text-slate-400 uppercase ml-1">Target Term</div>' +
        '<input id="term" class="swal2-input !m-0 !w-full !rounded-xl !text-sm !border-slate-200" placeholder="e.g. 2nd Semester">' +
        '<div class="text-left mt-4 mb-2 text-[10px] font-black text-slate-400 uppercase ml-1">School Year</div>' +
        '<input id="sy" class="swal2-input !m-0 !w-full !rounded-xl !text-sm !border-slate-200" placeholder="e.g. 2025-2026">',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'SET REQUIREMENTS',
      confirmButtonColor: '#2563eb',
      customClass: { popup: 'rounded-[2rem]' },
      preConfirm: () => {
        const term = document.getElementById('term').value;
        const sy = document.getElementById('sy').value;
        if (!term || !sy) return Swal.showValidationMessage('Please fill in both fields');
        return { term, sy };
      }
    });

    if (meta) {
      // Step 2: Open our React Builder Modal instead of Swal rendering
      setSelectedApp({ appId, studentName, meta });
      setShowBuilder(true);
    }
  };

  if (loading) return <div className="p-10 text-center font-bold animate-pulse">Syncing Database...</div>;

  return (
    <div className="min-h-screen bg-blue-50/30 p-8 relative">
      {/* BUILDER OVERLAY MODAL */}
      {showBuilder && selectedApp && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            <button 
              onClick={() => setShowBuilder(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={24} />
            </button>
            <div className="p-8">
              <RenewalFormBuilder 
                applicationId={selectedApp.appId}
                studentName={selectedApp.studentName}
                meta={selectedApp.meta}
                onComplete={() => {
                  setShowBuilder(false);
                  fetchApplicants();
                }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold mb-6 transition-colors">
          <ArrowLeft size={20} /> Back to Programs
        </button>

        <h1 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">
          Scholarship <span className="text-blue-600">Applicants</span>
        </h1>
        
        <div className="grid gap-6">
          {applications.map((app) => (
            <div key={app.id} className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100">
              <div className="flex justify-between items-start border-b border-slate-50 pb-4 mb-4">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-xl uppercase">
                       {app.sfirst_name[0]}{app.slast_name[0]}
                    </div>
                    <div>
                     <h2 className="text-lg font-black text-slate-800">{app.sfirst_name} {app.slast_name}</h2>
                     <p className="text-slate-500 text-xs font-bold flex items-center gap-1 opacity-60"><Mail size={12} /> {app.student_email}</p>
                   </div>
                </div>
                
                <div className="flex flex-col items-end gap-3">
                  <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    app.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                    app.status === 'renewal_pending' ? 'bg-blue-100 text-blue-700 animate-pulse' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {app.status.replace('_', ' ')}
                  </span>

                  <div className="flex gap-2">
                    {app.status === 'approved' && (
                      <button 
                        onClick={() => handleInitiateRenewal(app.id, `${app.sfirst_name} ${app.slast_name}`)}
                        className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-slate-900 transition-all shadow-lg shadow-blue-100"
                        title="Extend Scholarship"
                      >
                        <RefreshCw size={16} />
                      </button>
                    )}
                    <button 
                      onClick={() => navigate(`/scholarship/${id}/applications/${app.id}`)}
                      className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-4 py-2 rounded-xl hover:bg-slate-100 border border-slate-100 flex items-center gap-2"
                    >
                      View Details <ExternalLink size={12} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-slate-400 text-[10px] font-black uppercase tracking-[0.1em]">
                <p>Date Applied: {new Date(app.submitted_at).toLocaleDateString()}</p>
                <p className="text-blue-600 opacity-50">#APP-{app.id}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}