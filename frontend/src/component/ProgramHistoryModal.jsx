import React, { useState, useEffect } from 'react';
import api from '../api';
import ApplicationTimeline from '../component/ApplicationTimeline';
import {
  X, Loader2, FileText, FileCheck2, RefreshCw, PhilippinePeso,
  MessageSquare, Info, Download, ExternalLink
} from 'lucide-react';

const TABS = [
  { key: 'overview',   label: 'Overview',   icon: <Info size={14} /> },
  { key: 'files',      label: 'App Files',  icon: <FileText size={14} /> },
  { key: 'compliance', label: 'Compliance', icon: <FileCheck2 size={14} /> },
  { key: 'renewal',    label: 'Renewal',    icon: <RefreshCw size={14} /> },
  { key: 'receipts',   label: 'Receipts',   icon: <PhilippinePeso size={14} /> },
  { key: 'notes',      label: 'Notes',      icon: <MessageSquare size={14} /> },
];

// Reusable, drop-in anywhere a program's application_id is known — pulls
// together everything that's ever happened on that application in one place.
export default function ProgramHistoryModal({ applicationId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const currentStudentId = localStorage.getItem('studentId');

  useEffect(() => {
    if (!applicationId) return;
    const fetchHistory = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/applications/${applicationId}/my-history`);
        setData(res.data.data);
      } catch (err) {
        console.error('Failed to fetch program history', err);
        setError('Failed to load program history.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [applicationId]);

  if (!applicationId) return null;

  const fileName = (path) => {
    if (!path) return 'Document';
    const clean = path.split('?')[0];
    return decodeURIComponent(clean.split('/').pop());
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-[#FFFCFB] rounded-3xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl border border-black/8 overflow-hidden">

        {/* Header */}
        <div className="px-6 py-5 border-b border-black/5 bg-white flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <h2 className="text-lg font-black text-black uppercase tracking-tight truncate">
              {data?.program_name || 'Program History'}
            </h2>
            {data?.org_name && (
              <p className="text-[11px] font-black text-[#093fb4] uppercase tracking-widest mt-0.5">
                {data.org_name}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors shrink-0"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-4 pt-3 border-b border-black/5 bg-white overflow-x-auto shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-black uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-[#093fb4] text-[#093fb4]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 size={28} className="text-[#093fb4] animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading History...</p>
            </div>
          ) : error ? (
            <p className="text-center text-xs font-bold text-red-500 py-10">{error}</p>
          ) : (
            <>
              {activeTab === 'overview' && <OverviewTab data={data} />}
              {activeTab === 'files' && <FileListTab items={data.responses} type="responses" fileName={fileName} />}
              {activeTab === 'compliance' && <ComplianceTab data={data} fileName={fileName} />}
              {activeTab === 'renewal' && <FileListTab items={data.renewal_docs} type="plain" emptyText="No renewal documents submitted yet." fileName={fileName} />}
              {activeTab === 'receipts' && <ReceiptsTab receipts={data.receipts} />}
              {activeTab === 'notes' && (
                <ApplicationTimeline
                  applicationId={applicationId}
                  currentUserRole="student"
                  currentUserId={currentStudentId}
                  height={440}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3 text-slate-300">
        {icon}
      </div>
      <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{text}</p>
    </div>
  );
}

function OverviewTab({ data }) {
  const rows = [
    { label: 'Status', value: (data.status || '').replace(/_/g, ' ') },
    { label: 'Submitted', value: data.submitted_at ? new Date(data.submitted_at).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }) : '—' },
    { label: 'Fund Type', value: data.fund_type || '—' },
    { label: 'Total Received', value: data.total_disbursed != null ? `₱${Number(data.total_disbursed).toLocaleString()}` : '₱0' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {rows.map((r) => (
        <div key={r.label} className="bg-white border border-slate-100 rounded-xl px-4 py-3">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{r.label}</p>
          <p className="text-sm font-black text-black capitalize mt-0.5">{r.value}</p>
        </div>
      ))}
    </div>
  );
}

function FileRow({ path, label, sublabel, fileName }) {
  return (
    <a
      href={path}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 bg-white border border-slate-100 rounded-xl p-3.5 hover:border-[#093fb4]/40 transition-colors group"
    >
      <div className="w-9 h-9 rounded-lg bg-[#093fb4]/10 flex items-center justify-center shrink-0">
        <FileText size={16} className="text-[#093fb4]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-black text-slate-800 truncate">{label}</p>
        <p className="text-[10px] font-bold text-slate-400 truncate">{sublabel || fileName(path)}</p>
      </div>
      <ExternalLink size={14} className="text-slate-300 group-hover:text-[#093fb4] shrink-0 transition-colors" />
    </a>
  );
}

function FileListTab({ items, type, emptyText, fileName }) {
  if (!items || items.length === 0) {
    return <EmptyState icon={<FileText size={22} />} text={emptyText || 'No files submitted yet.'} />;
  }

  return (
    <div className="space-y-2.5">
      {items.map((item, i) => {
        if (type === 'responses') {
          // Initial application requirement submissions — may be a file or a text answer
          if (item.file_path) {
            return (
              <FileRow
                key={i}
                path={item.file_path}
                label={item.field_label || `Requirement ${i + 1}`}
                fileName={fileName}
              />
            );
          }
          return (
            <div key={i} className="bg-white border border-slate-100 rounded-xl p-3.5">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{item.field_label}</p>
              <p className="text-xs font-bold text-slate-700 mt-1">{item.text_value || '—'}</p>
            </div>
          );
        }
        // Plain file list (compliance/renewal docs)
        return (
          <FileRow
            key={i}
            path={item.file_path}
            label={fileName(item.file_path)}
            sublabel={item.created_at ? new Date(item.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : null}
            fileName={fileName}
          />
        );
      })}
    </div>
  );
}

function ComplianceTab({ data, fileName }) {
  const history = data.compliance_history || [];
  const docs = data.compliance_docs || [];

  return (
    <div className="space-y-5">
      {history.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Requests From Organization</p>
          {history.map((req) => (
            <div key={req.id} className="bg-blue-50/60 border border-blue-100 rounded-xl p-3.5">
              <p className="text-xs font-bold text-slate-700">{req.reason}</p>
              {req.created_at && (
                <p className="text-[10px] font-bold text-slate-400 mt-1.5">
                  {new Date(req.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2.5">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Documents You Submitted</p>
        {docs.length === 0 ? (
          <EmptyState icon={<FileCheck2 size={22} />} text="No compliance documents submitted yet." />
        ) : (
          docs.map((doc, i) => (
            <FileRow
              key={i}
              path={doc.file_path}
              label={fileName(doc.file_path)}
              sublabel={doc.created_at ? new Date(doc.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : null}
              fileName={fileName}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ReceiptsTab({ receipts }) {
  if (!receipts || receipts.length === 0) {
    return <EmptyState icon={<PhilippinePeso size={22} />} text="No funds received for this program yet." />;
  }

  const total = receipts.reduce((sum, r) => sum + Number(r.amount), 0);

  return (
    <div className="space-y-3">
      <div className="bg-[#093fb4] rounded-xl px-4 py-3.5 flex items-center justify-between text-white">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/70">Total Received</p>
        <p className="text-lg font-black">₱{total.toLocaleString()}</p>
      </div>
      {receipts.map((r) => (
        <div key={r.id} className="flex items-center gap-3 bg-white border border-slate-100 rounded-xl p-3.5">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
            <PhilippinePeso size={16} className="text-emerald-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-emerald-600">₱{Number(r.amount).toLocaleString()}</p>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5">
              {new Date(r.disbursed_at).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            {r.remarks && <p className="text-[11px] font-medium text-slate-400 mt-1 italic truncate">"{r.remarks}"</p>}
          </div>
        </div>
      ))}
    </div>
  );
}