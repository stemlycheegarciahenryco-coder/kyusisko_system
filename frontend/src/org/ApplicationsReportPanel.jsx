import React, { useState, useEffect } from 'react';
import api from '../api';
import { Users, Clock, CheckCircle2, XCircle } from 'lucide-react';

function StatCard({ icon: Icon, iconBg, iconColor, label, value, sublabel }) {
    return (
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3.5">
            <div className={`p-3 rounded-xl shrink-0 ${iconBg} ${iconColor}`}>
                <Icon size={22} />
            </div>
            <div>
                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-tight">{label}</p>
                <p className="text-3xl font-black text-slate-900 leading-tight mt-1">{value}</p>
                {sublabel && <p className="text-[11px] font-semibold text-slate-400 mt-0.5">{sublabel}</p>}
            </div>
        </div>
    );
}

const STATUS_SEGMENTS = [
    { key: 'pendingCount', label: 'Pending', color: 'bg-amber-400', dot: 'bg-amber-400' },
    { key: 'underReviewCount', label: 'Under Review', color: 'bg-blue-500', dot: 'bg-blue-500' },
    { key: 'approvedCount', label: 'Approved', color: 'bg-emerald-500', dot: 'bg-emerald-500' },
    { key: 'rejectedCount', label: 'Rejected', color: 'bg-rose-500', dot: 'bg-rose-500' },
    { key: 'otherCount', label: 'Other', color: 'bg-slate-300', dot: 'bg-slate-300' },
];

export default function ApplicationsReportPanel() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await api.get('/reports/applications-overview');
                if (res.data?.success) {
                    setData(res.data.data);
                } else {
                    setError("Couldn't load applications overview.");
                }
            } catch (err) {
                console.error('Applications Overview Fetch Error:', err);
                setError("Couldn't load applications overview. Please verify the report API route.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return <p className="text-center py-16 text-slate-400 font-bold text-sm">Loading...</p>;
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-bold px-4 py-3 rounded-xl">
                {error}
            </div>
        );
    }

    const d = data || {
        totalApplicants: 0, pendingCount: 0, underReviewCount: 0, needsReviewCount: 0,
        approvedCount: 0, rejectedCount: 0, otherCount: 0,
        totalMale: 0, totalFemale: 0, totalUnspecified: 0, interpretation: ''
    };

    const total = d.totalApplicants || 1;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Users} iconBg="bg-blue-50" iconColor="text-blue-600" label="Total Applicants" value={d.totalApplicants} />
                <StatCard icon={Clock} iconBg="bg-amber-50" iconColor="text-amber-600" label="Needs Review" value={d.needsReviewCount} sublabel={`${d.pendingCount} pending, ${d.underReviewCount} in review`} />
                <StatCard icon={CheckCircle2} iconBg="bg-emerald-50" iconColor="text-emerald-600" label="Approved" value={d.approvedCount} />
                <StatCard icon={XCircle} iconBg="bg-rose-50" iconColor="text-rose-600" label="Rejected" value={d.rejectedCount} />
            </div>

            {/* Status breakdown as a single stacked bar instead of a table */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
                <h2 className="text-base font-extrabold text-slate-900">Application Status Breakdown</h2>
                <p className="text-sm font-medium text-slate-400 mt-0.5 mb-4">Where every application currently stands</p>

                <div className="w-full h-4 rounded-full overflow-hidden flex bg-slate-100">
                    {STATUS_SEGMENTS.map(({ key, color }) => (
                        <div key={key} className={`h-full ${color}`} style={{ width: `${(d[key] / total) * 100}%` }} />
                    ))}
                </div>

                <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
                    {STATUS_SEGMENTS.map(({ key, label, dot }) => (
                        <div key={key} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                            <span className={`w-2.5 h-2.5 rounded-full ${dot}`} /> {label} — {d[key]}
                        </div>
                    ))}
                </div>
            </div>

            {/* Applicant demographics */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
                <h2 className="text-base font-extrabold text-slate-900">Applicant Demographics</h2>
                <p className="text-sm font-medium text-slate-400 mt-0.5 mb-4">Gender split across ALL applicants (not just approved)</p>

                <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100">
                    <div className="h-full bg-blue-600" style={{ width: `${(d.totalMale / total) * 100}%` }} />
                    <div className="h-full bg-rose-400" style={{ width: `${(d.totalFemale / total) * 100}%` }} />
                    <div className="h-full bg-slate-300" style={{ width: `${(d.totalUnspecified / total) * 100}%` }} />
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3 text-xs font-bold text-slate-600">
                    <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Male — {d.totalMale}</span>
                    <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> Female — {d.totalFemale}</span>
                    {d.totalUnspecified > 0 && (
                        <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> Unspecified — {d.totalUnspecified}</span>
                    )}
                </div>
            </div>

            {d.interpretation && (
                <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900 font-medium">
                    {d.interpretation}
                </div>
            )}
        </div>
    );
}