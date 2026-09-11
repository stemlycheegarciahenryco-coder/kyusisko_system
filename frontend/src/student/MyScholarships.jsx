import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import {
  University, CheckCircle2,
  Clock, XCircle, AlertCircle, Bookmark, ClipboardCheck, FileText, Receipt, PhilippinePeso
} from 'lucide-react';
import StudentTopNav from './StudentTopNav';

const backendURL = 'http://localhost:5000';

// 🚀 FIXED: Added 'renewal_approved' to the active array group mapping
const getTabGroup = (status) => {
  if (['pending', 'not_eligible'].includes(status)) return 'pending';
  if (['under_review', 'compliance', 'need_changes', 'submitted'].includes(status)) return 'compliance'; 
  if (['approved', 'active', 'terminated', 'renewal_approved'].includes(status)) return 'active';
  if (['renewing', 'renewal_pending'].includes(status)) return 'renewal'; 
  return 'pending';
};

const TABS = [
  { key: 'pending', label: 'Applications', icon: <Clock size={14} />, desc: 'Pending submissions & initial decisions' },
  { key: 'compliance', label: 'For Compliance', icon: <ClipboardCheck size={14} />, desc: 'Requirements & verification reviews' },
  { key: 'active', label: 'Active', icon: <CheckCircle2 size={14} />, desc: 'Approved & active scholarships' },
  { key: 'renewal', label: 'Renewal', icon: <AlertCircle size={14} />, desc: 'Renewal requirements & active submissions' },
  { key: 'saved', label: 'Saved', icon: <Bookmark size={14} />, desc: 'Saved scholarships' },
  { key: 'receipts', label: 'Receipts', icon: <Receipt size={14} />, desc: 'Funds released to you, with dates and amounts' },
];

