import React, { useState, useEffect } from 'react';
import api from '../api';
import {
  Search,
  History,
  LogOut,
  LogIn,
  Filter,
  Download
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const getActionBadgeStyle = (type) => {
  const t = (type || '').toLowerCase();
  if (t.includes('remov') || t.includes('block') || t.includes('delet')) return 'bg-red-50 text-red-600 border border-red-100';
  if (t.includes('add') || t.includes('approv') || t.includes('unblock') || t.includes('creat')) return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
  if (t.includes('login')) return 'bg-blue-50 text-blue-600 border border-blue-100';
  if (t.includes('logout')) return 'bg-slate-100 text-slate-600';
  if (t.includes('updat') || t.includes('edit') || t.includes('profile') || t.includes('logo')) return 'bg-purple-50 text-purple-600 border border-purple-100';
  return 'bg-slate-100 text-slate-600';
};

const formatRelativeTime = (dateStr) => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
};

const formatAbsoluteTime = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function OrgLogs() {
  const [logFilter, setLogFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [activityLogs, setActivityLogs] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState(null);
  const [activityPage, setActivityPage] = useState(0);
  const ACTIVITY_ROWS_PER_PAGE = 8;

  useEffect(() => {
    const fetchActivityLogs = async () => {
      try {
        setActivityLoading(true);
        setActivityError(null);
        const res = await api.get('/organizations/activity-logs');
        setActivityLogs(res.data?.data || []);
      } catch (err) {
        console.error("Activity Logs Fetch Error:", err);
        setActivityError("Couldn't load activity logs. Please try again.");
      } finally {
        setActivityLoading(false);
      }
    };

    fetchActivityLogs();
  }, []);

  const logTypeOptions = ['ALL', ...new Set(activityLogs.map(l => l.type).filter(Boolean))];

  const filteredLogs = activityLogs.filter(log => {
    const matchesFilter = logFilter === 'ALL' || log.type === logFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = log.user.toLowerCase().includes(q) || log.detail.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const activityTotalPages = Math.max(1, Math.ceil(filteredLogs.length / ACTIVITY_ROWS_PER_PAGE));
  const paginatedLogs = filteredLogs.slice(activityPage * ACTIVITY_ROWS_PER_PAGE, (activityPage + 1) * ACTIVITY_ROWS_PER_PAGE);

  useEffect(() => {
    setActivityPage(0);
  }, [searchQuery, logFilter]);

  // ─── PDF EXPORT GENERATOR ───
  const handleExportPDF = async () => {
    // 1. Tell the backend a report was generated
    try {
      await api.post('/organizations/log-report', { reportName: 'Audit Logs', format: 'PDF' });
    } catch (err) {
      console.error("Failed to log report generation", err);
    }

    // 2. Generate the PDF
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Organization Audit Trail & System Logs", 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString('en-PH')}`, 14, 22);

    const tableColumn = ["User & Role", "Action Type", "Activity Description", "Timestamp"];
    const tableRows = filteredLogs.map(log => [
      `${log.user} (${log.role})`,
      log.type,
      log.detail || '—',
      formatAbsoluteTime(log.createdAt)
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 28,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [9, 63, 180] }
    });

    doc.save("audit_logs_report.pdf");
  };

  // ─── DOCX EXPORT GENERATOR (HTML to MS Word) ───
  const handleExportDOCX = async () => {
    // 1. Tell the backend a report was generated
    try {
      await api.post('/organizations/log-report', { reportName: 'Audit Logs', format: 'DOCX' });
    } catch (err) {
      console.error("Failed to log report generation", err);
    }

    // 2. Generate the DOCX
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Audit Logs</title><style>table { border-collapse: collapse; width: 100%; } th, td { border: 1px solid #dddddd; text-align: left; padding: 8px; } th { background-color: #093fb4; color: white; }</style></head><body>";
    const footer = "</body></html>";
    
    let html = `<h2>Organization Audit Trail & System Logs</h2>`;
    html += `<p>Generated on: ${new Date().toLocaleString('en-PH')}</p>`;
    html += "<table><tr><th>User & Role</th><th>Action Type</th><th>Activity Description</th><th>Timestamp</th></tr>";

    filteredLogs.forEach(log => {
      html += `<tr>
        <td>${log.user} (${log.role})</td>
        <td>${log.type}</td>
        <td>${log.detail || '—'}</td>
        <td>${formatAbsoluteTime(log.createdAt)}</td>
      </tr>`;
    });
    html += "</table>";

    const sourceHTML = header + html + footer;
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = 'audit_logs_report.doc';
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  return (
    <div className="p-8 bg-slate-50/50 min-h-screen font-sans space-y-6">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Audit Trail & System Logs <History className="text-[#093fb4]" size={22} />
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-0.5">
            Track every co-admin and system action across your organization account.
          </p>
        </div>

        {/* ── REPORT DOWNLOAD BUTTONS ── */}
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={handleExportPDF} 
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl font-bold text-xs hover:bg-red-100 transition-colors shadow-sm"
          >
            <Download size={14} /> PDF Report
          </button>
          <button 
            onClick={handleExportDOCX} 
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-[#093fb4] border border-blue-100 rounded-xl font-bold text-xs hover:bg-blue-100 transition-colors shadow-sm"
          >
            <Download size={14} /> Word Report
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-5">

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search user or action..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-[#093fb4] transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter size={15} className="text-slate-400" />
            <span className="text-sm font-extrabold text-slate-600">Filter:</span>
            <select
              value={logFilter}
              onChange={(e) => setLogFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-sm font-bold rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-[#093fb4]"
            >
              {logTypeOptions.map(opt => (
                <option key={opt} value={opt}>{opt === 'ALL' ? 'All Actions' : opt}</option>
              ))}
            </select>
          </div>
        </div>

        {activityError && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-bold px-4 py-3 rounded-xl">
            {activityError}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-black text-slate-400 uppercase">
                <th className="pb-3 px-3">User & Role</th>
                <th className="pb-3 px-3">Action Type</th>
                <th className="pb-3 px-3">Activity Description</th>
                <th className="pb-3 px-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm font-semibold">
              {activityLoading ? (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-slate-400 font-bold">
                    Loading activity logs...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-slate-400 font-bold">
                    No activity logs found matching your filters.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-3">
                      <p className="font-bold text-slate-900">{log.user}</p>
                      <p className="text-xs font-medium text-slate-400">{log.role}</p>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`text-xs font-extrabold px-2.5 py-1 rounded-md inline-flex items-center gap-1 ${getActionBadgeStyle(log.type)}`}>
                        {log.type.toLowerCase().includes('login') && <LogIn size={11} />}
                        {log.type.toLowerCase().includes('logout') && <LogOut size={11} />}
                        {log.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-medium text-slate-700">{log.detail || '—'}</td>
                    <td className="py-3.5 px-3 text-right">
                      <p className="font-bold text-slate-900">{formatRelativeTime(log.createdAt)}</p>
                      <p className="text-xs font-medium text-slate-400">{formatAbsoluteTime(log.createdAt)}</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!activityLoading && filteredLogs.length > ACTIVITY_ROWS_PER_PAGE && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              onClick={() => setActivityPage(p => Math.max(p - 1, 0))}
              disabled={activityPage === 0}
              className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
            >
              ← Previous
            </button>
            <span className="text-xs font-semibold text-slate-400">
              Page {activityPage + 1} of {activityTotalPages}
            </span>
            <button
              onClick={() => setActivityPage(p => Math.min(p + 1, activityTotalPages - 1))}
              disabled={activityPage >= activityTotalPages - 1}
              className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
            >
              Next →
            </button>
          </div>
        )}

        <div className="pt-2 text-center border-t border-slate-50">
          <span className="text-xs font-bold text-slate-400">
            Showing {filteredLogs.length} audit trail records
          </span>
        </div>

      </div>

    </div>
  );
}