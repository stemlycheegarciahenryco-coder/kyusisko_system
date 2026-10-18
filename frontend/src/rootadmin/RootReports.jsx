import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, XCircle, ChevronDown, ChevronUp, Flag, Search, Archive, Trash2, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../api';

export default function RootReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports');
      setReports(res.data.data);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  const handleTakedown = async (scholarshipId) => {
    const confirmResult = await Swal.fire({
      title: 'Take down this scholarship?',
      text: 'This will hide it from all students.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, take down',
      cancelButtonText: 'Cancel'
    });

    if (!confirmResult.isConfirmed) return;

    const { value: reasonText, dismiss } = await Swal.fire({
      title: 'Provide Takedown Reason',
      input: 'textarea',
      inputPlaceholder: 'Please provide a reason for taking down this scholarship...',
      inputAttributes: {
        'aria-label': 'Provide a reason for taking down this scholarship'
      },
      showCancelButton: true,
      confirmButtonColor: '#093fb4',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Submit',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'A reason is required to take down a scholarship program.';
        }
      }
    });

    if (dismiss) return;

    setActionLoading(`takedown-${scholarshipId}`);
    try {
      await api.put(`/reports/takedown/${scholarshipId}`, { 
        reason: reasonText.trim() 
      });
      Swal.fire({
        icon: 'success',
        title: 'Taken Down',
        text: 'The scholarship program has been successfully taken down.',
        timer: 2000,
        showConfirmButton: false
      });
      fetchReports();
    } catch (err) {
      console.error("Takedown failed:", err);
      Swal.fire('Error', 'Failed to take down the scholarship.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDismiss = async (reportId) => {
    const result = await Swal.fire({
      title: 'Dismiss this report?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#093fb4',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, dismiss'
    });

    if (!result.isConfirmed) return;

    setActionLoading(`dismiss-${reportId}`);
    try {
      await api.put(`/reports/dismiss/${reportId}`);
      Swal.fire({
        icon: 'success',
        title: 'Dismissed',
        text: 'The report has been dismissed.',
        timer: 1500,
        showConfirmButton: false
      });
      fetchReports();
    } catch (err) {
      console.error("Dismiss failed:", err);
      Swal.fire('Error', 'Failed to dismiss the report.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleArchive = async (reportId) => {
    const result = await Swal.fire({
      title: 'Archive this report?',
      text: 'This report will be moved to archives.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d97706', // Amber/Yellow theme for archiving
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, archive'
    });

    if (!result.isConfirmed) return;

    setActionLoading(`archive-${reportId}`);
    try {
      await api.put(`/reports/archive/${reportId}`);
      Swal.fire({
        icon: 'success',
        title: 'Archived!',
        text: 'The report has been successfully archived.',
        timer: 1500,
        showConfirmButton: false
      });
      fetchReports();
    } catch (err) {
      console.error("Archive failed:", err);
      Swal.fire('Error', 'Failed to archive the report.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (reportId) => {
    const result = await Swal.fire({
      title: 'Delete report permanently?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete'
    });

    if (!result.isConfirmed) return;

    setActionLoading(`delete-${reportId}`);
    try {
      await api.delete(`/reports/${reportId}`);
      Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'The report has been permanently deleted.',
        timer: 1500,
        showConfirmButton: false
      });
      fetchReports();
    } catch (err) {
      console.error("Delete failed:", err);
      Swal.fire('Error', 'Failed to delete the report.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const statusConfig = {
    pending:   { color: 'bg-amber-50 text-amber-600 border-amber-200', dot: 'bg-amber-400' },
    resolved:  { color: 'bg-green-50 text-green-600 border-green-200', dot: 'bg-green-400' },
    dismissed: { color: 'bg-slate-100 text-slate-400 border-slate-200', dot: 'bg-slate-300' },
  };

  const filtered = reports.filter(r => {
    const matchFilter = filter === 'all' ? true : r.status === filter;
    const matchSearch =
      r.student_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.scholarship_title?.toLowerCase().includes(search.toLowerCase()) ||
      r.org_name?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const stats = [
    { label: 'Total', value: reports.length, color: 'text-slate-800', bg: 'bg-slate-50' },
    { label: 'Pending', value: reports.filter(r => r.status === 'pending').length, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Resolved', value: reports.filter(r => r.status === 'resolved').length, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Dismissed', value: reports.filter(r => r.status === 'dismissed').length, color: 'text-slate-400', bg: 'bg-slate-50' },
  ];

  return (
    <div className="font-['Inter'] p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center">
            <Flag size={15} className="text-red-500" />
          </div>
          <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
            Scholarship Reports
          </h1>
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-10">
          Student-submitted flags for admin review
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {stats.map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl border border-black/5 p-4 text-center`}>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {['all', 'pending', 'resolved', 'dismissed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                filter === f
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search size={13} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search student, program, org..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 pr-4 py-2 text-xs font-medium bg-white border border-slate-100 rounded-xl text-slate-700 placeholder-slate-300 focus:outline-none focus:border-[#093fb4]/20 w-64 transition-all"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                  <div className="h-2.5 bg-slate-100 rounded w-1/2" />
                  <div className="h-2 bg-slate-100 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 size={22} className="text-slate-200" />
          </div>
          <p className="text-sm font-black text-slate-300 uppercase tracking-wider">No reports found</p>
          <p className="text-xs text-slate-300 mt-1">
            {filter === 'all' ? 'No reports submitted yet.' : `No ${filter} reports.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => {
            const isExpanded = expandedId === r.report_id;
            const isPending = r.status === 'pending';
            const isTakenDown = r.taken_down;
            const cfg = statusConfig[r.status] || statusConfig.pending;

            const isArchiving = actionLoading === `archive-${r.report_id}`;
            const isDeleting = actionLoading === `delete-${r.report_id}`;

            return (
              <div
                key={r.report_id}
                className={`bg-white rounded-2xl border transition-all shadow-xs ${
                  isPending ? 'border-amber-100' : 'border-slate-100'
                } ${isArchiving || isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
              >
                {/* Main Row */}
                <div className="p-4 flex items-start gap-3">

                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    isPending ? 'bg-amber-50' : 'bg-slate-50'
                  }`}>
                    <AlertTriangle size={15} className={isPending ? 'text-amber-500' : 'text-slate-300'} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight truncate leading-none">
                          {r.scholarship_title}
                        </p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                          by <span className="text-slate-600 font-bold">{r.org_name}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isTakenDown && (
                          <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border bg-red-50 text-red-500 border-red-100">
                            Taken Down
                          </span>
                        )}
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${cfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {r.status}
                        </span>
                      </div>
                    </div>

                    {/* Reporter info */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2.5 p-2.5 bg-slate-50 rounded-xl">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Reporter</p>
                        <p className="text-xs font-black text-slate-700 mt-0.5">{r.student_name}</p>
                      </div>
                      <div className="w-px bg-slate-200 self-stretch mx-1" />
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Email</p>
                        <p className="text-xs font-semibold text-slate-600 mt-0.5">{r.student_email}</p>
                      </div>
                      <div className="w-px bg-slate-200 self-stretch mx-1" />
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Reported</p>
                        <p className="text-xs font-semibold text-slate-600 mt-0.5">
                          {new Date(r.created_at).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric'
                          })}
                          {' · '}
                          {new Date(r.created_at).toLocaleTimeString([], {
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 font-medium mt-2.5 leading-relaxed line-clamp-2">
                      "{r.reason}"
                    </p>
                  </div>

                  {/* Actions / Buttons Group */}
                  <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                    {/* Archive Button */}
                    <button
                      onClick={() => handleArchive(r.report_id)}
                      disabled={isArchiving || isDeleting}
                      title="Archive Report"
                      className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-600 transition-colors disabled:opacity-50 flex items-center justify-center cursor-pointer"
                    >
                      {isArchiving ? <Loader2 size={14} className="animate-spin" /> : <Archive size={14} />}
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(r.report_id)}
                      disabled={isArchiving || isDeleting}
                      title="Delete Report"
                      className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors disabled:opacity-50 flex items-center justify-center cursor-pointer"
                    >
                      {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>

                    {/* Expand/Collapse Button */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : r.report_id)}
                      title={isExpanded ? "Collapse" : "Expand"}
                      className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>

                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 border-t border-slate-50 space-y-3">
                    <div className="mt-3 bg-blue-50/50 rounded-xl border border-blue-100 p-4 space-y-3">
                      <p className="text-[9px] font-black text-[#093fb4] uppercase tracking-wider">
                        Scholarship Program Details
                      </p>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-white border border-blue-100 flex items-center justify-center shrink-0">
                          {r.org_pic ? (
                            <img src={`http://localhost:5000/${r.org_pic}`} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-black text-[#093fb4]">
                              {r.org_name?.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{r.org_name}</p>
                          <p className="text-[10px] text-slate-400 font-semibold">{r.org_email}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Program</p>
                        <p className="text-sm font-black text-slate-800">{r.scholarship_title}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white rounded-lg p-2.5 border border-blue-50">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Deadline</p>
                          <p className="text-xs font-bold text-slate-700 mt-0.5">
                            {new Date(r.deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-2.5 border border-blue-50">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Slots</p>
                          <p className="text-xs font-bold text-slate-700 mt-0.5">{r.slots ?? 'N/A'}</p>
                        </div>
                        <div className="bg-white rounded-lg p-2.5 border border-blue-50">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">GWA Requirement</p>
                          <p className="text-xs font-bold text-slate-700 mt-0.5">{r.gwa_requirement ?? 'N/A'}</p>
                        </div>
                        <div className="bg-white rounded-lg p-2.5 border border-blue-50">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Fund Type</p>
                          <p className="text-xs font-bold text-slate-700 mt-0.5">{r.fund_type ?? 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                        Student's Report
                      </p>
                      <p className="text-sm text-slate-700 font-medium leading-relaxed">
                        {r.reason}
                      </p>
                    </div>

                    {isPending && !isTakenDown && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleTakedown(r.scholarship_id)}
                          disabled={actionLoading === `takedown-${r.scholarship_id}`}
                          className="flex-1 py-2.5 bg-red-600 text-white font-black rounded-xl uppercase text-[10px] tracking-widest hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-red-900/20"
                        >
                          <XCircle size={13} />
                          {actionLoading === `takedown-${r.scholarship_id}` ? 'Processing...' : 'Take Down Scholarship'}
                        </button>
                        <button
                          onClick={() => handleDismiss(r.report_id)}
                          disabled={actionLoading === `dismiss-${r.report_id}`}
                          className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-black rounded-xl uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 size={13} />
                          {actionLoading === `dismiss-${r.report_id}` ? 'Processing...' : 'Dismiss'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
