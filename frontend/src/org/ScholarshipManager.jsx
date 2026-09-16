import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Eye, Trash2, Edit3, PowerOff, CheckCircle2, 
  ChevronLeft, ChevronRight, Calendar, DollarSign, GraduationCap, 
  Search, SlidersHorizontal, MoreHorizontal, Folder, CheckCircle, 
  FileText, XCircle 
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

  const handleDeleteAction = async () => {
    try {
      await api.delete(`/scholarships/${deleteConfirm.id}`);
      fetchScholarships();
      setDeleteConfirm({ show: false, id: null });
    } catch (err) {
      console.error('Delete error', err);
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
    <div className="p-4 md:p-8 bg-[#FFFCFB] min-h-screen text-slate-800 font-['Inter']">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* ── HEADER TITLE BLOCK ── */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight uppercase leading-none">
              Manage <span className="text-[#093fb4]">Programs</span>
            </h1>
            <p className="text-sm text-slate-600 font-bold mt-3 uppercase tracking-[0.15em]">
              Organize and monitor all scholarship distributions
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => navigate('/create-scholarship')}
              className="flex items-center justify-center gap-2 bg-[#093fb4] hover:bg-[#073496] text-white px-8 py-4 rounded-2xl font-black text-xs md:text-sm uppercase tracking-[0.2em] transition-all shadow-xl shadow-[#093fb4]/25 active:scale-95"
            >
              <Plus size={20} strokeWidth={3} /> Create Program
            </button>
          </div>
        </div>

        {/* ── KPI METRIC CARDS ROW ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: All Programs */}
          <div 
            onClick={() => switchTab('all')}
            className={`bg-white/70 backdrop-blur-md border-2 rounded-[2rem] p-6 shadow-lg flex items-center gap-5 cursor-pointer transition-all ${activeTab === 'all' ? 'border-[#093fb4] bg-blue-50/20' : 'border-slate-200 hover:border-slate-300'}`}
          >
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#093fb4] flex items-center justify-center shrink-0 border border-blue-100">
              <Folder size={28} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest">All Programs</p>
              <p className="text-4xl font-black text-slate-900 leading-none mt-1">{getCount('all')}</p>
            </div>
          </div>

          {/* Card 2: Open */}
          <div 
            onClick={() => switchTab('open')}
            className={`bg-white/70 backdrop-blur-md border-2 rounded-[2rem] p-6 shadow-lg flex items-center gap-5 cursor-pointer transition-all ${activeTab === 'open' ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-200 hover:border-slate-300'}`}
          >
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <CheckCircle2 size={28} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Active</p>
              <p className="text-4xl font-black text-slate-900 leading-none mt-1">{getCount('open')}</p>
            </div>
          </div>

          {/* Card 3: Draft */}
          <div 
            onClick={() => switchTab('draft')}
            className={`bg-white/70 backdrop-blur-md border-2 rounded-[2rem] p-6 shadow-lg flex items-center gap-5 cursor-pointer transition-all ${activeTab === 'draft' ? 'border-amber-500 bg-amber-50/20' : 'border-slate-200 hover:border-slate-300'}`}
          >
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
              <FileText size={28} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Drafts</p>
              <p className="text-4xl font-black text-slate-900 leading-none mt-1">{getCount('draft')}</p>
            </div>
          </div>

          {/* Card 4: Closed */}
          <div 
            onClick={() => switchTab('closed')}
            className={`bg-white/70 backdrop-blur-md border-2 rounded-[2rem] p-6 shadow-lg flex items-center gap-5 cursor-pointer transition-all ${activeTab === 'closed' ? 'border-red-500 bg-red-50/20' : 'border-slate-200 hover:border-slate-300'}`}
          >
            <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
              <XCircle size={28} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Closed</p>
              <p className="text-4xl font-black text-slate-900 leading-none mt-1">{getCount('closed')}</p>
            </div>
          </div>
        </div>

        {/* ── SEARCH FILTERS ROW CONTROL ── */}
        <div className="bg-white/60 backdrop-blur-md p-6 border-2 border-slate-200 rounded-[2rem] flex flex-col md:flex-row gap-6 items-center justify-between shadow-sm">
          <div className="relative w-full md:flex-1 group">
            <Search size={22} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#093fb4] transition-colors" />
            <input
              type="text"
              placeholder="Search by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 rounded-2xl border-2 border-slate-200 bg-white focus:outline-none focus:border-[#093fb4] text-base font-bold text-slate-900 placeholder-slate-400 transition-all shadow-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-5 w-full md:w-auto">
            <div className="flex flex-col flex-1 sm:flex-initial min-w-[150px]">
              <label className="text-xs font-black uppercase text-slate-700 tracking-widest mb-2 ml-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-4 border-2 border-slate-200 rounded-2xl text-sm font-black uppercase tracking-wider text-slate-900 bg-white focus:outline-none focus:border-[#093fb4] shadow-sm cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="draft">Draft</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div className="flex flex-col flex-1 sm:flex-initial min-w-[160px]">
              <label className="text-xs font-black uppercase text-slate-700 tracking-widest mb-2 ml-1">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-4 border-2 border-slate-200 rounded-2xl text-sm font-black uppercase tracking-wider text-slate-900 bg-white focus:outline-none focus:border-[#093fb4] shadow-sm cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── PROGRAMS GRID SYSTEM ── */}
        {paginated.length === 0 ? (
          <div className="bg-white/50 border-2 border-dashed border-slate-300 rounded-[2.5rem] py-24 text-center shadow-sm">
            <Folder size={48} className="mx-auto text-slate-300 mb-4" stroke={1.5} />
            <p className="text-sm font-black text-slate-500 uppercase tracking-widest">No programs found matching this selection</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {paginated.map((s) => {
              const badgeType = getBadgeType(s);

              const badgeStyles = {
                open: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                draft: 'bg-blue-100 text-[#093fb4] border-blue-200',
                closed: 'bg-red-100 text-red-700 border-red-200',
              };

              const badgeLabels = {
                open: 'Open',
                draft: 'Draft',
                closed: 'Closed',
              };

              return (
                <div 
                  key={s.id}
                  className="bg-white/80 backdrop-blur-md border-2 border-slate-200 rounded-[2rem] p-8 shadow-lg hover:shadow-2xl hover:border-[#093fb4]/50 transition-all duration-300 flex flex-col justify-between group relative"
                >
                  <div>
                    {/* Header: Tag + Options Menu icon */}
                    <div className="flex justify-between items-center mb-6">
                      <span className={`px-4 py-1.5 rounded-xl border-2 text-xs font-black uppercase tracking-[0.2em] ${badgeStyles[badgeType] || badgeStyles.draft}`}>
                        {badgeLabels[badgeType]}
                      </span>
                      <div className="relative">
                        <button
                          onClick={() => setMenuOpenId(menuOpenId === s.id ? null : s.id)}
                          className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
                        >
                          <MoreHorizontal size={24} stroke={2.5}/>
                        </button>

                        {menuOpenId === s.id && (
                          <div className="absolute right-0 top-full mt-2 w-40 bg-white border-2 border-slate-200 rounded-2xl shadow-xl py-2 z-20">
                            {(badgeType === 'draft' || badgeType === 'closed') ? (
                              <button
                                onClick={() => {
                                  setDeleteConfirm({ show: true, id: s.id });
                                  setMenuOpenId(null);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-widest text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 size={16} stroke={2.5} /> Delete
                              </button>
                            ) : (
                              <p className="px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-widest text-center">
                                No Actions
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Meta header row: Profile avatar image + text titles */}
                    <div className="flex items-center gap-5 mb-5">
                      <div className="w-16 h-16 rounded-2xl border-2 border-slate-100 shadow-sm overflow-hidden bg-slate-50 flex items-center justify-center shrink-0">
                        {s.org_pic ? (
                          <img src={s.org_pic} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl font-black text-slate-400">
                            {s.org_name?.substring(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg md:text-xl font-black text-slate-900 leading-snug group-hover:text-[#093fb4] transition-colors truncate uppercase tracking-tight">
                          {s.title}
                        </h3>
                        <p className="text-xs font-black text-[#093fb4] uppercase tracking-[0.15em] mt-1 truncate">
                          {s.org_name || 'OSDS-CHED'}
                        </p>
                      </div>
                    </div>

                    {/* Program description snippet */}
                    <p className="text-sm text-slate-600 font-semibold leading-relaxed line-clamp-3 mb-8">
                      {s.description || 'No summary description provided for this tracking program.'}
                    </p>

                    {/* Multi-parameter information row */}
                    <div className="grid grid-cols-3 gap-3 py-5 border-t-2 border-b-2 border-slate-100 my-6 text-center">
                      <div>
                        <div className="flex items-center justify-center gap-2 text-slate-600 mb-2">
                          <Calendar size={16} stroke={2.5}/>
                          <span className="text-[10px] font-black uppercase tracking-widest">Deadline</span>
                        </div>
                        <p className="text-sm font-extrabold text-slate-900 truncate">
                          {s.deadline ? new Date(s.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'VARY'}
                        </p>
                      </div>

                      <div className="border-l-2 border-r-2 border-slate-100">
                        <div className="flex items-center justify-center gap-2 text-slate-600 mb-2">
                          <DollarSign size={16} stroke={2.5}/>
                          <span className="text-[10px] font-black uppercase tracking-widest">Budget</span>
                        </div>
                        <p className="text-sm font-black text-[#093fb4] truncate">
                          {s.total_budget != null ? `₱${Number(s.total_budget).toLocaleString()}` : 'VARY'}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center justify-center gap-2 text-slate-600 mb-2">
                          <GraduationCap size={16} stroke={2.5}/>
                          <span className="text-[10px] font-black uppercase tracking-widest">Type</span>
                        </div>
                        <p className="text-sm font-extrabold text-slate-900 truncate">
                          {s.fund_type || 'Financial Aid'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ── CARD BUTTON ROW ACTION PACK (Matches Screenshot) ── */}
<div className="flex items-center gap-3 mt-4">
  {/* View Action — always available */}
  <button 
    onClick={() => setViewModal(s)}
    className="flex-1 bg-white border-2 border-slate-200 hover:border-[#093fb4] hover:text-[#093fb4] text-slate-800 font-black text-xs uppercase tracking-widest py-3.5 rounded-2xl transition-colors"
  >
    View
  </button>

  {/* DRAFT: Edit, Publish, Delete */}
  {badgeType === 'draft' && (
    <>
      <button 
        onClick={() => setEditModal(s)}
        className="flex-1 bg-white border-2 border-slate-200 hover:border-slate-400 text-slate-800 font-black text-xs uppercase tracking-widest py-3.5 rounded-2xl transition-colors"
      >
        Edit
      </button>
      <button 
        onClick={() => setPublishConfirm({ show: true, id: s.id })}
        className="flex-1 bg-emerald-50 text-emerald-700 border-2 border-emerald-200 hover:bg-emerald-100 font-black text-xs uppercase tracking-widest py-3.5 rounded-2xl transition-colors"
      >
        Publish
      </button>
      <button 
        onClick={() => setDeleteConfirm({ show: true, id: s.id })}
        className="flex-1 bg-red-50 text-red-700 border-2 border-red-200 hover:bg-red-100 font-black text-xs uppercase tracking-widest py-3.5 rounded-2xl transition-colors"
      >
        Delete
      </button>
    </>
  )}

  {/* OPEN: Close */}
  {badgeType === 'open' && (
    <button 
      onClick={() => setCloseConfirm({ show: true, id: s.id })}
      className="flex-1 bg-red-50 text-red-700 border-2 border-red-200 hover:bg-red-100 font-black text-xs uppercase tracking-widest py-3.5 rounded-2xl transition-colors"
    >
      Close
    </button>
  )}

  {/* CLOSED: Delete */}
  {badgeType === 'closed' && (
    <button 
      onClick={() => setDeleteConfirm({ show: true, id: s.id })}
      className="flex-1 bg-red-50 text-red-700 border-2 border-red-200 hover:bg-red-100 font-black text-xs uppercase tracking-widest py-3.5 rounded-2xl transition-colors"
    >
      Delete
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
          <div className="flex justify-between items-center pt-8 border-t-2 border-slate-200 flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(p - 1, 0))} 
                disabled={currentPage === 0}
                className="w-12 h-12 border-2 border-slate-200 bg-white rounded-2xl flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors text-slate-700"
              >
                <ChevronLeft size={20} strokeWidth={2.5}/>
              </button>
              
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className={`w-12 h-12 font-black text-sm uppercase rounded-2xl transition-all border-2 ${i === currentPage ? 'bg-[#093fb4] border-[#093fb4] text-white shadow-lg' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                >
                  {i + 1}
                </button>
              ))}

              <button 
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages - 1))} 
                disabled={currentPage === totalPages - 1}
                className="w-12 h-12 border-2 border-slate-200 bg-white rounded-2xl flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors text-slate-700"
              >
                <ChevronRight size={20} strokeWidth={2.5}/>
              </button>
            </div>

            <div className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">
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
        const iconBg = isPublish ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-red-100 text-red-600 border-red-200';
        const icon = isPublish
          ? <CheckCircle2 size={32} strokeWidth={2.5} />
          : isDelete ? <Trash2 size={32} strokeWidth={2.5} /> : <PowerOff size={32} strokeWidth={2.5} />;
        const title = isPublish ? 'Publish this program?' : isDelete ? 'Delete this program?' : 'Close this program?';
        const desc = isPublish ? 'It will become visible to all eligible students.'
          : isDelete ? 'This action is permanent and cannot be undone.' : 'Students will no longer be able to apply.';
        const confirmBg = isPublish ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700';
        const onConfirm = isPublish ? handlePublishAction : isDelete ? handleDeleteAction : handleCloseAction;

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
            <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-10 max-w-sm w-full border border-white/60 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
              <div className={`w-20 h-20 rounded-2xl border-2 ${iconBg} mx-auto flex items-center justify-center mb-6 shadow-inner`}>
                {icon}
              </div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-3">
                {title}
              </h2>
              <p className="text-sm text-slate-600 font-bold leading-relaxed mb-8">
                {desc}
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={cancelAll}
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={onConfirm}
                  className={`flex-1 py-4 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-lg active:scale-95 ${confirmBg}`}
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