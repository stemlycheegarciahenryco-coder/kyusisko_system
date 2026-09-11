import React from 'react';
import { CheckCircle2, XCircle, Info, Check, Trash2 } from 'lucide-react';

export default function NotifCard({ notif, onRead, onDelete, onClick }) {
  const title = notif.title?.toLowerCase() || '';
  const config =
    title.includes('approved') || title.includes('released')
      ? { icon: <CheckCircle2 size={18} />, bg: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-200' }
      : title.includes('rejected') || title.includes('not eligible') || title.includes('taken down')
      ? { icon: <XCircle size={18} />, bg: 'bg-red-50 text-[#FF1E1E]', border: 'border-red-200' }
      : { icon: <Info size={18} />, bg: 'bg-blue-50 text-[#093fb4]', border: 'border-blue-200' };

  return (
    <div className={`p-3.5 rounded-xl flex gap-3.5 border transition-all ${!notif.is_read ? 'bg-slate-50 border-slate-200 shadow-sm' : 'border-transparent hover:bg-slate-100/70'}`}>
      
      {/* Icon Area */}
      <div className={`w-10 h-10 rounded-xl ${config.bg} border ${config.border} flex items-center justify-center shrink-0`}>
        {config.icon}
      </div>
      
      {/* Clickable Text Area */}
      <div 
        className="min-w-0 flex-1 cursor-pointer"
        onClick={() => onClick(notif)}
      >
        <h4 className="text-sm font-black text-slate-900 leading-tight mb-1">{notif.title}</h4>
        <p className={`text-xs leading-relaxed break-words whitespace-normal ${!notif.is_read ? 'text-slate-800 font-bold' : 'text-slate-600 font-semibold'}`}>
          {notif.message}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 shrink-0 items-center justify-center border-l border-slate-200 pl-2">
        {!notif.is_read && (
          <button 
            onClick={(e) => { e.stopPropagation(); onRead(notif.id); }} 
            className="text-blue-600 hover:text-blue-800 p-1 rounded-md hover:bg-blue-50 transition-colors" 
            title="Mark as read"
          >
            <Check size={16} strokeWidth={3} />
          </button>
        )}
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(notif.id); }} 
          className="text-slate-400 hover:text-[#FF1E1E] p-1 rounded-md hover:bg-red-50 transition-colors" 
          title="Delete notification"
        >
          <Trash2 size={16} />
        </button>
      </div>
      
    </div>
  );
}