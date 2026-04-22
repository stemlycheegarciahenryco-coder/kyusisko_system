import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { ArrowLeft, FileText, ExternalLink, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
// Import the new component
import StudentProfileModal from '../component/StudentProfileModal'; 

const backendURL = "http://localhost:5000";

export default function ApplicationDetails() {
    const { id, appId } = useParams();
    const navigate = useNavigate();
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await api.get(`/scholarship/${id}/applications/${appId}`);
                setDetail(res.data.data);
            } catch (err) {
                console.error("Error fetching application details", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id, appId]);

    const handleStatusUpdate = async (newStatus) => {
        try {
            const res = await api.patch(`/scholarship/${id}/applications/${appId}/status`, { 
                status: newStatus 
            });
            if (res.data.success) {
                setDetail(prev => ({ ...prev, status: res.data.data.status }));
                alert(`Status updated to ${newStatus}`);
            }
        } catch (err) {
            alert("Failed to update status");
        }
    };

    if (loading) return <div className="p-10 text-center font-bold">Loading Details...</div>;
    if (!detail) return <div className="p-10 text-center">Application not found.</div>;

    // Split the logic here
    const isFirstTimePending = detail.status === 'pending';
    const isRenewalPending = detail.status === 'renewal_pending';
    const isProcessed = detail.status === 'approved' || detail.status === 'rejected';

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <StudentProfileModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                student={detail} 
            />

            <div className="max-w-4xl mx-auto">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 mb-6 font-bold hover:text-blue-600 transition-colors">
                    <ArrowLeft size={20} /> Back to List
                </button>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* Header */}
                    <div className="p-8 border-b border-slate-100 bg-slate-900 text-white flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-black">{detail.sfirst_name} {detail.slast_name}</h1>
                            <p className="text-slate-400">{detail.student_email}</p>
                            <button 
                                onClick={() => setIsModalOpen(true)}
                                className="mt-4 text-xs bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2"
                            >
                                <ExternalLink size={14} /> View Full Profile
                            </button>
                        </div>
                        <div className="text-right">
                            <span className="block text-[10px] font-black uppercase text-slate-500 mb-1">Status</span>
                            <span className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest ${detail.status === 'approved' ? 'bg-green-500' : detail.status === 'rejected' ? 'bg-red-500' : 'bg-blue-600'}`}>
                                {detail.status.replace('_', ' ')}
                            </span>
                        </div>
                    </div>

                    {/* Renewal Section - Only shows if status is renewal_pending */}
                    {isRenewalPending && (
                        <div className="m-8 p-6 bg-purple-50 border-2 border-purple-100 rounded-[2rem] flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-600 text-white rounded-2xl shadow-lg shadow-purple-100">
                                    <RefreshCw size={24} className="animate-spin-slow" />
                                </div>
                                <div>
                                    <h4 className="font-black text-purple-900 uppercase text-xs">Renewal Requirements Submitted</h4>
                                    <p className="text-purple-600 text-[10px] font-bold uppercase tracking-tight">Verify latest GWA in Student Profile</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleStatusUpdate('approved')}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-purple-200 transition-all active:scale-95"
                            >
                                Confirm Renewal
                            </button>
                        </div>
                    )}

                    {/* Form Responses */}
                    <div className="p-8">
                        <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Form Responses</h2>
                        <div className="grid gap-6">
                            {detail.responses?.map((ans, idx) => (
                                <div key={idx} className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                    <p className="text-xs font-black text-blue-600 uppercase mb-2">{ans.field_label}</p>
                                    {ans.field_type === 'file' ? (
                                        <a 
                                            href={`${backendURL}/uploads/${encodeURIComponent(ans.response_value.replace(/^uploads[\\/]/, ''))}`} 
                                            target="_blank" rel="noreferrer"
                                            className="inline-flex items-center gap-2 text-slate-700 font-bold hover:text-blue-600 transition-colors"
                                        >
                                            <FileText size={18} className="text-red-500" /> View Document <ExternalLink size={14} />
                                        </a>
                                    ) : (
                                        <p className="text-slate-800 font-semibold text-lg">{ans.response_value}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons - Only shows if status is FIRST TIME pending */}
                    {isFirstTimePending && (
                        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
                            <button 
                                onClick={() => handleStatusUpdate('rejected')} 
                                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-red-600 hover:bg-red-100 border border-transparent hover:border-red-200 transition-all"
                            >
                                <XCircle size={20} /> Reject
                            </button>
                            <button 
                                onClick={() => handleStatusUpdate('approved')} 
                                className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
                            >
                                <CheckCircle size={20} /> Approve Student
                            </button>
                        </div>
                    )}

                    {/* Footer Info - Shows after the application is already approved or rejected */}
                    {isProcessed && (
                        <div className="p-8 bg-slate-50 border-t border-slate-100 text-center">
                             <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                                This application has been <span className={detail.status === 'approved' ? 'text-green-600' : 'text-red-600'}>{detail.status}</span>
                             </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}