import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import ApplicationTimeline from '../component/ApplicationTimeline';
import MyCompliance from './MyCompliance';
import RenewCompliance from './RenewCompliance';
import DisbursementLedger from '../component/StudentDisbursementLedger';
import FilePreviewModal from '../component/FilePreviewModal';
import {
  ArrowLeft, Loader2, FileText, FileCheck2, RefreshCw,
  Info, Building2, Mail, Phone, Globe, Calendar, GraduationCap, Eye
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
  rejected:        'bg-red-50 text-red-600 border-red-200',
  terminated:      'bg-black/5 text-black/50 border-black/10',
};

const peso = (n) => `₱${Number(n || 0).toLocaleString()}`;
const fmtDate = (d, month = 'short') =>
  d ? new Date(d).toLocaleDateString('en-PH', { month, day: 'numeric', year: 'numeric' }) : '—';

/*
  The page is rendered as a full-screen layer (fixed inset-0) so any left
  student profile / sidebar coming from a parent layout is covered and not shown.
*/
const PAGE_SHELL = "fixed inset-0 z-[60] overflow-y-auto bg-[#FFFCFB] font-['Inter']";

export default function ProgramDetailPage() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const currentStudentId = localStorage.getItem('studentId');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null); // { url, name }

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

  // The page is a full-screen layer with its own scroll, so freeze the page
  // behind it. This leaves exactly ONE scrollbar on the right of the browser.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const fileName = (path) => {
    if (!path) return 'Document';
    const clean = path.split('?')[0];
    return decodeURIComponent(clean.split('/').pop());
  };

  const goBack = () => navigate('/MyScholarships');

  if (loading) {
    return (
      <div className={`${PAGE_SHELL} flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} strokeWidth={2.5} className="text-[#093fb4] animate-spin" />
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-black/40">Loading Program Data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={`${PAGE_SHELL} flex flex-col items-center justify-center gap-5`}>
        <p className="text-sm font-black uppercase tracking-wider text-red-600 bg-red-50 px-6 py-3 rounded-xl border-2 border-red-100">{error || 'Program not found.'}</p>
        <button
          onClick={goBack}
          className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-black/50 hover:text-[#093fb4] transition-colors"
        >
          <ArrowLeft size={16} strokeWidth={2.5} /> Go back
        </button>
      </div>
    );
  }

  const statusStyle = STATUS_STYLES[data.status] || 'bg-black/5 text-black/50 border-black/10';
  const totalReceived = (data.receipts || []).reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const canSeeContact =
    ['approved', 'active', 'renewal_approved'].includes(data.status) &&
    (data.sub_email || data.contact_number || data.website);

  return (
    <div className={PAGE_SHELL}>
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-5 md:py-6">

        <button
          onClick={goBack}
          className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-black/40 hover:text-[#093fb4] transition-colors mb-4"
        >
          <ArrowLeft size={16} strokeWidth={2.5} /> Back to My Scholarships
        </button>

        {/* Header */}
        <div className="bg-white border-2 border-black/5 rounded-3xl px-6 py-5 mb-5 flex items-center justify-between gap-5 flex-wrap shadow-sm">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-black/5 border-2 border-black/5 flex items-center justify-center shrink-0 overflow-hidden">
              {data.org_pic ? (
                <img src={data.org_pic} alt={data.org_name} className="w-full h-full object-cover" />
              ) : (
                <Building2 size={26} strokeWidth={2} className="text-black/30" />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-black text-black uppercase tracking-tight truncate">{data.program_name}</h1>
              <p className="text-[11px] font-black text-[#093fb4] uppercase tracking-[0.2em] mt-1">{data.org_name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-[#093fb4] text-white rounded-xl px-4 py-2 shadow-md shadow-[#093fb4]/20">
              <p className="text-[9px] font-black uppercase tracking-widest text-white/70">Total Received</p>
              <p className="text-base font-black leading-tight">{peso(totalReceived)}</p>
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-xl border-2 ${statusStyle}`}>
              {(data.status || '').replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

          {/* LEFT — program content */}
          <div className="lg:col-span-8 space-y-5">

            <Section title="Overview" icon={<Info size={16} strokeWidth={2.5} />}>
              {data.description && (
                <p className="text-sm font-bold text-black/70 leading-relaxed mb-4">{data.description}</p>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <InfoBox icon={<Calendar size={13} strokeWidth={2.5} />} label="Submitted" value={fmtDate(data.submitted_at, 'long')} />
                <InfoBox icon={<FileText size={13} strokeWidth={2.5} />} label="Fund Type" value={data.fund_type || '—'} />
                {data.deadline && (
                  <InfoBox icon={<Calendar size={13} strokeWidth={2.5} />} label="Deadline" value={fmtDate(data.deadline, 'long')} />
                )}
                {data.gwa_requirement && (
                  <InfoBox icon={<GraduationCap size={13} strokeWidth={2.5} />} label="Min. GWA" value={data.gwa_requirement} />
                )}
              </div>

              {canSeeContact && (
                <div className="mt-4 pt-4 border-t-2 border-black/5">
                  <p className="text-[10px] font-black text-black/40 uppercase tracking-widest mb-2">Contact the organization</p>
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    {data.sub_email && (
                      <a href={`mailto:${data.sub_email}`} className="flex items-center gap-2 text-xs font-black text-black/70 tracking-wider hover:text-[#093fb4] transition-colors group">
                        <Mail size={15} strokeWidth={2.5} className="text-black/30 group-hover:text-[#093fb4]" /> {data.sub_email}
                      </a>
                    )}
                    {data.contact_number && (
                      <div className="flex items-center gap-2 text-xs font-black text-black/70 tracking-wider">
                        <Phone size={15} strokeWidth={2.5} className="text-black/30" /> {data.contact_number}
                      </div>
                    )}
                    {data.website && (
                      <a href={data.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-black text-[#093fb4] tracking-wider hover:underline">
                        <Globe size={15} strokeWidth={2.5} /> {data.website}
                      </a>
                    )}
                  </div>
                </div>
              )}
            </Section>

            {/* Disbursement ledger (own component) */}
            <DisbursementLedger receipts={data.receipts} programName={data.program_name} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
              <div className="space-y-5">
                <Section title="Application Files" icon={<FileText size={16} strokeWidth={2.5} />} subtitle="What you submitted when you first applied">
                  <FileList
                    items={data.responses}
                    type="responses"
                    fileName={fileName}
                    onPreview={setPreview}
                    emptyText="No application files on record."
                  />
                </Section>

                <Section title="Renewal" icon={<RefreshCw size={16} strokeWidth={2.5} />} subtitle="Documents submitted for renewal">
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
                    onPreview={setPreview}
                    emptyText="No renewal documents submitted yet."
                  />
                </Section>
              </div>

              <Section title="Compliance" icon={<FileCheck2 size={16} strokeWidth={2.5} />} subtitle="Requests from the organization and what you sent back">
                {data.compliance_history?.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {data.compliance_history.map((req) => (
                      <div key={req.id} className="bg-[#093fb4]/5 border-2 border-[#093fb4]/15 rounded-2xl p-4">
                        <p className="text-sm font-bold text-black/80">{req.reason}</p>
                        {req.created_at && (
                          <p className="text-[10px] font-black uppercase tracking-widest text-black/40 mt-2">
                            {fmtDate(req.created_at)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {data.status === 'under_review' && (
                  <div className="mb-4">
                    <MyCompliance
                      applicationId={applicationId}
                      onSuccess={() => setData(prev => ({ ...prev, status: 'submitted' }))}
                    />
                  </div>
                )}

                <p className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-3 ml-1">Documents you've submitted</p>
                <FileList
                  items={data.compliance_docs}
                  type="plain"
                  fileName={fileName}
                  onPreview={setPreview}
                  emptyText="No compliance documents submitted yet."
                />
              </Section>
            </div>

          </div>

          {/* RIGHT — Notes board (grows with the page, no inner scrollbar) */}
          <div className="lg:col-span-4">
            <ApplicationTimeline
              applicationId={applicationId}
              currentUserRole="student"
              currentUserId={currentStudentId}
            />
          </div>

        </div>
      </div>

      <FilePreviewModal file={preview} onClose={() => setPreview(null)} />
    </div>
  );
}

function Section({ title, subtitle, icon, children }) {
  return (
    <div className="bg-white border-2 border-black/5 shadow-sm rounded-3xl p-5 md:p-6">
      <div className="flex items-center gap-3 text-black mb-1">
        <div className="w-8 h-8 rounded-xl bg-[#093fb4]/10 text-[#093fb4] flex items-center justify-center shrink-0">
          {icon}
        </div>
        <h2 className="text-base font-black uppercase tracking-wider">{title}</h2>
      </div>
      {subtitle && <p className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-4 ml-11">{subtitle}</p>}
      <div className={subtitle ? '' : 'mt-4'}>{children}</div>
    </div>
  );
}

function InfoBox({ icon, label, value }) {
  return (
    <div className="bg-black/5 rounded-2xl px-4 py-3 border-2 border-transparent hover:bg-white hover:border-black/10 transition-colors">
      <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-black/40">
        <span className="text-[#093fb4]">{icon}</span> {label}
      </p>
      <p className="text-sm font-black text-black capitalize mt-1">{value}</p>
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center bg-black/5 border-2 border-dashed border-black/10 rounded-2xl">
      <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center mb-2 text-black/20">
        {icon}
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-black/40">{text}</p>
    </div>
  );
}

function FileRow({ path, label, sublabel, fileName, onPreview }) {
  return (
    <button
      type="button"
      onClick={() => onPreview({ url: path, name: label })}
      className="w-full text-left flex items-center gap-3 bg-black/5 border-2 border-transparent rounded-2xl p-3 hover:border-[#093fb4] hover:bg-white hover:shadow-sm transition-all group"
    >
      <div className="w-9 h-9 rounded-xl bg-[#093fb4]/10 flex items-center justify-center shrink-0">
        <FileText size={16} strokeWidth={2.5} className="text-[#093fb4]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-black truncate uppercase">{label}</p>
        <p className="text-[10px] font-bold text-black/50 truncate tracking-wide mt-0.5">{sublabel || fileName(path)}</p>
      </div>
      <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-black/30 group-hover:text-[#093fb4] shrink-0 transition-colors">
        <Eye size={16} strokeWidth={2.5} /> Preview
      </span>
    </button>
  );
}

function FileList({ items, type, emptyText, fileName, onPreview }) {
  if (!items || items.length === 0) {
    return <EmptyState icon={<FileText size={22} strokeWidth={2} />} text={emptyText} />;
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
                onPreview={onPreview}
              />
            );
          }
          return (
            <div key={i} className="bg-black/5 border-2 border-transparent rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#093fb4]">{item.field_label}</p>
              <p className="text-sm font-black text-black mt-1.5">{item.text_value || '—'}</p>
            </div>
          );
        }
        return (
          <FileRow
            key={i}
            path={item.file_path}
            label={fileName(item.file_path)}
            sublabel={item.created_at ? fmtDate(item.created_at) : null}
            fileName={fileName}
            onPreview={onPreview}
          />
        );
      })}
    </div>
  );
}