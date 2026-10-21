import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, PowerOff, CheckCircle2,
  ChevronLeft, ChevronRight, Calendar, Banknote, GraduationCap,
  Search, MoreHorizontal, Folder,
  FileText, XCircle, Archive, AlertTriangle
} from 'lucide-react';
import api from '../api';
import ViewProgram from '../component/ViewProgram';
import EditProgram from '../component/EditProgram';

export default function ScholarshipManager() {
  const navigate = useNavigate();
  const [scholarships, setScholarships] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Modal States
  const [viewModal, setViewModal] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [publishConfirm, setPublishConfirm] = useState({ show: false, id: null });
  const [closeConfirm, setCloseConfirm] = useState({ show: false, id: null });
  const [archiveConfirm, setArchiveConfirm] = useState({ show: false, id: null });
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [errorModal, setErrorModal] = useState({ show: false, message: '' });

  const CARDS_PER_PAGE = 6;

  useEffect(() => {
    fetchScholarships();
  }, []);

  const fetchScholarships = async () => {
    try {
      const res = await api.get('/scholarships/get-all');
      setScholarships(res.data.data || []);
      setCurrentPage(0);
    } catch (err) {
      console.error('Fetch error', err);
    }
  };

  const getBadgeType = (s) => {
    const st = s.status?.toLowerCase();
    if (st === 'draft') return 'draft';
    const isPast = s.deadline ? new Date() > new Date(s.deadline) : false;
    if (st === 'closed' || isPast) return 'closed';
    return 'open';
  };

  const filtered = scholarships
    .filter(s => {
      const badgeType = getBadgeType(s);
      if (activeTab !== 'all' && badgeType !== activeTab) return false;
      if (statusFilter !== 'all' && badgeType !== statusFilter) return false;

      const searchStr = `${s.title} ${s.description} ${s.org_name}`.toLowerCase();
      return searchStr.includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at || b.id) - new Date(a.created_at || a.id);
      if (sortBy === 'oldest') return new Date(a.created_at || a.id) - new Date(b.created_at || b.id);
      return 0;
    });

  const getCount = (key) => {
    if (key === 'all') return scholarships.length;
    return scholarships.filter(s => getBadgeType(s) === key).length;
  };

  const totalPages = Math.ceil(filtered.length / CARDS_PER_PAGE);
  const paginated = filtered.slice(currentPage * CARDS_PER_PAGE, (currentPage + 1) * CARDS_PER_PAGE);

  const switchTab = (key) => {
    setActiveTab(key);
    setCurrentPage(0);
  };

  const showError = (err, fallback) =>
    setErrorModal({ show: true, message: err?.response?.data?.message || fallback });

  const handleArchiveAction = async () => {
    try {
      await api.delete(`/scholarships/${archiveConfirm.id}`);
      fetchScholarships();
      setArchiveConfirm({ show: false, id: null });
    } catch (err) {
      console.error('Archive error', err);
      setArchiveConfirm({ show: false, id: null });
      showError(err, 'Failed to archive the program.');
    }
  };

  const handlePublishAction = async () => {
    try {
      await api.patch(`/scholarships/${publishConfirm.id}/status`, { status: 'open' });
      fetchScholarships();
      setPublishConfirm({ show: false, id: null });
    } catch (err) {
      console.error('Publish error', err);
      setPublishConfirm({ show: false, id: null });
      showError(err, 'Failed to publish the program.');
    }
  };

  const handleCloseAction = async () => {
    try {
      await api.patch(`/scholarships/${closeConfirm.id}/status`, { status: 'closed' });
      setCloseConfirm({ show: false, id: null });
      fetchScholarships();
    } catch (err) {
      console.error('Close error', err);
      setCloseConfirm({ show: false, id: null });
      showError(err, 'Failed to close the program.');
    }
  };

  const cancelAll = () => {
    setPublishConfirm({ show: false, id: null });
    setCloseConfirm({ show: false, id: null });
    setArchiveConfirm({ show: false, id: null });
  };

  const kpiCards = [
    { key: 'all', label: 'All Programs', icon: Folder, active: 'border-[#093fb4] bg-blue-50/30', iconCls: 'bg-blue-50 text-[#093fb4] border-blue-100' },
    { key: 'open', label: 'Active', icon: CheckCircle2, active: 'border-emerald-500 bg-emerald-50/30', iconCls: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    { key: 'draft', label: 'Drafts', icon: FileText, active: 'border-amber-500 bg-amber-50/30', iconCls: 'bg-amber-50 text-amber-600 border-amber-100' },
    { key: 'closed', label: 'Closed', icon: XCircle, active: 'border-red-500 bg-red-50/30', iconCls: 'bg-red-50 text-red-600 border-red-100' },
  ];

  const badgeStyles = {
    open: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    draft: 'bg-blue-50 text-[#093fb4] border-blue-200',
    closed: 'bg-red-50 text-red-600 border-red-200',
  };

  const badgeLabels = { open: 'Open', draft: 'Draft', closed: 'Closed' };

  const btnBase = 'flex-1 font-black text-[11px] uppercase tracking-widest py-2.5 rounded-xl border transition-colors';

  return (
    <div className="p-8 bg-white min-h-screen text-slate-800">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── HEADER TITLE BLOCK ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-black tracking-tight uppercase">
              Manage <span className="text-[#093fb4]">Programs</span>
            </h1>
            <p className="text-[12px] text-slate-500 font-bold mt-1 uppercase tracking-widest">
              Organize and monitor all scholarship distributions
            </p>
          </div>
          <button
            onClick={() => navigate('/create-scholarship')}
            className="flex items-center justify-center gap-2 bg-[#093fb4] hover:bg-[#073496] text-white px-5 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all shadow-md shadow-[#093fb4]/20 active:scale-95"
          >
            <Plus size={16} strokeWidth={3} /> Create Program
          </button>
        </div>

        {/* ── KPI METRIC CARDS ROW ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map(({ key, label, icon: Icon, active, iconCls }) => (
            <div
              key={key}
              onClick={() => switchTab(key)}
              className={`bg-white border rounded-2xl p-5 shadow-sm flex items-center gap-4 cursor-pointer transition-all ${
                activeTab === key ? active : 'border-slate-300 hover:border-slate-400'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${iconCls}`}>
                <Icon size={22} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
                <p className="text-2xl font-black text-black leading-none mt-1">{getCount(key)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── SEARCH FILTERS ROW CONTROL ── */}
        <div className="bg-white p-4 border border-slate-300 rounded-2xl flex flex-col md:flex-row gap-4 items-end justify-between shadow-sm">
          <div className="relative w-full md:flex-1 group">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#093fb4] transition-colors" />
            <input
              type="text"
              placeholder="Search by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-[#093fb4] text-[13px] font-medium text-black placeholder-slate-400 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-end gap-4 w-full md:w-auto">
            <div className="flex flex-col flex-1 sm:flex-initial min-w-[140px]">
              <label className="text-[11px] font-black uppercase text-slate-600 tracking-widest mb-1.5 ml-0.5">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2.5 border border-slate-300 rounded-xl text-[12px] font-black uppercase tracking-wider text-black bg-white focus:outline-none focus:border-[#093fb4] cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="draft">Draft</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div className="flex flex-col flex-1 sm:flex-initial min-w-[150px]">
              <label className="text-[11px] font-black uppercase text-slate-600 tracking-widest mb-1.5 ml-0.5">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2.5 border border-slate-300 rounded-xl text-[12px] font-black uppercase tracking-wider text-black bg-white focus:outline-none focus:border-[#093fb4] cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── PROGRAMS GRID SYSTEM ── */}
        {paginated.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl py-16 text-center shadow-sm">
            <Folder size={40} className="mx-auto text-slate-300 mb-3" strokeWidth={1.5} />
            <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">No programs found matching this selection</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginated.map((s) => {
              const badgeType = getBadgeType(s);

              return (
                <div
                  key={s.id}
                  className="bg-white border border-slate-300 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-[#093fb4]/50 transition-all duration-300 flex flex-col justify-between group relative"
                >
                  <div>
                    {/* Header: Tag + Options Menu icon */}
                    <div className="flex justify-between items-center mb-4">
                      <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${badgeStyles[badgeType] || badgeStyles.draft}`}>
                        {badgeLabels[badgeType]}
                      </span>
                      <div className="relative">
                        <button
                          onClick={() => setMenuOpenId(menuOpenId === s.id ? null : s.id)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                        >
                          <MoreHorizontal size={20} strokeWidth={2.5} />
                        </button>

                        {menuOpenId === s.id && (
                          <div className="absolute right-0 top-full mt-2 w-40 bg-white border border-slate-300 rounded-xl shadow-xl py-1.5 z-20">
                            {(badgeType === 'draft' || badgeType === 'closed') ? (
                              <button
                                onClick={() => {
                                  setArchiveConfirm({ show: true, id: s.id });
                                  setMenuOpenId(null);
                                }}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-amber-700 hover:bg-amber-50 transition-colors"
                              >
                                <Archive size={14} strokeWidth={2.5} /> Archive
                              </button>
                            ) : (
                              <p className="px-4 py-2.5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">
                                No Actions
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Meta header row: Profile avatar image + text titles */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl border border-slate-200 shadow-sm overflow-hidden bg-slate-50 flex items-center justify-center shrink-0">
                        {s.org_pic ? (
                          <img src={s.org_pic} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-base font-black text-slate-400">
                            {s.org_name?.substring(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-black text-black leading-snug group-hover:text-[#093fb4] transition-colors truncate uppercase tracking-tight">
                          {s.title}
                        </h3>
                        <p className="text-[11px] font-black text-[#093fb4] uppercase tracking-[0.15em] mt-0.5 truncate">
                          {s.org_name || 'OSDS-CHED'}
                        </p>
                      </div>
                    </div>

                    {/* Program description snippet */}
                    <p className="text-[13px] text-slate-600 font-medium leading-relaxed line-clamp-3 mb-4">
                      {s.description || 'No summary description provided for this tracking program.'}
                    </p>

                    {/* Multi-parameter information row */}
                    <div className="grid grid-cols-3 gap-2 py-4 border-y border-slate-200 my-4 text-center">
                      <div className="min-w-0">
                        <div className="flex items-center justify-center gap-1.5 text-slate-500 mb-1.5">
                          <Calendar size={13} strokeWidth={2.5} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Deadline</span>
                        </div>
                        <p className="text-[13px] font-bold text-black truncate">
                          {s.deadline ? new Date(s.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'VARY'}
                        </p>
                      </div>

                      <div className="min-w-0 border-l border-r border-slate-200">
                        <div className="flex items-center justify-center gap-1.5 text-slate-500 mb-1.5">
                          <Banknote size={13} strokeWidth={2.5} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Budget</span>
                        </div>
                        <p className="text-[13px] font-black text-[#093fb4] truncate">
                          {s.total_budget != null ? `₱${Number(s.total_budget).toLocaleString()}` : 'VARY'}
                        </p>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center justify-center gap-1.5 text-slate-500 mb-1.5">
                          <GraduationCap size={13} strokeWidth={2.5} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Type</span>
                        </div>
                        <p className="text-[13px] font-bold text-black truncate">
                          {s.fund_type || 'Financial Aid'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ── CARD BUTTON ROW ── */}
                  <div className={`gap-2 mt-1 ${badgeType === 'draft' ? 'grid grid-cols-2' : 'flex'}`}>
                    {/* View — always available */}
                    <button
                      onClick={() => setViewModal(s)}
                      className={`${btnBase} bg-white border-slate-300 hover:border-[#093fb4] hover:text-[#093fb4] text-slate-700`}
                    >
                      View
                    </button>

                    {/* DRAFT: Edit, Publish, Archive */}
                    {badgeType === 'draft' && (
                      <>
                        <button
                          onClick={() => setEditModal(s)}
                          className={`${btnBase} bg-white border-slate-300 hover:border-slate-500 text-slate-700`}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setPublishConfirm({ show: true, id: s.id })}
                          className={`${btnBase} bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100`}
                        >
                          Publish
                        </button>
                        <button
                          onClick={() => setArchiveConfirm({ show: true, id: s.id })}
                          className={`${btnBase} bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100`}
                        >
                          Archive
                        </button>
                      </>
                    )}

                    {/* OPEN: Close */}
                    {badgeType === 'open' && (
                      <button
                        onClick={() => setCloseConfirm({ show: true, id: s.id })}
                        className={`${btnBase} bg-red-50 text-red-700 border-red-200 hover:bg-red-100`}
                      >
                        Close
                      </button>
                    )}

                    {/* CLOSED: Archive */}
                    {badgeType === 'closed' && (
                      <button
                        onClick={() => setArchiveConfirm({ show: true, id: s.id })}
                        className={`${btnBase} bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100`}
                      >
                        Archive
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── FOOTER PAGINATION CONTAINER ── */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center pt-5 border-t border-slate-200 flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 0))}
                disabled={currentPage === 0}
                className="w-9 h-9 border border-slate-300 bg-white rounded-xl flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#093fb4] hover:text-[#093fb4] transition-colors text-slate-600"
              >
                <ChevronLeft size={16} strokeWidth={2.5} />
              </button>

              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className={`w-9 h-9 font-black text-[13px] rounded-xl transition-all border ${
                    i === currentPage
                      ? 'bg-[#093fb4] border-[#093fb4] text-white shadow-md shadow-[#093fb4]/20'
                      : 'bg-white border-slate-300 text-slate-600 hover:border-[#093fb4] hover:text-[#093fb4]'
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages - 1))}
                disabled={currentPage === totalPages - 1}
                className="w-9 h-9 border border-slate-300 bg-white rounded-xl flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#093fb4] hover:text-[#093fb4] transition-colors text-slate-600"
              >
                <ChevronRight size={16} strokeWidth={2.5} />
              </button>
            </div>

            <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
              Page {currentPage + 1} of {totalPages}
            </div>
          </div>
        )}
      </div>

      {/* ── CLICK-OUTSIDE OVERLAY FOR CARD OPTIONS MENU ── */}
      {menuOpenId && (
        <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
      )}

      {/* ── EXTERNAL MODAL DRAWERS ── */}
      {viewModal && <ViewProgram scholarship={viewModal} onClose={() => setViewModal(null)} />}
      {editModal && (
        <EditProgram
          scholarship={editModal}
          onUpdateSuccess={() => { setEditModal(null); fetchScholarships(); }}
          onCancel={() => setEditModal(null)}
        />
      )}

      {/* ── UNIFIED CONFIRM DIALOG SYSTEM ── */}
      {(publishConfirm.show || closeConfirm.show || archiveConfirm.show) && (() => {
        const isPublish = publishConfirm.show;
        const isArchive = archiveConfirm.show;
        const iconBg = isPublish
          ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
          : isArchive ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-600 border-red-200';
        const icon = isPublish
          ? <CheckCircle2 size={26} strokeWidth={2.5} />
          : isArchive ? <Archive size={26} strokeWidth={2.5} /> : <PowerOff size={26} strokeWidth={2.5} />;
        const title = isPublish ? 'Publish this program?' : isArchive ? 'Archive this program?' : 'Close this program?';
        const desc = isPublish ? 'It will become visible to all eligible students.'
          : isArchive ? "It'll move to the Archive along with its students. You can restore it anytime, or delete it permanently from there."
          : 'Students will no longer be able to apply.';
        const confirmBg = isPublish ? 'bg-emerald-600 hover:bg-emerald-700' : isArchive ? 'bg-amber-600 hover:bg-amber-700' : 'bg-red-600 hover:bg-red-700';
        const onConfirm = isPublish ? handlePublishAction : isArchive ? handleArchiveAction : handleCloseAction;

        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200" onClick={cancelAll}>
            <div
              className="bg-white rounded-3xl p-7 max-w-sm w-full border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-200 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`w-14 h-14 rounded-2xl border ${iconBg} mx-auto flex items-center justify-center mb-4`}>
                {icon}
              </div>
              <h2 className="text-lg font-black text-black uppercase tracking-tight mb-2">
                {title}
              </h2>
              <p className="text-[13px] text-slate-500 font-medium leading-relaxed mb-6">
                {desc}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={cancelAll}
                  className="flex-1 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 font-black text-[11px] uppercase tracking-widest rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className={`flex-1 py-3 text-white font-black text-[11px] uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 ${confirmBg}`}
                >
                  {isArchive ? 'Archive' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── ERROR DIALOG (replaces alert) ── */}
      {errorModal.show && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110] p-4"
          onClick={() => setErrorModal({ show: false, message: '' })}
        >
          <div
            className="bg-white rounded-3xl p-7 max-w-sm w-full border border-slate-200 shadow-2xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl border bg-red-50 text-red-600 border-red-200 mx-auto flex items-center justify-center mb-4">
              <AlertTriangle size={26} strokeWidth={2.5} />
            </div>
            <h2 className="text-lg font-black text-black uppercase tracking-tight mb-2">Something went wrong</h2>
            <p className="text-[13px] text-slate-500 font-medium leading-relaxed mb-6">{errorModal.message}</p>
            <button
              onClick={() => setErrorModal({ show: false, message: '' })}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black text-[11px] uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}