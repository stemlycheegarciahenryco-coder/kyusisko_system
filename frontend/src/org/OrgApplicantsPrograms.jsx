import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { backendURL } from '../api';
import {
  Users, ArrowRight, Calendar, Layers, ChevronLeft, ChevronRight,
  Shield, CheckCircle, XCircle, Search,
} from 'lucide-react';

// Programs on this page are only ever Active or Closed — drafts and
// archived programs are hidden entirely, and a past-deadline program
// counts as Closed, same as ScholarshipManager's unified status logic.
const getDisplayStatus = (rawStatus) => {
  const s = rawStatus?.toLowerCase();
  if (s === 'draft') return 'draft';
  if (s === 'archived') return 'archived';
  if (s === 'closed' || s === 'deadline_passed') return 'closed';
  return 'active';
};

const CARDS_PER_PAGE = 6;

const TABS = [
  { key: 'all', label: 'All', icon: Users },
  { key: 'active', label: 'Active', icon: CheckCircle },
  { key: 'closed', label: 'Closed', icon: XCircle },
];

const norm = (v) => (v || '').trim().toLowerCase();

function StatusBadge({ status }) {
  const isActive = status === 'active';
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${
        isActive
          ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
          : 'bg-red-50 text-red-600 border-red-200'
      }`}
    >
      {isActive ? 'Active' : 'Closed'}
    </span>
  );
}

function ApplicantAvatar({ applicant, index }) {
  const firstName = applicant.sfirst_name || '';
  const lastName = applicant.slast_name || '';
  const raw = applicant.sprofile_pic || '';
  const hasValidImg = raw.trim() !== '';
  const fullImgUrl = hasValidImg
    ? (raw.startsWith('http') ? raw : `${backendURL}/uploads/${raw}`)
    : null;

  return (
    <div
      title={`${firstName} ${lastName}`.trim() || 'Applicant'}
      className={`w-9 h-9 rounded-full border-2 border-white bg-[#093fb4] overflow-hidden shrink-0 relative shadow-sm ${index === 0 ? '' : '-ml-3'}`}
    >
      {hasValidImg && (
        <img
          src={fullImgUrl}
          alt=""
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
            if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
          }}
        />
      )}
      <div
        className="w-full h-full bg-[#093fb4] text-white text-[11px] font-black uppercase items-center justify-center"
        style={{ display: hasValidImg ? 'none' : 'flex' }}
      >
        {firstName[0] || '?'}{lastName[0] || ''}
      </div>
    </div>
  );
}