// ==========================================
// 2. DYNAMIC CARD DISPLAY SUB-MODULE
// ==========================================
function ScholarshipCard({ s, onOpenHistory }) {
  const cleanStatus = ['approved', 'active', 'renewal_approved'].includes(s.status)
    ? s.status
    : (s.display_status || s.status);

  const statusConfig = {
    approved:        { label: 'Approved',          cls: 'bg-emerald-50 text-emerald-600 border-emerald-200',   icon: <CheckCircle2 size={13} /> },
    active:          { label: 'Active Scholar',    cls: 'bg-emerald-50 text-emerald-600 border-emerald-200',   icon: <CheckCircle2 size={13} /> },
    renewal_approved:{ label: 'Active Scholar',    cls: 'bg-emerald-50 text-emerald-600 border-emerald-200',   icon: <CheckCircle2 size={13} /> },
    not_eligible:    { label: 'Not Eligible',      cls: 'bg-red-50 text-red-500 border-red-200',                icon: <XCircle size={13} /> },
    terminated:      { label: 'Terminated',        cls: 'bg-red-50 text-red-500 border-red-200',                icon: <XCircle size={13} /> },
    pending:         { label: 'Pending',           cls: 'bg-amber-50 text-amber-600 border-amber-200',         icon: <Clock size={13} /> },
    under_review:    { label: 'For Compliance',    cls: 'bg-[#093fb4]/10 text-[#093fb4] border-[#093fb4]/20',  icon: <Clock size={13} /> },
    submitted:       { label: 'Submitted',         cls: 'bg-emerald-50 text-emerald-600 border-emerald-200',   icon: <CheckCircle2 size={13} /> },
    renewing:        { label: 'Renewal Required',  cls: 'bg-amber-100 text-amber-700 border-amber-300',        icon: <AlertCircle size={13} /> },
    renewal_pending: { label: 'Renewal Submitted', cls: 'bg-emerald-50 text-emerald-600 border-emerald-200',   icon: <CheckCircle2 size={13} /> },
  };

  const sc = statusConfig[cleanStatus] || statusConfig.pending;

  return (
    <div
      onClick={() => onOpenHistory(s.application_id)}
      className="bg-[#FFFCFB] rounded-2xl border border-black/8 shadow-sm overflow-hidden cursor-pointer hover:border-[#093fb4]/30 hover:shadow-md transition-all"
    >
      <div className="p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
          {s.org_pic ? (
            <img src={s.org_pic} className="w-full h-full object-cover" alt={s.org_name} />
          ) : (
            <span className="text-lg font-bold text-slate-400">{s.org_name?.substring(0, 2).toUpperCase()}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-slate-900 leading-tight truncate">{s.title}</h2>
          <p className="text-[13px] font-semibold text-[#093fb4] mt-0.5">{s.org_name}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Applied {new Date(s.applied_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${sc.cls}`}>
          {sc.icon} {sc.label}
        </span>
      </div>
    </div>
  );
}
// --- 2. MAIN CONTAINER CONTROLLER ---
export default function MyScholarships() {
  const navigate = useNavigate();
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [savedScholarships, setSavedScholarships] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [totalReceived, setTotalReceived] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [scholarRes, savedRes, receiptsRes] = await Promise.all([
          api.get('/students/my-scholarships'),
          api.get('/recommendations/saved-scholarships'),
          api.get('/applications/my-disbursements'),
        ]);
        setScholarships(scholarRes.data.data || []);
        setSavedScholarships(savedRes.data.data || []);
        setReceipts(receiptsRes.data.data?.entries || []);
        setTotalReceived(receiptsRes.data.data?.total_received || 0);
      } catch (err) {
        console.error("My Scholarships Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#093fb4] border-t-transparent rounded-full animate-spin" />
        <p className="text-[13px] font-black uppercase tracking-widest text-slate-400">Loading...</p>
      </div>
    </div>
  );

  // 🚀 FIXED: If core status reflects approval, bypass display_status check to break out of tab loops
  const currentStatus = (s) => {
    if (['approved', 'active', 'renewal_approved'].includes(s.status)) {
      return s.status;
    }
    return s.display_status || s.status;
  };

  const grouped = {
    pending: scholarships.filter(s => getTabGroup(currentStatus(s)) === 'pending'),
    compliance: scholarships.filter(s => getTabGroup(currentStatus(s)) === 'compliance'),
    renewal: scholarships.filter(s => getTabGroup(currentStatus(s)) === 'renewal'),
    active: scholarships.filter(s => getTabGroup(currentStatus(s)) === 'active' && currentStatus(s) !== 'terminated'),
    terminated: scholarships.filter(s => getTabGroup(currentStatus(s)) === 'active' && currentStatus(s) === 'terminated'),
  };

  const tabItems = {
    pending: grouped.pending,
    compliance: grouped.compliance,
    renewal: grouped.renewal,
    active: [...grouped.active, ...grouped.terminated].filter(
      (s, i, arr) => arr.findIndex(x => x.application_id === s.application_id) === i
    ),
    saved: savedScholarships,
    receipts: receipts,
  };

  const displayed = tabItems[activeTab] || [];

  return (
    <div className="min-h-screen bg-slate-50">
      <StudentTopNav />
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-10">

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mb-6">
          {TABS.map(tab => {
            const count = tabItems[tab.key]?.length || 0;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setExpanded(null);
                }}
                className={`relative flex flex-col items-center justify-between text-center gap-1 py-3 px-1 rounded-2xl border font-black transition-all ${
                  isActive
                    ? 'bg-[#093fb4] text-white border-[#093fb4] shadow-lg shadow-[#093fb4]/20'
                    : 'bg-[#FFFCFB] text-black/50 border-black/8 hover:border-[#093fb4]/30 hover:text-[#093fb4]'
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  {tab.icon}
                  <span className="text-[12px] uppercase tracking-wider block leading-tight">{tab.label}</span>
                </div>
                {count > 0 && (
                  <span className={`text-[11px] font-black px-2 py-0.5 rounded-full mt-1 ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[#093fb4]/10 text-[#093fb4]'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <p className="text-[12px] font-bold text-black/30 uppercase tracking-widest mb-4">
          {TABS.find(t => t.key === activeTab)?.desc}
        </p>

        {activeTab === 'saved' ? (  
          displayed.length === 0 ? (
            <div className="bg-[#FFFCFB] rounded-2xl border border-black/8 p-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Bookmark size={24} className="text-slate-300" />
              </div>
              <p className="text-[13px] font-black uppercase tracking-widest text-slate-400">No saved scholarships</p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayed.map((s) => (
                <SavedScholarshipCard
                  key={`saved-${s.scholarship_id}`}
                  s={s}
                  onUnsave={async () => {
                    await api.delete(`/recommendations/${s.scholarship_id}/unsave`);
                    setSavedScholarships(prev => prev.filter(x => x.scholarship_id !== s.scholarship_id));
                  }}
                />
              ))}
            </div>
          )
        ) : activeTab === 'receipts' ? (
          <>
            <div className="bg-[#093fb4] rounded-2xl p-6 mb-4 flex items-center justify-between text-white shadow-lg shadow-[#093fb4]/20">
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-white/60 mb-1">Total Received</p>
                <p className="text-3xl font-black tracking-tight">₱{Number(totalReceived).toLocaleString()}</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                <Receipt size={26} />
              </div>
            </div>

            {displayed.length === 0 ? (
              <div className="bg-[#FFFCFB] rounded-2xl border border-black/8 p-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Receipt size={24} className="text-slate-300" />
                </div>
                <p className="text-[13px] font-black uppercase tracking-widest text-slate-400">
                  No funds received yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayed.map((r) => (
                  <ReceiptCard key={r.id} r={r} />
                ))}
              </div>
            )}
          </>
        ) : (
          displayed.length === 0 ? (
            <div className="bg-[#FFFCFB] rounded-2xl border border-black/8 p-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <University size={24} className="text-slate-300" />
              </div>
              <p className="text-[13px] font-black uppercase tracking-widest text-slate-400">
                Nothing here yet
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayed.map((s) => (
                <ScholarshipCard
                  key={`${activeTab}-${s.application_id}`}
                  s={s}
                  onOpenHistory={(appId) => navigate(`/my-scholarships/${appId}`)}
                />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}



function SavedScholarshipCard({ s, onUnsave }) {
  return (
    <div className="bg-[#FFFCFB] rounded-2xl border border-black/8 p-4 flex items-center justify-between gap-4">
      <div>
        <h3 className="text-xs font-black uppercase tracking-wide text-slate-800">{s.title}</h3>
        <p className="text-[12px] font-bold text-[#093fb4] mt-0.5">{s.org_name}</p>
      </div>
      <button 
        onClick={onUnsave}
        className="text-[12px] font-black text-red-500 hover:underline bg-red-50 px-2.5 py-1 rounded-md border border-red-100"
      >
        Remove
      </button>
    </div>
  );
}

function ReceiptCard({ r }) {
  const formattedDate = r.disbursed_at
    ? new Date(r.disbursed_at).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })
    : '—';

  return (
    <div className="bg-[#FFFCFB] rounded-2xl border border-black/8 p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
        <PhilippinePeso size={20} className="text-emerald-600" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xs font-black uppercase tracking-wide text-slate-800 truncate">{r.program_name}</h3>
          <p className="text-lg font-black text-emerald-600 shrink-0">₱{Number(r.amount).toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-[12px] font-bold text-[#093fb4]">{r.org_name}</p>
          <span className="text-slate-300">·</span>
          <p className="text-[12px] font-bold text-slate-400">{formattedDate}</p>
        </div>
        {r.remarks && (
          <p className="text-[11px] font-medium text-slate-400 mt-1.5 italic">"{r.remarks}"</p>
        )}
      </div>
    </div>
  );
}