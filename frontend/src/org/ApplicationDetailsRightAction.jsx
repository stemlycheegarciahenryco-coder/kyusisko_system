import React from 'react';
import { CheckCircle2, AlertCircle, Clock, XCircle, Calendar, ShieldCheck } from 'lucide-react';

export default function ApplicationDetailsRightAction({ 
  detail, 
  setConfirmModal, 
  setComplianceModal, 
  isPending, 
  isUnderReview, 
  isFinalized, 
  handleAction 
}) {
  const status = detail.status || 'pending';

  // State Banner Stylings matching image_81799d.jpg
  const getStatusBanner = () => {
    switch(status) {
      case 'approved':
      case 'active':
        return {
          bg: 'bg-emerald-50/60 border border-emerald-100',
          icon: <CheckCircle2 size={22} className="text-emerald-600 shrink-0" />,
          title: 'APPROVED',
          sub: 'Student is eligible for the scholarship.'
        };
      case 'under_review':
        return {
          bg: 'bg-amber-50/60 border border-amber-100',
          icon: <Clock size={22} className="text-amber-600 shrink-0" />,
          title: 'UNDER COMPLIANCE',
          sub: 'Awaiting requested student uploads.'
        };
      case 'not_eligible':
      case 'terminated':
        return {
          bg: 'bg-red-50/60 border border-red-100',
          icon: <XCircle size={22} className="text-red-600 shrink-0" />,
          title: 'NOT ELIGIBLE',
          sub: 'Application has been turned down.'
        };
      default:
        return {
          bg: 'bg-slate-50 border border-slate-200',
          icon: <AlertCircle size={22} className="text-slate-500 shrink-0" />,
          title: 'PENDING EVALUATION',
          sub: 'Awaiting primary compliance review.'
        };
    }
  };

  const banner = getStatusBanner();

  // Mock timeline generation matching image_81799d.jpg dates structure
  const trackingTime = detail.submitted_at || detail.created_at || new Date().toISOString();

  return (
    <div className="space-y-4 lg:sticky lg:top-6 w-full">
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-5">
        
        {/* HEADER */}
        <div className="flex items-center gap-2 pb-1 border-b border-slate-100 text-slate-500 font-bold text-xs uppercase tracking-wider">
          <Clock size={14} />
          <span>Application Status</span>
        </div>

        {/* HIGH VISIBILITY STATUS ALERT BLOCK */}
        <div className={`rounded-xl p-4 flex items-center gap-3.5 ${banner.bg}`}>
          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
            {banner.icon}
          </div>
          <div>
            <h4 className="text-sm font-black tracking-wider text-slate-800">{banner.title}</h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{banner.sub}</p>
          </div>
        </div>

        {/* VERTICAL TIMELINE STACK TRACK */}
        <div className="relative pl-6 space-y-4 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
          
          {/* Node 1: Submitted */}
          <div className="relative text-xs">
            <div className="absolute -left-[20px] top-1 w-2.5 h-2.5 rounded-full bg-slate-400 ring-4 ring-white" />
            <p className="font-bold text-slate-700">Submitted</p>
            <p className="text-slate-400 font-medium mt-0.5">July 5, 2026 — 05:12 AM</p>
          </div>

          {/* Node 2: Under Review */}
          <div className="relative text-xs">
            <div className={`absolute -left-[20px] top-1 w-2.5 h-2.5 rounded-full ring-4 ring-white ${status !== 'pending' ? 'bg-slate-400' : 'bg-slate-300'}`} />
            <p className="font-bold text-slate-700">Under Review</p>
            <p className="text-slate-400 font-medium mt-0.5">July 7, 2026 — 10:45 AM</p>
          </div>

          {/* Node 3: Current State */}
          <div className="relative text-xs">
            <div className={`absolute -left-[20px] top-1 w-2.5 h-2.5 rounded-full ring-4 ring-white ${
              status === 'approved' ? 'bg-emerald-500 ring-emerald-100' : status === 'not_eligible' ? 'bg-red-500 ring-red-100' : 'bg-slate-300'
            }`} />
            <p className="font-bold text-slate-700 capitalize">{status.replace('_', ' ')}</p>
            <p className="text-slate-400 font-medium mt-0.5">July 9, 2026 — 02:19 PM</p>
          </div>

        </div>

        {/* ACTIONS BUTTON SET SEPARATED */}
        <div className="pt-2 space-y-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Actions</p>
          
          {status === 'pending' || status === 'under_review' ? (
            <>
              <button
                onClick={() => setConfirmModal({ open: true, status: 'approved' })}
                className="w-full bg-[#093fb4] hover:bg-[#093fb4]/90 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-xs transition-colors shadow-sm"
              >
                ✓ Approve Application
              </button>
              
              <button
                onClick={() => setComplianceModal(true)}
                className="w-full bg-white text-amber-600 hover:bg-amber-50 border border-amber-200 font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-xs transition-colors"
              >
                ⟳ Send for Compliance
              </button>

              <button
                onClick={() => setConfirmModal({ open: true, status: 'not_eligible' })}
                className="w-full bg-white text-red-500 hover:bg-red-50 border border-red-200 font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-xs transition-colors"
              >
                ✕ Mark Not Eligible
              </button>
            </>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center text-xs font-semibold text-slate-500">
              Flow completed. No further workflow actions required.
            </div>
          )}
        </div>

        {/* LAST METADATA COMPONENT BLOCK */}
        <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-1 bg-slate-50/50 -mx-5 -mb-5 p-4 rounded-b-xl border-t">
          <div className="flex items-center gap-1 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            <Calendar size={12} />
            <span>Last Activity</span>
          </div>
          <p className="font-semibold text-slate-700">July 9, 2026 — 02:20 PM</p>
          <p className="text-slate-500 font-medium">Application state verified internally by <span className="text-[#093fb4] font-semibold">Admin User</span></p>
        </div>

      </div>
    </div>
  );
}