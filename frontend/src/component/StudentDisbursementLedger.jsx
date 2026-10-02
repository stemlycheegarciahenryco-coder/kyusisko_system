import React, { useMemo, useState } from 'react';
import { BookOpenCheck, PhilippinePeso, Download, ArrowDownUp } from 'lucide-react';

const peso = (n) => `₱${Number(n || 0).toLocaleString()}`;
const fmtDate = (d, month = 'short') =>
  d ? new Date(d).toLocaleDateString('en-PH', { month, day: 'numeric', year: 'numeric' }) : '—';

/**
 * Student-facing disbursement ledger for one program.
 * Props: receipts = [{ id, amount, disbursed_at, remarks }], programName (for the CSV file name)
 */
export default function StudentDisbursementLedger({ receipts = [], programName = 'program' }) {
  const [year, setYear] = useState('all');
  const [newestFirst, setNewestFirst] = useState(true);

  // Chronological rows with a running total that always counts from the first release
  const rows = useMemo(() => {
    let running = 0;
    return [...receipts]
      .sort((a, b) => new Date(a.disbursed_at) - new Date(b.disbursed_at))
      .map((r, i) => {
        running += Number(r.amount) || 0;
        return { ...r, no: i + 1, running, year: new Date(r.disbursed_at).getFullYear() };
      });
  }, [receipts]);

  const years = useMemo(() => [...new Set(rows.map((r) => r.year))].sort((a, b) => b - a), [rows]);

  const total = rows.length ? rows[rows.length - 1].running : 0;
  const average = rows.length ? total / rows.length : 0;
  const last = rows[rows.length - 1];

  const visible = rows
    .filter((r) => year === 'all' || r.year === year)
    .sort((a, b) => (newestFirst ? b.no - a.no : a.no - b.no));
  const visibleTotal = visible.reduce((sum, r) => sum + Number(r.amount || 0), 0);

  const exportCsv = () => {
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [
      ['No', 'Date', 'Remarks', 'Amount', 'Running Total'].join(','),
      ...[...visible]
        .sort((a, b) => a.no - b.no)
        .map((r) => [r.no, esc(fmtDate(r.disbursed_at, 'long')), esc(r.remarks), r.amount, r.running].join(',')),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${String(programName).replace(/\s+/g, '-').toLowerCase()}-disbursements.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white border-2 border-black/5 shadow-sm rounded-3xl p-5 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#093fb4]/10 text-[#093fb4] flex items-center justify-center shrink-0">
            <BookOpenCheck size={16} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-base font-black uppercase tracking-wider text-black">Disbursement Ledger</h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-black/40">
              Every release of funds for this program
            </p>
          </div>
        </div>

        {rows.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setNewestFirst((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/5 hover:bg-black/10 text-[10px] font-black uppercase tracking-widest text-black/60 transition-colors"
            >
              <ArrowDownUp size={13} strokeWidth={2.5} /> {newestFirst ? 'Newest first' : 'Oldest first'}
            </button>
            <button
              onClick={exportCsv}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#093fb4]/10 hover:bg-[#093fb4]/20 text-[10px] font-black uppercase tracking-widest text-[#093fb4] transition-colors"
            >
              <Download size={13} strokeWidth={2.5} /> Export CSV
            </button>
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center bg-black/5 border-2 border-dashed border-black/10 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center mb-2 text-black/20">
            <PhilippinePeso size={22} strokeWidth={2} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-black/40">
            No funds received for this program yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[#093fb4] text-white rounded-2xl px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/70">Total Received</p>
              <p className="text-xl font-black tracking-tight mt-0.5">{peso(total)}</p>
            </div>
            <div className="bg-black/5 rounded-2xl px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-black/40">Releases</p>
              <p className="text-xl font-black text-black mt-0.5">{rows.length}</p>
            </div>
            <div className="bg-black/5 rounded-2xl px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-black/40">Average Release</p>
              <p className="text-xl font-black text-black mt-0.5">{peso(Math.round(average))}</p>
            </div>
            <div className="bg-black/5 rounded-2xl px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-black/40">Last Release</p>
              <p className="text-sm font-black text-black mt-1.5">{fmtDate(last.disbursed_at)}</p>
            </div>
          </div>

          {/* Year filter */}
          {years.length > 1 && (
            <div className="flex items-center gap-2 flex-wrap">
              {['all', ...years].map((y) => (
                <button
                  key={y}
                  onClick={() => setYear(y)}
                  className={`px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 transition-colors ${
                    year === y
                      ? 'bg-[#093fb4] text-white border-[#093fb4]'
                      : 'bg-white text-black/50 border-black/10 hover:border-[#093fb4]/40 hover:text-[#093fb4]'
                  }`}
                >
                  {y === 'all' ? 'All' : y}
                </button>
              ))}
            </div>
          )}

          {/* Ledger table */}
          <div className="overflow-x-auto rounded-2xl border-2 border-black/5">
            <table className="w-full text-left min-w-[520px]">
              <thead>
                <tr className="bg-black/5 text-[10px] font-black uppercase tracking-widest text-black/50">
                  <th className="px-4 py-3 w-10">#</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Remarks</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-right">Running Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {visible.map((r) => (
                  <tr key={r.id ?? r.no} className="hover:bg-[#093fb4]/5 transition-colors">
                    <td className="px-4 py-3 text-xs font-black text-black/40">{r.no}</td>
                    <td className="px-4 py-3 text-xs font-black text-black whitespace-nowrap">{fmtDate(r.disbursed_at)}</td>
                    <td className="px-4 py-3 text-xs font-bold text-black/60">{r.remarks || '—'}</td>
                    <td className="px-4 py-3 text-sm font-black text-emerald-600 text-right whitespace-nowrap">+ {peso(r.amount)}</td>
                    <td className="px-4 py-3 text-sm font-black text-[#093fb4] text-right whitespace-nowrap">{peso(r.running)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#093fb4]/5 border-t-2 border-[#093fb4]/15">
                  <td colSpan={3} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-black/50">
                    {year === 'all' ? 'Total Disbursed' : `Total in ${year}`}
                  </td>
                  <td className="px-4 py-3 text-sm font-black text-emerald-600 text-right">{peso(visibleTotal)}</td>
                  <td className="px-4 py-3 text-sm font-black text-[#093fb4] text-right">{peso(total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}