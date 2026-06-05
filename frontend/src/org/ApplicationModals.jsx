import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export function StatusBadge({ status }) {
  const map = {
    pending:      { label: 'Pending',        cls: 'bg-amber-50 text-amber-600 border-amber-200' },
    approved:     { label: 'Approved',        cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    not_eligible: { label: 'Not Eligible',    cls: 'bg-[#FF1E1E]/10 text-[#FF1E1E] border-[#FF1E1E]/20' },
    under_review: { label: 'For Compliance',  cls: 'bg-amber-50 text-amber-600 border-amber-200' },
  };
  const { label, cls } = map[status] || { label: status, cls: 'bg-black/5 text-black/40 border-black/10' };
  return (
    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${cls}`}>
      {label}
    </span>
  );
}

export function ActionConfirmModal({ isOpen, onClose, onConfirm, status }) {
  if (!isOpen) return null;

  const config = {
    approved: {
      title: 'Confirm Approval',
      sub: 'Student will be marked as eligible and notified immediately.',
      icon: <CheckCircle size={30} className="text-[#093fb4]" />,
      iconBg: 'bg-[#093fb4]/10',
      btnCls: 'bg-[#093fb4] hover:bg-[#093fb4]/90',
    },
    under_review: {
      title: 'Send Compliance Notice',
      sub: 'Student will be notified to submit required documents.',
      icon: <Clock size={30} className="text-amber-500" />,
      iconBg: 'bg-amber-50',
      btnCls: 'bg-amber-500 hover:bg-amber-600',
    },
    not_eligible: {
      title: 'Mark Not Eligible',
      sub: 'Student will be informed they do not qualify for this scholarship.',
      icon: <XCircle size={30} className="text-[#FF1E1E]" />,
      iconBg: 'bg-[#FF1E1E]/10',
      btnCls: 'bg-[#FF1E1E] hover:bg-[#FF1E1E]/90',
    },
    terminated: {
      title: 'Terminate Agreement',
      sub: 'This will close the scholarship agreement. This action cannot be undone.',
      icon: <XCircle size={30} className="text-[#FF1E1E]" />,
      iconBg: 'bg-[#FF1E1E]/10',
      btnCls: 'bg-[#FF1E1E] hover:bg-[#FF1E1E]/90',
    },
  };

  const c = config[status] || config.not_eligible;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-[#FFFCFB] rounded-2xl p-8 text-center shadow-2xl">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 ${c.iconBg}`}>
          {c.icon}
        </div>
        <h2 className="text-base font-black text-black uppercase tracking-tight mb-2">{c.title}</h2>
        <p className="text-sm text-black/50 font-medium mb-6 leading-relaxed">{c.sub}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-black/5 text-black font-black uppercase text-[10px] tracking-widest hover:bg-black/10 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition-colors ${c.btnCls}`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export function FeedbackModal({ isOpen, onClose, type, message }) {
  if (!isOpen) return null;
  const isSuccess = type === 'success';
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-[#FFFCFB] rounded-2xl p-8 text-center shadow-2xl">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${isSuccess ? 'bg-emerald-50' : 'bg-[#FF1E1E]/10'}`}>
          {isSuccess
            ? <CheckCircle size={30} className="text-emerald-500" />
            : <XCircle size={30} className="text-[#FF1E1E]" />
          }
        </div>
        <p className="text-sm font-black text-black uppercase tracking-tight mb-5">{message}</p>
        <button
          onClick={onClose}
          className="w-full py-3 bg-[#093fb4] text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-[#093fb4]/90 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export function ComplianceModal({ isOpen, onClose, onSend, mode = 'compliance' }) {
  const [reason, setReason] = useState('');
  const [requiredDocs, setRequiredDocs] = useState('');
  const [sending, setSending] = useState(false);

  const isRenew = mode === 'renew';
  if (!isOpen) return null; 

  const handleSend = async () => {
    if (!reason.trim() || !requiredDocs.trim()) return;
    setSending(true);
    await onSend(reason, requiredDocs);
    setSending(false);
    setReason('');
    setRequiredDocs('');
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#FFFCFB] rounded-2xl shadow-2xl overflow-hidden">

        <div className={`px-6 py-4 flex items-center justify-between ${isRenew ? 'bg-[#093fb4]' : 'bg-amber-500'}`}>
           {/* Dynamic Header */}
           <h2 className="text-sm font-black text-white uppercase tracking-widest">
             {isRenew ? 'Renewal Requirements' : 'Compliance Request'}
           </h2>
        </div>

        <div className="bg-amber-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-white" />
            <h2 className="text-sm font-black text-white uppercase tracking-widest">Compliance Request</h2>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <XCircle size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-[11px] font-black uppercase tracking-widest text-black/50 mb-2 block">
              Reason for Compliance
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Missing grade certificate, Incomplete personal information..."
              rows={3}
              className="w-full bg-black/[0.03] border border-black/10 rounded-xl px-4 py-3 text-sm text-black outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none transition-all"
            />
          </div>
<label className="text-[11px] font-black uppercase tracking-widest text-black/50 mb-2 block">
           {isRenew ? 'Reason for Renewal' : 'Reason for Compliance'}
        </label>
          <div>
            <label className="text-[11px] font-black uppercase tracking-widest text-black/50 mb-1 block">
              Required Documents
            </label>
            <p className="text-[10px] text-black/40 font-medium mb-2">
              List each document on a new line or separated by commas — each becomes a separate upload field for the student.
            </p>
            <textarea
              value={requiredDocs}
              onChange={(e) => setRequiredDocs(e.target.value)}
              placeholder={`Updated Grade Report (PDF)\nBirth Certificate\nCertificate of Enrollment`}
              rows={4}
              className="w-full bg-black/[0.03] border border-black/10 rounded-xl px-4 py-3 text-sm text-black outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none transition-all font-mono"
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <p className="text-[11px] font-bold text-amber-700 leading-relaxed">
              The student will be notified and each document listed above becomes a separate upload field in their My Scholarships page.
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-black/5 text-black rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-black/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !reason.trim() || !requiredDocs.trim()}
              className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {sending ? <Clock size={14} className="animate-spin" /> : <Clock size={14} />}
              Send Notice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}