export default function OrgApplicantPrograms() {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'active' | 'closed'
  const [searchQuery, setSearchQuery] = useState('');
  const [conflicts, setConflicts] = useState([]);
  const [loadingConflicts, setLoadingConflicts] = useState(true);
  const [expandedConflict, setExpandedConflict] = useState(null);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const res = await api.get('/organizations/dashboard-programs/me');
        const allPrograms = res.data.data || res.data || [];
        setPrograms(
          allPrograms.filter(p =>
            !p.is_archived && getDisplayStatus(p.status) !== 'draft' && getDisplayStatus(p.status) !== 'archived'
          )
        );
      } catch (err) {
        console.error("Failed to fetch programs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPrograms();
  }, []);

  // Student Monitored Applications
  useEffect(() => {
    const fetchConflicts = async () => {
      try {
        const res = await api.get('/organizations/conflicts');
        setConflicts(res.data?.data || []);
      } catch (err) {
        console.error("Failed to fetch monitored applications", err);
      } finally {
        setLoadingConflicts(false);
      }
    };
    fetchConflicts();
  }, []);

  // Programs of THIS organization where the monitored student has applied
  const findStudentPrograms = (c) =>
    programs.filter(p =>
      (p.applicants || []).some(a =>
        (a.student_id != null && String(a.student_id) === String(c.student_id)) ||
        (norm(a.sfirst_name) === norm(c.sfirst_name) && norm(a.slast_name) === norm(c.slast_name))
      )
    );

  const goToStudentInProgram = (program, c) => {
    navigate(`/scholarship-applications/${program.id}/applicants`, {
      state: { search: `${c.sfirst_name || ''} ${c.slast_name || ''}`.trim() },
    });
  };

  const handleConflictClick = (c) => {
    const matches = findStudentPrograms(c);
    if (matches.length === 1) {
      goToStudentInProgram(matches[0], c);
    } else if (matches.length > 1) {
      setExpandedConflict(prev => (prev === c.student_id ? null : c.student_id));
    }
  };

  // Segregate programs by status
  const activePrograms = programs.filter(p => getDisplayStatus(p.status) === 'active');
  const closedPrograms = programs.filter(p => getDisplayStatus(p.status) === 'closed');
  const countFor = (key) =>
    key === 'all' ? programs.length : key === 'active' ? activePrograms.length : closedPrograms.length;

  const baseList =
    activeTab === 'all' ? programs : activeTab === 'active' ? activePrograms : closedPrograms;
  const tabPrograms = baseList.filter(p =>
    (p.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(tabPrograms.length / CARDS_PER_PAGE);
  const paginatedProgs = tabPrograms.slice(
    currentPage * CARDS_PER_PAGE,
    (currentPage + 1) * CARDS_PER_PAGE
  );

  const totalApplicants = programs.reduce((sum, p) => sum + (p.applicants?.length || 0), 0);

  const switchTab = (tab) => {
    setActiveTab(tab);
    setCurrentPage(0);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#093fb4] border-t-transparent rounded-full animate-spin" />
        <p className="text-[12px] font-black uppercase tracking-widest text-black">Loading Programs...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-6xl mx-auto">

        {/* Page Header + Searchbar Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-black uppercase tracking-tight">
              Manage <span className="text-[#093fb4]">Students</span>
            </h1>
            <p className="text-[12px] font-bold text-black mt-1 uppercase tracking-widest">
              {programs.length} programs found
              <span className="text-slate-400"> · {totalApplicants} total applicants</span>
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search by program title..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(0); }}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-[13px] font-medium text-black focus:border-[#093fb4] focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Two aligned columns: LEFT = tabs + tiles, RIGHT = monitored applications.
            Both columns start at the same top edge. */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">

          {/* ───────────── LEFT: tabs + program tiles ───────────── */}
          <div className="min-w-0 order-2 lg:order-1">

            {/* Status Tabs */}
            <div className="flex items-center gap-2 mb-5 overflow-x-auto">
              {TABS.map(({ key, label, icon: Icon }) => {
                const isActive = activeTab === key;
                return (
                  <button
                    key={key}
                    onClick={() => switchTab(key)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border shrink-0 ${
                      isActive
                        ? 'bg-[#093fb4] text-white border-[#093fb4] shadow-md shadow-[#093fb4]/20'
                        : 'bg-white text-slate-600 border-slate-300 hover:text-[#093fb4] hover:border-[#093fb4]'
                    }`}
                  >
                    <Icon size={13} />
                    {label}
                    <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-600 text-white'
                    }`}>
                      {countFor(key)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Program tiles */}
            {tabPrograms.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-300 shadow-sm py-16 px-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#093fb4]/10 text-[#093fb4] flex items-center justify-center mx-auto mb-4">
                  <Users size={22} />
                </div>
                <p className="text-[12px] font-black uppercase tracking-widest text-slate-400">
                  {searchQuery
                    ? 'No matching programs found'
                    : activeTab === 'active'
                      ? 'No active programs'
                      : activeTab === 'closed'
                        ? 'No closed programs'
                        : 'No programs found'}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {paginatedProgs.map((program) => {
                    const applicants = program.applicants || [];
                    const total = applicants.length;
                    const extra = total - 4;
                    const displayStatus = getDisplayStatus(program.status);

                    return (
                      <div
                        key={program.id}
                        onClick={() => navigate(`/scholarship-applications/${program.id}/applicants`)}
                        className="group bg-white rounded-2xl border border-slate-300 shadow-sm p-5 flex flex-col justify-between min-h-[230px] cursor-pointer hover:border-[#093fb4]/50 hover:shadow-md transition-all"
                      >
                        <div>
                          {/* Icon + status */}
                          <div className="flex items-start justify-between gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-[#093fb4]/10 text-[#093fb4] flex items-center justify-center shrink-0">
                              <Layers size={18} />
                            </div>
                            <StatusBadge status={displayStatus} />
                          </div>

                          {/* Title */}
                          <h2 className="text-base font-black text-black uppercase tracking-tight leading-snug line-clamp-2 mb-4">
                            {program.title}
                          </h2>

                          {/* Applicants */}
                          <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-slate-600 mb-2.5">
                            <Users size={13} /> Applicants ({total})
                          </p>
                          {total === 0 ? (
                            <p className="text-[12px] font-medium italic text-slate-400">No submissions yet</p>
                          ) : (
                            <div className="flex items-center">
                              {applicants.slice(0, 4).map((a, i) => (
                                <ApplicantAvatar key={a.id || i} applicant={a} index={i} />
                              ))}
                              {extra > 0 && (
                                <div className="w-9 h-9 -ml-3 rounded-full border-2 border-white bg-slate-600 text-white text-[11px] font-black flex items-center justify-center shrink-0">
                                  +{extra}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-200">
                          {program.deadline ? (
                            <span className="inline-flex items-center gap-2 text-[13px] font-bold text-slate-700">
                              <Calendar size={14} className="text-slate-400" />
                              {new Date(program.deadline).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          ) : (
                            <span className="text-[12px] font-medium text-slate-400">No deadline set</span>
                          )}
                          <span className="inline-flex w-8 h-8 items-center justify-center rounded-xl bg-slate-100 text-slate-400 group-hover:bg-[#093fb4] group-hover:text-white transition-colors">
                            <ArrowRight size={15} />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                      Page {currentPage + 1} of {totalPages}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(p - 1, 0))}
                        disabled={currentPage === 0}
                        className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-600 hover:border-[#093fb4] hover:text-[#093fb4] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages - 1))}
                        disabled={currentPage === totalPages - 1}
                        className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-600 hover:border-[#093fb4] hover:text-[#093fb4] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ───────────── RIGHT: Student Monitored Applications ───────────── */}
          <aside className="order-1 lg:order-2 lg:sticky lg:top-6 bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Shield size={17} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[12px] font-black uppercase tracking-widest text-black leading-tight">
                  Monitored Students
                </h2>
                <p className="text-[11px] font-medium text-slate-500 mt-0.5">Scholarship conflicts to review</p>
              </div>
              {conflicts.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-red-500 text-white shrink-0">
                  {conflicts.length}
                </span>
              )}
            </div>

            {/* Body */}
            <div className="p-3 max-h-96 lg:max-h-[calc(100vh-16rem)] overflow-y-auto">
              {loadingConflicts ? (
                <p className="px-2 py-6 text-center text-[12px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">
                  Checking status...
                </p>
              ) : conflicts.length > 0 ? (
                <div className="space-y-2.5">
                  {conflicts.map((c) => {
                    const matches = findStudentPrograms(c);
                    const clickable = matches.length > 0;
                    const isExpanded = expandedConflict === c.student_id;

                    return (
                      <div
                        key={c.student_id}
                        className={`rounded-xl border bg-white overflow-hidden transition-colors ${
                          clickable ? 'border-slate-200 hover:border-red-300' : 'border-slate-200'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleConflictClick(c)}
                          disabled={!clickable}
                          title={clickable ? 'View this student in your program' : 'This student is not in your programs'}
                          className={`group w-full flex items-start gap-3 px-3.5 py-3 text-left transition-colors ${
                            clickable ? 'cursor-pointer hover:bg-red-50/50' : 'cursor-default'
                          }`}
                        >
                          <div className="w-9 h-9 rounded-full bg-red-50 text-red-600 border border-red-100 flex items-center justify-center text-[11px] font-black uppercase shrink-0">
                            {(c.sfirst_name || '?')[0]}{(c.slast_name || '')[0]}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-black text-black uppercase tracking-tight truncate">
                              {c.sfirst_name} {c.slast_name}
                            </p>
                            <p className="text-[12px] font-semibold text-red-600 mt-0.5 leading-snug">
                              {c.conflict_display}
                            </p>
                            {!clickable && (
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1.5">
                                Not in your programs
                              </p>
                            )}
                          </div>
                          {clickable && (
                            <ArrowRight
                              size={15}
                              className={`shrink-0 mt-2 text-slate-400 group-hover:text-red-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            />
                          )}
                        </button>

                        {isExpanded && matches.length > 1 && (
                          <div className="space-y-2 px-3 pb-3">
                            {matches.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => goToStudentInProgram(p, c)}
                                className="w-full text-left px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-black uppercase tracking-widest text-[#093fb4] hover:border-[#093fb4] transition-colors truncate"
                              >
                                {p.title}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center text-center px-3 py-8">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-3">
                    <CheckCircle size={24} className="text-emerald-600" />
                  </div>
                  <p className="text-[13px] font-black text-black uppercase tracking-tight">No Scholarship Conflicts</p>
                  <p className="text-[12px] font-medium text-slate-500 mt-1 leading-snug">
                    All monitored applications are in good standing.
                  </p>
                </div>
              )}
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}