import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Eye, Trash2, Edit3, PowerOff, CheckCircle2, Archive, 
  ChevronLeft, ChevronRight, Calendar, DollarSign, GraduationCap, 
  Search, SlidersHorizontal, MoreHorizontal, Folder, CheckCircle, 
  FileText, XCircle, AlertTriangle 
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
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });
  const [menuOpenId, setMenuOpenId] = useState(null);

  const CARDS_PER_PAGE = 6;

  useEffect(() => {
    fetchScholarships();
  }, []);

  const fetchScholarships = async () => {
    try {
      const res = await api.get('/scholarships/get-all');
      setScholarships((res.data.data || []).filter(s => s.status !== 'archived'));
      setCurrentPage(0);
    } catch (err) {
      console.error('Fetch error', err);
    }
  };

  // Status parser logic
  const getBadgeType = (s) => {
    const isPast = s.deadline ? new Date() > new Date(s.deadline) : false;
    const st = s.status?.toLowerCase();
    if (isPast && st !== 'closed') return 'expired';
    if (st === 'closed') return 'closed';
    if (st === 'open') return 'open';
    return 'draft';
  };

  // Dynamic filter pipeline: Tab counters, query match strings, status drop-downs
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

  // Operations handlers
  const handleDeleteAction = async () => {
    try {
      await api.delete(`/scholarships/${deleteConfirm.id}`);
      fetchScholarships();
      setDeleteConfirm({ show: false, id: null });
    } catch (err) {
      console.error('Delete error', err);
    }
  };

  const handleArchive = async (id) => {
    try {
      await api.patch(`/scholarships/${id}/status`, { status: 'archived' });
      navigate('/OrgHistory');
      fetchScholarships();
    } catch {
      alert('Failed to archive');
    }
  };

  const handlePublishAction = async () => {
    try {
      await api.patch(`/scholarships/${publishConfirm.id}/status`, { status: 'open' });
      fetchScholarships();
      setPublishConfirm({ show: false, id: null });
    } catch {
      alert('Failed to publish');
    }
  };

  const handleCloseAction = async () => {
    try {
      await api.patch(`/scholarships/${closeConfirm.id}/status`, { status: 'closed' });
      setCloseConfirm({ show: false, id: null });
      fetchScholarships();
    } catch (err) {
      console.error('Close error', err);
    }
  };

  const cancelAll = () => {
    setPublishConfirm({ show: false, id: null });
    setCloseConfirm({ show: false, id: null });
    setDeleteConfirm({ show: false, id: null });
  };

  return (
    <div className="p-8 bg-slate-50/40 min-h-screen text-slate-800 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* ── HEADER TITLE BLOCK ── */}
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
              Manage Your <span className="text-[#093fb4]">Scholarships</span>
            </h1>
            <p className="text-xs text-slate-400 font-bold mt-2 uppercase tracking-wider">
              Organize, monitor and manage all your scholarship programs in one place.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/create-scholarship')}
              className="flex items-center gap-2 bg-[#093fb4] hover:bg-[#073290] text-white px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-sm shadow-[#093fb4]/10"
            >
              <Plus size={16} strokeWidth={3} /> Create New Program
            </button>
            <button className="p-3 bg-white border border-slate-200/80 rounded-xl hover:bg-slate-50 text-slate-400 shadow-2xl shadow-black/5">
              <SlidersHorizontal size={16} />
            </button>
          </div>
        </div>

        {/* ── KPI METRIC CARDS ROW ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: All Programs */}
          <div 
            onClick={() => switchTab('all')}
            className={`bg-white border rounded-2xl p-5 shadow-2xl shadow-black/5 flex items-center gap-4 cursor-pointer transition-all ${activeTab === 'all' ? 'border-[#093fb4] ring-2 ring-[#093fb4]/5 bg-blue-50/5' : 'border-slate-200/60 hover:border-slate-300'}`}
          >
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#093fb4] flex items-center justify-center shrink-0">
              <Folder size={20} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">All Programs</p>
              <p className="text-2xl font-black text-slate-900 leading-tight mt-0.5">{getCount('all')}</p>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5">Total</p>
            </div>
          </div>

          {/* Card 2: Open */}
          <div 
            onClick={() => switchTab('open')}
            className={`bg-white border rounded-2xl p-5 shadow-2xl shadow-black/5 flex items-center gap-4 cursor-pointer transition-all ${activeTab === 'open' ? 'border-emerald-500 ring-2 ring-emerald-500/5 bg-emerald-50/5' : 'border-slate-200/60 hover:border-slate-300'}`}
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 size={20} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Open</p>
              <p className="text-2xl font-black text-slate-900 leading-tight mt-0.5">{getCount('open')}</p>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Active</p>
            </div>
          </div>

          {/* Card 3: Draft */}
          <div 
            onClick={() => switchTab('draft')}
            className={`bg-white border rounded-2xl p-5 shadow-2xl shadow-black/5 flex items-center gap-4 cursor-pointer transition-all ${activeTab === 'draft' ? 'border-amber-500 ring-2 ring-amber-500/5 bg-amber-50/5' : 'border-slate-200/60 hover:border-slate-300'}`}
          >
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <FileText size={20} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Draft</p>
              <p className="text-2xl font-black text-slate-900 leading-tight mt-0.5">{getCount('draft')}</p>
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Draft</p>
            </div>
          </div>

          {/* Card 4: Closed */}
          <div 
            onClick={() => switchTab('closed')}
            className={`bg-white border rounded-2xl p-5 shadow-2xl shadow-black/5 flex items-center gap-4 cursor-pointer transition-all ${activeTab === 'closed' ? 'border-red-500 ring-2 ring-red-500/5 bg-red-50/5' : 'border-slate-200/60 hover:border-slate-300'}`}
          >
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <XCircle size={20} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Closed</p>
              <p className="text-2xl font-black text-slate-900 leading-tight mt-0.5">{getCount('closed')}</p>
              <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Closed</p>
            </div>
          </div>

          {/* Card 5: Deadline Passed */}
          <div 
            onClick={() => switchTab('expired')}
            className={`bg-white border rounded-2xl p-5 shadow-2xl shadow-black/5 flex items-center gap-4 cursor-pointer transition-all ${activeTab === 'expired' ? 'border-purple-500 ring-2 ring-purple-500/5 bg-purple-50/5' : 'border-slate-200/60 hover:border-slate-300'}`}
          >
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deadline Passed</p>
              <p className="text-2xl font-black text-slate-900 leading-tight mt-0.5">{getCount('expired')}</p>
              <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Expired</p>
            </div>
          </div>
        </div>

        {/* ── SEARCH FILTERS ROW CONTROL ── */}
        <div className="bg-white p-4 border border-slate-200/60 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-2xl shadow-black/5">
          <div className="relative w-full md:flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search programs by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#093fb4]/20 focus:border-[#093fb4] text-xs font-semibold placeholder-slate-400 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex flex-col flex-1 sm:flex-initial min-w-[120px]">
              <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="draft">Draft</option>
                <option value="closed">Closed</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            <div className="flex flex-col flex-1 sm:flex-initial min-w-[140px]">
              <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white focus:outline-none"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>

            <button className="flex items-center gap-2 border border-slate-200 px-4 py-2 mt-4 sm:mt-0 rounded-xl text-xs font-black uppercase tracking-wider text-slate-600 hover:bg-slate-50 h-[38px] self-end">
              <SlidersHorizontal size={14} /> Filters
            </button>
          </div>
        </div>

        {/* ── PROGRAMS GRID SYSTEM ── */}
        {paginated.length === 0 ? (
          <div className="bg-white border border-slate-200/60 rounded-2xl py-20 text-center shadow-2xl shadow-black/5">
            <Folder size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-xs font-black text-slate-400 text-uppercase tracking-widest uppercase">No programs found matching this selection</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginated.map((s) => {
              const isPastDeadline = s.deadline ? new Date() > new Date(s.deadline) : false;
              const status = s.status?.toLowerCase();
              const isClosedOrExpired = status === 'closed' || isPastDeadline;
              const badgeType = getBadgeType(s);

              // Setup local colors per dynamic tag type
              const badgeStyles = {
                open: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                draft: 'bg-blue-50 text-[#093fb4] border-blue-100',
                closed: 'bg-red-50 text-red-600 border-red-100',
                expired: 'bg-purple-50 text-purple-600 border-purple-100',
              };

              const badgeLabels = {
                open: 'Open',
                draft: 'Draft',
                closed: 'Closed',
                expired: 'Deadline Passed',
              };

              return (
                <div 
                  key={s.id}
                  className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative border-b-4 hover:border-b-[#093fb4]"
                >
                  <div>
                    {/* Header: Tag + Options Menu icon */}
                    <div className="flex justify-between items-center mb-4">
                      <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${badgeStyles[badgeType] || badgeStyles.draft}`}>
                        {badgeLabels[badgeType]}
                      </span>
                      <div className="relative">
                        <button
                          onClick={() => setMenuOpenId(menuOpenId === s.id ? null : s.id)}
                          className="p-1 rounded-lg hover:bg-slate-50 text-slate-400"
                        >
                          <MoreHorizontal size={16} />
                        </button>

                        {menuOpenId === s.id && (
                          <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200/80 rounded-xl shadow-2xl shadow-black/10 py-1.5 z-20">
                            {status === 'draft' ? (
                              <button
                                onClick={() => {
                                  setDeleteConfirm({ show: true, id: s.id });
                                  setMenuOpenId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-black uppercase tracking-wider text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 size={13} /> Delete
                              </button>
                            ) : (
                              <p className="px-3 py-2 text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                                No actions
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Meta header row: Profile avatar image + text titles */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 rounded-full border border-slate-100 shadow-sm overflow-hidden bg-slate-50 flex items-center justify-center shrink-0">
                        {s.org_pic ? (
                          <img src={s.org_pic} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-base font-black text-slate-400">
                            {s.org_name?.substring(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-black text-slate-900 leading-snug group-hover:text-[#093fb4] transition-colors truncate">
                          {s.title}
                        </h3>
                        <p className="text-[10px] font-black text-[#093fb4] uppercase tracking-wider mt-0.5">
                          {s.org_name || 'OSDS-CHED'}
                        </p>
                      </div>
                    </div>

                    {/* Program description snippet */}
                    <p className="text-xs text-slate-400 font-semibold leading-relaxed line-clamp-3 mb-6">
                      {s.description || 'No summary description provided for this tracking program.'}
                    </p>

                    {/* Multi-parameter information row */}
                    <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-slate-100 my-4 text-center">
                      <div>
                        <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
                          <Calendar size={12} />
                          <span className="text-[9px] font-black uppercase tracking-wider">Deadline</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-700 truncate">
                          {s.deadline ? new Date(s.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'VARY'}
                        </p>
                      </div>

                      <div className="border-l border-r border-slate-100">
                        <div className="flex items-center justify-center gap-0.5 text-slate-400 mb-0.5">
                          <DollarSign size={12} />
                          <span className="text-[9px] font-black uppercase tracking-wider">Amount</span>
                        </div>
                        <p className="text-[10px] font-black text-[#093fb4] truncate">
                          {s.amount_range || 'VARY'}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
                          <GraduationCap size={13} />
                          <span className="text-[9px] font-black uppercase tracking-wider">Type</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-700 truncate">
                          {s.fund_type || 'Financial Aid'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ── CARD BUTTON ROW ACTION PACK ── */}
                  <div className="flex items-center gap-2 pt-2 mt-2">
                    {/* View Action */}
                    <button 
                      onClick={() => setViewModal(s)}
                      className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-600 font-black text-[10px] uppercase tracking-wider py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Eye size={13} /> View
                    </button>

                    {/* Conditional Edit triggers based on draft/open statuses */}
                    {((status === 'draft' || status === 'open') && !isPastDeadline) && (
                      <button 
                        onClick={() => setEditModal(s)}
                        className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-600 font-black text-[10px] uppercase tracking-wider py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Edit3 size={13} /> Edit
                      </button>
                    )}

                    {/* Primary pipeline controls (Publish, Close, Delete or Archive) */}
                    {status === 'draft' && !isPastDeadline && (
                      <button 
                        onClick={() => setPublishConfirm({ show: true, id: s.id })}
                        className="flex-1 bg-emerald-50 text-emerald-600 border border-emerald-200/60 hover:bg-emerald-100 font-black text-[10px] uppercase tracking-wider py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <CheckCircle2 size={13} /> Publish
                      </button>
                    )}

                    {status === 'open' && !isPastDeadline && (
                      <button 
                        onClick={() => setCloseConfirm({ show: true, id: s.id })}
                        className="flex-1 bg-red-50 text-red-600 border border-red-200/60 hover:bg-red-100 font-black text-[10px] uppercase tracking-wider py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <PowerOff size={13} /> Close
                      </button>
                    )}

                    {isClosedOrExpired && status !== 'draft' && (
                      <button 
                        onClick={() => handleArchive(s.id)}
                        className="flex-1 bg-red-50 text-red-600 border border-red-200/60 hover:bg-red-100 font-black text-[10px] uppercase tracking-wider py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Archive size={13} /> Archive
                      </button>
                    )}

                    {status === 'draft' && isPastDeadline && (
                      <button 
                        onClick={() => setDeleteConfirm({ show: true, id: s.id })}
                        className="flex-1 bg-red-50 text-red-600 border border-red-200/60 hover:bg-red-100 font-black text-[10px] uppercase tracking-wider py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Trash2 size={13} /> Delete
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
          <div className="flex justify-between items-center pt-4 border-t border-slate-200/60 flex-wrap gap-4">
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setCurrentPage(p => Math.max(p - 1, 0))} 
                disabled={currentPage === 0}
                className="w-9 h-9 border border-slate-200 bg-white rounded-xl flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors text-slate-600"
              >
                <ChevronLeft size={16} />
              </button>
              
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className={`w-9 h-9 font-black text-xs rounded-xl transition-all ${i === currentPage ? 'bg-[#093fb4] text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {i + 1}
                </button>
              ))}

              <button 
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages - 1))} 
                disabled={currentPage === totalPages - 1}
                className="w-9 h-9 border border-slate-200 bg-white rounded-xl flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors text-slate-600"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
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
      {(publishConfirm.show || closeConfirm.show || deleteConfirm.show) && (() => {
        const isPublish = publishConfirm.show;
        const isDelete = deleteConfirm.show;
        const iconBg = isPublish ? 'bg-emerald-500' : 'bg-red-500';
        const icon = isPublish
          ? <CheckCircle2 size={24} className="text-white" />
          : isDelete ? <Trash2 size={24} className="text-white" /> : <PowerOff size={24} className="text-white" />;
        const title = isPublish ? 'Publish this program?' : isDelete ? 'Delete this program?' : 'Close this program?';
        const desc = isPublish ? 'It will become visible to all eligible students.'
          : isDelete ? 'This action is permanent and cannot be undone.' : 'Students will no longer be able to apply.';
        const confirmBg = isPublish ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700';
        const onConfirm = isPublish ? handlePublishAction : isDelete ? handleDeleteAction : handleCloseAction;

        return (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full border border-slate-100 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
              <div className={`w-14 h-14 rounded-full ${iconBg} mx-auto flex items-center justify-center mb-4 shadow-lg`}>
                {icon}
              </div>
              <h2 className="text-base font-black text-slate-900 uppercase tracking-tight mb-2">
                {title}
              </h2>
              <p className="text-xs text-slate-400 font-medium leading-relaxed mb-6">
                {desc}
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={cancelAll}
                  className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 font-black text-xs uppercase tracking-widest rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={onConfirm}
                  className={`flex-1 py-3 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-sm ${confirmBg}`}
                >
                  {isDelete ? 'Delete' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}