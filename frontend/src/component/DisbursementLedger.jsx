import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { ArrowLeft, Banknote, Search } from 'lucide-react';

// GET /applications/scholarship/:id/disbursements  → scoped to one program
// GET /applications/disbursements                  → org-wide, all programs
// Route this at e.g. /scholarship-applications/:id/disbursements for the
// scoped view, or mount without :id for the org-wide view.
export default function DisbursementLedger() {
  const { id } = useParams(); // undefined => org-wide ledger
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [scholarship, setScholarship] = useState(null);
  const [entries, setEntries] = useState([]);
  const [totalGiven, setTotalGiven] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const url = id
          ? `/applications/scholarship/${id}/disbursements`
          : `/applications/disbursements`;
        const res = await api.get(url);
        const data = res.data.data || res.data;
        setScholarship(data.scholarship || null);
        setEntries(data.entries || []);
        setTotalGiven(data.total_given || 0);
      } catch (err) {
        console.error('Failed to fetch disbursement ledger', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLedger();
  }, [id]);

  const filteredEntries = entries.filter((e) => {
    const fullName = `${e.sfirst_name || ''} ${e.slast_name || ''}`.toLowerCase();
    const program = (e.program_name || '').toLowerCase();
    const q = searchQuery.toLowerCase();
    return fullName.includes(q) || program.includes(q);
  });

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#093fb4] border-t-transparent rounded-full animate-spin" />
        <p className="text-[11px] font-black uppercase tracking-widest text-black">Loading Ledger...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-6xl mx-auto">

        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-black hover:text-[#093fb4] transition-colors mb-6"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-black uppercase tracking-tight">
              Disbursement <span className="text-[#093fb4]">Ledger</span>
            </h1>
            <p className="text-[11px] font-bold text-black mt-1 uppercase tracking-widest">
              {scholarship ? scholarship.title : 'All Programs'} · {entries.length} release{entries.length === 1 ? '' : 's'}
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Search by student or program..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-black focus:border-[#093fb4] focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Budget summary strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <SummaryCard label="Total Given" value={`₱${Number(totalGiven).toLocaleString()}`} />
          {scholarship?.total_budget != null && (
            <SummaryCard label="Total Budget" value={`₱${Number(scholarship.total_budget).toLocaleString()}`} />
          )}
          {scholarship?.remaining_budget != null && (
            <SummaryCard label="Remaining Budget" value={`₱${Number(scholarship.remaining_budget).toLocaleString()}`} accent />
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-300 bg-white text-[10px] font-black uppercase tracking-widest text-slate-600">
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Amount</th>
                  <th className="py-4 px-6">Student (Recipient)</th>
                  <th className="py-4 px-6">Program</th>
                  <th className="py-4 px-6">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                      No disbursements recorded yet
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => (
                    <tr key={entry.id} className="text-black">
                      <td className="py-4 px-6 text-xs font-medium text-slate-700">
                        {new Date(entry.disbursed_at).toLocaleDateString(undefined, {
                          year: 'numeric', month: 'short', day: 'numeric'
                        })}
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-700">
                          <Banknote size={12} />
                          ₱{Number(entry.amount).toLocaleString()}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs font-bold text-black uppercase tracking-tight">
                        {entry.sfirst_name} {entry.slast_name}
                      </td>
                      <td className="py-4 px-6 text-xs font-medium text-slate-700">
                        {entry.program_name}
                      </td>
                      <td className="py-4 px-6 text-xs font-medium text-slate-500">
                        {entry.remarks || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, accent }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-300 shadow-sm px-5 py-4">
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className={`text-lg font-black mt-1 ${accent ? 'text-[#093fb4]' : 'text-black'}`}>{value}</p>
    </div>
  );
}