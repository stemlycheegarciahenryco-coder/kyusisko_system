import React, { useState } from 'react';
import { X, Banknote, Loader2, UploadCloud } from 'lucide-react';

export default function DisbursementModal({ isOpen, app, remainingBudget, onClose, onSubmit }) {
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [mode, setMode] = useState('Bank Transfer');
  const [receipt, setReceipt] = useState(null);
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
      // Use FormData to support file uploads
      const formData = new FormData();
      formData.append('amount_range', numericAmount);
      formData.append('remarks', remarks);
      formData.append('mode', mode);
      if (receipt) formData.append('receipt', receipt);

      await onSubmit(formData);
      
      setAmount('');
      setRemarks('');
      setMode('Bank Transfer');
      setReceipt(null);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to record disbursement.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl border border-slate-300 shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Banknote size={16} className="text-[#093fb4]" />
            <h2 className="text-sm font-black uppercase tracking-widest text-black">Give Funds</h2>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1.5">Amount To Give</label>
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
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1.5">Mode of Disburse</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-black focus:border-[#093fb4] focus:outline-none transition-all"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="School Direct">School Direct</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1.5">Upload Receipt / Proof (Optional)</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors w-full">
                <UploadCloud size={16} className="text-slate-500" />
                <span className="text-xs font-bold text-slate-600">
                  {receipt ? receipt.name : 'Choose file...'}
                </span>
                <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setReceipt(e.target.files[0])} />
              </label>
              {receipt && (
                <button type="button" onClick={() => setReceipt(null)} className="p-2.5 text-rose-500 bg-rose-50 rounded-xl hover:bg-rose-100">
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1.5">Remarks (Optional)</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={2}
              placeholder="e.g. 1st semester release"
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-black focus:border-[#093fb4] focus:outline-none transition-all resize-none"
            />
          </div>

          {error && <p className="text-[11px] font-bold text-[#FF1E1E] bg-[#FF1E1E]/10 border border-[#FF1E1E]/30 rounded-xl px-3 py-2">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:border-slate-400">Cancel</button>
            <button type="submit" disabled={submitting} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl bg-[#093fb4] text-white hover:bg-[#0730a0] disabled:opacity-60">
              {submitting && <Loader2 size={12} className="animate-spin" />} Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}