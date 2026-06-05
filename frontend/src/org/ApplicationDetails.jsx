import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { ArrowLeft, User, Phone, Mail, FileText, ExternalLink, Clock, History, RefreshCw, CheckCircle2 } from 'lucide-react';
import ApplicationDetailsRightAction from './ApplicationDetailsRightAction';
import ApplicationStudentProfile from './ApplicationStudentProfile';
import { StatusBadge, ActionConfirmModal, FeedbackModal, ComplianceModal } from './ApplicationModals';

const backendURL = "http://localhost:5000";

// ─── helpers ────────────────────────────────────────────────────
function EmptySlot({ message }) {
  return (
    <p className="text-[10px] font-black uppercase tracking-widest text-black/20 italic text-center py-4">
      {message}
    </p>
  );
}

function FileRow({ href, label, accent = '#093fb4', date }) {
  return (
    <div className="bg-white rounded-xl border border-black/5 px-3 py-2.5 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center" style={{ background: `${accent}15` }}>
          <FileText size={12} style={{ color: accent }} />
        </div>
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="text-[11px] font-bold hover:underline flex items-center gap-1 truncate"
          style={{ color: accent }}
        >
          {label} <ExternalLink size={9} />
        </a>
      </div>
      {date && <span className="text-[9px] font-bold text-black/20 uppercase shrink-0">{date}</span>}
    </div>
  );
}

