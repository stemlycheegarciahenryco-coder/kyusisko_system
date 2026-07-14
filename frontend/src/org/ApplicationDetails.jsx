import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import ApplicationDetailsRightAction from './ApplicationDetailsRightAction';
import ApplicationStudentProfile from './ApplicationStudentProfile';
import ApplicantDocs from './ApplicantDocs';
import { ActionConfirmModal, FeedbackModal, ComplianceModal } from './ApplicationModals';

export default function ApplicationDetails() {
  const { id, appId } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState({ open: false, status: null });
  const [feedbackModal, setFeedbackModal] = useState({ open: false, type: '', message: '' });
  const [complianceModal, setComplianceModal] = useState(false);
  const [renewalDocs, setRenewalDocs] = useState([]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/applications/scholarship/${id}/applications/${appId}`);
      setDetail(res.data.data);
    } catch (err) {
      console.error("Error loading application detail records:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id && appId) fetchDetail(); }, [id, appId]);

  const handleStatusUpdate = async (newStatus) => {
    setConfirmModal({ open: false, status: null });
    try {
      const res = await api.patch(`/applications/scholarship/${id}/applications/${appId}/status`, { status: newStatus });
      if (res.data.success) {
        setDetail(prev => ({ ...prev, status: res.data.data.status }));
        setFeedbackModal({ open: true, type: 'success', message: `Status updated to ${newStatus} successfully.` });
      }
    } catch (err) {
      setFeedbackModal({ open: true, type: 'error', message: "Failed to securely update institutional ledger." });
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="w-8 h-8 border-4 border-[#093fb4] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!detail) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-400 font-bold text-sm uppercase tracking-wider">
      Record mapping unverified or empty.
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6">
      <div className="max-w-6xl mx-auto space-y-5">

        {/* TOP LEVEL ROUTING BARS */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#093fb4] transition-colors uppercase tracking-wider"
          >
            <ArrowLeft size={14} /> Back to Applicants
          </button>
          
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-slate-400">APP-{appId || '53'}</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1">
              <CheckCircle2 size={10} /> {detail.status || 'Approved'}
            </span>
          </div>
        </div>

        {/* SPLIT PRIMARY SECTION GRID (Top Half from image_81799d.jpg) */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
          <ApplicationStudentProfile detail={detail} />
          <ApplicationDetailsRightAction
            detail={detail}
            setConfirmModal={setConfirmModal}
            setComplianceModal={setComplianceModal}
            isPending={detail.status === 'pending'}
            isUnderReview={detail.status === 'under_review'}
            isFinalized={detail.status === 'approved' || detail.status === 'not_eligible'}
            handleAction={handleStatusUpdate}
          />
        </div>

        {/* COMPREHENSIVE HORIZONTAL LEDGER ROW TABLES (Bottom Half from image_81799d.jpg) */}
        <div className="w-full">
          <ApplicantDocs 
            applicationId={appId}
            responses={detail.responses}
            compliance_docs={detail.compliance_docs}
            compliance_history={detail.compliance_history}
            renewal_docs={detail.renewal_docs}
            renewal_requirements={renewalDocs}
            renewal_history={detail.renewal_history}
          />
        </div>

      </div>

      {/* OVERLAY SYSTEM FLOW MODALS */}
      <ComplianceModal
        isOpen={complianceModal}
        onClose={() => setComplianceModal(false)}
        onSend={async (reason, required_docs) => {
          try {
            await api.post(`/applications/scholarship/${id}/applications/${appId}/comply`, { reason, required_docs });
            setComplianceModal(false);
            setDetail(prev => ({ ...prev, status: 'under_review' }));
            setFeedbackModal({ open: true, type: 'success', message: 'Compliance metrics successfully sent to student profile.' });
          } catch (err) {
            setFeedbackModal({ open: true, type: 'error', message: 'Failed to complete transaction lookup dispatch.' });
          }
        }}
      />
      <ActionConfirmModal
        isOpen={confirmModal.open}
        status={confirmModal.status}
        onClose={() => setConfirmModal({ open: false, status: null })}
        onConfirm={() => handleStatusUpdate(confirmModal.status)}
      />
      <FeedbackModal
        isOpen={feedbackModal.open}
        type={feedbackModal.type}
        message={feedbackModal.message}
        onClose={() => setFeedbackModal({ ...feedbackModal, open: false })}
      />
    </div>
  );
}