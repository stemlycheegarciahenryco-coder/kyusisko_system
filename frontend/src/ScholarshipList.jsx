import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';
import { ArrowRight, Bookmark, AlertTriangle, Building2Icon, CheckCircle2, Calendar, X } from 'lucide-react';
import StudentSideNotif from './student/StudentSideNotif';
import { IconReport } from '@tabler/icons-react';

// 📋 Pre-defined lists of report reasons
const PREDEFINED_REPORTS = [
    "Suspicious Scholarship Program",
    "The Provider or Program required have a membership payment amount first",
    "Scam/ Fraud Account Provider or Program",
    "Social Media or Website information is not legitimate",
    "Unverified Contact Information"
];

export default function ScholarshipList() {
    const [scholarships, setScholarships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [reportModal, setReportModal] = useState({
        open: false,
        id: null,
        selectedReasons: [],
        otherReason: ''
    });
    const navigate = useNavigate();

    const fetchScholarships = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get('/recommendations/all');
            const data = res.data.data;
            setScholarships(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Fetch error:", err);
            setError(err.response?.data?.error || err.message || 'Failed to load scholarships.');
            setScholarships([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchScholarships(); }, []);

    // Programs with the MOST matched criteria come first.
    // Ties: best match first, then the nearest deadline.
    const sortedScholarships = useMemo(() => {
        return [...scholarships].sort((a, b) => {
            const diff = (b.matched_criteria?.length || 0) - (a.matched_criteria?.length || 0);
            if (diff !== 0) return diff;
            if (!!b.is_best_match !== !!a.is_best_match) return b.is_best_match ? 1 : -1;
            return new Date(a.deadline) - new Date(b.deadline);
        });
    }, [scholarships]);

    const handleSaveToggle = async (id, currentStatus) => {
        try {
            if (currentStatus) {
                await api.delete(`/recommendations/${id}/unsave`);
            } else {
                await api.post(`/recommendations/${id}/save`);
            }
            setScholarships(prev => prev.map(s =>
                s.id === id ? { ...s, is_saved: !currentStatus } : s
            ));
        } catch (err) {
            console.error("Save toggle error:", err);
            alert("Failed to update save status. Please try again.");
        }
    };

    const handleCheckboxChange = (reason) => {
        setReportModal(prev => {
            const exists = prev.selectedReasons.includes(reason);
            const updated = exists
                ? prev.selectedReasons.filter(r => r !== reason)
                : [...prev.selectedReasons, reason];
            return { ...prev, selectedReasons: updated };
        });
    };

    const handleSelectAll = () => {
        if (reportModal.selectedReasons.length === PREDEFINED_REPORTS.length) {
            setReportModal(prev => ({ ...prev, selectedReasons: [] }));
        } else {
            setReportModal(prev => ({ ...prev, selectedReasons: [...PREDEFINED_REPORTS] }));
        }
    };

    const submitReport = async () => {
        const finalReasons = [...reportModal.selectedReasons];
        if (reportModal.otherReason.trim()) {
            finalReasons.push(reportModal.otherReason.trim());
        }

        if (finalReasons.length === 0) {
            alert("Please select at least one reason or type an explanation.");
            return;
        }

        const combinedReason = finalReasons.join(' | ');

        try {
            await api.post(`/recommendations/${reportModal.id}/report`, { reason: combinedReason });
            alert("Report submitted successfully.");
            setReportModal({ open: false, id: null, selectedReasons: [], otherReason: '' });
        } catch (err) {
            console.error("Report error:", err);
            alert("Failed to submit report. Please try again.");
        }
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="text-center font-black text-black animate-pulse py-20 uppercase tracking-widest text-[11px]">
                    Searching Programs for you...
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex flex-col items-center gap-4 py-20 text-center">
                    <AlertTriangle size={40} className="text-red-500" strokeWidth={2.5} />
                    <p className="font-black text-black uppercase tracking-widest text-[13px]">Failed to Load</p>
                    <p className="text-black text-[12px] font-bold max-w-xs leading-relaxed">{error}</p>
                    <button
                        onClick={fetchScholarships}
                        className="mt-4 px-8 py-3 bg-[#093fb4] text-white font-black rounded-xl uppercase text-[11px] tracking-widest hover:bg-[#073496] active:scale-95 transition-all"
                    >
                        Retry
                    </button>
                </div>
            );
        }

        if (scholarships.length === 0) {
            return (
                <div className="flex flex-col items-center gap-4 py-24 text-center bg-white border border-dashed border-blue-100 rounded-3xl">
                    <CheckCircle2 size={48} className="text-black" strokeWidth={2} />
                    <p className="font-black text-black uppercase tracking-widest text-[13px]">No Scholarships Available</p>
                    <p className="text-black text-[12px] font-bold max-w-xs leading-relaxed">
                        Check back later — new programs are added regularly.
                    </p>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                {sortedScholarships.map((s, i) => {
                    return (
                        <div
                            key={s.id}
                            className="scholar-card bg-white rounded-3xl border border-blue-100 shadow-sm p-6 transition-all duration-300 hover:border-[#093fb4] hover:-translate-y-0.5 hover:shadow-md relative overflow-hidden"
                            style={{ animationDelay: `${Math.min(i, 8) * 90}ms` }}
                        >
                            <div className="flex flex-col gap-4">

                                {/* Org header & Top Right Corner (Provider Type + Report Icon) */}
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center bg-white border border-blue-100 shrink-0">
                                            {s.org_pic ? (
                                                <img src={s.org_pic} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-xl font-black text-[#093fb4]">
                                                    {s.org_name?.substring(0, 2).toUpperCase()}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-col justify-center gap-2">
                                            <h1 className="text-[#093fb4] text-[14px] font-black uppercase tracking-tight leading-none">
                                                {s.org_name}
                                            </h1>
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#093fb4] rounded-lg text-[#093fb4] font-black text-[10px] uppercase tracking-widest w-fit">
                                                <Building2Icon size={12} strokeWidth={2.5} /> {s.provider_type || 'N/A'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center">
                                        <button
                                            onClick={() => setReportModal({ open: true, id: s.id, selectedReasons: [], otherReason: '' })}
                                            className="p-2.5 rounded-xl bg-white text-black hover:text-red-600 border border-blue-100 hover:border-red-600 transition-all"
                                            title="Report this scholarship"
                                        >
                                            <IconReport size={18} strokeWidth={2} />
                                        </button>
                                    </div>
                                </div>

                                {/* Matched criteria centered */}
                                {s.matched_criteria?.length > 0 && (
                                    <div className="flex flex-wrap justify-center gap-2">
                                        {s.matched_criteria.map((c, idx) => (
                                            <span
                                                key={`matched-${idx}`}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-white text-green-700 border border-green-600"
                                            >
                                                <CheckCircle2 size={12} strokeWidth={3} />
                                                {c}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Title (Program Name) directly below criteria - CENTERED */}
                                <div className="flex flex-col items-center justify-center text-center">
                                    <h3 className="text-xl font-black text-black leading-tight tracking-tight max-w-2xl uppercase">
                                        {s.title}
                                    </h3>
                                </div>

                                {/* PROMINENT RED DEADLINE */}
                                <div className="flex items-center justify-center gap-2 text-red-600 font-black text-[11px] uppercase tracking-widest bg-white py-2 px-4 rounded-xl border border-red-600 w-fit mx-auto">
                                    <Calendar size={14} strokeWidth={2.5} />
                                    <span>
                                        Deadline: {new Date(s.deadline).toLocaleDateString('en-US', {
                                            month: 'short', day: '2-digit', year: 'numeric'
                                        })}
                                    </span>
                                </div>

                                {/* Description */}
                                <div className="p-4 bg-white rounded-xl border border-blue-100 w-full">
                                    <p className="text-[12px] text-black leading-relaxed text-justify line-clamp-3 font-medium italic">
                                        "{s.description || "No description provided for this scholarship."}"
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-blue-100">
                                    <button
                                        onClick={() => handleSaveToggle(s.id, s.is_saved)}
                                        className={`flex-none px-6 py-3 font-black rounded-xl flex items-center justify-center gap-2 uppercase text-[11px] tracking-widest transition-all border ${
                                            s.is_saved
                                                ? 'bg-[#093fb4] border-[#093fb4] text-white'
                                                : 'bg-white border-blue-100 text-black hover:border-[#093fb4] hover:text-[#093fb4]'
                                        }`}
                                    >
                                        <Bookmark
                                            size={16}
                                            strokeWidth={2.5}
                                            fill={s.is_saved ? "white" : "none"}
                                            className={s.is_saved ? "animate-in zoom-in duration-300" : ""}
                                        />
                                        {s.is_saved ? 'Saved' : 'Save'}
                                    </button>

                                    <button
                                        onClick={() => navigate(`/apply/${s.id}`)}
                                        className="flex-1 bg-[#093fb4] text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 uppercase text-[11px] tracking-widest hover:bg-[#073496] transition-all active:scale-95"
                                    >
                                        View and Apply <ArrowRight size={16} strokeWidth={2.5} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const isAllSelected = reportModal.selectedReasons.length === PREDEFINED_REPORTS.length;

    return (
        <>
            <style>{`
                @keyframes scholarCardIn {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes scholarBorderFlash {
                    0%   { border-color: #dbeafe; box-shadow: 0 0 0 0 #dbeafe; }
                    35%  { border-color: #093fb4; box-shadow: 0 0 0 4px #dbeafe; }
                    70%  { border-color: #093fb4; box-shadow: 0 0 0 0 #dbeafe; }
                    100% { border-color: #dbeafe; box-shadow: 0 0 0 0 #dbeafe; }
                }
                .scholar-card {
                    animation: scholarCardIn 0.5s ease-out backwards,
                               scholarBorderFlash 1.6s ease-in-out backwards;
                }
                @media (prefers-reduced-motion: reduce) {
                    .scholar-card { animation: none; }
                }
            `}</style>

            {/* 🛡️ MULTI-CHECKBOX REPORT MODAL */}
            {reportModal.open && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
                    onClick={() => setReportModal({ open: false, id: null, selectedReasons: [], otherReason: '' })}
                >
                    <div
                        className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl p-6 md:p-8 shadow-2xl border border-blue-100 animate-in fade-in zoom-in-95 duration-200 custom-scrollbar"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-lg font-black text-black uppercase tracking-tight leading-none">Report Program</h2>
                            <button
                                onClick={() => setReportModal({ open: false, id: null, selectedReasons: [], otherReason: '' })}
                                className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-black hover:text-red-600 hover:border-red-600 transition-all border border-blue-100 shrink-0"
                            >
                                <X size={20} strokeWidth={2.5} />
                            </button>
                        </div>

                        <div className="mb-4 pb-2 border-b border-blue-100">
                            <p className="text-black text-[11px] font-black uppercase tracking-widest">Select reasons for reporting</p>
                        </div>

                        <div className="space-y-3 mb-6 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                            <label
                                className={`flex items-start gap-4 p-4 rounded-2xl border text-[13px] font-black cursor-pointer transition-all bg-white ${
                                    isAllSelected
                                        ? 'border-[#093fb4] text-[#093fb4]'
                                        : 'border-blue-100 text-black hover:border-[#093fb4]'
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={isAllSelected}
                                    onChange={handleSelectAll}
                                    className="mt-0.5 rounded border-blue-100 text-[#093fb4] focus:ring-[#093fb4] h-5 w-5 shrink-0 cursor-pointer"
                                />
                                <span className="leading-tight select-none uppercase tracking-wider">Select All Reasons</span>
                            </label>

                            <div className="border-t border-blue-100 my-2" />

                            {PREDEFINED_REPORTS.map((reason, index) => {
                                const isChecked = reportModal.selectedReasons.includes(reason);
                                return (
                                    <label
                                        key={index}
                                        className={`flex items-start gap-4 p-4 rounded-2xl border text-[13px] font-bold cursor-pointer transition-all bg-white ${
                                            isChecked
                                                ? 'border-[#093fb4] text-[#093fb4]'
                                                : 'border-blue-100 text-black hover:border-[#093fb4]'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => handleCheckboxChange(reason)}
                                            className="mt-0.5 rounded border-blue-100 text-[#093fb4] focus:ring-[#093fb4] h-5 w-5 shrink-0 cursor-pointer"
                                        />
                                        <span className="leading-tight select-none">{reason}</span>
                                    </label>
                                );
                            })}
                        </div>

                        <p className="text-black text-[11px] font-black uppercase tracking-widest mb-2">Other Details / Specific Reasons</p>
                        <textarea
                            className="w-full h-24 p-5 rounded-2xl bg-white border border-blue-100 focus:border-[#093fb4] text-[13px] font-medium text-black placeholder:text-blue-300 transition-all outline-none resize-none mb-6"
                            placeholder="Provide additional details or specify other reasons here..."
                            value={reportModal.otherReason}
                            onChange={(e) => setReportModal({ ...reportModal, otherReason: e.target.value })}
                        />

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => setReportModal({ open: false, id: null, selectedReasons: [], otherReason: '' })}
                                className="flex-1 py-3.5 bg-white text-black border border-blue-100 hover:border-[#093fb4] font-black rounded-2xl uppercase text-[11px] tracking-widest transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitReport}
                                className="flex-[2] py-3.5 bg-red-600 text-white font-black rounded-2xl uppercase text-[11px] tracking-widest hover:bg-red-700 transition-all active:scale-95"
                            >
                                Submit Report
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_260px] gap-8 items-start w-full">
                <main className="w-full min-w-0">
                    {renderContent()}
                </main>
                <div className="hidden xl:block w-full self-start xl:sticky xl:top-24">
                    <StudentSideNotif />
                </div>
            </div>
        </>
    );
}