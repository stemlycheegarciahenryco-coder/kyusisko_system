import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { usePendingLeave, confirmLeave, cancelLeave } from './unsavedGuard';

export default function UnsavedChangesModal() {
  const open = usePendingLeave();
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
      onClick={cancelLeave}
    >
      <div
        className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl border border-slate-200 flex flex-col items-center text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 mb-5 border border-amber-100">
          <AlertTriangle size={28} strokeWidth={2.5} />
        </div>
        <h3 className="text-base md:text-lg font-black text-slate-900 uppercase tracking-wide mb-2">
          Unsaved Changes
        </h3>
        <p className="text-slate-600 text-sm md:text-base font-medium leading-relaxed mb-8 px-2">
          You have changes on this page that haven't been saved or submitted. If you leave now, they will be lost.
        </p>
        <div className="flex w-full gap-3">
          <button
            onClick={cancelLeave}
            className="flex-1 py-3.5 bg-[#093fb4] text-white font-bold rounded-xl uppercase text-xs tracking-wider hover:bg-[#07369a] transition-all shadow-md cursor-pointer"
          >
            Stay on page
          </button>
          <button
            onClick={confirmLeave}
            className="flex-1 py-3.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl uppercase text-xs tracking-wider hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all cursor-pointer"
          >
            Leave anyway
          </button>
        </div>
      </div>
    </div>
  );
}