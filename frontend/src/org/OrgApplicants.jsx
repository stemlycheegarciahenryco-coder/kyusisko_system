import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { backendURL } from '../api';
import { ExternalLink, ArrowLeft, Users, Clock, CheckCircle, RefreshCw, Search, XCircle, AlertTriangle } from 'lucide-react';
import { ActionConfirmModal, ComplianceModal } from './ApplicationModals';

const TABS = [
  { key: 'all',            label: 'All',                   icon: Users,        statuses: null },
  { key: 'pending',        label: 'Pending',               icon: Clock,        statuses: ['pending'] },
  { key: 'compliance',     label: 'For Compliance',        icon: AlertTriangle, statuses: ['compliance', 'under_review', 'need_changes'] }, 
  { key: 'activescholar',  label: 'Active Scholars',       icon: CheckCircle,  statuses: ['approved', 'active'] },
  { key: 'renewal',        label: 'Renewal',               icon: RefreshCw,    statuses: ['renewing', 'submitted'] },
  { key: 'noteligible',    label: 'Not Eligible / Terminated', labelShort: 'Not Eligible / Terminated', icon: XCircle, statuses: ['rejected', 'not_eligible', 'terminated'] },
];

export default function OrgApplicants() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [terminateModal, setTerminateModal] = useState({ show: false, app: null });
  const [renewModal, setRenewModal] = useState({ show: false, app: null });

  const handleTerminateConfirm = async () => {
    try {
      await api.patch(`/renewals/${terminateModal.app.id}/terminate`, { status: 'terminated' });
      setTerminateModal({ show: false, app: null });
      fetchApplicants();
    } catch (err) {
      console.error("Failed to terminate applicant", err);
    }
  };

  const handleRenewConfirm = async (reason, docs) => {
    try {
      await api.patch(`/renewals/${renewModal.app.id}/renew`, { reason, docs });
      setRenewModal({ show: false, app: null });
      fetchApplicants();
    } catch (err) {
      console.error("Failed to renew applicant", err);
    }
  };

  const fetchApplicants = async () => {
    try {
      const res = await api.get(`/applications/scholarship/${id}/applicants`);
      setApplications(res.data.data || res.data);
    } catch (err) {
      console.error("Failed to fetch applicants", err);
    } finally {
      setLoading(false);
    }   
  };

  useEffect(() => { fetchApplicants(); }, [id]);

  const activeTabConfig = TABS.find(t => t.key === activeTab);

  const filteredApps = applications.filter(app => {
    const matchesTab = !activeTabConfig?.statuses || activeTabConfig.statuses.includes(app.status);
    const fullName = `${app.sfirst_name || ''} ${app.slast_name || ''}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || 
                          (app.student_email || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const countFor = (tab) =>
    !tab.statuses
      ? applications.length
      : applications.filter(a => tab.statuses.includes(a.status)).length;

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#093fb4] border-t-transparent rounded-full animate-spin" />
        <p className="text-[11px] font-black uppercase tracking-widest text-black">Loading Applicants...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-6xl mx-auto">

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-black hover:text-[#093fb4] transition-colors mb-6"
        >
          <ArrowLeft size={16} /> Back to Programs
        </button>

        {/* Page Header + Searchbar Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-black uppercase tracking-tight">
              Scholarship <span className="text-[#093fb4]">Applicants</span>
            </h1>
            <p className="text-[11px] font-bold text-black mt-1 uppercase tracking-widest">
              {applications.length} total applications found
            </p>
          </div>

          {/* Searchbar Component */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-black focus:border-[#093fb4] focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Dynamic Sub-tabs Selection Row */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
          {TABS.map((tab) => {
            const { key, label, icon: Icon } = tab;
            const count = countFor(tab);
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border shrink-0 ${
                  isActive
                    ? 'bg-[#093fb4] text-white border-[#093fb4] shadow-md shadow-[#093fb4]/20'
                    : 'bg-white text-slate-600 border-slate-300 hover:text-[#093fb4] hover:border-[#093fb4]'
                }`}
              >
                <Icon size={12} />
                {label}
                <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-600 text-white'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Presentation Display Table */}
        <div className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-300 bg-white text-[10px] font-black uppercase tracking-widest text-slate-600">
                  <th className="py-4 px-6">Profile & Name</th>
                  <th className="py-4 px-6">Gmail / Email</th>
                  <th className="py-4 px-6">Contact Number</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredApps.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                      No matching records found in this category
                    </td>
                  </tr>
                ) : (
                  filteredApps.map((app) => {
                    const hasValidImg = app.sprofile_pic && app.sprofile_pic.trim() !== '';
                    const fullImgUrl = hasValidImg 
                      ? (app.sprofile_pic.startsWith('http') ? app.sprofile_pic : `${backendURL}/uploads/${app.sprofile_pic}`)
                      : null;

                    // Consolidated dynamic layout lookup path for standard or nested contact numbers
                    const verifiedContactNumber = app.scontact_number || app.contact_number || app.student_contact || '—';

                    return (
                      <tr key={app.id} className="hover:bg-slate-50 transition-colors text-black">
                        
                        {/* Avatar Profile Pic + Name */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            {hasValidImg ? (
                              <img 
                                src={fullImgUrl} 
                                alt="" 
                                className="w-9 h-9 rounded-xl object-cover border border-slate-300 bg-white shrink-0"
                                onError={(e) => { 
                                  e.target.style.display = 'none';
                                  if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            
                            <div 
                              className="w-9 h-9 rounded-xl bg-[#093fb4] flex items-center justify-center text-white font-black text-xs uppercase shrink-0"
                              style={{ display: hasValidImg ? 'none' : 'flex' }}
                            >
                              {app.sfirst_name?.[0]}{app.slast_name?.[0]}
                            </div>

                            <div>
                              <span className="block text-xs font-black text-black uppercase tracking-tight">
                                {app.sfirst_name} {app.slast_name}
                              </span>
                              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                ID: #APP-{app.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Student Gmail contact field */}
                        <td className="py-4 px-6 text-xs font-medium text-slate-700">
                          {app.student_email || '—'}
                        </td>

                        {/* Student Mobile Phone Contact number */}
                        <td className="py-4 px-6 text-xs font-mono font-medium text-slate-700">
                          {verifiedContactNumber} 
                        </td>

                        {/* Current Application Tracking Status Badge */}
                        <td className="py-4 px-6 text-center">
                          <StatusBadge status={app.status} />
                        </td>

                        {/* Actions options layout */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => navigate(`/scholarship-applications/${id}/applicants/${app.id}`)}
                              className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-white border border-slate-300 hover:bg-[#093fb4] hover:text-white text-slate-700 px-3 py-2 rounded-xl transition-colors"
                            >
                              View <ExternalLink size={10} />
                            </button>

                            {['approved', 'active', 'renewing', 'submitted'].includes(app.status) && (
                              <>
                                <button
                                  onClick={() => ['approved', 'active'].includes(app.status) && setRenewModal({ show: true, app })}
                                  disabled={['renewing', 'submitted'].includes(app.status)}
                                  className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl transition-colors ${
                                    ['approved', 'active'].includes(app.status)
                                      ? 'bg-[#093fb4] text-white hover:bg-[#0730a0]'
                                      : 'bg-white border border-slate-200 text-slate-300 cursor-not-allowed'
                                  }`}
                                >
                                  <RefreshCw size={10} className={['renewing', 'submitted'].includes(app.status) ? 'animate-spin' : ''} />
                                  Renew
                                </button>

                                <button
                                  onClick={() => setTerminateModal({ show: true, app })}
                                  className="text-[10px] font-black uppercase tracking-widest bg-[#FF1E1E]/10 text-[#FF1E1E] px-3 py-2 rounded-xl hover:bg-[#FF1E1E]/20 transition-colors border border-[#FF1E1E]/30"
                                >
                                  Terminate
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ActionConfirmModal
        isOpen={terminateModal.show}
        status="terminated"
        onClose={() => setTerminateModal({ show: false, app: null })}
        onConfirm={handleTerminateConfirm}
      />
      <ComplianceModal
        isOpen={renewModal.show}
        mode="renew"
        onClose={() => setRenewModal({ show: false, app: null })}
        onSend={handleRenewConfirm}
      />
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending:       { label: 'Pending',               cls: 'bg-amber-50 text-amber-600 border-amber-200' },
    submitted:     { label: 'Renewal Submitted',     cls: 'bg-blue-50 text-blue-600 border-blue-200' },
    active:        { label: 'Active Scholar',        cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    approved:      { label: 'Active Scholar',        cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    rejected:      { label: 'Not Eligible',          cls: 'bg-rose-50 text-rose-600 border-rose-200' },
    not_eligible:  { label: 'Not Eligible',          cls: 'bg-rose-50 text-rose-600 border-rose-200' },
    terminated:    { label: 'Terminated',            cls: 'bg-red-100 text-red-700 border-red-300' },
    under_review:  { label: 'For Compliance',        cls: 'bg-purple-50 text-purple-600 border-purple-200' },
    compliance:    { label: 'For Compliance',        cls: 'bg-purple-50 text-purple-600 border-purple-200' },
    need_changes:  { label: 'For Compliance',        cls: 'bg-purple-50 text-purple-600 border-purple-200' },
    renewing:      { label: 'Under Renewal Review',  cls: 'bg-blue-50 text-blue-500 border-blue-200' }
  };
  
  const { label, cls } = map[status] || { label: status, cls: 'bg-slate-50 text-slate-600 border-slate-200' };

  return (
    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border inline-block ${cls}`}>
      {label}
    </span>
  );
}