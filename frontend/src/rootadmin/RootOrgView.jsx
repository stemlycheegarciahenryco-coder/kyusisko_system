import React, { useState } from 'react';
import {supabase} from '../supabaseClient';
import {
  IconCheck, IconX, IconLock, IconLockOpen, IconFileText,
  IconMail, IconPhone, IconMapPin, IconWorld, IconBuilding,
  IconUser, IconExternalLink, IconAlertCircle, IconRefresh, IconPlus, IconTrash, IconSend
} from '@tabler/icons-react';
import api from '../api';
import Swal from 'sweetalert2';

const REJECTION_REASON_OPTIONS = [
  'Submitted documents is fake or counterfeited',
  'Registered account is unauthorized',
  'Unverified Contact Information',
  'Social Media Inconsistencies'
];

const RootOrgView = ({ org, onClose, onApprove, onReject, onBlock, colors, fetchOrgs }) => {
  if (!org) return null;

  const [sendingReqs, setSendingReqs] = useState(false);
  const [reqFields, setReqFields] = useState([
    'SEC Registration / DTI Permit',
    'Mayor\'s Business Permit',
    'Valid ID of Representative',
    'Signed Memorandum of Agreement (MOA)'
  ]);
  const [newField, setNewField] = useState('');

  // NEW: Reject modal state — checkbox reasons + optional free-text note
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [rejectNote, setRejectNote] = useState('');
  const [submittingReject, setSubmittingReject] = useState(false);

  const isPending  = org.status === 'pending';
  const isApproved = org.status === 'approved';
  const isRejected = org.status === 'rejected';
  const isComply   = org.status === 'comply';

  // 1. SAFELY EXTRACT AND PROCESS ALL DOCUMENT TYPE STRUCTURES FROM THE DB PAYLOAD
  const processedFiles = (() => {
    try {
      if (!org.proof_files) return [];
      
      const proofData = typeof org.proof_files === 'string' ? JSON.parse(org.proof_files) : org.proof_files;
      const items = [];

      // Maps legacy static structures
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

      // Maps your new Dynamic Compliance uploads structure seamlessly!
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
    if (newField.trim()) {
      if (reqFields.includes(newField.trim())) {
        return Swal.fire('Notice', 'This requirement title is already in your checklist.', 'info');
      }
      setReqFields([...reqFields, newField.trim()]);
      setNewField('');
    }
  };

  const handleRemoveField = (fieldToRemove) => {
    setReqFields(reqFields.filter(f => f !== fieldToRemove));
  };

  // 2. DISPATCH CHECKLIST DIRECTLY TO THE CORRECT DYNAMIC ENDPOINT
  const handleSendRequirements = async (e) => {
    e.preventDefault();
    if (reqFields.length === 0) {
      return Swal.fire('Error', 'Please include at least one document requirement title to send.', 'error');
    }

    try {
      setSendingReqs(true);
      
      // Fixed to call the dedicated endpoint with an array payload
      await api.post(`/onboarding-orgs/send-requirements/${org.id}`, {
        requirements: reqFields 
      });
      
      Swal.fire({
        title: 'Requirements Dispatched!',
        text: `Compliance checklist guidelines have been sent to ${org.org_name}.`,
        icon: 'success',
        confirmButtonColor: colors.blue
      });
      if (fetchOrgs) fetchOrgs();
      if (onClose) onClose();
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to submit required fields to the compliance flow.', 'error');
    } finally {
      setSendingReqs(false);
    }
  };

  // NEW: Toggle a checkbox reason on/off
  const toggleReason = (reason) => {
    setSelectedReasons(prev =>
      prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason]
    );
  };

  // NEW: Submit the structured rejection (checked reasons + optional note)
  const handleConfirmReject = async () => {
    if (selectedReasons.length === 0) {
      return Swal.fire('Select a reason', 'Please check at least one rejection reason.', 'warning');
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

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-['Inter',_sans-serif]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#FFFCFB] w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="px-7 py-5 flex items-center justify-between shrink-0" style={{ background: colors.blue }}>
          <div className="flex items-center gap-4">
            {org.org_pic ? (
              <img
                src={`http://localhost:5000/${org.org_pic}`}
                alt={`${org.org_name} logo`}
                className="w-12 h-12 rounded-2xl object-cover border border-white/20 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/10 flex items-center justify-center text-white font-black text-lg shrink-0">
                {org.org_name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-white/55 text-[9px] font-black uppercase tracking-[0.2em]">
                  {org.provider_type || 'Organization'}
                </p>
                {isResubmitted && (
                  <span className="bg-amber-500 text-white text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md flex items-center gap-1 animate-bounce">
                    <IconRefresh size={8} strokeWidth={3} /> Updated
                  </span>
                )}
              </div>
              <h2 className="text-[18px] font-black text-white leading-tight uppercase tracking-tight">{org.org_name}</h2>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: statusColor }} />
                <span className="text-[9px] font-black uppercase tracking-widest text-white/60">{statusLabel}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0"
          >
            <IconX size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-7 py-6 space-y-6">

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

                {/* Checklist Requirements Stack */}
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                  {reqFields.map((field, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-100 shadow-sm group">
                      <span className="text-xs font-semibold text-slate-800">{field}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveField(field)}
                        className="text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <IconTrash size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Fields Action Line */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g., BIR Form 2303, Cert of Good Standing"
                    value={newField}
                    onChange={(e) => setNewField(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddField())}
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-slate-400 transition-all font-['Inter']"
                  />
                  <button
                    type="button"
                    onClick={handleAddField}
                    className="p-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-slate-700 transition-colors flex items-center justify-center shrink-0"
                  >
                    <IconPlus size={16} />
                  </button>
                </div>

                {/* Dispatch Trigger */}
                <button
                  type="button"
                  onClick={handleSendRequirements}
                  disabled={sendingReqs}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black text-[10px] uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  {sendingReqs ? 'Notifying Provider...' : <><IconSend size={14} /> Send Compliance Checklist</>}
                </button>
              </div>
            </Section>
          )}

          {/* Contact person */}
          <Section label="Contact person">
            <div className="grid grid-cols-2 gap-3">
              {org.provider_code && (
                <InfoCard icon={<IconUser size={14} className="text-[#093fb4]" />} label="Provider ID"
                  value={org.provider_code} />
              )}
             
              <InfoCard icon={<IconMail size={14} className="text-[#093fb4]" />} label="Email" value={org.sub_email} />
              <InfoCard icon={<IconPhone size={14} className="text-[#093fb4]" />} label="Contact number"
                value={org.contact_number ? `+63 ${org.contact_number}` : '—'} />
                <InfoCard icon={<IconPhone size={14} className="text-[#093fb4]" />} label="Telephone number"
                value={org.tel_number ? ` ${org.tel_number}` : '—'} />
              <InfoCard icon={<IconBuilding size={14} className="text-[#093fb4]" />} label="Provider type"
                value={org.provider_type || '—'} />
            </div>
          </Section>

          {/* Website */}
          {org.website && (
            <Section label="Website / Social">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] flex items-center justify-center shrink-0">
                  <IconWorld size={14} className="text-[#093fb4]" />
                </div>
                <a
                  href={org.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-bold text-[#093fb4] hover:underline flex items-center gap-1.5 group"
                >
                  {org.website}
                  <IconExternalLink size={12} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                </a>
              </div>
            </Section>
          )}

          {/* Address */}
          <Section label="Address">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] flex items-center justify-center shrink-0 mt-0.5">
                <IconMapPin size={14} className="text-[#093fb4]" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-black/40 mb-0.5">Full address</p>
                <p className="text-sm font-semibold text-slate-800">
                  {[org.street_address, org.barangay, org.city, org.region].filter(Boolean).join(', ') || '—'}
                </p>
              </div>
            </div>
          </Section>

          {/* Document Renderer */}
          <Section label={`Uploaded documents (${processedFiles.length})`}>
            {processedFiles.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {processedFiles.map((file, idx) => {
                  const pathString = file.path || '';
                  const rawFileName = pathString.split('/').pop() || `Document ${idx + 1}`;
                  const ext = rawFileName.split('.').pop()?.toUpperCase() || 'FILE';

                  return (
                    <a
                      key={idx}
                      href={`http://localhost:5000/${pathString}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-3 hover:bg-[#EEF2FF] hover:border-[#093fb4]/20 transition-all group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#093fb4] flex items-center justify-center shrink-0">
                        <IconFileText size={14} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black text-slate-800 truncate" title={file.displayName}>
                          {file.displayName}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase truncate" title={rawFileName}>
                          {ext} · {rawFileName}
                        </p>
                      </div>
                      <IconExternalLink size={12} className="text-slate-300 group-hover:text-[#093fb4] transition-colors shrink-0" />
                    </a>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs font-bold text-black/40 italic">No documentation records attached.</p>
            )}
          </Section>

        </div>

        {/* Footer */}
        <div className="px-7 py-5 border-t border-black/5 bg-[#FFFCFB] shrink-0">
          {(isPending || isComply) && (
            <div className="flex gap-3">
              <button
                onClick={() => onApprove(org)}
                className="flex-1 py-3 bg-[#093fb4] hover:bg-[#093fb4]/90 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-md shadow-blue-900/10"
              >
                <IconCheck size={16} /> {isResubmitted ? "Approve Resubmission" : "Approve Provider"}
              </button>
              <button
                onClick={() => setIsRejectModalOpen(true)}
                className="px-5 py-3 bg-red-50 hover:bg-red-100 text-red-500 border border-red-100 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              >
                <IconX size={16} /> Reject Account
              </button>
            </div>
          )}

          {isApproved && (
            <button
              onClick={() => onBlock(org)}
              className={`w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.99] ${
                org.is_active
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                  : 'bg-[#093fb4] hover:bg-[#093fb4]/90 text-white shadow-md shadow-blue-900/10'
              }`}
            >
              {org.is_active
                ? <><IconLock size={16} /> Block Provider Access</>
                : <><IconLockOpen size={16} /> Restore Provider Access</>
              }
            </button>
          )}

          {isRejected && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-5 py-3.5 text-center">
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center justify-center gap-1.5">
                <IconX size={13} /> This organization profile has been rejected
              </p>
            </div>
          )}
        </div>

      </div>

      {/* NEW: Reject Reason Modal — checkbox list + optional note */}
      {isRejectModalOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && !submittingReject && setIsRejectModalOpen(false)}
        >
          <div className="bg-[#FFFCFB] w-full max-w-md rounded-3xl shadow-2xl p-7">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-1">Reject {org.org_name}</h3>
            <p className="text-xs font-semibold text-slate-500 mb-5">
              This action is final — the organization will not be able to resubmit compliance documents afterward.
            </p>

            <div className="space-y-2 mb-5">
              {REJECTION_REASON_OPTIONS.map((reason) => (
                <label
                  key={reason}
                  className="flex items-start gap-3 bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-3 cursor-pointer hover:bg-red-50/50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedReasons.includes(reason)}
                    onChange={() => toggleReason(reason)}
                    className="mt-0.5 w-4 h-4 accent-red-500 shrink-0"
                  />
                  <span className="text-xs font-semibold text-slate-700">{reason}</span>
                </label>
              ))}
            </div>

            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Additional note (optional)
            </label>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="Add any extra context for this rejection..."
              rows={3}
              className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-red-400 transition-all mb-6 resize-none"
            />

            <div className="flex gap-3">
              <button
                type="button"
                disabled={submittingReject}
                onClick={() => { setIsRejectModalOpen(false); setSelectedReasons([]); setRejectNote(''); }}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingReject}
                onClick={handleConfirmReject}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                <IconX size={14} /> {submittingReject ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function Section({ label, children }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-[9px] font-black uppercase tracking-widest text-black/40 whitespace-nowrap">{label}</span>
        <div className="h-px flex-1 bg-black/5" />
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoCard({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5 bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-3">
      <div className="w-7 h-7 rounded-lg bg-[#EEF2FF] flex items-center justify-center shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest text-black/40 mb-0.5">{label}</p>
        <p className="text-xs font-bold text-slate-800 ">{value || '—'}</p>
      </div>
    </div>
  );
}

export default RootOrgView;