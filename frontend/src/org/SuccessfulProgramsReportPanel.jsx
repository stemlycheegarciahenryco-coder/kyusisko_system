import React, { useState, useEffect } from 'react';
import api from '../api';
import { Trophy, Users, Coins, CalendarClock } from 'lucide-react';

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

const CLOSED_REASON_LABEL = {
    closed: 'Closed',
    deadline_passed: 'Deadline Passed',
    archived: 'Archived',
};

const CLOSED_REASON_BADGE = {
    closed: 'bg-red-50 text-red-600 border-red-100',
    deadline_passed: 'bg-red-50 text-red-600 border-red-100',
    archived: 'bg-amber-50 text-amber-700 border-amber-100',
};

function ProgramCard({ program }) {
    const total = program.gender.male + program.gender.female + program.gender.unspecified || 1;
    const malePct = (program.gender.male / total) * 100;
    const femalePct = (program.gender.female / total) * 100;

    return (
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-sm font-extrabold text-slate-900">{program.title}</h3>
                    <span className={`inline-block mt-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md border uppercase tracking-wide ${CLOSED_REASON_BADGE[program.closed_reason] || CLOSED_REASON_BADGE.closed}`}>
                        {CLOSED_REASON_LABEL[program.closed_reason] || 'Closed'}
                    </span>
                </div>
                <Trophy size={20} className="text-amber-400 shrink-0" />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50/70 rounded-xl p-3">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase">Active Scholars</p>
                    <p className="text-xl font-black text-slate-900 mt-0.5">{program.active_scholars}</p>
                </div>
                <div className="bg-slate-50/70 rounded-xl p-3">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase">Per Scholar</p>
                    <p className="text-xl font-black text-slate-900 mt-0.5">₱{program.budget_per_student.toLocaleString()}</p>
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase">Gender Split</span>
                    <span className="text-[10px] font-bold text-slate-400">{total === 1 && program.active_scholars === 0 ? 'No scholars yet' : `${program.active_scholars} total`}</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-100">
                    <div className="h-full bg-blue-600" style={{ width: `${malePct}%` }} />
                    <div className="h-full bg-rose-400" style={{ width: `${femalePct}%` }} />
                </div>
                <div className="flex gap-3 mt-1 text-[11px] font-bold text-slate-400">
                    <span>M {program.gender.male}</span>
                    <span>F {program.gender.female}</span>
                    {program.gender.unspecified > 0 && <span>U {program.gender.unspecified}</span>}
                </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 pt-1 border-t border-slate-50">
                <CalendarClock size={13} />
                {program.deadline ? `Deadline: ${new Date(program.deadline).toLocaleDateString('en-PH', { dateStyle: 'medium' })}` : 'No deadline set'}
            </div>
        </div>
    );
}

export default function SuccessfulProgramsReportPanel() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await api.get('/reports/successful-programs');
                if (res.data?.success) {
                    setData(res.data.data);
                } else {
                    setError("Couldn't load successful programs report.");
                }
            } catch (err) {
                console.error('Successful Programs Fetch Error:', err);
                setError("Couldn't load successful programs report. Please verify the report API route.");
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

    const d = data || { totalPrograms: 0, totalActiveScholars: 0, totalDisbursed: 0, programs: [], interpretation: '' };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard icon={Trophy} iconBg="bg-amber-50" iconColor="text-amber-600" label="Closed / Completed Programs" value={d.totalPrograms} />
                <StatCard icon={Users} iconBg="bg-emerald-50" iconColor="text-emerald-600" label="Active Scholars" value={d.totalActiveScholars} />
                <StatCard icon={Coins} iconBg="bg-blue-50" iconColor="text-blue-600" label="Total Disbursed" value={`₱${d.totalDisbursed.toLocaleString()}`} />
            </div>

            {d.programs.length === 0 ? (
                <div className="bg-white p-10 rounded-2xl border border-slate-100 shadow-xs text-center">
                    <p className="text-slate-400 font-bold text-sm">No programs have closed or passed their deadline yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {d.programs.map((program) => (
                        <ProgramCard key={program.id} program={program} />
                    ))}
                </div>
            )}

            {d.interpretation && (
                <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl text-xs text-amber-900 font-medium">
                    {d.interpretation}
                </div>
            )}
        </div>
    );
}