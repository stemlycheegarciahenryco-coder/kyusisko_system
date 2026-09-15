import React from 'react';
import { Wallet, Coins, AlertTriangle, ListChecks, Users } from 'lucide-react';

const DEMOGRAPHIC_TABS = [
    { key: 'byProgram', label: 'By Program' },
    { key: 'byCourse', label: 'By Course' },
    { key: 'byDistrict', label: 'By District' },
    { key: 'byBarangay', label: 'By Barangay' },
];

// Small stat card used across this panel
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

// A single program's budget shown as a labeled progress bar instead of a table row
function ProgramBudgetRow({ program }) {
    const isDraft = program.is_draft;
    const budget = program.total_budget;
    const disbursed = program.disbursed || 0;
    const pct = (!isDraft && budget && budget > 0) ? Math.min(100, Math.round((disbursed / budget) * 100)) : 0;

    return (
        <div className="py-3">
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-bold text-slate-800 truncate pr-3">{program.title}</span>
                {isDraft ? (
                    <span className="text-xs font-extrabold text-slate-400 italic shrink-0">Not counted (draft)</span>
                ) : (
                    <span className="text-xs font-extrabold text-slate-500 shrink-0">
                        ₱{disbursed.toLocaleString()} / {budget != null ? `₱${budget.toLocaleString()}` : 'No budget set'}
                    </span>
                )}
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all ${isDraft ? 'bg-slate-200' : 'bg-blue-600'}`}
                    style={{ width: `${isDraft ? 6 : pct}%` }}
                />
            </div>
        </div>
    );
}

// Overall male/female split rendered as a ring using a conic-gradient (no chart library needed)
function GenderRing({ male, female, unspecified }) {
    const total = male + female + unspecified || 1;
    const malePct = (male / total) * 100;
    const femalePct = (female / total) * 100;
    const gradient = `conic-gradient(#2563eb 0% ${malePct}%, #fb7185 ${malePct}% ${malePct + femalePct}%, #cbd5e1 ${malePct + femalePct}% 100%)`;

    return (
        <div className="flex items-center gap-5">
            <div className="relative w-24 h-24 rounded-full shrink-0" style={{ background: gradient }}>
                <div className="absolute inset-[6px] bg-white rounded-full flex items-center justify-center flex-col">
                    <span className="text-lg font-black text-slate-900">{male + female + unspecified}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Scholars</span>
                </div>
            </div>
            <div className="space-y-1.5 text-xs font-bold">
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Male — {male}</div>
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> Female — {female}</div>
                {unspecified > 0 && (
                    <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> Unspecified — {unspecified}</div>
                )}
            </div>
        </div>
    );
}

export default function OverallReportPanel({
    reportsLoading,
    reportsError,
    fundData,
    totals,
    financialInterpretation,
    demographics,
    demographicInterpretation,
    demoTab,
    setDemoTab,
}) {
    const activeDemoRows = demographics[demoTab] || [];

    return (
        <div className="space-y-6">
            {/* Financial stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Wallet} iconBg="bg-blue-50" iconColor="text-blue-600" label="Total Program Budget" value={`₱${totals.totalAllocatedFund.toLocaleString()}`} sublabel="Published programs only" />
                <StatCard icon={Coins} iconBg="bg-emerald-50" iconColor="text-emerald-600" label="Total Disbursed" value={`₱${totals.totalDisbursed.toLocaleString()}`} />
                <StatCard icon={AlertTriangle} iconBg="bg-amber-50" iconColor="text-amber-600" label="Programs With No Budget" value={totals.programsMissingAmount} />
                <StatCard icon={ListChecks} iconBg="bg-slate-100" iconColor="text-slate-500" label="Draft Programs" value={totals.draftProgramCount} sublabel="Excluded from totals" />
            </div>

            {reportsError && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-bold px-4 py-3 rounded-xl">
                    {reportsError}
                </div>
            )}

            {/* Program Fund Allocation — progress bars instead of a table */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
                <h2 className="text-base font-extrabold text-slate-900">Program Fund Allocation</h2>
                <p className="text-sm font-medium text-slate-400 mt-0.5 mb-2">How much of each program's budget has gone out the door</p>

                {reportsLoading ? (
                    <p className="text-center py-8 text-slate-400 font-bold text-sm">Loading...</p>
                ) : fundData.length === 0 ? (
                    <p className="text-center py-8 text-slate-400 font-bold text-sm">No program records found.</p>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {fundData.map((program) => (
                            <ProgramBudgetRow key={program.id} program={program} />
                        ))}
                    </div>
                )}

                {financialInterpretation && (
                    <div className="mt-4 p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900 font-medium">
                        {financialInterpretation}
                    </div>
                )}
            </div>

            {/* Demographics — ring + per-category bars instead of a table */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-5">
                <div>
                    <h2 className="text-base font-extrabold text-slate-900">Applicant Demographics</h2>
                    <p className="text-sm font-medium text-slate-400 mt-0.5">Approved scholars by gender</p>
                </div>

                <GenderRing male={totals.totalMale} female={totals.totalFemale} unspecified={totals.totalUnspecified} />

                <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                    {DEMOGRAPHIC_TABS.map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setDemoTab(key)}
                            className={`text-xs font-extrabold px-3.5 py-2 rounded-lg transition-all ${demoTab === key ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div className="space-y-3">
                    {reportsLoading ? (
                        <p className="text-center py-6 text-slate-400 font-bold text-sm">Loading...</p>
                    ) : activeDemoRows.length === 0 ? (
                        <p className="text-center py-6 text-slate-400 font-bold text-sm">No records found for this breakdown.</p>
                    ) : (
                        activeDemoRows.map((row) => {
                            const malePct = row.total > 0 ? (row.male / row.total) * 100 : 0;
                            const femalePct = row.total > 0 ? (row.female / row.total) * 100 : 0;
                            return (
                                <div key={row.name} className="p-3 rounded-xl bg-slate-50/60">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-sm font-bold text-slate-800">{row.name}</span>
                                        <span className="text-xs font-extrabold text-slate-500">{row.total} total</span>
                                    </div>
                                    <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-100">
                                        <div className="h-full bg-blue-600" style={{ width: `${malePct}%` }} />
                                        <div className="h-full bg-rose-400" style={{ width: `${femalePct}%` }} />
                                    </div>
                                    <div className="flex gap-3 mt-1 text-[11px] font-bold text-slate-400">
                                        <span>M {row.male}</span>
                                        <span>F {row.female}</span>
                                        {row.unspecified > 0 && <span>U {row.unspecified}</span>}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {demographicInterpretation && (
                    <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-xl text-xs text-purple-900 font-medium">
                        {demographicInterpretation}
                    </div>
                )}
            </div>
        </div>
    );
}