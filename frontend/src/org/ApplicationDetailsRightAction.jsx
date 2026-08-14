import React, { useMemo } from 'react';
import { CheckCircle2, AlertCircle, Clock, XCircle, Calendar, RefreshCw } from 'lucide-react';

export default function ApplicationDetailsRightAction({ 
  detail, 
  setConfirmModal, 
  setComplianceModal, 
  isPending, 
  isUnderReview, 
  isFinalized, 
  handleAction 
}) {
  
  const status = detail?.status || 'pending';

  // Helper to format timestamps dynamically
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Date unavailable';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Date unavailable';

    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
    const formattedTime = date.toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: true,
    });

    return `${formattedDate} — ${formattedTime}`;
  };

  // State Banner Stylings
  const getStatusBanner = () => {
    switch(status) {
      case 'approved':
      case 'active':
        return { bg: 'bg-emerald-50/60 border border-emerald-100', icon: <CheckCircle2 size={22} className="text-emerald-600 shrink-0" />, title: 'APPROVED / ACTIVE', sub: 'Student is eligible for the scholarship.' };
      case 'submitted':
        return { bg: 'bg-blue-50/60 border border-blue-100', icon: <RefreshCw size={22} className="text-blue-600 shrink-0 animate-pulse" />, title: 'RENEWAL SUBMITTED', sub: 'Student has submitted documents for renewal review.' };
      case 'renewing':
        return { bg: 'bg-purple-50/60 border border-purple-100', icon: <Clock size={22} className="text-purple-600 shrink-0" />, title: 'UNDER RENEWAL REVIEW', sub: 'Renewal requirements are currently being evaluated.' };
      case 'under_review':
      case 'compliance':
      case 'need_changes':
        return { bg: 'bg-amber-50/60 border border-amber-100', icon: <Clock size={22} className="text-amber-600 shrink-0" />, title: 'UNDER COMPLIANCE', sub: 'Awaiting requested student uploads.' };
      case 'not_eligible':
      case 'terminated':
      case 'rejected':
        return { bg: 'bg-red-50/60 border border-red-100', icon: <XCircle size={22} className="text-red-600 shrink-0" />, title: 'NOT ELIGIBLE / TERMINATED', sub: 'Application has been turned down or scholar terminated.' };
      default:
        return { bg: 'bg-slate-50 border border-slate-200', icon: <AlertCircle size={22} className="text-slate-500 shrink-0" />, title: 'PENDING EVALUATION', sub: 'Awaiting primary compliance review.' };
    }
  };

  const banner = getStatusBanner();
  const isRenewalFlow = ['submitted', 'renewing'].includes(status);
  const isActionable = ['pending', 'under_review', 'compliance', 'need_changes', 'submitted', 'renewing'].includes(status);

  // ==========================================
  // BUILD DYNAMIC TIMELINE EVENTS
  // ==========================================
  const timelineEvents = useMemo(() => {
    if (!detail) return [];
    const events = [];

    // 1. Initial Submission
    if (detail.submitted_at) {
      events.push({
        id: 'submitted',
        title: isRenewalFlow ? 'Renewal Requested' : 'Application Submitted',
        date: detail.submitted_at,
        color: 'bg-slate-400 ring-white'
      });
    }

    // 2. Compliance History (Loops through all compliance requests)
    if (detail.compliance_history && detail.compliance_history.length > 0) {
      detail.compliance_history.forEach((req, idx) => {
        // Add the request event
        events.push({
          id: `compliance-req-${req.id || idx}`,
          title: 'Compliance Requested',
          date: req.created_at,
          color: 'bg-amber-400 ring-white'
        });

        // If compliance was submitted back by the student
        if (req.status === 'submitted' && req.updated_at) {
          events.push({
            id: `compliance-sub-${req.id || idx}`,
            title: 'Compliance Uploaded',
            date: req.updated_at,
            color: 'bg-blue-400 ring-white'
          });
        }
      });
    }

    // 3. Final/Current Status (Only add if it's a concluding status like approved/rejected)
    const finalStatuses = ['approved', 'active', 'not_eligible', 'terminated', 'rejected'];
    if (finalStatuses.includes(status)) {
      events.push({
        id: 'final-status',
        title: status.replace('_', ' '),
        date: detail.updated_at || new Date().toISOString(), // Fallback to current time if updated_at is missing
        color: ['approved', 'active'].includes(status) ? 'bg-emerald-500 ring-emerald-100' : 'bg-red-500 ring-red-100'
      });
    }

    // Sort chronologically (oldest to newest)
    return events.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [detail, status, isRenewalFlow]);


  const lastActivityDate = formatDate(
    timelineEvents.length > 0 ? timelineEvents[timelineEvents.length - 1].date : detail?.submitted_at
  );

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

        {/* DYNAMIC VERTICAL TIMELINE STACK TRACK */}
        <div className="relative pl-6 space-y-4 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
          
          {timelineEvents.map((event, index) => (
            <div key={event.id} className="relative text-xs">
              <div className={`absolute -left-[20px] top-1 w-2.5 h-2.5 rounded-full ring-4 ${event.color}`} />
              <p className="font-bold text-slate-700 capitalize">{event.title}</p>
              <p className="text-slate-400 font-medium mt-0.5">
                {formatDate(event.date)}
              </p>
            </div>
          ))}

          {/* Fallback if somehow there are no events */}
          {timelineEvents.length === 0 && (
             <p className="text-xs text-slate-400 italic">No timeline history available.</p>
          )}

        </div>

        {/* ACTIONS BUTTON SET SEPARATED */}
        <div className="pt-2 space-y-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Actions</p>
          
          {isActionable ? (
            <>
              <button onClick={() => setConfirmModal({ open: true, status: 'approved' })} className="w-full bg-[#093fb4] hover:bg-[#093fb4]/90 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-xs transition-colors shadow-sm cursor-pointer">
                ✓ {isRenewalFlow ? 'Approve Renewal' : 'Approve Application'}
              </button>
              
              <button onClick={() => setComplianceModal(true)} className="w-full bg-white text-amber-600 hover:bg-amber-50 border border-amber-200 font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-xs transition-colors cursor-pointer">
                ⟳ Send for Compliance
              </button>

              <button onClick={() => setConfirmModal({ open: true, status: isRenewalFlow ? 'terminated' : 'not_eligible' })} className="w-full bg-white text-red-500 hover:bg-red-50 border border-red-200 font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-xs transition-colors cursor-pointer">
                ✕ {isRenewalFlow ? 'Terminate Scholar' : 'Mark Not Eligible'}
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
          <p className="font-semibold text-slate-700">{lastActivityDate}</p>
          <p className="text-slate-500 font-medium">Application state verified internally</p>
        </div>

      </div>
    </div>
  );
}