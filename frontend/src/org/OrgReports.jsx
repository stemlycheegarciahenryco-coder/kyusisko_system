import React, { useState, useEffect } from 'react';
import api from '../api';
import {
  Users,
  Wallet,
  AlertTriangle,
  Download,
  GraduationCap,
  MapPin,
  Building2,
  ListChecks,
  Coins
} from 'lucide-react';

const getDisplayStatus = (rawStatus) => {
  const s = rawStatus?.toLowerCase();
  if (s === 'draft') return 'draft';
  if (s === 'closed' || s === 'deadline_passed') return 'closed';
  return 'active';
};

const STATUS_BADGE_STYLES = {
  active: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
  closed: 'bg-red-50 text-red-600 border border-red-100',
  draft:  'bg-blue-50 text-[#093fb4] border border-blue-100',
};

const STATUS_LABELS = {
  active: 'Active',
  closed: 'Closed',
  draft:  'Draft',
};

const DEMOGRAPHIC_TABS = [
  { key: 'byProgram', label: 'By Program', icon: ListChecks },
  { key: 'byCourse', label: 'By Course', icon: GraduationCap },
  { key: 'byDistrict', label: 'By District', icon: MapPin },
  { key: 'byBarangay', label: 'By Barangay', icon: Building2 },
];

