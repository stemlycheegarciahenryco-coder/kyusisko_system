import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import {
  University, CheckCircle2,
  Clock, XCircle, AlertCircle, Bookmark, ClipboardCheck
} from 'lucide-react';

// NOTE: StudentTopNav is intentionally NOT imported here anymore.
// StudentLayout already renders it for every student page.

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
  //{ key: 'renewal', label: 'Renewal', icon: <AlertCircle size={14} />, desc: 'Renewal requirements & active submissions' },
  { key: 'saved', label: 'Saved', icon: <Bookmark size={14} />, desc: 'Saved scholarships' },
];

// ==========================================
// 2. DYNAMIC CARD DISPLAY SUB-MODULE
// ==========================================
function ScholarshipCard({ s, onOpenHistory, index = 0 }) {
  const cleanStatus = ['approved', 'active', 'renewal_approved'].includes(s.status)
    ? s.status
    : (s.display_status || s.status);

  const statusConfig = {
    approved:        { label: 'Approved',          cls: 'bg-white text-green-700 border-green-600',   icon: <CheckCircle2 size={12} /> },
    active:          { label: 'Active Scholar',    cls: 'bg-white text-green-700 border-green-600',   icon: <CheckCircle2 size={12} /> },
    renewal_approved:{ label: 'Active Scholar',    cls: 'bg-white text-green-700 border-green-600',   icon: <CheckCircle2 size={12} /> },
    not_eligible:    { label: 'Not Eligible',      cls: 'bg-white text-red-600 border-red-600',                icon: <XCircle size={12} /> },
    terminated:      { label: 'Terminated',        cls: 'bg-white text-red-600 border-red-600',                icon: <XCircle size={12} /> },
    pending:         { label: 'Pending',           cls: 'bg-white text-amber-600 border-amber-500',         icon: <Clock size={12} /> },
    under_review:    { label: 'For Compliance',    cls: 'bg-white text-[#093fb4] border-[#093fb4]',  icon: <Clock size={12} /> },
    submitted:       { label: 'Submitted',         cls: 'bg-white text-green-700 border-green-600',   icon: <CheckCircle2 size={12} /> },
    renewing:        { label: 'Renewal Required',  cls: 'bg-white text-amber-700 border-amber-600',        icon: <AlertCircle size={12} /> },
    renewal_pending: { label: 'Renewal Submitted', cls: 'bg-white text-green-700 border-green-600',   icon: <CheckCircle2 size={12} /> },
  };

  const sc = statusConfig[cleanStatus] || statusConfig.pending;

  return (
    <div
      onClick={() => onOpenHistory(s.application_id)}
      className="my-card bg-white rounded-3xl border border-blue-100 shadow-sm overflow-hidden cursor-pointer hover:border-[#093fb4] hover:-translate-y-0.5 hover:shadow-md transition-all duration-300"
      style={{ animationDelay: `${Math.min(index, 8) * 90}ms` }}
    >
      <div className="p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white border border-blue-100 shrink-0 flex items-center justify-center">
          {s.org_pic ? (
            <img src={s.org_pic} className="w-full h-full object-cover" alt={s.org_name} />
          ) : (
            <span className="text-base font-black text-[#093fb4]">{s.org_name?.substring(0, 2).toUpperCase()}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-[14px] font-black text-black uppercase tracking-tight leading-tight truncate">{s.title}</h2>
          <p className="text-[11px] font-black text-[#093fb4] uppercase tracking-widest mt-1">{s.org_name}</p>
          <p className="text-[10px] font-black uppercase tracking-widest text-black mt-1">
            Applied {new Date(s.applied_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <span className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border shrink-0 ${sc.cls}`}>
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [scholarRes, savedRes] = await Promise.all([
          api.get('/students/my-scholarships'),
          api.get('/recommendations/saved-scholarships'),
        ]);
        setScholarships(scholarRes.data.data || []);
        setSavedScholarships(savedRes.data.data || []);
      } catch (err) {
        console.error("My Scholarships Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#093fb4] border-t-transparent rounded-full animate-spin" />
        <p className="text-[11px] font-black uppercase tracking-widest text-black">Loading...</p>
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
  };

  const displayed = tabItems[activeTab] || [];

  return (
    // The layout already provides the page background, nav, width and padding.
    <div className="w-full">
      <style>{`
        @keyframes myCardIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes myCardFlash {
          0%   { border-color: #dbeafe; box-shadow: 0 0 0 0 #dbeafe; }
          35%  { border-color: #093fb4; box-shadow: 0 0 0 4px #dbeafe; }
          70%  { border-color: #093fb4; box-shadow: 0 0 0 0 #dbeafe; }
          100% { border-color: #dbeafe; box-shadow: 0 0 0 0 #dbeafe; }
        }
        .my-card { animation: myCardIn 0.5s ease-out backwards, myCardFlash 1.6s ease-in-out backwards; }
        @media (prefers-reduced-motion: reduce) { .my-card { animation: none; } }
      `}</style>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
        {TABS.map(tab => {
          const count = tabItems[tab.key]?.length || 0;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex flex-col items-center justify-between text-center gap-1 py-3 px-2 rounded-3xl border font-black transition-all duration-300 ${
                isActive
                  ? 'bg-[#093fb4] text-white border-[#093fb4] shadow-md'
                  : 'bg-white text-black border-blue-100 hover:border-[#093fb4] hover:text-[#093fb4]'
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                {tab.icon}
                <span className="text-[11px] font-black uppercase tracking-widest block leading-tight">{tab.label}</span>
              </div>
              {count > 0 && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full mt-1 ${
                  isActive ? 'bg-white text-[#093fb4]' : 'bg-white text-[#093fb4] border border-[#093fb4]'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-[10px] font-black text-black uppercase tracking-widest mb-4 ml-1">
        {TABS.find(t => t.key === activeTab)?.desc}
      </p>

      {activeTab === 'saved' ? (
        displayed.length === 0 ? (
          <div className="bg-white rounded-3xl border border-blue-100 shadow-sm p-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white border border-blue-100 flex items-center justify-center mx-auto mb-4">
              <Bookmark size={24} className="text-black" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-black">No saved scholarships</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.map((s, i) => (
              <SavedScholarshipCard
                key={`saved-${s.scholarship_id}`}
                s={s}
                index={i}
                onUnsave={async () => {
                  await api.delete(`/recommendations/${s.scholarship_id}/unsave`);
                  setSavedScholarships(prev => prev.filter(x => x.scholarship_id !== s.scholarship_id));
                }}
              />
            ))}
          </div>
        )
      ) : (
        displayed.length === 0 ? (
          <div className="bg-white rounded-3xl border border-blue-100 shadow-sm p-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white border border-blue-100 flex items-center justify-center mx-auto mb-4">
              <University size={24} className="text-black" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-black">
              Nothing here yet
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayed.map((s, i) => (
              <ScholarshipCard
                key={`${activeTab}-${s.application_id}`}
                s={s}
                index={i}
                onOpenHistory={(appId) => navigate(`/my-scholarships/${appId}`)}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}

function SavedScholarshipCard({ s, onUnsave, index = 0 }) {
  return (
    <div
      className="my-card bg-white rounded-3xl border border-blue-100 shadow-sm p-5 flex items-center justify-between gap-4 transition-all duration-300 hover:border-[#093fb4] hover:-translate-y-0.5 hover:shadow-md"
      style={{ animationDelay: `${Math.min(index, 8) * 90}ms` }}
    >
      <div className="min-w-0">
        <h3 className="text-[14px] font-black uppercase tracking-tight text-black truncate">{s.title}</h3>
        <p className="text-[11px] font-black text-[#093fb4] uppercase tracking-widest mt-1">{s.org_name}</p>
      </div>
      <button
        onClick={onUnsave}
        className="text-[10px] font-black uppercase tracking-widest text-red-600 bg-white hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-lg border border-red-600 transition-colors shrink-0"
      >
        Remove
      </button>
    </div>
  );
} 
