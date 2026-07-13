import React, { useState, useEffect } from 'react';
import api from '../api';
import {
  University, Mail, Phone, Globe, CheckCircle2, Check,
  Clock, XCircle, ChevronDown, ChevronUp, AlertCircle, Bookmark, ClipboardCheck, FileText
} from 'lucide-react';
import StudentTopNav from './StudentTopNav';
import MyCompliance from './MyCompliance';
import RenewCompliance from './RenewCompliance';

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
];

// --- 1. PROGRESS TRACKING SUB-COMPONENT ---
// --- 1. PROGRESS TRACKING SUB-COMPONENT ---
// ==========================================
// 1. PROGRESS TRACKING SUB-COMPONENT (FOOLPROOF VERSION)
// ==========================================
function ScholarshipProgressTrack({ s }) {
  if (!s) return null;

  // Extract raw fields straight from the object to prevent cross-wiring
  const rawStatus = s.status || '';
  const displayStatus = s.display_status || '';
  const appliedAt = s.applied_at;

  // The ultimate truth: If backend status is approved or active, the pipeline is complete!
  const isFullyApproved = ['approved', 'active', 'renewal_approved'].includes(rawStatus);

  // Fallback chain for evaluation state
  const checkStatus = isFullyApproved ? rawStatus : (displayStatus || rawStatus);

  // Check if this record is running through a renewal timeline
  const isRenewalPipeline = ['renewing', 'renewal_pending', 'renewal_approved'].includes(displayStatus) || 
                            ['renewing', 'renewal_pending', 'renewal_approved'].includes(rawStatus);
  
  const formattedDate = appliedAt 
    ? new Date(appliedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

  // Renewal progress path steps
  const renewalSteps = [
    { label: "Renewal Started",      subtext: formattedDate,   isDone: (st) => isFullyApproved || ['renewing', 'renewal_pending', 'approved', 'active', 'renewal_approved'].includes(st) },
    { label: "Requirements Submitted", subtext: formattedDate, isDone: (st) => isFullyApproved || ['renewal_pending', 'approved', 'active', 'renewal_approved'].includes(st) },
    { label: "Under Review",         subtext: "Completed",     isActive: (st) => !isFullyApproved && st === 'renewal_pending', isDone: (st) => isFullyApproved || ['approved', 'active', 'renewal_approved'].includes(st) },
    { label: "Decision",             subtext: "Approved",      isActive: (st) => false, isDone: (st) => isFullyApproved || ['approved', 'active', 'renewal_approved'].includes(st) },
    { label: "Renewal Completed",    subtext: "Completed",     isActive: (st) => false, isDone: (st) => isFullyApproved || ['approved', 'active', 'renewal_approved'].includes(st) },
  ];

  // Initial application progress path steps
  const applicationSteps = [
    { label: "Application Started",  subtext: formattedDate,   isDone: (st) => true },
    { label: "Documents Submitted",  subtext: "Completed",     isDone: (st) => isFullyApproved || ['under_review', 'submitted', 'approved', 'active'].includes(st) },
    { label: "Under Review",         subtext: "In Progress",   isActive: (st) => !isFullyApproved && st === 'under_review', isDone: (st) => isFullyApproved || ['submitted', 'approved', 'active'].includes(st) },
    { label: "Decision",             subtext: "Pending",       isActive: (st) => !isFullyApproved && (st === 'submitted' || st === 'pending'), isDone: (st) => isFullyApproved || ['approved', 'active'].includes(st) },
    { label: "Scholar Activated",    subtext: "Completed",     isActive: (st) => false, isDone: (st) => isFullyApproved || ['approved', 'active'].includes(st) },
  ];

  const steps = isRenewalPipeline ? renewalSteps : applicationSteps;

  return (
    <div className="pt-2 pb-4 space-y-6">
      <p className="text-[12px] font-black uppercase tracking-widest text-[#093fb4]">
        {isRenewalPipeline ? "Renewal Progress" : "Application Progress"}
      </p>

      <div className="relative flex justify-between items-start w-full">
        {/* Background Connecting Bar */}
        <div className="absolute top-4 left-0 right-0 h-[2px] bg-slate-100 -z-10" />
        
        {steps.map((step, index) => {
          const done = step.isDone(checkStatus);
          const active = step.isActive ? step.isActive(checkStatus) : false;

          return (
            <div key={index} className="flex flex-col items-center flex-1 text-center relative px-1">
              
              {/* Step Node Circle */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                done 
                  ? 'bg-[#093fb4] text-white shadow-sm shadow-[#093fb4]/20' 
                  : active 
                    ? 'bg-white border-2 border-[#093fb4] text-[#093fb4]' 
                    : 'bg-white border border-slate-200 text-slate-400'
              }`}>
                {done ? <Check size={14} strokeWidth={3} /> : <span>{index + 1}</span>}
              </div>

              {/* Step Text Labels */}
              <div className="mt-3 space-y-0.5">
                <p className={`text-[12px] font-black leading-tight max-w-[110px] mx-auto ${
                  done || active ? 'text-slate-800' : 'text-slate-400'
                }`}>
                  {step.label}
                </p>
                <p className={`text-[11px] font-medium tracking-wide ${
                  active ? 'text-[#093fb4] font-bold animate-pulse' : 'text-slate-400'
                }`}>
                  {done && !active ? "Completed" : step.subtext}
                </p>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}


// ==========================================
// 2. DYNAMIC CARD DISPLAY SUB-MODULE
// ==========================================
function ScholarshipCard({ s, isExpanded, onToggle, onStatusUpdate }) {
  
  // Guard check if cleanStatus hits active/approved
  const cleanStatus = ['approved', 'active', 'renewal_approved'].includes(s.status)
    ? s.status
    : (s.display_status || s.status);

  const statusConfig = {
    approved:        { label: 'Approved',          cls: 'bg-emerald-50 text-emerald-600 border-emerald-200',   icon: <CheckCircle2 size={13} /> },
    active:          { label: 'Active Scholar',    cls: 'bg-emerald-50 text-emerald-600 border-emerald-200',   icon: <CheckCircle2 size={13} /> },
    renewal_approved:{ label: 'Active Scholar',    cls: 'bg-emerald-50 text-emerald-600 border-emerald-200',   icon: <CheckCircle2 size={13} /> },
    not_eligible:    { label: 'Not Eligible',      cls: 'bg-[#FF1E1E]/10 text-[#FF1E1E] border-[#FF1E1E]/20', icon: <XCircle size={13} /> },
    terminated:      { label: 'Terminated',        cls: 'bg-[#FF1E1E]/10 text-[#FF1E1E] border-[#FF1E1E]/20', icon: <XCircle size={13} /> },
    pending:         { label: 'Pending',           cls: 'bg-amber-50 text-amber-600 border-amber-200',         icon: <Clock size={13} /> },
    under_review:    { label: 'For Compliance',    cls: 'bg-[#093fb4]/10 text-[#093fb4] border-[#093fb4]/20',  icon: <Clock size={13} /> },
    submitted:       { label: 'Submitted',         cls: 'bg-emerald-50 text-emerald-600 border-emerald-200',   icon: <CheckCircle2 size={13} /> },
    renewing:        { label: 'Renewal Required',  cls: 'bg-amber-100 text-amber-700 border-amber-300',        icon: <AlertCircle size={13} /> },
    renewal_pending: { label: 'Renewal Submitted', cls: 'bg-emerald-50 text-emerald-600 border-emerald-200',   icon: <CheckCircle2 size={13} /> },
  };

  const sc = statusConfig[cleanStatus] || statusConfig.pending;

  return (
    <div className="bg-[#FFFCFB] rounded-2xl border border-black/8 shadow-sm overflow-hidden">
      <div className="p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
          {s.org_pic ? (
            <img src={s.org_pic} className="w-full h-full object-cover" alt={s.org_name} />
          ) : (
            <span className="text-lg font-black text-slate-400">{s.org_name?.substring(0, 2).toUpperCase()}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-black text-black uppercase leading-tight truncate">{s.title}</h2>
          <p className="text-[12px] font-black text-[#093fb4] uppercase tracking-widest mt-0.5">{s.org_name}</p>
          <p className="text-[11px] font-bold text-slate-400 mt-0.5">
            Applied: {new Date(s.applied_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={`flex items-center gap-1 text-[11px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${sc.cls}`}>
            {sc.icon} {sc.label}
          </span>
          <button
            onClick={onToggle}
            className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-[#093fb4] flex items-center gap-1 transition-colors"
          >
            {isExpanded ? <><ChevronUp size={14} /> Less Details</> : <><ChevronDown size={14} /> View Details</>}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-black/5 px-5 pb-5 pt-4 space-y-5">
          {s.description && (
            <p className="text-[13px] text-slate-500 leading-relaxed break-words">{s.description}</p>
          )}

          <div className="flex flex-wrap gap-2">
            {s.amount_range && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Amount</p>
                <p className="text-xs font-black text-[#093fb4]">{s.amount_range}</p>
              </div>
            )}
            {s.fund_type && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fund Type</p>
                <p className="text-xs font-black text-black capitalize">{s.fund_type}</p>
              </div>
            )}
            {s.gwa_requirement && (
              <div className="bg-[#093fb4]/5 border border-[#093fb4]/10 rounded-xl px-3 py-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#093fb4]/60">Min. GWA</p>
                <p className="text-xs font-black text-[#093fb4]">{s.gwa_requirement}</p>
              </div>
            )}
            {s.deadline && (
              <div className="bg-[#FF1E1E]/5 border border-[#FF1E1E]/10 rounded-xl px-3 py-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#FF1E1E]/60">Deadline</p>
                <p className="text-xs font-black text-[#FF1E1E]">
                  {new Date(s.deadline).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            )}
          </div>

          {cleanStatus === 'submitted' && (
            <div className="bg-gradient-to-r from-emerald-50/70 to-emerald-50/20 border border-emerald-100 rounded-xl px-4 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-100/80 flex items-center justify-center text-emerald-600 shrink-0">
                  <Clock size={16} />
                </div>
                <div>
                  <p className="text-[13px] font-black uppercase tracking-wider text-emerald-600">
                    Compliance Documents Submitted
                  </p>
                  <p className="text-[12px] text-slate-500 font-medium mt-0.5">
                    Waiting for the organization to verify your submitted requirements.
                  </p>
                </div>
              </div>
            </div>
          )}

          {cleanStatus === 'renewal_pending' && (
            <div className="bg-gradient-to-r from-blue-50/70 to-blue-50/20 border border-blue-100 rounded-xl px-4 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100/80 flex items-center justify-center text-[#093fb4] shrink-0">
                  <Clock size={16} />
                </div>
                <div>
                  <p className="text-[13px] font-black uppercase tracking-wider text-[#093fb4]">
                    Renewal Documents Submitted
                  </p>
                  <p className="text-[12px] text-slate-500 font-medium mt-0.5">
                    Waiting for the organization to review your submitted documents.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 🚀 FOOLPROOF CORRECTION: We pass the whole object directly to avoid any state desync */}
          <ScholarshipProgressTrack s={s} />

          {cleanStatus === 'under_review' && (
            <MyCompliance 
              applicationId={s.application_id} 
              onSuccess={() => onStatusUpdate(s.application_id, 'submitted')}
            />
          )}

          {cleanStatus === 'renewing' && (
            <RenewCompliance 
              applicationId={s.application_id} 
              onSuccess={() => onStatusUpdate(s.application_id, 'renewal_pending')}
            />
          )}

          {['approved', 'active', 'renewal_approved'].includes(cleanStatus) && (
            <div className="bg-[#093fb4]/5 border border-[#093fb4]/10 rounded-xl px-4 py-4">
              <p className="text-[11px] font-black uppercase tracking-widest text-[#093fb4] mb-3">Contact Organization</p>
              <div className="space-y-2">
                {s.sub_email && (
                  <a href={`mailto:${s.sub_email}`} className="flex items-center gap-2.5 text-[13px] font-bold text-slate-600 hover:text-[#093fb4]">
                    <Mail size={14} className="text-[#093fb4]" /> {s.sub_email}
                  </a>
                )}
                {s.contact_number && (
                  <div className="flex items-center gap-2.5 text-[13px] font-bold text-slate-600">
                    <Phone size={14} className="text-[#093fb4]" /> {s.contact_number}
                  </div>
                )}
                {s.website && (
                  <a href={s.website} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2.5 text-[13px] font-bold text-[#093fb4] hover:underline">
                    <Globe size={14} /> {s.website}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
// --- 2. MAIN CONTAINER CONTROLLER ---
export default function MyScholarships() {
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
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

  const handleStatusUpdate = (applicationId, nextStatus) => {
    setScholarships(prev => 
      prev.map(item => {
        if (item.application_id === applicationId) {
          return {
            ...item,
            status: nextStatus,
            display_status: nextStatus
          };
        }
        return item;
      })
    );
  };

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
  };

  const displayed = tabItems[activeTab] || [];

  return (
    <div className="min-h-screen bg-slate-50">
      <StudentTopNav />
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-10">

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
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
                  isExpanded={expanded === s.application_id}
                  onToggle={() => setExpanded(expanded === s.application_id ? null : s.application_id)}
                  onStatusUpdate={handleStatusUpdate}
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