export default function OrgReports() {
  const [fundData, setFundData] = useState([]);
  const [fundPage, setFundPage] = useState(0);
  const FUND_ROWS_PER_PAGE = 6;

  const [demographics, setDemographics] = useState({
    byProgram: [], byCourse: [], byDistrict: [], byBarangay: []
  });
  const [demoTab, setDemoTab] = useState('byProgram');

  const [financialInterpretation, setFinancialInterpretation] = useState('');
  const [demographicInterpretation, setDemographicInterpretation] = useState('');

  const [totals, setTotals] = useState({
    totalAllocatedFund: 0,
    totalDisbursed: 0,
    totalRemaining: 0,
    totalApprovedStudents: 0,
    programsMissingAmount: 0,
    totalMale: 0,
    totalFemale: 0,
    totalUnspecified: 0,
  });
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState(null);

  useEffect(() => {
    const fetchAnalyticsReports = async () => {
      try {
        setReportsLoading(true);
        setReportsError(null);

        const [finRes, demoRes] = await Promise.allSettled([
          api.get('/reports/financial'),
          api.get('/reports/demographics')
        ]);

        // Financial Data & Interpretation
        if (finRes.status === 'fulfilled' && finRes.value.data?.success) {
          const finData = finRes.value.data.data;
          setFundData(finData.programs || []);
          setFinancialInterpretation(finData.interpretation || '');
          setTotals(prev => ({
            ...prev,
            totalAllocatedFund: finData.totalBudget || 0,
            totalDisbursed: finData.totalDisbursed || 0,
            totalRemaining: finData.totalRemaining || 0,
            programsMissingAmount: finData.missingBudgetCount || 0,
          }));
        }

        // Demographics Data & Interpretation
        if (demoRes.status === 'fulfilled' && demoRes.value.data?.success) {
          const demoData = demoRes.value.data.data;
          setDemographics({
            byProgram: demoData.byProgram || [],
            byCourse: demoData.byCourse || [],
            byDistrict: demoData.byDistrict || [],
            byBarangay: demoData.byBarangay || [],
          });
          setDemographicInterpretation(demoData.interpretation || '');
          setTotals(prev => ({
            ...prev,
            totalApprovedStudents: demoData.totalScholars || 0,
            totalMale: demoData.totalMale || 0,
            totalFemale: demoData.totalFemale || 0,
            totalUnspecified: demoData.totalUnspecified || 0,
          }));
        }

      } catch (err) {
        console.error("Reports Fetch Error:", err);
        setReportsError("Couldn't load report analytics. Please verify report API routes.");
      } finally {
        setReportsLoading(false);
      }
    };

    fetchAnalyticsReports();
  }, []);

  const fundTotalPages = Math.max(1, Math.ceil(fundData.length / FUND_ROWS_PER_PAGE));
  const paginatedFundData = fundData.slice(fundPage * FUND_ROWS_PER_PAGE, (fundPage + 1) * FUND_ROWS_PER_PAGE);

  const activeDemoRows = demographics[demoTab] || [];

  const handleDownloadReport = () => {
    const generatedAt = new Date().toLocaleString('en-PH', { dateStyle: 'long', timeStyle: 'short' });
    const line = '─'.repeat(64);
    let text = '';

    text += `SCHOLARSHIP PROGRAM REPORT\n`;
    text += `Generated: ${generatedAt}\n`;
    text += `${'='.repeat(64)}\n\n`;

    // ── Financial & Fund Allocation ──────────────────────────────────
    text += `FINANCIAL & FUND ALLOCATION\n${line}\n`;
    text += `Total Program Budget:        ₱${totals.totalAllocatedFund.toLocaleString()}\n`;
    text += `Total Disbursed:             ₱${totals.totalDisbursed.toLocaleString()}\n`;
    text += `Total Remaining:             ₱${totals.totalRemaining.toLocaleString()}\n`;
    text += `Programs With No Budget Set: ${totals.programsMissingAmount}\n\n`;
    text += `Per-Program Breakdown:\n`;
    fundData.forEach((p) => {
      const status = getDisplayStatus(p.status);
      text += `  • ${p.title || p.program}\n`;
      text += `      Budget: ${p.total_budget != null ? `₱${p.total_budget.toLocaleString()}` : 'Not set'}   `
            + `Disbursed: ₱${(p.disbursed || 0).toLocaleString()}   `
            + `Remaining: ${p.remaining_budget != null ? `₱${p.remaining_budget.toLocaleString()}` : '—'}   `
            + `Status: ${STATUS_LABELS[status]}\n`;
    });
    text += `\nInterpretation:\n${financialInterpretation}\n\n`;

    // ── Applicant Demographics ───────────────────────────────────────
    text += `APPLICANT DEMOGRAPHICS\n${line}\n`;
    text += `Total Approved Scholars: ${totals.totalApprovedStudents} `
          + `(${totals.totalMale} Male, ${totals.totalFemale} Female`
          + `${totals.totalUnspecified > 0 ? `, ${totals.totalUnspecified} Unspecified` : ''})\n\n`;

    DEMOGRAPHIC_TABS.forEach(({ key, label }) => {
      const rows = demographics[key] || [];
      text += `${label}:\n`;
      if (rows.length === 0) {
        text += `  (no records)\n`;
      } else {
        rows.forEach((row) => {
          text += `  • ${row.name}: ${row.total} total (Male ${row.male}, Female ${row.female}`
                + `${row.unspecified ? `, Unspecified ${row.unspecified}` : ''})\n`;
        });
      }
      text += `\n`;
    });
    text += `Interpretation:\n${demographicInterpretation}\n`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scholarship-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 bg-slate-50/50 min-h-screen font-sans space-y-6">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Reports & Analytics
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-0.5">
            Fund allocation and applicant demographics at a glance.
          </p>
        </div>

        <button
          onClick={handleDownloadReport}
          disabled={reportsLoading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          <Download size={14} /> Download Report
        </button>

      </div>

      {/* Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <Users size={22} />
          </div>
          <div>
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-tight">Total Active Scholars</p>
            <p className="text-3xl font-black text-slate-900 leading-tight mt-1">{totals.totalApprovedStudents}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
            <Wallet size={22} />
          </div>
          <div>
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-tight">Total Program Budget</p>
            <p className="text-3xl font-black text-slate-900 leading-tight mt-1">₱{totals.totalAllocatedFund.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <Coins size={22} />
          </div>
          <div>
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-tight">Total Disbursed</p>
            <p className="text-3xl font-black text-slate-900 leading-tight mt-1">₱{totals.totalDisbursed.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
            <AlertTriangle size={22} />
          </div>
          <div>
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-tight">Programs With No Budget</p>
            <p className="text-3xl font-black text-slate-900 leading-tight mt-1">{totals.programsMissingAmount}</p>
          </div>
        </div>

      </div>

      {reportsError && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-bold px-4 py-3 rounded-xl">
          {reportsError}
        </div>
      )}

      {/* Fund Allocation Per Program Report */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Program Fund Allocation</h2>
              <p className="text-sm font-medium text-slate-400 mt-0.5">Budget, disbursed, and remaining per program</p>
            </div>
            {fundData.length > FUND_ROWS_PER_PAGE && (
              <span className="text-xs font-bold text-slate-400 shrink-0 ml-4">
                Page {fundPage + 1} of {fundTotalPages}
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-black text-slate-400 uppercase">
                  <th className="pb-3 px-2">Program Title</th>
                  <th className="pb-3 px-2 text-right">Budget</th>
                  <th className="pb-3 px-2 text-right">Disbursed</th>
                  <th className="pb-3 px-2 text-right">Remaining</th>
                  <th className="pb-3 px-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm font-semibold">
                {reportsLoading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-slate-400 font-bold">
                      Loading...
                    </td>
                  </tr>
                ) : fundData.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-slate-400 font-bold">
                      No program record entries found.
                    </td>
                  </tr>
                ) : (
                  paginatedFundData.map((item) => {
                    const displayStatus = getDisplayStatus(item.status);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-2 font-bold text-slate-900">{item.title || item.program}</td>
                        <td className="py-3.5 px-2 text-right font-extrabold text-slate-700">
                          {item.total_budget != null ? `₱${item.total_budget.toLocaleString()}` : 'Not set'}
                        </td>
                        <td className="py-3.5 px-2 text-right font-black text-emerald-600">
                          ₱{(item.disbursed || 0).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-2 text-right font-black text-blue-700">
                          {item.remaining_budget != null ? `₱${item.remaining_budget.toLocaleString()}` : '—'}
                        </td>
                        <td className="py-3.5 px-2 text-center">
                          <span className={`text-xs font-extrabold px-2.5 py-1 rounded-md ${STATUS_BADGE_STYLES[displayStatus]}`}>
                            {STATUS_LABELS[displayStatus]}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {fundData.length > FUND_ROWS_PER_PAGE && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
              <button
                onClick={() => setFundPage(p => Math.max(p - 1, 0))}
                disabled={fundPage === 0}
                className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
              >
                ← Previous
              </button>
              <span className="text-xs font-semibold text-slate-400">
                Showing {fundPage * FUND_ROWS_PER_PAGE + 1}–{Math.min((fundPage + 1) * FUND_ROWS_PER_PAGE, fundData.length)} of {fundData.length} programs
              </span>
              <button
                onClick={() => setFundPage(p => Math.min(p + 1, fundTotalPages - 1))}
                disabled={fundPage >= fundTotalPages - 1}
                className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
              >
                Next →
              </button>
            </div>
          )}
        </div>

        {financialInterpretation && (
          <div className="mt-4 p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900 font-medium">
            {financialInterpretation}
          </div>
        )}
      </div>

      {/* Demographics: Male/Female breakdown per Program, Course, District, Barangay */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Applicant Demographics</h2>
            <p className="text-sm font-medium text-slate-400 mt-0.5">Approved scholars by gender, broken down per program, course, district, and barangay</p>
          </div>
          <div className="text-xs font-bold text-slate-500 shrink-0">
            <span className="text-blue-600">{totals.totalMale} Male</span>
            {' · '}
            <span className="text-rose-500">{totals.totalFemale} Female</span>
            {totals.totalUnspecified > 0 && <span className="text-slate-400"> · {totals.totalUnspecified} Unspecified</span>}
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
          {DEMOGRAPHIC_TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setDemoTab(key)}
              className={`flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-2 rounded-lg transition-all ${
                demoTab === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-black text-slate-400 uppercase">
                <th className="pb-3 px-3">{DEMOGRAPHIC_TABS.find(t => t.key === demoTab)?.label.replace('By ', '')}</th>
                <th className="pb-3 px-3 text-center">Male</th>
                <th className="pb-3 px-3 text-center">Female</th>
                {demoTab !== 'byProgram' && <th className="pb-3 px-3 text-center">Unspecified</th>}
                <th className="pb-3 px-3 text-center">Total</th>
                <th className="pb-3 px-3">Gender Split</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm font-semibold">
              {reportsLoading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-400 font-bold">Loading...</td>
                </tr>
              ) : activeDemoRows.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-400 font-bold">No records found for this breakdown.</td>
                </tr>
              ) : (
                activeDemoRows.map((row) => {
                  const malePct = row.total > 0 ? (row.male / row.total) * 100 : 0;
                  const femalePct = row.total > 0 ? (row.female / row.total) * 100 : 0;
                  return (
                    <tr key={row.name} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-3 font-bold text-slate-900">{row.name}</td>
                      <td className="py-3.5 px-3 text-center text-blue-700 font-black">{row.male}</td>
                      <td className="py-3.5 px-3 text-center text-rose-600 font-black">{row.female}</td>
                      {demoTab !== 'byProgram' && (
                        <td className="py-3.5 px-3 text-center text-slate-400 font-bold">{row.unspecified}</td>
                      )}
                      <td className="py-3.5 px-3 text-center font-black text-slate-900">{row.total}</td>
                      <td className="py-3.5 px-3">
                        <div className="w-full h-2 min-w-[100px] bg-slate-100 rounded-full overflow-hidden flex">
                          <div className="h-full bg-blue-600" style={{ width: `${malePct}%` }} />
                          <div className="h-full bg-rose-400" style={{ width: `${femalePct}%` }} />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
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