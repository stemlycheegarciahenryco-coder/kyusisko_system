import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingScreen({ isLoading, text = "Loading..." }) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center transition-all duration-300">
      <div className="bg-white p-8 w-40 h-40 rounded-3xl shadow-2xl flex flex-col items-center justify-center gap-4 border border-slate-100 animate-in fade-in zoom-in duration-300">
        <Loader2 className="animate-spin text-[#5C5CFF]" size={46} strokeWidth={2.5} />
        <p className="text-slate-600 font-medium text-sm">{text}</p>
      </div>
    </div>
  );
}