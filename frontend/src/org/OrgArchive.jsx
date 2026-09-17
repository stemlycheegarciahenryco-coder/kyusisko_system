import React, { useState, useEffect } from 'react';
import api, { backendURL } from '../api';
import {
  Archive, RotateCcw, Trash2, Users, Calendar, ChevronLeft, ChevronRight,
  ArchiveX, AlertTriangle, X, GraduationCap
} from 'lucide-react';

const CARDS_PER_PAGE = 6;

export default function OrgArchive() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);

  const [restoreConfirm, setRestoreConfirm] = useState({ show: false, id: null, title: '' });
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, title: '', studentCount: 0 });
  const [rosterModal, setRosterModal] = useState(null); // holds the clicked program, or null
  const [busy, setBusy] = useState(false);

  const fetchArchived = async () => {
    try {
      const res = await api.get('/scholarships/archived/get-all');
      setPrograms(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch archived programs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchived();
  }, []);

  const totalPages = Math.ceil(programs.length / CARDS_PER_PAGE);
  const paginated = programs.slice(currentPage * CARDS_PER_PAGE, (currentPage + 1) * CARDS_PER_PAGE);

  const handleRestore = async () => {
    setBusy(true);
    try {
      await api.patch(`/scholarships/${restoreConfirm.id}/restore`);
      setRestoreConfirm({ show: false, id: null, title: '' });
      fetchArchived();
    } catch (err) {
      console.error('Restore error', err);
      alert('Failed to restore program.');
    } finally {
      setBusy(false);
    }
  };

  const handlePermanentDelete = async () => {
    setBusy(true);
    try {
      await api.delete(`/scholarships/${deleteConfirm.id}/permanent`);
      setDeleteConfirm({ show: false, id: null, title: '', studentCount: 0 });
      fetchArchived();
    } catch (err) {
      console.error('Permanent delete error', err);
      alert('Failed to permanently delete program.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FFFCFB]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-4 border-[#093fb4] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Archive…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-[#FFFCFB] min-h-screen text-slate-800 font-['Inter']">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ── HEADER ── */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight uppercase leading-none flex items-center gap-3">
              <Archive size={40} className="text-[#093fb4]" strokeWidth={2.5} />
              Archive
            </h1>
            <p className="text-sm text-slate-600 font-bold mt-3 uppercase tracking-[0.15em]">
              Archived programs and the students who applied to them
            </p>
          </div>
        </div>

        {/* ── EMPTY STATE ── */}
        {programs.length === 0 ? (
          <div className="bg-white/50 border-2 border-dashed border-slate-300 rounded-[2.5rem] py-24 text-center shadow-sm">
            <Archive size={48} className="mx-auto text-slate-300 mb-4" stroke={1.5} />
            <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Nothing archived yet</p>
            <p className="text-xs font-semibold text-slate-400 mt-2">Programs you archive from Manage Programs will show up here.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {paginated.map((program) => {
                const totalApplicants = program.applicants?.length || 0;
                const truncatedApplicants = program.applicants?.slice(0, 4) || [];
                const extraCount = totalApplicants - 4;

                return (
                  <div
                    key={program.id}
                    onClick={() => setRosterModal(program)}
                    className="bg-white/80 backdrop-blur-md border-2 border-slate-200 rounded-[2rem] p-8 shadow-lg flex flex-col justify-between cursor-pointer hover:border-[#093fb4]/40 hover:shadow-2xl transition-all"
                  >
                    <div>
                      {/* Archived badge */}
                      <div className="flex justify-between items-center mb-6">
                        <span className="px-4 py-1.5 rounded-xl border-2 bg-slate-100 text-slate-600 border-slate-200 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                          <Archive size={13} /> Archived
                        </span>
                        {program.archived_at && (
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Calendar size={12} />
                            {new Date(program.archived_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-lg md:text-xl font-black text-slate-900 leading-snug truncate uppercase tracking-tight mb-1">
                        {program.title}
                      </h3>
                      <p className="text-xs font-black text-[#093fb4] uppercase tracking-[0.15em] mb-5 truncate">
                        {program.org_name || 'OSDS-CHED'}
                      </p>

                      {/* Students inside this archived program */}
                      <div className="mb-2">
                        <p className="text-[11px] font-black uppercase tracking-widest text-slate-600 mb-3 flex items-center gap-1.5">
                          <Users size={13} /> Students ({totalApplicants})
                        </p>
                        {totalApplicants === 0 ? (
                          <p className="text-xs font-semibold italic text-slate-400">No students were in this program</p>
                        ) : (
                          <div className="flex items-center">
                            {truncatedApplicants.map((applicant, index) => {
                              const firstName = applicant.sfirst_name || '';
                              const lastName = applicant.slast_name || '';
                              const rawFileName = applicant.sprofile_pic || '';
                              const hasValidImg = rawFileName && rawFileName.trim() !== '';
                              const fullImgUrl = hasValidImg
                                ? (rawFileName.startsWith('http') ? rawFileName : `${backendURL}/uploads/${rawFileName}`)
                                : null;
                              return (
                                <div
                                  key={applicant.id || index}
                                  title={`${firstName} ${lastName}`.trim() || 'Student'}
                                  className="w-9 h-9 rounded-full border-2 border-white overflow-hidden bg-slate-200 flex-shrink-0 relative shadow-sm grayscale"
                                  style={{ marginLeft: index === 0 ? 0 : -10 }}
                                >
                                  {hasValidImg && (
                                    <img
                                      src={fullImgUrl}
                                      alt=""
                                      className="w-full h-full object-cover"
                                      onError={e => { e.target.style.display = 'none'; e.target.nextSibling?.removeAttribute('style'); }}
                                    />
                                  )}
                                  <div
                                    className="w-full h-full flex items-center justify-center text-white text-[11px] font-black uppercase bg-slate-400"
                                    style={{ display: hasValidImg ? 'none' : 'flex' }}
                                  >
                                    {firstName[0] || '?'}{lastName[0] || ''}
                                  </div>
                                </div>
                              );
                            })}
                            {extraCount > 0 && (
                              <div
                                className="w-9 h-9 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center flex-shrink-0"
                                style={{ marginLeft: -10 }}
                              >
                                <span className="text-[11px] font-black text-slate-500">+{extraCount}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 mt-6 pt-6 border-t-2 border-slate-100">
                      <button
                        onClick={(e) => { e.stopPropagation(); setRestoreConfirm({ show: true, id: program.id, title: program.title }); }}
                        className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 border-2 border-emerald-200 hover:bg-emerald-100 font-black text-xs uppercase tracking-widest py-3.5 rounded-2xl transition-colors"
                      >
                        <RotateCcw size={15} /> Restore
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ show: true, id: program.id, title: program.title, studentCount: totalApplicants }); }}
                        className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-700 border-2 border-red-200 hover:bg-red-100 font-black text-xs uppercase tracking-widest py-3.5 rounded-2xl transition-colors"
                      >
                        <Trash2 size={15} /> Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── PAGINATION ── */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center pt-8 border-t-2 border-slate-200 flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 0))}
                    disabled={currentPage === 0}
                    className="w-12 h-12 border-2 border-slate-200 bg-white rounded-2xl flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors text-slate-700"
                  >
                    <ChevronLeft size={20} strokeWidth={2.5} />
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
                    <ChevronRight size={20} strokeWidth={2.5} />
                  </button>
                </div>
                <div className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">
                  Page {currentPage + 1} of {totalPages}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── RESTORE CONFIRM ── */}
      {restoreConfirm.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-10 max-w-sm w-full border border-white/60 shadow-2xl text-center">
            <div className="w-20 h-20 rounded-2xl border-2 bg-emerald-100 text-emerald-600 border-emerald-200 mx-auto flex items-center justify-center mb-6 shadow-inner">
              <RotateCcw size={32} strokeWidth={2.5} />
            </div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-3">Restore this program?</h2>
            <p className="text-sm text-slate-600 font-bold leading-relaxed mb-8">
              "{restoreConfirm.title}" will move back to Manage Programs as an active program.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setRestoreConfirm({ show: false, id: null, title: '' })}
                className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRestore}
                disabled={busy}
                className="flex-1 py-4 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-lg active:scale-95 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60"
              >
                {busy ? 'Restoring…' : 'Restore'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PERMANENT DELETE CONFIRM ── */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-10 max-w-sm w-full border border-white/60 shadow-2xl text-center">
            <div className="w-20 h-20 rounded-2xl border-2 bg-red-100 text-red-600 border-red-200 mx-auto flex items-center justify-center mb-6 shadow-inner">
              <ArchiveX size={32} strokeWidth={2.5} />
            </div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-3">Permanently delete?</h2>
            <p className="text-sm text-slate-600 font-bold leading-relaxed mb-4">
              "{deleteConfirm.title}" will be gone for good — this can't be undone.
            </p>
            {deleteConfirm.studentCount > 0 && (
              <div className="flex items-center gap-2 justify-center bg-amber-50 border border-amber-200 text-amber-700 text-xs font-black uppercase tracking-wider rounded-xl py-3 px-4 mb-8">
                <AlertTriangle size={15} />
                {deleteConfirm.studentCount} student{deleteConfirm.studentCount === 1 ? '' : 's'} history stays in Reports
              </div>
            )}
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteConfirm({ show: false, id: null, title: '', studentCount: 0 })}
                className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePermanentDelete}
                disabled={busy}
                className="flex-1 py-4 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-lg active:scale-95 bg-red-600 hover:bg-red-700 disabled:opacity-60"
              >
                {busy ? 'Deleting…' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STUDENT ROSTER MODAL ── */}
      {rosterModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
          onClick={() => setRosterModal(null)}
        >
          <div
            className="bg-white rounded-[2rem] max-w-lg w-full max-h-[80vh] border border-white/60 shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-7 pb-5 border-b-2 border-slate-100 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Archived Program</p>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight truncate">{rosterModal.title}</h2>
              </div>
              <button
                onClick={() => setRosterModal(null)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto px-7 py-5 space-y-3">
              {(rosterModal.applicants?.length || 0) === 0 ? (
                <p className="text-sm font-semibold italic text-slate-400 text-center py-8">No students were in this program</p>
              ) : (
                rosterModal.applicants.map((applicant, index) => {
                  const firstName = applicant.sfirst_name || '';
                  const lastName = applicant.slast_name || '';
                  // NOTE: comes from a join through student_onboarding_profiles ->
                  // colleges on the backend; verify the colleges column name there
                  // if this shows up blank.
                  const school = applicant.school_name || 'School not on file';
                  const rawFileName = applicant.sprofile_pic || '';
                  const hasValidImg = rawFileName && rawFileName.trim() !== '';
                  const fullImgUrl = hasValidImg
                    ? (rawFileName.startsWith('http') ? rawFileName : `${backendURL}/uploads/${rawFileName}`)
                    : null;

                  return (
                    <div
                      key={applicant.id || index}
                      className="flex items-center gap-4 p-3 rounded-2xl border border-slate-100 bg-slate-50/60"
                    >
                      <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-300 flex-shrink-0 relative grayscale">
                        {hasValidImg && (
                          <img
                            src={fullImgUrl}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={e => { e.target.style.display = 'none'; e.target.nextSibling?.removeAttribute('style'); }}
                          />
                        )}
                        <div
                          className="w-full h-full flex items-center justify-center text-white text-xs font-black uppercase bg-slate-400"
                          style={{ display: hasValidImg ? 'none' : 'flex' }}
                        >
                          {firstName[0] || '?'}{lastName[0] || ''}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-900 truncate">
                          {`${firstName} ${lastName}`.trim() || 'Unnamed student'}
                        </p>
                        <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5 truncate">
                          <GraduationCap size={12} className="shrink-0" /> {school}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-5 border-t-2 border-slate-100">
              <button
                onClick={() => setRosterModal(null)}
                className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}