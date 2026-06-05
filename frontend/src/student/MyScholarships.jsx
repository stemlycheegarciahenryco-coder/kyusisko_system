import React, { useState, useEffect } from 'react';
import api from '../api';
import {
  University, Mail, Phone, Globe, CheckCircle2,
  Clock, XCircle, ChevronDown, ChevronUp, AlertCircle, Bookmark, ClipboardCheck
} from 'lucide-react';
import StudentTopNav from './StudentTopNav';
import MyCompliance from './MyCompliance';
import RenewCompliance from './RenewCompliance';

const backendURL = 'http://localhost:5000';

const getTabGroup = (status) => {
  if (['pending', 'not_eligible'].includes(status)) return 'pending';
  if (['under_review', 'submitted'].includes(status)) return 'compliance'; 
  if (['approved', 'active', 'terminated'].includes(status)) return 'active';
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

  // Defined a handler function to update state immutably when child components signal a successful submission
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
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Loading...</p>
      </div>
    </div>
  );

  const currentStatus = (s) => s.display_status || s.status;

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
                  <span className="text-[10px] uppercase tracking-wider block leading-tight">{tab.label}</span>
                </div>
                {count > 0 && (
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full mt-1 ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[#093fb4]/10 text-[#093fb4]'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <p className="text-[10px] font-bold text-black/30 uppercase tracking-widest mb-4">
          {TABS.find(t => t.key === activeTab)?.desc}
        </p>

        {activeTab === 'saved' ? (  
          displayed.length === 0 ? (
            <div className="bg-[#FFFCFB] rounded-2xl border border-black/8 p-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Bookmark size={24} className="text-slate-300" />
              </div>
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">No saved scholarships</p>
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
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
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

function ScholarshipCard({ s, isExpanded, onToggle, onStatusUpdate }) {
  const currentStatus = s.display_status || s.status;

  const statusConfig = {
    approved:        { label: 'Approved',          cls: 'bg-emerald-50 text-emerald-600 border-emerald-200',   icon: <CheckCircle2 size={11} /> },
    active:          { label: 'Active Scholar',    cls: 'bg-emerald-50 text-emerald-600 border-emerald-200',   icon: <CheckCircle2 size={11} /> },
    not_eligible:    { label: 'Not Eligible',      cls: 'bg-[#FF1E1E]/10 text-[#FF1E1E] border-[#FF1E1E]/20', icon: <XCircle size={11} /> },
    terminated:      { label: 'Terminated',        cls: 'bg-[#FF1E1E]/10 text-[#FF1E1E] border-[#FF1E1E]/20', icon: <XCircle size={11} /> },
    pending:         { label: 'Pending',           cls: 'bg-amber-50 text-amber-600 border-amber-200',         icon: <Clock size={11} /> },
    under_review:    { label: 'For Compliance',    cls: 'bg-[#093fb4]/10 text-[#093fb4] border-[#093fb4]/20',  icon: <Clock size={11} /> },
    renewing:        { label: 'Renewal Required',  cls: 'bg-amber-100 text-amber-700 border-amber-300',        icon: <AlertCircle size={11} /> },
    renewal_pending: { label: 'Renewal Submitted', cls: 'bg-[#093fb4]/10 text-[#093fb4] border-[#093fb4]/20', icon: <Clock size={11} /> },
  };

  const sc = statusConfig[currentStatus] || statusConfig.pending;

  return (
    <div className="bg-[#FFFCFB] rounded-2xl border border-black/8 shadow-sm overflow-hidden">
      <div className="p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
          {s.org_pic ? (
            <img src={`${backendURL}/${s.org_pic}`} className="w-full h-full object-cover" alt={s.org_name} />
          ) : (
            <span className="text-lg font-black text-slate-400">{s.org_name?.substring(0, 2).toUpperCase()}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-black text-black uppercase leading-tight truncate">{s.title}</h2>
          <p className="text-[10px] font-black text-[#093fb4] uppercase tracking-widest mt-0.5">{s.org_name}</p>
          <p className="text-[9px] font-bold text-slate-400 mt-0.5">
            Applied: {new Date(s.applied_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${sc.cls}`}>
            {sc.icon} {sc.label}
          </span>
          <button
            onClick={onToggle}
            className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-[#093fb4] flex items-center gap-1 transition-colors"
          >
            {isExpanded ? <><ChevronUp size={12} /> Less</> : <><ChevronDown size={12} /> Details</>}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-black/5 px-5 pb-5 pt-4 space-y-4">
          {s.description && (
            <p className="text-[11px] text-slate-500 leading-relaxed break-words">{s.description}</p>
          )}

          <div className="flex flex-wrap gap-2">
            {s.amount_range && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Amount</p>
                <p className="text-xs font-black text-[#093fb4]">{s.amount_range}</p>
              </div>
            )}
            {s.fund_type && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Fund Type</p>
                <p className="text-xs font-black text-black capitalize">{s.fund_type}</p>
              </div>
            )}
            {s.gwa_requirement && (
              <div className="bg-[#093fb4]/5 border border-[#093fb4]/10 rounded-xl px-3 py-2">
                <p className="text-[8px] font-black uppercase tracking-widest text-[#093fb4]/60">Min. GWA</p>
                <p className="text-xs font-black text-[#093fb4]">{s.gwa_requirement}</p>
              </div>
            )}
            {s.deadline && (
              <div className="bg-[#FF1E1E]/5 border border-[#FF1E1E]/10 rounded-xl px-3 py-2">
                <p className="text-[8px] font-black uppercase tracking-widest text-[#FF1E1E]/60">Deadline</p>
                <p className="text-xs font-black text-[#FF1E1E]">
                  {new Date(s.deadline).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            )}
          </div>

          {currentStatus === 'under_review' && (
            <MyCompliance 
              applicationId={s.application_id} 
              onSuccess={() => onStatusUpdate(s.application_id, 'submitted')}
            />
          )}

          {currentStatus === 'renewing' && (
            <RenewCompliance 
              applicationId={s.application_id} 
              onSuccess={() => onStatusUpdate(s.application_id, 'renewal_pending')}
            />
          )}

          {currentStatus === 'renewal_pending' && (
            <div className="bg-[#093fb4]/5 border border-[#093fb4]/10 rounded-xl px-4 py-4 text-center">
              <Clock size={18} className="text-[#093fb4] mx-auto mb-2" />
              <p className="text-[10px] font-black uppercase tracking-widest text-[#093fb4]">
                Renewal Documents Submitted
              </p>
              <p className="text-[10px] text-[#093fb4]/60 font-medium mt-1">
                Awaiting organization review
              </p>
            </div>
          )}

          {(currentStatus === 'approved' || currentStatus === 'active') && (
            <div className="bg-[#093fb4]/5 border border-[#093fb4]/10 rounded-xl px-4 py-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-[#093fb4] mb-3">Contact Organization</p>
              <div className="space-y-2">
                {s.sub_email && (
                  <a href={`mailto:${s.sub_email}`} className="flex items-center gap-2.5 text-[11px] font-bold text-slate-600 hover:text-[#093fb4]">
                    <Mail size={12} className="text-[#093fb4]" /> {s.sub_email}
                  </a>
                )}
                {s.contact_number && (
                  <div className="flex items-center gap-2.5 text-[11px] font-bold text-slate-600">
                    <Phone size={12} className="text-[#093fb4]" /> {s.contact_number}
                  </div>
                )}
                {s.website && (
                  <a href={s.website} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2.5 text-[11px] font-bold text-[#093fb4] hover:underline">
                    <Globe size={12} /> {s.website}
                  </a>
                )}
              </div>
            </div>
          )}

          {currentStatus === 'pending' && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-center text-[10px] font-black uppercase text-amber-600">
              Your application is pending review.
            </div>
          )}

          {currentStatus === 'not_eligible' && (
            <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-center text-[10px] font-black uppercase text-slate-400">
              This application was marked as not eligible.
            </div>
          )}

          {currentStatus === 'terminated' && (
            <div className="bg-[#FF1E1E]/5 border border-[#FF1E1E]/10 rounded-xl px-4 py-3 text-center text-[10px] font-black uppercase text-[#FF1E1E]">
              This scholarship agreement has been terminated.
            </div>
          )}
        </div>
      )}
    </div>
  );
}