// ─── Column card wrapper ─────────────────────────────────────────
function ColCard({ icon, title, accent = '#093fb4', count, children }) {
  return (
    <div className="bg-[#FFFCFB] rounded-2xl border border-black/8 overflow-hidden flex flex-col">
      <div
        className="px-4 py-3 border-b border-black/5 flex items-center justify-between"
        style={{ background: `${accent}08` }}
      >
        <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest" style={{ color: accent }}>
          {icon} {title}
        </span>
        {count !== undefined && (
          <span
            className="text-[9px] font-black px-2 py-0.5 rounded-full"
            style={{ background: `${accent}15`, color: accent }}
          >
            {count}
          </span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[420px]">
        {children}
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────
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
      const appData = res.data.data;
      setDetail(appData);

      if (appData.status === 'renewing' || appData.status === 'submitted') {
        try {
          const reqRes = await api.get(`/renewals/${appId}/renewal-compliance`);
          setRenewalDocs(reqRes.data.data.required_docs);
        } catch (e) { console.warn("No requirements set"); }
      }
    } catch (err) {
      console.error("Error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id && appId) fetchDetail(); }, [id, appId]);

  const handleAction = async (action) => {
    const msg = action === 'approve'
      ? "Are you sure you want to approve this renewal?"
      : "Are you sure you want to terminate this scholarship?";
    if (!window.confirm(msg)) return;
    try {
      if (action === 'approve') {
        await api.patch(`/renewals/${appId}/renew-approve`);
      } else {
        await api.patch(`/renewals/${appId}/terminate`, { status: 'terminated' });
      }
      setFeedbackModal({ open: true, type: 'success', message: 'Action processed successfully' });
      fetchDetail();
    } catch (err) {
      setFeedbackModal({ open: true, type: 'error', message: 'Failed to process action' });
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    setConfirmModal({ open: false, status: null });
    try {
      const res = await api.patch(`/applications/scholarship/${id}/applications/${appId}/status`, { status: newStatus });
      if (res.data.success) {
        setDetail(prev => ({ ...prev, status: res.data.data.status }));
        setFeedbackModal({ open: true, type: 'success', message: getSuccessMessage(newStatus) });
      }
    } catch (err) {
      setFeedbackModal({ open: true, type: 'error', message: err.response?.data?.message || "Failed to update status." });
    }
  };

  const getSuccessMessage = (status) => {
    if (status === 'approved') return 'Student has been approved and notified!';
    if (status === 'under_review') return 'Student has been notified to comply with requirements.';
    if (status === 'not_eligible') return 'Application marked as not eligible.';
    return `Status updated to ${status}.`;
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-black/[0.02]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#093fb4] border-t-transparent rounded-full animate-spin" />
        <p className="text-[11px] font-black uppercase tracking-widest text-black/30">Loading Application...</p>
      </div>
    </div>
  );

  if (!detail) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-black/30 font-black uppercase">Application not found.</p>
    </div>
  );

  const isPending = detail.status === 'pending';
  const isUnderReview = detail.status === 'under_review';
  const isFinalized = detail.status === 'approved' || detail.status === 'not_eligible';

  // ── Build renewal cycles ────────────────────────────────────────
  const renewalCycles = (() => {
    if (detail.renewal_history?.length > 0) return detail.renewal_history;
    if (renewalDocs || detail.renewal_docs?.length > 0) {
      return [{
        id: 'cycle-1',
        created_at: detail.renewal_docs?.[0]?.created_at || new Date().toISOString(),
        reason: null,
        required_docs: renewalDocs,
        docs: detail.renewal_docs || [],
      }];
    }
    return [];
  })();

  return (
    <div className="min-h-screen bg-black/[0.02] p-6">
      <div className="max-w-6xl mx-auto space-y-5">

        {/* Back + App ID */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-black/40 hover:text-[#093fb4] transition-colors"
          >
            <ArrowLeft size={16} /> Back to Applicants
          </button>
          <div className="flex items-center gap-3">
            <p className="text-[11px] font-black uppercase tracking-widest text-[#093fb4]/50">#APP-{appId}</p>
            <StatusBadge status={detail.status} />
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            ROW 1 — Profile (left)  +  Action Panel (right)
        ══════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">

          {/* ← Extracted into its own component */}
          <ApplicationStudentProfile detail={detail} />

          {/* Action Panel */}
          <ApplicationDetailsRightAction
            detail={detail}
            setConfirmModal={setConfirmModal}
            setComplianceModal={setComplianceModal}
            isPending={isPending}
            isUnderReview={isUnderReview}
            isFinalized={isFinalized}
            handleAction={handleAction}
          />
        </div>

        {/* ══════════════════════════════════════════════════
            ROW 2 — Documents | Compliance | Renewal  (3 col)
        ══════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">

          {/* COL 1 — Submitted Documents */}
          <ColCard
            icon={<FileText size={12} />}
            title="Documents"
            accent="#093fb4"
            count={detail.responses?.length || 0}
          >
            {detail.responses?.length > 0 ? detail.responses.map((ans, idx) => (
              <div key={idx} className="bg-black/[0.02] rounded-xl border border-black/5 px-3 py-2.5">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#093fb4] mb-1.5">{ans.field_label}</p>
                {ans.field_type === 'file' ? (
                  <FileRow
                    href={`${backendURL}/uploads/${(ans.file_path || '').replace(/^uploads[\\/]/, '')}`}
                    label="View File"
                  />
                ) : (
                  <p className="text-xs font-bold text-black">{ans.text_value || '—'}</p>
                )}
              </div>
            )) : <EmptySlot message="No documents submitted" />}
          </ColCard>

          {/* COL 2 — Compliance History */}
          <ColCard
            icon={<History size={12} />}
            title="Compliance"
            accent="#d97706"
            count={detail.compliance_history?.length || 0}
          >
            {detail.compliance_history?.length > 0 ? detail.compliance_history.map((req, index) => {
              const nextReqTime = detail.compliance_history[index + 1]?.created_at;
              const docsForReq = detail.compliance_docs?.filter(doc => {
                const docTime = new Date(doc.created_at);
                const reqTime = new Date(req.created_at);
                return nextReqTime
                  ? docTime >= reqTime && docTime < new Date(nextReqTime)
                  : docTime >= reqTime;
              });

              return (
                <div key={req.id} className="rounded-xl border border-amber-200 overflow-hidden">
                  <div className="bg-amber-50 px-3 py-2 flex items-center justify-between border-b border-amber-100">
                    <span className="text-[9px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase tracking-widest">
                      #{index + 1}
                    </span>
                    <span className="text-[9px] font-bold text-black/30">
                      {new Date(req.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="px-3 py-2 bg-white/50 border-b border-amber-50">
                    <p className="text-[9px] font-black uppercase tracking-widest text-black/30 mb-0.5">Reason</p>
                    <p className="text-[11px] font-bold text-black leading-snug">{req.reason || '—'}</p>
                  </div>
                  <div className="px-3 py-2 bg-white/50 border-b border-amber-50">
                    <p className="text-[9px] font-black uppercase tracking-widest text-black/30 mb-0.5">Required</p>
                    <p className="text-[11px] font-bold text-amber-700 leading-snug">{req.required_docs || '—'}</p>
                  </div>
                  <div className="px-3 py-2.5 space-y-1.5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-black/20 mb-1">Submitted Files</p>
                    {docsForReq?.length > 0
                      ? docsForReq.map((doc, idx) => (
                        <FileRow
                          key={idx}
                          href={`${backendURL}/uploads/${doc.file_path}`}
                          label={`File ${idx + 1}`}
                          accent="#d97706"
                          date={new Date(doc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        />
                      ))
                      : <EmptySlot message="No files yet" />
                    }
                  </div>
                </div>
              );
            }) : <EmptySlot message="No compliance requests" />}
          </ColCard>

          {/* COL 3 — Renewal History */}
          <ColCard
            icon={<RefreshCw size={12} />}
            title="Renewal"
            accent="#093fb4"
            count={renewalCycles.length}
          >
            {renewalCycles.length > 0 ? renewalCycles.map((cycle, index) => {
              const isLatest = index === renewalCycles.length - 1;
              return (
                <div key={cycle.id || index} className="rounded-xl border border-[#093fb4]/20 overflow-hidden">
                  <div className="bg-[#093fb4]/5 px-3 py-2 flex items-center justify-between border-b border-[#093fb4]/10">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-black bg-[#093fb4]/10 text-[#093fb4] px-2 py-0.5 rounded-full uppercase tracking-widest">
                        Cycle #{index + 1}
                      </span>
                      {isLatest && (
                        <span className="text-[9px] font-black bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1">
                          <CheckCircle2 size={8} /> Latest
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] font-bold text-black/30">
                      {new Date(cycle.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  {cycle.required_docs && (
                    <div className="px-3 py-2 bg-white/60 border-b border-[#093fb4]/10">
                      <p className="text-[9px] font-black uppercase tracking-widest text-[#093fb4]/40 mb-0.5">Required</p>
                      <p className="text-[11px] font-bold text-[#093fb4] leading-snug whitespace-pre-line">{cycle.required_docs}</p>
                    </div>
                  )}
                  <div className="px-3 py-2.5 space-y-1.5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-black/20 mb-1">Submitted Files</p>
                    {cycle.docs?.length > 0
                      ? cycle.docs.map((doc, idx) => (
                        <FileRow
                          key={idx}
                          href={`${backendURL}/uploads/${doc.file_path}`}
                          label={`Renewal File ${idx + 1}`}
                          date={new Date(doc.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                        />
                      ))
                      : (
                        <div className="bg-[#093fb4]/5 border border-[#093fb4]/10 rounded-xl px-3 py-2.5 text-center">
                          <Clock size={12} className="text-[#093fb4]/30 mx-auto mb-1" />
                          <p className="text-[9px] font-black uppercase tracking-widest text-[#093fb4]/30">
                            Awaiting student
                          </p>
                        </div>
                      )
                    }
                  </div>
                </div>
              );
            }) : <EmptySlot message="No renewal history yet" />}
          </ColCard>

        </div>
      </div>

      {/* Modals */}
      <ComplianceModal
        isOpen={complianceModal}
        onClose={() => setComplianceModal(false)}
        onSend={async (reason, required_docs) => {
          try {
            await api.post(`/applications/scholarship/${id}/applications/${appId}/comply`, { reason, required_docs });
            setComplianceModal(false);
            setDetail(prev => ({ ...prev, status: 'under_review' }));
            setFeedbackModal({ open: true, type: 'success', message: 'Compliance request sent to student.' });
          } catch (err) {
            setFeedbackModal({ open: true, type: 'error', message: 'Failed to send compliance request.' });
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