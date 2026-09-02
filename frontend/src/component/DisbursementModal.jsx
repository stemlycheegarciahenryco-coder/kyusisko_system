import React, { useState } from 'react';
import { X, Banknote, Loader2 } from 'lucide-react';

// Modal used from OrgApplicants.jsx — clicking the heart/fund icon on an
// approved/active applicant opens this to log a new disbursement.
export default function DisbursementModal({ isOpen, app, remainingBudget, onClose, onSubmit }) {
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !app) return null;

  const numericAmount = Number(amount);
  const overBudget = remainingBudget != null && numericAmount > remainingBudget;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!numericAmount || numericAmount <= 0) {
      setError('Enter a valid amount greater than 0.');
      return;
    }
    if (overBudget) {
      setError(`Amount exceeds the remaining program budget (₱${remainingBudget.toLocaleString()}).`);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({ amount_range: numericAmount, remarks });
      setAmount('');
      setRemarks('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to record disbursement.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl border border-slate-300 shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Banknote size={16} className="text-[#093fb4]" />
            <h2 className="text-sm font-black uppercase tracking-widest text-black">
              Give Funds
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-black transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Recipient</p>
            <p className="text-sm font-black text-black uppercase tracking-tight">
              {app.sfirst_name} {app.slast_name}
            </p>
          </div>

          {remainingBudget != null && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Remaining Program Budget</p>
              <p className="text-sm font-black text-[#093fb4]">₱{Number(remainingBudget).toLocaleString()}</p>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1.5">
              Amount To Give (Per-Student)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₱</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-black focus:border-[#093fb4] focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1.5">
              Remarks (Optional)
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={2}
              placeholder="e.g. 1st semester release"
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-black focus:border-[#093fb4] focus:outline-none transition-all resize-none"
            />
          </div>

          {error && (
            <p className="text-[11px] font-bold text-[#FF1E1E] bg-[#FF1E1E]/10 border border-[#FF1E1E]/30 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:border-slate-400 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl bg-[#093fb4] text-white hover:bg-[#0730a0] transition-colors disabled:opacity-60"
            >
              {submitting && <Loader2 size={12} className="animate-spin" />}
              Confirm Disbursement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}