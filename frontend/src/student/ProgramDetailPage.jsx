import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import ApplicationTimeline from '../component/ApplicationTimeline';
import MyCompliance from './MyCompliance';
import RenewCompliance from './RenewCompliance';
import {
  ArrowLeft, Loader2, FileText, FileCheck2, RefreshCw, PhilippinePeso,
  Info, ExternalLink, Building2, Mail, Phone, Globe, Calendar, GraduationCap
} from 'lucide-react';

const STATUS_STYLES = {
  pending:         'bg-amber-50 text-amber-600 border-amber-200',
  under_review:    'bg-[#093fb4]/10 text-[#093fb4] border-[#093fb4]/20',
  submitted:       'bg-emerald-50 text-emerald-600 border-emerald-200',
  renewing:        'bg-amber-100 text-amber-700 border-amber-300',
  renewal_pending: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  approved:        'bg-emerald-50 text-emerald-600 border-emerald-200',
  active:          'bg-emerald-50 text-emerald-600 border-emerald-200',
  renewal_approved:'bg-emerald-50 text-emerald-600 border-emerald-200',
  rejected:        'bg-red-50 text-red-500 border-red-200',
  terminated:      'bg-slate-100 text-slate-500 border-slate-200',
};

// Full page (not a modal, no tabs) — everything about one program sits on
// the left in plain view, and the notes/messages thread stays pinned on
// the right so a conversation with the org is never more than a glance away.
export default function ProgramDetailPage() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const currentStudentId = localStorage.getItem('studentId');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHistory = async () => {
    try {
      const res = await api.get(`/applications/${applicationId}/my-history`);
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to fetch program history', err);
      setError('Failed to load this program.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!applicationId) return;
    setLoading(true);
    setError('');
    fetchHistory();
  }, [applicationId]);

  const fileName = (path) => {
    if (!path) return 'Document';
    const clean = path.split('?')[0];
    return decodeURIComponent(clean.split('/').pop());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={26} className="text-[#093fb4] animate-spin" />
          <p className="text-sm text-slate-400">Loading program...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <p className="text-sm font-medium text-red-500">{error || 'Program not found.'}</p>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#093fb4]"
        >
          <ArrowLeft size={15} /> Go back
        </button>
      </div>
    );
  }

  const statusStyle = STATUS_STYLES[data.status] || 'bg-slate-100 text-slate-500 border-slate-200';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-8">

        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#093fb4] transition-colors mb-6"
        >
          <ArrowLeft size={15} /> Back to My Scholarships
        </button>

        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
              {data.org_pic ? (
                <img src={data.org_pic} alt={data.org_name} className="w-full h-full object-cover" />
              ) : (
                <Building2 size={22} className="text-slate-400" />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-slate-900 truncate">{data.program_name}</h1>
              <p className="text-sm font-semibold text-[#093fb4] mt-0.5">{data.org_name}</p>
            </div>
          </div>
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border shrink-0 capitalize ${statusStyle}`}>
            {(data.status || '').replace(/_/g, ' ')}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* LEFT — everything about the program, always visible */}
          <div className="lg:col-span-2 space-y-6">

            <Section title="Overview" icon={<Info size={16} />}>
              {data.description && (
                <p className="text-sm text-slate-600 leading-relaxed mb-4">{data.description}</p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <InfoBox icon={<Calendar size={13} />} label="Submitted" value={data.submitted_at ? new Date(data.submitted_at).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'} />
                <InfoBox icon={<FileText size={13} />} label="Fund Type" value={data.fund_type || '—'} />
                {data.deadline && (
                  <InfoBox icon={<Calendar size={13} />} label="Deadline" value={new Date(data.deadline).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })} />
                )}
                {data.gwa_requirement && (
                  <InfoBox icon={<GraduationCap size={13} />} label="Min. GWA" value={data.gwa_requirement} />
                )}
                <InfoBox icon={<PhilippinePeso size={13} />} label="Total Received" value={`₱${Number(data.total_disbursed || 0).toLocaleString()}`} />
              </div>

              {['approved', 'active', 'renewal_approved'].includes(data.status) && (data.sub_email || data.contact_number || data.website) && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  <p className="text-xs font-medium text-slate-400 mb-1">Contact the organization</p>
                  {data.sub_email && (
                    <a href={`mailto:${data.sub_email}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-[#093fb4] transition-colors">
                      <Mail size={14} className="text-slate-400" /> {data.sub_email}
                    </a>
                  )}
                  {data.contact_number && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Phone size={14} className="text-slate-400" /> {data.contact_number}
                    </div>
                  )}
                  {data.website && (
                    <a href={data.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-[#093fb4] hover:underline">
                      <Globe size={14} /> {data.website}
                    </a>
                  )}
                </div>
              )}
            </Section>

            <Section title="Application Files" icon={<FileText size={16} />} subtitle="What you submitted when you first applied">
              <FileList
                items={data.responses}
                type="responses"
                fileName={fileName}
                emptyText="No application files on record."
              />
            </Section>

            <Section title="Compliance" icon={<FileCheck2 size={16} />} subtitle="Requests from the organization and what you sent back">
              {data.compliance_history?.length > 0 && (
                <div className="space-y-2 mb-4">
                  {data.compliance_history.map((req) => (
                    <div key={req.id} className="bg-blue-50/60 border border-blue-100 rounded-xl p-3.5">
                      <p className="text-sm text-slate-700">{req.reason}</p>
                      {req.created_at && (
                        <p className="text-xs text-slate-400 mt-1.5">
                          {new Date(req.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Live upload form — only renders when the org is currently waiting on you */}
              {data.status === 'under_review' && (
                <div className="mb-4">
                  <MyCompliance
                    applicationId={applicationId}
                    onSuccess={() => setData(prev => ({ ...prev, status: 'submitted' }))}
                  />
                </div>
              )}

              <p className="text-xs font-medium text-slate-400 mb-2">Documents you've submitted</p>
              <FileList
                items={data.compliance_docs}
                type="plain"
                fileName={fileName}
                emptyText="No compliance documents submitted yet."
              />
            </Section>

            <Section title="Renewal" icon={<RefreshCw size={16} />} subtitle="Documents submitted for renewal">
              {/* Live upload form — only renders when a renewal is currently required */}
              {data.status === 'renewing' && (
                <div className="mb-4">
                  <RenewCompliance
                    applicationId={applicationId}
                    onSuccess={() => setData(prev => ({ ...prev, status: 'renewal_pending' }))}
                  />
                </div>
              )}
              <FileList
                items={data.renewal_docs}
                type="plain"
                fileName={fileName}
                emptyText="No renewal documents submitted yet."
              />
            </Section>

            <Section title="Receipts" icon={<PhilippinePeso size={16} />} subtitle="Funds released to you for this program">
              <ReceiptsList receipts={data.receipts} />
            </Section>

          </div>

          {/* RIGHT — Notes, pinned so it's always visible while scrolling */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-8">
              <ApplicationTimeline
                applicationId={applicationId}
                currentUserRole="student"
                currentUserId={currentStudentId}
                height={640}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function Section({ title, subtitle, icon, children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <div className="flex items-center gap-2 text-slate-700 mb-1">
        <span className="text-[#093fb4]">{icon}</span>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      </div>
      {subtitle && <p className="text-sm text-slate-400 mb-4">{subtitle}</p>}
      <div className={subtitle ? '' : 'mt-4'}>{children}</div>
    </div>
  );
}

function InfoBox({ icon, label, value }) {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
      <p className="flex items-center gap-1.5 text-xs text-slate-400 mb-0.5">
        {icon} {label}
      </p>
      <p className="text-sm font-semibold text-slate-800 capitalize">{value}</p>
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-11 h-11 rounded-2xl bg-slate-50 flex items-center justify-center mb-2.5 text-slate-300">
        {icon}
      </div>
      <p className="text-sm text-slate-400">{text}</p>
    </div>
  );
}

function FileRow({ path, label, sublabel, fileName }) {
  return (
    <a
      href={path}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3.5 hover:border-[#093fb4]/40 hover:bg-white transition-colors group"
    >
      <div className="w-9 h-9 rounded-lg bg-[#093fb4]/10 flex items-center justify-center shrink-0">
        <FileText size={16} className="text-[#093fb4]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800 truncate">{label}</p>
        <p className="text-xs text-slate-400 truncate">{sublabel || fileName(path)}</p>
      </div>
      <ExternalLink size={14} className="text-slate-300 group-hover:text-[#093fb4] shrink-0 transition-colors" />
    </a>
  );
}

function FileList({ items, type, emptyText, fileName }) {
  if (!items || items.length === 0) {
    return <EmptyState icon={<FileText size={20} />} text={emptyText} />;
  }

  return (
    <div className="space-y-2.5">
      {items.map((item, i) => {
        if (type === 'responses') {
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
            <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
              <p className="text-xs text-slate-400">{item.field_label}</p>
              <p className="text-sm text-slate-700 mt-1">{item.text_value || '—'}</p>
            </div>
          );
        }
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

function ReceiptsList({ receipts }) {
  if (!receipts || receipts.length === 0) {
    return <EmptyState icon={<PhilippinePeso size={20} />} text="No funds received for this program yet." />;
  }

  const total = receipts.reduce((sum, r) => sum + Number(r.amount), 0);

  return (
    <div className="space-y-3">
      <div className="bg-[#093fb4] rounded-xl px-4 py-3.5 flex items-center justify-between text-white">
        <p className="text-sm text-white/70">Total Received</p>
        <p className="text-lg font-semibold">₱{total.toLocaleString()}</p>
      </div>
      {receipts.map((r) => (
        <div key={r.id} className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3.5">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
            <PhilippinePeso size={16} className="text-emerald-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-emerald-600">₱{Number(r.amount).toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {new Date(r.disbursed_at).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            {r.remarks && <p className="text-xs text-slate-400 mt-1 italic truncate">"{r.remarks}"</p>}
          </div>
        </div>
      ))}
    </div>
  );
}