import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export function StatusBadge({ status }) {
  const map = {
    pending:      { label: 'Pending',        cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    approved:     { label: 'Approved',        cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    not_eligible: { label: 'Not Eligible',    cls: 'bg-red-50 text-red-700 border-red-200' },
    under_review: { label: 'For Compliance',  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  };
  const { label, cls } = map[status] || { label: status, cls: 'bg-slate-50 text-slate-600 border-slate-200' };
  return (
    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${cls}`}>
      {label}
    </span>
  );
}

export function ActionConfirmModal({ isOpen, onClose, onConfirm, status }) {
  if (!isOpen) return null;

  const config = {
    approved: {
      title: 'Confirm Approval',
      sub: 'The student applicant will be officially marked as eligible and notified immediately.',
      icon: <CheckCircle size={28} className="text-[#093fb4]" />,
      iconBg: 'bg-blue-50 border border-blue-100',
      btnCls: 'bg-[#093fb4] hover:bg-[#093fb4]/90 text-white',
    },
    under_review: {
      title: 'Request Compliance Notice',
      sub: 'The student will be prompted to supply additional required configurations and records.',
      icon: <Clock size={28} className="text-amber-600" />,
      iconBg: 'bg-amber-50 border border-amber-100',
      btnCls: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
    not_eligible: {
      title: 'Mark as Not Eligible',
      sub: 'This actions logs that the student does not qualify under the current program guidelines.',
      icon: <XCircle size={28} className="text-red-600" />,
      iconBg: 'bg-red-50 border border-red-100',
      btnCls: 'bg-red-600 hover:bg-red-700 text-white',
    },
    terminated: {
      title: 'Terminate Scholarship',
      sub: 'This closes the active agreement setup. This structural action cannot be reverted.',
      icon: <XCircle size={28} className="text-red-600" />,
      iconBg: 'bg-red-50 border border-red-100',
      btnCls: 'bg-red-600 hover:bg-red-700 text-white',
    },
  };

  const c = config[status] || config.not_eligible;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white rounded-xl p-6 text-center shadow-xl border border-slate-100">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${c.iconBg}`}>
          {c.icon}
        </div>
        <h2 className="text-base font-bold text-slate-800 uppercase tracking-wide mb-1.5">{c.title}</h2>
        <p className="text-sm text-slate-500 font-medium mb-5 leading-relaxed">{c.sub}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-colors ${c.btnCls}`}
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
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white rounded-xl p-6 text-center shadow-xl border border-slate-100">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${isSuccess ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'}`}>
          {isSuccess ? <CheckCircle size={28} className="text-emerald-600" /> : <XCircle size={28} className="text-red-600" />}
        </div>
        <p className="text-sm font-semibold text-slate-800 mb-5">{message}</p>
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-[#093fb4] text-white rounded-lg font-semibold text-sm hover:bg-[#093fb4]/90 transition-colors shadow-sm"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export function ComplianceModal({ isOpen, onClose, onSend, mode = 'compliance' }) {
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [otherDoc, setOtherDoc] = useState('');

  const isRenew = mode === 'renew';
  if (!isOpen) return null; 

  const commonDocuments = [
    "Updated Grade Report (PDF)",
    "Certificate of Enrollment",
    "Valid ID / School ID",
    "Birth Certificate",
    "Certificate of Indigency"
  ];

  const isAllSelected = selectedDocs.length === commonDocuments.length;

  const handleSelectAllToggle = () => {
    if (isAllSelected) {
      setSelectedDocs([]);
    } else {
      setSelectedDocs([...commonDocuments]);
    }
  };

  const handleCheckboxChange = (doc) => {
    setSelectedDocs(prev => prev.includes(doc) ? prev.filter(item => item !== doc) : [...prev, doc]);
  };

  const handleSend = async () => {
    const finalDocsList = [...selectedDocs];
    if (otherDoc.trim()) finalDocsList.push(otherDoc.trim());

    const requiredDocsString = finalDocsList.join('\n');
    if (!reason.trim() || !requiredDocsString) return;
    
    setSending(true);
    await onSend(reason, requiredDocsString);
    setSending(false);
    
    setReason('');
    setSelectedDocs([]);
    setOtherDoc('');
  };

  const hasRequirements = selectedDocs.length > 0 || otherDoc.trim().length > 0;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden border border-slate-100">

        <div className={`px-6 py-4 flex items-center justify-between text-white ${isRenew ? 'bg-[#093fb4]' : 'bg-amber-600'}`}>
          <div className="flex items-center gap-2">
            <Clock size={16} />
            <h2 className="text-sm font-semibold uppercase tracking-wider">
              {isRenew ? 'Renewal Requirements' : 'Compliance Request'}
            </h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <XCircle size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
              {isRenew ? 'Reason for Renewal' : 'Reason for Compliance'}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide clean instructions on what needs updating..."
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#093fb4] resize-none transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Select Required Documents
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAllToggle}
                  className="w-3.5 h-3.5 rounded text-[#093fb4] focus:ring-[#093fb4] cursor-pointer"
                />
                <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Select All</span>
              </label>
            </div>

            <div className="space-y-1.5 mb-3">
              {commonDocuments.map((doc) => (
                <label key={doc} className="flex items-center gap-3 p-2 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedDocs.includes(doc)}
                    onChange={() => handleCheckboxChange(doc)}
                    className="w-4 h-4 rounded text-[#093fb4] focus:ring-[#093fb4] cursor-pointer"
                  />
                  <span className="text-sm font-medium text-slate-700">{doc}</span>
                </label>
              ))}
            </div>

            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 block">
              Other Requirement (Optional)
            </label>
            <input
              type="text"
              value={otherDoc}
              onChange={(e) => setOtherDoc(e.target.value)}
              placeholder="Enter custom requirement line item..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#093fb4] transition-all"
            />
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5">
            <p className="text-xs font-medium text-slate-500 leading-normal">
              Note: Explicit reasons and requirement listings guide transparent evaluation workflows.
            </p>
          </div>

          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-semibold text-sm hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !reason.trim() || !hasRequirements}
              className="flex-1 py-2.5 bg-[#093fb4] hover:bg-[#093fb4]/90 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-40 flex items-center justify-center gap-2 shadow-sm"
            >
              {sending ? <Clock size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              Send Notice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}