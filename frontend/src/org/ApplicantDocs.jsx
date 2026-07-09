import React from 'react';
import { FileText, ExternalLink, RefreshCw, History, FileCheck } from 'lucide-react';

const backendURL = "http://localhost:5000";

// --- Helper Components for the Table Layout ---

function TableCard({ icon, title, accentClass, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2 bg-white">
        <span className={accentClass}>{icon}</span>
        <h3 className={`text-sm font-bold uppercase tracking-wider ${accentClass}`}>
          {title}
        </h3>
      </div>
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          {children}
        </table>
      </div>
    </div>
  );
}

function EmptyRow({ message, colSpan }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-10 bg-white">
        <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
          <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
            <FileText size={16} className="text-slate-300" />
          </div>
          <span className="text-sm font-medium">{message}</span>
        </div>
      </td>
    </tr>
  );
}

function StatusBadge({ status }) {
  if (status === 'Submitted' || status === 'Active') {
    return <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-600 uppercase tracking-wider border border-emerald-100">{status}</span>;
  }
  if (status === 'Pending') {
    return <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-50 text-amber-600 uppercase tracking-wider border border-amber-100">{status}</span>;
  }
  return <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-50 text-slate-500 uppercase tracking-wider border border-slate-200">{status}</span>;
}

// --- Main Component ---

export default function ApplicantDocs({
  responses,
  compliance_docs,
  compliance_history,
  renewal_docs,
  renewal_requirements,
  renewal_history,
}) {
  // Format Date Helper to match screenshot: "July 9, 2026 — 09:15 AM"
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    const datePart = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const timePart = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return `${datePart} — ${timePart}`;
  };

  const renewalCycles = (() => {
    if (renewal_history?.length > 0) return renewal_history;
    if (renewal_requirements || renewal_docs?.length > 0) {
      return [{
        id: 'cycle-1',
        created_at: renewal_docs?.[0]?.created_at || new Date().toISOString(),
        reason: 'Standard Renewal',
        required_docs: renewal_requirements,
        docs: renewal_docs || [],
      }];
    }
    return [];
  })();

  return (
    <div className="w-full mt-2">
      
      {/* 1. APPLICATION DOCUMENTS */}
      <TableCard 
        icon={<FileCheck size={16} />} 
        title="Application Documents" 
        accentClass="text-[#093fb4]"
      >
        <thead className="bg-slate-50/50 border-b border-slate-100">
          <tr>
            <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-2/5">Document</th>
            <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Type</th>
            <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Uploaded On</th>
            <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right w-32">File</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {responses?.length > 0 ? (
            responses.map((ans, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center border border-blue-100 shrink-0">
                      <FileText size={14} className="text-[#093fb4]" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 truncate max-w-[300px]">
                      {ans.field_label}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {/* Defaulting to Required for demonstration, you can map this to actual schema if available */}
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                    Required
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  {formatDate(ans.created_at || new Date().toISOString())}
                </td>
                <td className="px-6 py-4 text-right">
                  {ans.field_type === 'file' ? (
                    <a
                      href={`${backendURL}/uploads/${(ans.file_path || '').replace(/^uploads[\\/]/, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#093fb4] bg-blue-50/50 border border-[#093fb4]/20 rounded hover:bg-blue-100 hover:border-[#093fb4]/40 transition-all"
                    >
                      View File <ExternalLink size={12} />
                    </a>
                  ) : (
                    <span className="text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded px-2.5 py-1">
                      {ans.text_value || '—'}
                    </span>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <EmptyRow message="No application documents submitted." colSpan={4} />
          )}
        </tbody>
      </TableCard>

      {/* 2. COMPLIANCE HISTORY */}
      <TableCard 
        icon={<History size={16} />} 
        title="Compliance History" 
        accentClass="text-amber-600"
      >
        <thead className="bg-slate-50/50 border-b border-slate-100">
          <tr>
            <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Request Date</th>
            <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reason</th>
            <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Required Documents</th>
            <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {compliance_history?.length > 0 ? (
            compliance_history.map((req, index) => {
              const nextReqTime = compliance_history[index + 1]?.created_at;
              const docsForReq = compliance_docs?.filter(doc => {
                const docTime = new Date(doc.created_at);
                const reqTime = new Date(req.created_at);
                return nextReqTime ? docTime >= reqTime && docTime < new Date(nextReqTime) : docTime >= reqTime;
              });
              
              const hasDocs = docsForReq?.length > 0;

              return (
                <tr key={req.id} className="hover:bg-amber-50/10 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                    {formatDate(req.created_at)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 max-w-[250px] truncate">
                    {req.reason || '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 max-w-[250px] truncate">
                    {req.required_docs || '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={hasDocs ? 'Submitted' : 'Pending'} />
                      {hasDocs && docsForReq.map((doc, idx) => (
                        <a
                          key={idx}
                          href={`${backendURL}/uploads/${doc.file_path}`}
                          target="_blank" rel="noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#FFBF00] bg-amber-20/20 border border-[#FFBF00]/20 rounded hover:bg-amber-100 hover:border-[#FFBF00]/40 transition-all"
                        >
                          View File {idx + 1} <ExternalLink size={10} />
                        </a>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <EmptyRow message="No compliance requests yet." colSpan={4} />
          )}
        </tbody>
      </TableCard>

      {/* 3. RENEWAL HISTORY */}
      <TableCard 
        icon={<RefreshCw size={16} />} 
        title="Renewal History" 
        accentClass="text-[#093fb4]"
      >
        <thead className="bg-slate-50/50 border-b border-slate-100">
          <tr>
            <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cycle</th>
            <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Request Date</th>
            <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reason</th>
            <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Submitted Documents</th>
            <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {renewalCycles.length > 0 ? (
            renewalCycles.map((cycle, index) => {
              const hasDocs = cycle.docs?.length > 0;
              return (
                <tr key={cycle.id || index} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                      Cycle {index + 1}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                    {formatDate(cycle.created_at)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 max-w-[200px] truncate">
                    {cycle.reason || '—'}
                  </td>
                  <td className="px-6 py-4">
                    {hasDocs ? (
                       <div className="flex flex-wrap gap-2">
                         {cycle.docs.map((doc, idx) => (
                            <a
                              key={idx}
                              href={`${backendURL}/uploads/${doc.file_path}`}
                              target="_blank" rel="noreferrer"
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-[#093fb4] bg-blue-50/50 border border-[#093fb4]/20 rounded hover:bg-blue-100 transition-all"
                            >
                              File {idx + 1} <ExternalLink size={10} />
                            </a>
                         ))}
                       </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">None submitted</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                     <StatusBadge status={hasDocs ? 'Submitted' : 'Pending'} />
                  </td>
                </tr>
              );
            })
          ) : (
            <EmptyRow message="No renewal history yet." colSpan={5} />
          )}
        </tbody>
      </TableCard>

    </div>
  );
}