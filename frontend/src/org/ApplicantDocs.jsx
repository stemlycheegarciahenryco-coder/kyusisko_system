import React, { useState } from 'react';
import { FileText, ExternalLink, RefreshCw, History, FileCheck, X, Download, ShieldAlert } from 'lucide-react';
// 🚀 Import your newly created timeline component here
import ApplicationTimeline from '../component/ApplicationTimeline'; 

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

// Keep your status badge layout clean
function StatusBadge({ status }) {
  if (status === 'Submitted' || status === 'Active') {
    return <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-600 uppercase tracking-wider border border-emerald-100">{status}</span>;
  }
  if (status === 'Pending') {
    return <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-50 text-amber-600 uppercase tracking-wider border border-amber-100">{status}</span>;
  }
  return <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-50 text-slate-500 uppercase tracking-wider border border-slate-200">{status}</span>;
}

// --- Main Component (Added applicationId Prop) ---
export default function ApplicantDocs({
  applicationId,
  responses,
  compliance_docs,
  compliance_history,
  renewal_docs,
  renewal_requirements,
  renewal_history,
}) {
  const [viewingDoc, setViewingDoc] = useState(null);
  const currentSubAdminId = localStorage.getItem('subAdminId');

  const getFileUrl = (filePath) => {
    if (!filePath) return '#';
    const cleanPath = filePath.trim().replace(/\\/g, '/');
    if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
      return cleanPath;
    }
    if (cleanPath.startsWith('uploads/')) {
      return `${backendURL}/${cleanPath}`;
    }
    return `${backendURL}/uploads/${cleanPath}`;
  };

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
    // ⚡ transformed top-level element to structural 3-Column CSS grid
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full mt-2 relative">
      
      {/* ================= LEFT SIDE: FILE VIEWER TABLES (TAKES 2 COLUMNS) ================= */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* 1. APPLICATION DOCUMENTS */}
        <TableCard icon={<FileCheck size={16} />} title="Application Documents" accentClass="text-[#093fb4]">
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
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                      Required
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {formatDate(ans.created_at || new Date().toISOString())}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {ans.field_type === 'file' ? (
                      <button
                        onClick={() => setViewingDoc({ url: getFileUrl(ans.file_path), title: ans.field_label })}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#093fb4] bg-blue-50/50 border border-[#093fb4]/20 rounded hover:bg-blue-100 hover:border-[#093fb4]/40 transition-all cursor-pointer"
                      >
                        View File <ExternalLink size={12} />
                      </button>
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
        <TableCard icon={<History size={16} />} title="Compliance History" accentClass="text-amber-600">
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
                          <button
                            key={idx}
                            onClick={() => setViewingDoc({ url: getFileUrl(doc.file_path), title: `Compliance Doc ${idx + 1}` })}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#FFBF00] bg-amber-20/20 border border-[#FFBF00]/20 rounded hover:bg-amber-100 hover:border-[#FFBF00]/40 transition-all cursor-pointer"
                          >
                            View File {idx + 1} <ExternalLink size={10} />
                          </button>
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
        <TableCard icon={<RefreshCw size={16} />} title="Renewal History" accentClass="text-[#093fb4]">
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
                              <button
                                key={idx}
                                onClick={() => setViewingDoc({ url: getFileUrl(doc.file_path), title: `Renewal Doc ${idx + 1}` })}
                                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-[#093fb4] bg-blue-50/50 border border-[#093fb4]/20 rounded hover:bg-blue-100 transition-all cursor-pointer"
                              >
                                File {idx + 1} <ExternalLink size={10} />
                              </button>
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

      {/* ================= RIGHT SIDE: STICKY APPLICATION TIMELINE (TAKES 1 COLUMN) ================= */}
      <div className="lg:sticky lg:top-4 space-y-4 w-full">
        {applicationId ? (
          <ApplicationTimeline 
            applicationId={applicationId}
            currentUserRole="sub_admin"
            currentUserId={currentSubAdminId}
          />
        ) : (
          <div className="p-4 bg-slate-100 text-[10px] font-bold uppercase text-slate-400 tracking-wider text-center rounded-2xl">
            Waiting for Application ID Reference...
          </div>
        )}

        <div className="p-4 bg-blue-50/50 border border-blue-100/70 rounded-2xl flex gap-3">
          <ShieldAlert size={16} className="text-[#093fb4] shrink-0 mt-0.5" />
          <p className="text-[9px] text-slate-500 font-medium leading-relaxed">
            <strong className="text-slate-700 font-bold uppercase tracking-wider block mb-0.5">Evaluation Logs Note</strong>
            Comments posted here are shared directly with the student's submission timeline tracking view in real-time polling intervals.
          </p>
        </div>
      </div>

      {/* --- DYNAMIC DOCUMENT VIEWING IFRAME MODAL --- */}
      {viewingDoc && (
        <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-black text-slate-900 truncate uppercase tracking-wide">{viewingDoc.title || 'Document Preview'}</h3>
                <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">{viewingDoc.url}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-4">
                <a href={viewingDoc.url} download target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#093fb4] hover:bg-[#093fb4]/95 rounded-xl transition-all shadow-md shadow-[#093fb4]/10">
                  <Download size={14} /> Download
                </a>
                <button onClick={() => setViewingDoc(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-xl transition-colors cursor-pointer">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-800 p-2 relative">
              <iframe src={viewingDoc.url} title="Document Workspace Preview" className="w-full h-full rounded-lg border-0 bg-white shadow-inner" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}