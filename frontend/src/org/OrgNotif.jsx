import React, { useState, useEffect } from 'react';
import api from '../api';
import { Bell, Eye, X, FileText, CheckCircle, BellOff } from 'lucide-react';
import Swal from 'sweetalert2';

export default function OrgNotif() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [files, setFiles] = useState([]);

  const fetchNotifs = async () => {
    try {
      const res = await api.get('/renew/notifications/org');
      setNotifications(res.data.data || []);
    } catch (err) {
      console.error("Error fetching org notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const openReviewModal = async (appId) => {
    try {
      // Fetches the uploaded documents for this specific renewal
      const res = await api.get(`/renew/requirements/${appId}`);
      setFiles(res.data.data);
      setSelectedApp(appId);
    } catch (err) {
      Swal.fire({
        title: 'Error',
        text: 'Could not load renewal files.',
        icon: 'error',
        confirmButtonColor: '#ef4444',
        customClass: { popup: 'rounded-[2rem]' }
      });
    }
  };

  const approveRenewal = async (appId) => {
    try {
      const result = await Swal.fire({
        title: 'APPROVE RENEWAL?',
        text: "This will finalize the student's scholarship for the next term.",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#16a34a',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Yes, Approve',
        customClass: { popup: 'rounded-[2rem]' }
      });

      if (result.isConfirmed) {
        await api.post(`/renew/approve/${appId}`);
        Swal.fire({
          title: 'SUCCESS',
          text: 'Scholarship renewal has been finalized.',
          icon: 'success',
          confirmButtonColor: '#2563eb',
          customClass: { popup: 'rounded-[2rem]' }
        });
        setSelectedApp(null);
        fetchNotifs();
      }
    } catch (err) {
      Swal.fire('Error', 'Failed to approve renewal', 'error');
    }
  };

  if (loading) return (
    <div className="p-20 text-center font-black text-slate-400 animate-pulse tracking-widest uppercase text-xs">
      Loading Organization Alerts...
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="flex items-center gap-4 mb-10">
        <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg shadow-slate-200">
          <Bell size={24} />
        </div>
        <h2 className="text-3xl font-black tracking-tight text-slate-900">Organization Alerts</h2>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-24 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
          <BellOff className="mx-auto text-slate-300 mb-4" size={48} />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No new submissions found</p>
        </div>
      ) : (
        <div className="grid gap-4">
  {notifications.map((n) => (
    <div 
      key={n.id} 
      className="bg-white border-2 border-slate-100 p-8 rounded-[2.5rem] flex justify-between items-center shadow-sm hover:border-blue-200 transition-all group"
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {/* UPDATED: Added underscores to match the new controller query */}
          <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-[9px] font-black uppercase tracking-tighter">
            {n.sfirst_name ? `${n.sfirst_name} ${n.slast_name}` : 'Scholarship Student'}
          </span>
          <span className="text-[10px] text-slate-300 font-bold uppercase italic">
            {new Date(n.created_at).toLocaleDateString()}
          </span>
        </div>
        <h4 className="font-black text-slate-800 uppercase text-xs tracking-tight">{n.title}</h4>
        <p className="text-sm text-slate-500 leading-relaxed max-w-md">{n.message}</p>
        <p className="text-[9px] font-bold text-slate-400 uppercase mt-2">App ID: #{n.application_id}</p>
      </div>
      
      <button 
        onClick={() => openReviewModal(n.application_id)}
        className="bg-slate-900 text-white p-4 rounded-[1.5rem] hover:bg-blue-600 transition-all shadow-xl shadow-slate-100 group-hover:scale-105 active:scale-95"
      >
        <Eye size={20} />
      </button>
    </div>
  ))}
</div>
      )}

      {/* --- REVIEW MODAL OVERLAY --- */}
      {selectedApp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-2xl rounded-[3.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            
            {/* Modal Header */}
            <div className="p-10 border-b border-slate-50 flex justify-between items-center">
              <div>
                <h3 className="font-black uppercase text-sm tracking-widest text-slate-900">Review Requirements</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">App ID: #{selectedApp}</p>
              </div>
              <button 
                onClick={() => setSelectedApp(null)}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-10 space-y-8">
              <div className="grid gap-3">
                {files.map(f => (
                  <div key={f.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-xl shadow-sm text-blue-600">
                            <FileText size={18} />
                        </div>
                        <span className="text-[11px] font-black text-slate-700 uppercase">{f.field_label}</span>
                    </div>
                    
                    <a 
                      href={`http://localhost:5000/${f.file_path}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[9px] font-black text-blue-600 uppercase hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                    >
                      View Document
                    </a>
                  </div>
                ))}
                {files.length === 0 && <p className="text-center py-4 text-xs font-bold text-slate-400">No files found for this renewal.</p>}
              </div>

              <button 
                onClick={() => approveRenewal(selectedApp)}
                className="w-full py-6 bg-green-600 text-white rounded-[1.8rem] font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-green-700 transition-all shadow-xl shadow-green-100 active:scale-95"
              >
                <CheckCircle size={20} /> Finalize & Approve Renewal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}