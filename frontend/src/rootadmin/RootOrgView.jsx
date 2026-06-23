import React, { useState } from 'react';
import {
  IconCheck, IconX, IconLock, IconLockOpen, IconFileText,
  IconMail, IconPhone, IconMapPin, IconWorld, IconBuilding,
  IconUser, IconExternalLink, IconAlertCircle, IconRefresh, IconPlus, IconTrash, IconSend
} from '@tabler/icons-react';
import api from '../api';
import Swal from 'sweetalert2';

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

  const isPending  = org.status === 'pending';
  const isApproved = org.status === 'approved';
  const isRejected = org.status === 'rejected';
  const isResubmitted = isPending && org.rejection_reason;

  const proofData = (() => {
    try { return org.proof_files ? JSON.parse(org.proof_files) : {}; }
    catch { return {}; }
  })();

  const allFiles = [
    ...(proofData.proof_files || []),
    ...(proofData.sec_files   || []),
    ...(proofData.valid_ids   || []),
  ];

  const statusColor = isApproved ? '#22c55e' : isRejected ? colors.red : '#f59e0b';
  const statusLabel = isApproved ? 'Approved' : isRejected ? 'Rejected' : isResubmitted ? 'Updated & Pending' : 'Pending Review';

  // Add requirement item to checklist field state
  const handleAddField = () => {
    if (newField.trim()) {
      if (reqFields.includes(newField.trim())) {
        return Swal.fire('Notice', 'This requirement title is already in your checklist.', 'info');
      }
      setReqFields([...reqFields, newField.trim()]);
      setNewField('');
    }
  };

  // Remove individual text requirements
  const handleRemoveField = (fieldToRemove) => {
    setReqFields(reqFields.filter(f => f !== fieldToRemove));
  };

  // Handle Forwarding Requirement guidelines to Org via JSON payload
  const handleSendRequirements = async (e) => {
    e.preventDefault();
    if (reqFields.length === 0) {
      return Swal.fire('Error', 'Please include at least one document requirement title to send.', 'error');
    }

    try {
      setSendingReqs(true);
      
      // Changed to clean JSON payload instead of FormData
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
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to submit dynamic required fields data.', 'error');
    } finally {
      setSendingReqs(false);
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
                <p className="text-xs font-semibold text-amber-900 mb-2">This provider updated their documents after being rejected.</p>
                <div className="bg-white/60 rounded-xl p-2.5 border border-amber-100">
                  <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wide mb-0.5">Previous Rejection Reason:</p>
                  <p className="text-xs font-medium text-slate-700 italic">"{org.rejection_reason}"</p>
                </div>
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

          {/* ADMIN ACTION: Request Specific Requirement Upload Fields Section */}
          {isPending && (
            <Section label="Specify Compliance Upload Fields">
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-4">
                <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
                  Enter the specific document names you expect this provider to fulfill. These titles will be assigned to their onboarding field profile.
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
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-black text-[10px] uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  {sendingReqs ? 'Sending Fields...' : <><IconSend size={14} /> Assign & Request Requirements</>}
                </button>
              </div>
            </Section>
          )}

          {/* Contact person */}
          <Section label="Contact person">
            <div className="grid grid-cols-2 gap-3">
              <InfoCard icon={<IconUser size={14} className="text-[#093fb4]" />} label="Full name"
                value={`${org.first_name || ''} ${org.middle_name || ''} ${org.last_name || ''}`.trim()} />
              <InfoCard icon={<IconMail size={14} className="text-[#093fb4]" />} label="Email" value={org.sub_email} />
              <InfoCard icon={<IconPhone size={14} className="text-[#093fb4]" />} label="Contact number"
                value={org.contact_number ? `+63 ${org.contact_number}` : '—'} />
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

          {/* Documents */}
          <Section label={`Uploaded documents (${allFiles.length})`}>
            {allFiles.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {allFiles.map((path, idx) => {
                  const fileName = path.split('/').pop() || `Document ${idx + 1}`;
                  const ext = fileName.split('.').pop()?.toUpperCase() || 'FILE';
                  return (
                    <a
                      key={idx}
                      href={`http://localhost:5000/${path}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-3 hover:bg-[#EEF2FF] hover:border-[#093fb4]/20 transition-all group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#093fb4] flex items-center justify-center shrink-0">
                        <IconFileText size={14} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black text-slate-800 truncate">{fileName}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">{ext} File</p>
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
          {isPending && (
            <div className="flex gap-3">
              <button
                onClick={() => onApprove(org)}
                className="flex-1 py-3 bg-[#093fb4] hover:bg-[#093fb4]/90 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-md shadow-blue-900/10"
              >
                <IconCheck size={16} /> {isResubmitted ? "Approve Resubmission" : "Approve Provider"}
              </button>
              <button
                onClick={() => onReject(org)}
                className="px-5 py-3 bg-red-50 hover:bg-red-100 text-red-500 border border-red-100 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              >
                <IconX size={16} /> Reject Again
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