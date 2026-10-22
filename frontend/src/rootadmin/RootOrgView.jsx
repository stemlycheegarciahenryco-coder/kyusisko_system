import React, { useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import {
  IconCheck, IconX, IconLock, IconLockOpen, IconFileText,
  IconMail, IconPhone, IconMapPin, IconWorld, IconBuilding,
  IconUser, IconExternalLink, IconAlertCircle, IconRefresh, IconPlus, IconTrash, IconSend, IconCircleCheck
} from '@tabler/icons-react';
import api from '../api';
import { useDialog } from './DialogModal'; 

const REJECTION_REASON_OPTIONS = [
  'Submitted documents is fake or counterfeited',
  'Registered account is unauthorized',
  'Unverified Contact Information',
  'Social Media Inconsistencies'
];

const FIELD_ERROR = 'text-caption font-bold text-red-600';

const RootOrgView = ({ org, onClose, onApprove, onReject, onBlock, colors, fetchOrgs }) => {
  const [sendingReqs, setSendingReqs] = useState(false);
  const [reqsSent, setReqsSent] = useState(false);
  const [reqFields, setReqFields] = useState([
    'SEC Registration / DTI Permit',
    'Mayor\'s Business Permit',
    'Valid ID of Representative',
    'Signed Memorandum of Agreement (MOA)'
  ]);
  const [newField, setNewField] = useState('');

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [rejectNote, setRejectNote] = useState('');
  const [submittingReject, setSubmittingReject] = useState(false);
  const [rejectError, setRejectError] = useState('');

  const [fieldError, setFieldError] = useState('');
  const bodyRef = useRef(null);

  const { notify, dialogElement } = useDialog();

  if (!org) return null;

  const isPending  = org.status === 'pending';
  const isApproved = org.status === 'approved';
  const isRejected = org.status === 'rejected';
  const isComply   = org.status === 'comply';

  const processedFiles = (() => {
    try {
      if (!org.proof_files) return [];
      const proofData = typeof org.proof_files === 'string' ? JSON.parse(org.proof_files) : org.proof_files;
      const items = [];

      if (proofData.proof_files && Array.isArray(proofData.proof_files)) {
        proofData.proof_files.forEach(path => {
          if (path && typeof path === 'string') items.push({ displayName: 'Proof of Existence', path });
        });
      }
      if (proofData.sec_files && Array.isArray(proofData.sec_files)) {
        proofData.sec_files.forEach(path => {
          if (path && typeof path === 'string') items.push({ displayName: 'SEC / DTI Registration', path });
        });
      }
      if (proofData.valid_ids && Array.isArray(proofData.valid_ids)) {
        proofData.valid_ids.forEach(path => {
          if (path && typeof path === 'string') items.push({ displayName: 'Representative Valid ID', path });
        });
      }
      if (proofData.new_compliance_docs && Array.isArray(proofData.new_compliance_docs)) {
        proofData.new_compliance_docs.forEach(doc => {
          if (doc && doc.file_path) {
            items.push({ displayName: doc.document_name || 'Compliance Document', path: doc.file_path });
          }
        });
      }
      return items;
    } catch (err) {
      console.error("Failed parsing organization documents metadata object:", err);
      return [];
    }
  })();

  const isResubmitted = isPending && processedFiles.length > 0;
  const statusColor = isApproved ? '#22c55e' : isRejected ? colors.red : isComply ? '#3b82f6' : '#f59e0b';
  const statusLabel = isApproved ? 'Approved' : isRejected ? 'Rejected' : isComply ? 'Compliance Mode' : isResubmitted ? 'Updated & Pending' : 'Pending Review';

  const handleAddField = () => {
    const value = newField.trim();
    if (!value) return;
    if (reqFields.some(f => f.toLowerCase() === value.toLowerCase())) {
      setFieldError('This requirement is already in the checklist.');
      return;
    }
    setReqFields([...reqFields, value]);
    setNewField('');
    setFieldError('');
    setReqsSent(false);
  };

  const handleRemoveField = (fieldToRemove) => {
    setReqFields(reqFields.filter(f => f !== fieldToRemove));
    setFieldError('');
    setReqsSent(false);
  };

  const handleSendRequirements = async (e) => {
    e.preventDefault();
    if (reqFields.length === 0) {
      await notify({ variant: 'error', title: 'Checklist is empty', body: 'Add at least one document requirement before sending.' });
      return;
    }

    try {
      setSendingReqs(true);
      await api.post(`/onboarding-orgs/send-requirements/${org.id}`, { requirements: reqFields });
      setReqsSent(true);
      
      // Await prevents this from getting immediately unmounted
      await notify({
        variant: 'success',
        title: 'requirements sent',
        body: `The compliance requirements were emailed to ${org.org_name}. You can close this window.`
      });
      
      if (fetchOrgs) fetchOrgs();
    } catch (err) {
      await notify({
        variant: 'error',
        title: 'Could not send checklist',
        body: err.response?.data?.error || 'Failed to send the required fields. Please try again.'
      });
    } finally {
      setSendingReqs(false);
    }
  };

  const toggleReason = (reason) => {
    setRejectError('');
    setSelectedReasons(prev =>
      prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason]
    );
  };

  const handleConfirmReject = async () => {
    if (selectedReasons.length === 0) {
      setRejectError('Check at least one rejection reason to continue.');
      return;
    }
    try {
      setSubmittingReject(true);
      await onReject(org, selectedReasons, rejectNote);
      setIsRejectModalOpen(false);
      setSelectedReasons([]);
      setRejectNote('');
    } finally {
      setSubmittingReject(false);
    }
  };

  const handleDownload = async (pathString) => {
    try {
      const { data } = supabase.storage.from('org-complied-docs').getPublicUrl(pathString);
      if (!data || !data.publicUrl) throw new Error("Failed to generate public URL reference string.");
      window.open(data.publicUrl, '_blank');
    } catch (err) {
      await notify({ variant: 'error', title: 'Could not open file', body: 'The document could not be retrieved. Please try again.' });
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#FFFCFB] w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col z-[51]">
        {/* Header */}
        <div className="px-7 py-5 flex items-center justify-between shrink-0" style={{ background: colors.blue }}>
          <div className="flex items-center gap-4">
            {org.org_pic ? (
              <img src={org.org_pic} alt={`${org.org_name} logo`} className="w-12 h-12 rounded-2xl object-cover border border-white/20 shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/10 flex items-center justify-center text-white font-black text-lg shrink-0">
                {org.org_name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-white/55 text-[9px] font-black uppercase tracking-[0.2em]">{org.provider_type || 'Organization'}</p>
                {isResubmitted && <span className="bg-amber-500 text-white text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md flex items-center gap-1 animate-bounce"><IconRefresh size={8} strokeWidth={3} /> Updated</span>}
              </div>
              <h2 className="text-[18px] font-black text-white leading-tight uppercase tracking-tight">{org.org_name}</h2>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: statusColor }} />
                <span className="text-[9px] font-black uppercase tracking-widest text-white/60">{statusLabel}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0"><IconX size={16} /></button>
        </div>

        {/* Body */}
        <div ref={bodyRef} className="overflow-y-auto flex-1 px-7 py-6 space-y-6">
          {isResubmitted && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start">
              <IconRefresh size={18} className="text-amber-600 shrink-0 mt-0.5 animate-spin [animation-duration:4s]" />
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-amber-800 mb-0.5">Action Required: Compliance Resubmitted</p>
                <p className="text-xs font-semibold text-amber-900">This provider updated their documents for registration clearance review.</p>
              </div>
            </div>
          )}

          {isComply && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3 items-start">
              <IconAlertCircle size={18} className="text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-blue-700 mb-1">Status: Compliance Requested</p>
                <p className="text-xs font-semibold text-blue-900">This organization is currently requested to upload the custom fields specified below.</p>
              </div>
            </div>
          )}

          {isRejected && org.rejection_reason && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-3 items-start">
              <IconAlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-red-700 mb-1">Reason for rejection</p>
                <p className="text-sm font-medium text-red-700">{org.rejection_reason}</p>
              </div>
            </div>
          )}

          {/* ADMIN ACTION: Compliance Upload Fields Creator Section */}
          {(isPending || isComply) && (
            <Section label="Specify Compliance Upload Fields">
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-4">
                <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
                  Enter the specific document names you expect this provider to fulfill. Submitting this list moves them into Compliance Mode and emails them a dynamic secure upload channel.
                </p>
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                  {reqFields.map((field, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-100 shadow-sm group">
                      <span className="text-xs font-semibold text-slate-800">{field}</span>
                      <button type="button" onClick={() => handleRemoveField(field)} className="text-slate-300 hover:text-red-500 transition-colors"><IconTrash size={14} /></button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" placeholder="e.g., BIR Form 2303, Cert of Good Standing" value={newField} onChange={(e) => { setNewField(e.target.value); setFieldError(''); }} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddField())} aria-invalid={!!fieldError} className={`ui-input py-2 text-caption ${fieldError ? 'border-red-400' : ''}`} />
                  <button type="button" onClick={handleAddField} className="p-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-slate-700 transition-colors flex items-center justify-center shrink-0"><IconPlus size={16} /></button>
                </div>
                {fieldError && <p className={`${FIELD_ERROR} -mt-2`} role="alert">{fieldError}</p>}
                <button type="button" onClick={handleSendRequirements} disabled={sendingReqs || reqsSent || reqFields.length === 0} className="ui-btn-primary w-full !py-2.5">
                  {sendingReqs ? 'Notifying Provider...' : reqsSent ? <><IconCircleCheck size={14} /> Checklist Sent</> : <><IconSend size={14} /> Send Compliance Checklist</>}
                </button>
              </div>
            </Section>
          )}

          <Section label="Contact person">
            <div className="grid grid-cols-2 gap-3">
              {org.provider_code && <InfoCard icon={<IconUser size={14} className="text-brand" />} label="Provider ID" value={org.provider_code} />}
              <InfoCard icon={<IconMail size={14} className="text-brand" />} label="Email" value={org.sub_email} />
              <InfoCard icon={<IconPhone size={14} className="text-brand" />} label="Telephone number" value={org.tel_number ? `+02 ${org.tel_number}` : '—'} />
              <InfoCard icon={<IconPhone size={14} className="text-brand" />} label="Contact number" value={org.contact_number ? `+63 ${org.contact_number}` : '—'} />
              <InfoCard icon={<IconBuilding size={14} className="text-brand" />} label="Provider type" value={org.provider_type || '—'} />
            </div>
          </Section>

          {org.website && (
            <Section label="Website / Social">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-soft flex items-center justify-center shrink-0"><IconWorld size={14} className="text-brand" /></div>
                <a href={org.website} target="_blank" rel="noreferrer" className="text-sm font-bold text-brand hover:underline flex items-center gap-1.5 group">{org.website}<IconExternalLink size={12} className="opacity-50 group-hover:opacity-100 transition-opacity" /></a>
              </div>
            </Section>
          )}

          <Section label="Address">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-soft flex items-center justify-center shrink-0 mt-0.5"><IconMapPin size={14} className="text-brand" /></div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-black/40 mb-0.5">Full address</p>
                <p className="text-sm font-semibold text-slate-800">{[org.street_address, org.barangay, org.city, org.region].filter(Boolean).join(', ') || '—'}</p>
              </div>
            </div>
          </Section>

          <Section label={`Uploaded documents (${processedFiles.length})`}>
            {processedFiles.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {processedFiles.map((file, idx) => {
                  const pathString = file.path || '';
                  const rawFileName = pathString.split('/').pop() || `Document ${idx + 1}`;
                  const ext = rawFileName.split('.').pop()?.toUpperCase() || 'FILE';
                  return (
                    <button key={idx} type="button" onClick={() => handleDownload(file.path)} className="w-full text-left flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-3 hover:bg-brand-soft hover:border-brand/20 transition-all group">
                      <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center shrink-0"><IconFileText size={14} className="text-white" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black text-slate-800 truncate" title={file.displayName}>{file.displayName}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase truncate" title={rawFileName}>{ext} · {rawFileName}</p>
                      </div>
                      <IconExternalLink size={12} className="text-slate-300 group-hover:text-brand transition-colors shrink-0" />
                    </button>
                  );
                })}
              </div>
            ) : (<p className="text-xs font-bold text-black/40 italic">No documentation records attached.</p>)}
          </Section>
        </div>

        {/* Footer */}
        <div className="px-7 py-5 border-t border-black/5 bg-[#FFFCFB] shrink-0">
          {(isPending || isComply) && (
            <div className="flex gap-3">
              <button onClick={() => onApprove(org)} className="flex-1 py-3 bg-brand hover:bg-brand-dark text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-md shadow-blue-900/10">
                <IconCheck size={16} /> {isResubmitted ? "Approve Resubmission" : "Approve Provider"}
              </button>
              <button onClick={() => setIsRejectModalOpen(true)} className="px-5 py-3 bg-red-50 hover:bg-red-100 text-red-500 border border-red-100 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.99]">
                <IconX size={16} /> Reject Account
              </button>
            </div>
          )}

          {isApproved && (
            <button onClick={() => onBlock(org)} className={`w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99] ${org.is_active ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-brand hover:bg-brand-dark text-white shadow-md shadow-blue-900/10'}`}>
              {org.is_active ? <><IconLock size={16} /> Block Provider Access</> : <><IconLockOpen size={16} /> Restore Provider Access</>}
            </button>
          )}

          {isRejected && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-5 py-3.5 text-center">
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center justify-center gap-1.5"><IconX size={13} /> This organization profile has been rejected</p>
            </div>
          )}
        </div>
      </div>

      {isRejectModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && !submittingReject && setIsRejectModalOpen(false)}>
          <div className="bg-[#FFFCFB] w-full max-w-md rounded-3xl shadow-2xl p-7">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-1">Reject {org.org_name}</h3>
            <p className="text-xs font-semibold text-slate-500 mb-5">This action is final — the organization will not be able to resubmit compliance documents afterward.</p>
            <div className="space-y-2 mb-5">
              {REJECTION_REASON_OPTIONS.map((reason) => (
                <label key={reason} className="flex items-start gap-3 bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-3 cursor-pointer hover:bg-red-50/50 transition-colors">
                  <input type="checkbox" checked={selectedReasons.includes(reason)} onChange={() => toggleReason(reason)} className="mt-0.5 w-4 h-4 accent-red-500 shrink-0" />
                  <span className="text-xs font-semibold text-slate-700">{reason}</span>
                </label>
              ))}
            </div>
            {rejectError && <p className={`${FIELD_ERROR} -mt-3 mb-4`} role="alert">{rejectError}</p>}
            <label className="ui-label block mb-2">Additional note (optional)</label>
            <textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} placeholder="Add any extra context for this rejection..." rows={3} className="ui-input focus:border-red-400 mb-6 resize-none" />
            <div className="flex gap-3">
              <button type="button" disabled={submittingReject} onClick={() => { setIsRejectModalOpen(false); setSelectedReasons([]); setRejectNote(''); setRejectError(''); }} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">Cancel</button>
              <button type="button" disabled={submittingReject} onClick={handleConfirmReject} className="flex-1 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"><IconX size={14} /> {submittingReject ? 'Rejecting...' : 'Confirm Rejection'}</button>
            </div>
          </div>
        </div>
      )}
      
      {/* 
        This is placed at the absolute highest root of the component (outside the inner window)
        so no CSS 'overflow-hidden' container can clip it. 
      */}
      {dialogElement}
    </div>
  );
};

function Section({ label, children }) { return (<div className="space-y-3"><div className="flex items-center gap-3"><span className="text-[9px] font-black uppercase tracking-widest text-black/40 whitespace-nowrap">{label}</span><div className="h-px flex-1 bg-black/5" /></div><div className="space-y-2">{children}</div></div>); }
function InfoCard({ icon, label, value }) { return (<div className="flex items-start gap-2.5 bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-3"><div className="w-7 h-7 rounded-lg bg-brand-soft flex items-center justify-center shrink-0 mt-0.5">{icon}</div><div className="min-w-0 flex-1"><p className="text-[9px] font-black uppercase tracking-widest text-black/40 mb-0.5 truncate">{label}</p><p className="text-xs font-bold text-slate-800 break-words">{value || '—'}</p></div></div>); }

export default RootOrgView;