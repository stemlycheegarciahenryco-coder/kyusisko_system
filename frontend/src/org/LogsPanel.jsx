import React, { useState, useEffect } from 'react';
import api from '../api';
import { Search, Filter, Download } from 'lucide-react';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

// Register the standard fonts. Handles both the older pdfmake build (which
// nests vfs under pdfFonts.pdfMake.vfs) and newer builds that export vfs
// directly — if OrgReports.jsx's setup already runs this at app startup,
// this is a harmless no-op the second time.
if (pdfFonts?.pdfMake?.vfs) {
  pdfMake.vfs = pdfFonts.pdfMake.vfs;
} else if (pdfFonts?.vfs) {
  pdfMake.vfs = pdfFonts.vfs;
}

const getActionBadgeStyle = (type) => {
  const t = (type || '').toLowerCase();
  if (t.includes('remov') || t.includes('block') || t.includes('delet') || t.includes('reject') || t.includes('archiv') || t.includes('clos')) return 'bg-red-50 text-red-600 border border-red-100';
  if (t.includes('add') || t.includes('approv') || t.includes('unblock') || t.includes('creat') || t.includes('accept') || t.includes('publish') || t.includes('restor')) return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
  if (t.includes('disburs')) return 'bg-amber-50 text-amber-600 border border-amber-100';
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

const ROWS_PER_PAGE = 8;

// Self-contained: owns its own search/filter/pagination state, so mounting
// it fresh per tab (parent passes key={activeTab}) is enough to reset all of
// that automatically when switching tabs — no state needs to be lifted up.
export default function LogsPanel({ logs, loading, error, reportName, emptyMessage, fileNamePrefix }) {
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);

  const typeOptions = ['ALL', ...new Set(logs.map(l => l.type).filter(Boolean))];

  const filteredLogs = logs.filter(log => {
    const matchesFilter = filter === 'ALL' || log.type === filter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = log.user.toLowerCase().includes(q) || log.detail.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / ROWS_PER_PAGE));
  const paginatedLogs = filteredLogs.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, filter]);

  const handleExportPDF = async () => {
    try {
      await api.post('/organizations/log-report', { reportName, format: 'PDF' });
    } catch (err) {
      console.error("Failed to log report generation", err);
    }

    const tableBody = [
      [
        { text: 'User & Role', bold: true, color: 'white' },
        { text: 'Action Type', bold: true, color: 'white' },
        { text: 'Activity Description', bold: true, color: 'white' },
        { text: 'Timestamp', bold: true, color: 'white' },
      ],
      ...filteredLogs.map(log => [
        `${log.user} (${log.role})`,
        log.type,
        log.detail || '—',
        formatAbsoluteTime(log.createdAt)
      ])
    ];

    const docDefinition = {
      content: [
        { text: reportName, fontSize: 16, bold: true, margin: [0, 0, 0, 5] },
        { text: `Generated on: ${new Date().toLocaleString('en-PH')}`, fontSize: 10, color: '#666666', margin: [0, 0, 0, 15] },
        {
          table: {
            headerRows: 1,
            widths: ['auto', 'auto', '*', 'auto'],
            body: tableBody
          },
          layout: {
            fillColor: (rowIndex) => (rowIndex === 0 ? '#093fb4' : rowIndex % 2 === 0 ? '#f8fafc' : null),
            hLineColor: '#e2e8f0',
            vLineColor: '#e2e8f0',
          }
        }
      ],
      defaultStyle: { fontSize: 8, color: '#333333' },
      pageMargins: [30, 30, 30, 30],
    };

    pdfMake.createPdf(docDefinition).download(`${fileNamePrefix}_report.pdf`);
  };

  const handleExportDOCX = async () => {
    try {
      await api.post('/organizations/log-report', { reportName, format: 'DOCX' });
    } catch (err) {
      console.error("Failed to log report generation", err);
    }

    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>" + reportName + "</title><style>table { border-collapse: collapse; width: 100%; } th, td { border: 1px solid #dddddd; text-align: left; padding: 8px; } th { background-color: #093fb4; color: white; }</style></head><body>";
    const footer = "</body></html>";

    let html = `<h2>${reportName}</h2>`;
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
    fileDownload.download = `${fileNamePrefix}_report.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  return (
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

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap justify-end">
          <Filter size={15} className="text-slate-400" />
          <span className="text-sm font-extrabold text-slate-600">Filter:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-sm font-bold rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-[#093fb4]"
          >
            {typeOptions.map(opt => (
              <option key={opt} value={opt}>{opt === 'ALL' ? 'All Actions' : opt}</option>
            ))}
          </select>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl font-bold text-xs hover:bg-red-100 transition-colors shadow-sm"
          >
            <Download size={14} /> PDF
          </button>
          <button
            onClick={handleExportDOCX}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-[#093fb4] border border-blue-100 rounded-xl font-bold text-xs hover:bg-blue-100 transition-colors shadow-sm"
          >
            <Download size={14} /> Word
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-bold px-4 py-3 rounded-xl">
          {error}
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
            {loading ? (
              <tr>
                <td colSpan="4" className="text-center py-8 text-slate-400 font-bold">
                  Loading...
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-8 text-slate-400 font-bold">
                  {emptyMessage}
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

      {!loading && filteredLogs.length > ROWS_PER_PAGE && (
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <button
            onClick={() => setPage(p => Math.max(p - 1, 0))}
            disabled={page === 0}
            className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
          >
            ← Previous
          </button>
          <span className="text-xs font-semibold text-slate-400">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(p + 1, totalPages - 1))}
            disabled={page >= totalPages - 1}
            className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
          >
            Next →
          </button>
        </div>
      )}

      <div className="pt-2 text-center border-t border-slate-50">
        <span className="text-xs font-bold text-slate-400">
          Showing {filteredLogs.length} record{filteredLogs.length === 1 ? '' : 's'}
        </span>
      </div>

    </div>
  );
}