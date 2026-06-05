import React from 'react';
import { CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';

export default function ApplicationDetailsRightAction({ 
    detail, 
    setConfirmModal, 
    setComplianceModal, 
    isPending, 
    isUnderReview, 
    isFinalized, 
    handleAction 
}) {
    // Logic for Renewal states
    const isRenewal = detail.status === 'renewing' || detail.status === 'submitted' || detail.status === 'active' || detail.status === 'terminated';
const isRenewalSubmitted = detail.status === 'submitted';
const isRenewalPending = detail.status === 'renewing'; // org sent request, waiting for student
const isTerminated = detail.status === 'terminated';
const isRenewalApproved = detail.status === 'active';

    return (
        <div className="space-y-5">
            <div className="bg-[#FFFCFB] rounded-2xl border border-black/8 px-6 py-5 lg:sticky lg:top-6">
                <p className="text-[11px] font-black uppercase tracking-widest text-black/40 mb-5">
                    {isRenewal ? 'Renewal Management' : 'Application Action'}
                </p>

                {/* --- RENEWAL FLOW --- */}
                {isRenewal ? (
    <div className="space-y-3">
        {/* Student hasn't uploaded yet */}
        {isRenewalPending && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 flex items-center justify-center gap-2">
                    <Clock size={12}/> Awaiting Student Upload
                </p>
                <p className="text-xs text-amber-500 mt-1 font-medium">Student has been notified to submit renewal documents</p>
            </div>
        )}

        {/* Student submitted — show action buttons */}
        {isRenewalSubmitted && (
            <>
                <div className="bg-[#093fb4]/5 border border-[#093fb4]/10 rounded-xl px-4 py-3 text-center mb-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#093fb4]">
                        Student has submitted renewal documents
                    </p>
                </div>
                <button
                    onClick={() => handleAction('approve')}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-[#FFFCFB] font-black py-4 rounded-xl flex items-center justify-center gap-2 uppercase text-[11px] tracking-widest transition-colors"
                >
                    <CheckCircle size={16} /> Approve Renewal
                </button>
                <button
                    onClick={() => handleAction('terminate')}
                    className="w-full bg-[#FF1E1E]/5 hover:bg-[#FF1E1E]/10 text-[#FF1E1E] border border-[#FF1E1E]/20 font-black py-4 rounded-xl flex items-center justify-center gap-2 uppercase text-[11px] tracking-widest transition-colors"
                >
                    <XCircle size={16} /> Terminate
                </button>
            </>
        )}

        {/* Also allow terminate even while waiting */}
        {isRenewalPending && (
            <button
                onClick={() => handleAction('terminate')}
                className="w-full bg-[#FF1E1E]/5 hover:bg-[#FF1E1E]/10 text-[#FF1E1E] border border-[#FF1E1E]/20 font-black py-4 rounded-xl flex items-center justify-center gap-2 uppercase text-[11px] tracking-widest transition-colors"
            >
                <XCircle size={16} /> Terminate
            </button>
        )}

        {/* Finalized renewal states */}
        {(isTerminated || isRenewalApproved) && (
            <div className={`rounded-xl px-4 py-5 text-center border ${
                isRenewalApproved ? 'bg-emerald-50 border-emerald-200' : 'bg-[#FF1E1E]/5 border-[#FF1E1E]/20'
            }`}>
                <p className={`text-xs font-black uppercase tracking-widest ${
                    isRenewalApproved ? 'text-emerald-600' : 'text-[#FF1E1E]'
                }`}>
                    {isRenewalApproved ? '✓ Renewal Approved' : '✕ Scholarship Terminated'}
                </p>
            </div>
        )}
    </div>
) : (
                    /* --- STANDARD APPLICATION ACTIONS --- */
                    <div className="space-y-3">
                        {isPending && (
                            <>
                                <button
                                    onClick={() => setConfirmModal({ open: true, status: 'approved' })}
                                    className="w-full bg-[#093fb4] hover:bg-[#093fb4]/90 text-[#FFFCFB] font-black py-4 rounded-xl flex items-center justify-center gap-2 uppercase text-[11px] tracking-widest transition-colors"
                                >
                                    <CheckCircle size={16} /> Approve
                                </button>
                                <button
                                    onClick={() => setComplianceModal(true)}
                                    className="w-full bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200 font-black py-4 rounded-xl flex items-center justify-center gap-2 uppercase text-[11px] tracking-widest transition-colors"
                                >
                                    <Clock size={16} /> For Compliance
                                </button>
                                <button
                                    onClick={() => setConfirmModal({ open: true, status: 'not_eligible' })}
                                    className="w-full bg-black/[0.03] hover:bg-[#FF1E1E]/5 text-black/40 hover:text-[#FF1E1E] border border-black/10 hover:border-[#FF1E1E]/20 font-black py-4 rounded-xl flex items-center justify-center gap-2 uppercase text-[11px] tracking-widest transition-colors"
                                >
                                    <XCircle size={16} /> Not Eligible
                                </button>
                            </>
                        )}

                        {isUnderReview && (
                            <>
                                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Awaiting Student Compliance</p>
                                    <p className="text-xs text-amber-500 mt-1 font-medium">Student notified to submit documents</p>
                                </div>
                                <button
                                    onClick={() => setConfirmModal({ open: true, status: 'approved' })}
                                    className="w-full bg-[#093fb4] hover:bg-[#093fb4]/90 text-[#FFFCFB] font-black py-4 rounded-xl flex items-center justify-center gap-2 uppercase text-[11px] tracking-widest transition-colors"
                                >
                                    <CheckCircle size={16} /> Approve
                                </button>
                                <button
                                    onClick={() => setConfirmModal({ open: true, status: 'not_eligible' })}
                                    className="w-full bg-black/[0.03] hover:bg-[#FF1E1E]/5 text-black/40 hover:text-[#FF1E1E] border border-black/10 hover:border-[#FF1E1E]/20 font-black py-4 rounded-xl flex items-center justify-center gap-2 uppercase text-[11px] tracking-widest transition-colors"
                                >
                                    <XCircle size={16} /> Not Eligible
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* Status Display for Finalized Items */}
                {isFinalized && (
                    <div className={`mt-3 rounded-xl px-4 py-5 text-center border ${
                        detail.status === 'approved' || detail.status === 'renewed' 
                            ? 'bg-emerald-50 border-emerald-200' 
                            : 'bg-[#FF1E1E]/5 border-[#FF1E1E]/20'
                    }`}>
                        <p className={`text-xs font-black uppercase tracking-widest ${
                            detail.status === 'approved' || detail.status === 'renewed' 
                                ? 'text-emerald-600' 
                                : 'text-[#FF1E1E]'
                        }`}>
                            {detail.status === 'approved' || detail.status === 'renewed' 
                                ? '✓ Renewal Approved' 
                                : detail.status === 'terminated' 
                                    ? '✕ Scholarship Terminated' 
                                    : '✕ Marked as Not Eligible'}
                        </p>
                    </div>
                )}

                <div className="mt-5 pt-4 border-t border-black/5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-black/20 text-center">
                        Last Activity: {new Date(detail.updated_at || detail.submitted_at).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                </div>
            </div>
        </div>
    );
}