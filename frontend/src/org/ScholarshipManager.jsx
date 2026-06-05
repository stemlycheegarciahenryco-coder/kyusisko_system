import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Trash2, Edit3, PowerOff, CheckCircle, Archive, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../api';
import ViewProgram from '../component/ViewProgram';
import EditProgram from '../component/EditProgram';

/* ─────────────────────────────────────────────────────────────────
   PALETTE
     White  #FFFCFB   Blue  #093fb4   Red  #FF1E1E   Green  #16a34a
   ───────────────────────────────────────────────────────────────── */
const C = {
  white:       '#FFFCFB',
  blue:        '#093fb4',
  blueLight:   '#e8eef8',
  blueMid:     '#d0dcf2',
  red:         '#FF1E1E',
  redLight:    '#fff0f0',
  green:       '#16a34a',
  greenLight:  '#f0faf4',
  textStrong:  '#111827',
  textBody:    '#374151',
  textMuted:   '#6b7280',
  border:      '#e5e7eb',
  borderLight: '#f3f4f6',
  surface:     '#f9fafb',
};

/* ─── Button tokens ── */
const btn = {
  view:    { background: C.blue,  color: C.white },
  edit:    { background: C.blue,  color: C.white },
  delete:  { background: C.red,   color: C.white },
  archive: { background: C.red,   color: C.white },
  publish: { background: C.green, color: C.white },
  close:   { background: C.red,   color: C.white },
};

const ICON_BTN = {
  width: 34, height: 34, borderRadius: 8, border: 'none',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', flexShrink: 0,
};
const WIDE_BTN = {
  height: 34, padding: '0 14px', borderRadius: 8, border: 'none',
  display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer',
  fontSize: 10.5, fontWeight: 800, letterSpacing: '0.1em',
  textTransform: 'uppercase', whiteSpace: 'nowrap',
};

/* ─── Status badges ── */
const BADGE = {
  open:    { bg: C.green,     color: C.white, dot: C.white, label: 'Open'            },
  draft:   { bg: C.blue,      color: C.white, dot: C.white, label: 'Draft'           },
  closed:  { bg: C.red,       color: C.white, dot: C.white, label: 'Closed'          },
  expired: { bg: C.red,       color: C.white, dot: C.white, label: 'Deadline Passed' },
};

const StatusBadge = ({ type }) => {
  const m = BADGE[type] || BADGE.draft;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
      padding: '3px 10px', borderRadius: 999,
      background: m.bg, color: m.color,
      width: 'fit-content', marginBottom: 14,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.dot, opacity: 0.7, flexShrink: 0 }} />
      {m.label}
    </span>
  );
};

/* ─── Tabs config ── */
const TABS = [
  { key: 'all',     label: 'All'             },
  { key: 'open',    label: 'Open'            },
  { key: 'draft',   label: 'Draft'           },
  { key: 'closed',  label: 'Closed'          },
  { key: 'expired', label: 'Deadline Passed' },
];

const CARDS_PER_PAGE = 8;

/* ─── COMPONENT ── */
const ScholarshipManager = () => {
  const navigate = useNavigate();
  const [scholarships, setScholarships] = useState([]);
  const [activeTab,    setActiveTab]    = useState('all');
  const [currentPage,  setCurrentPage]  = useState(0);
  const [viewModal,    setViewModal]    = useState(null);
  const [editModal,    setEditModal]    = useState(null);
  const [publishConfirm, setPublishConfirm] = useState({ show: false, id: null });
  const [closeConfirm,   setCloseConfirm]   = useState({ show: false, id: null });
  const [deleteConfirm,  setDeleteConfirm]  = useState({ show: false, id: null });

  useEffect(() => { fetchScholarships(); }, []);

  const fetchScholarships = async () => {
    try {
      const res = await api.get('/scholarships/get-all');
      setScholarships((res.data.data || []).filter(s => s.status !== 'archived'));
      setCurrentPage(0);
    } catch (err) { console.error('Fetch error', err); }
  };

  /* ── derive badge type per card ── */
  const getBadgeType = (s) => {
    const isPast = s.deadline ? new Date() > new Date(s.deadline) : false;
    const st     = s.status?.toLowerCase();
    if (isPast && st !== 'closed') return 'expired';
    if (st === 'closed')           return 'closed';
    if (st === 'open')             return 'open';
    return 'draft';
  };

  /* ── filter by tab ── */
  const filtered = activeTab === 'all'
    ? scholarships
    : scholarships.filter(s => getBadgeType(s) === activeTab);

  /* ── tab counts ── */
  const count = (key) => key === 'all'
    ? scholarships.length
    : scholarships.filter(s => getBadgeType(s) === key).length;

  const totalPages = Math.ceil(filtered.length / CARDS_PER_PAGE);
  const paginated  = filtered.slice(currentPage * CARDS_PER_PAGE, (currentPage + 1) * CARDS_PER_PAGE);

  const switchTab = (key) => { setActiveTab(key); setCurrentPage(0); };

  /* ── actions ── */
  const handleDeleteAction = async () => {
    try { await api.delete(`/scholarships/${deleteConfirm.id}`); fetchScholarships(); setDeleteConfirm({ show: false, id: null }); }
    catch (err) { console.error('Delete error', err); }
  };
  const handleArchive = async (id) => {
    try { await api.patch(`/scholarships/${id}/status`, { status: 'archived' }); navigate('/OrgHistory'); fetchScholarships(); }
    catch { alert('Failed to archive'); }
  };
  const handlePublishAction = async () => {
    try { await api.patch(`/scholarships/${publishConfirm.id}/status`, { status: 'open' }); fetchScholarships(); setPublishConfirm({ show: false, id: null }); }
    catch { alert('Failed to publish'); }
  };
  const handleCloseAction = async () => {
    try { await api.patch(`/scholarships/${closeConfirm.id}/status`, { status: 'closed' }); setCloseConfirm({ show: false, id: null }); fetchScholarships(); }
    catch (err) { console.error('Close error', err); }
  };
  const cancelAll = () => {
    setPublishConfirm({ show: false, id: null });
    setCloseConfirm({ show: false, id: null });
    setDeleteConfirm({ show: false, id: null });
  };

  return (
    <div style={{ padding: '32px 28px 60px', background: C.white, minHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: C.textStrong, letterSpacing: '-0.03em', lineHeight: 1.15, margin: 0 }}>
              Manage your <span style={{ color: C.blue }}>Scholarships</span>
            </h1>
            <p style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, marginTop: 6, letterSpacing: '0.04em' }}>
              {scholarships.length} program{scholarships.length !== 1 ? 's' : ''} total
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: '0.06em' }}>
                  {currentPage + 1} / {totalPages}
                </span>
                <button onClick={() => setCurrentPage(p => Math.max(p - 1, 0))} disabled={currentPage === 0}
                  style={{ width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentPage === 0 ? 'not-allowed' : 'pointer', opacity: currentPage === 0 ? 0.35 : 1, color: C.textBody }}>
                  <ChevronLeft size={15} />
                </button>
                <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages - 1))} disabled={currentPage === totalPages - 1}
                  style={{ width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentPage === totalPages - 1 ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages - 1 ? 0.35 : 1, color: C.textBody }}>
                  <ChevronRight size={15} />
                </button>
              </div>
            )}
            <button onClick={() => navigate('/create-scholarship')}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: C.blue, color: C.white, border: 'none', borderRadius: 10, fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer' }}>
              <Plus size={16} strokeWidth={3} /> Create New Program
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            const tabCount = count(tab.key);
            return (
              <button
                key={tab.key}
                onClick={() => switchTab(tab.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
                  fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase',
                  transition: 'all .15s',
                  background: isActive ? C.blue : C.surface,
                  color:      isActive ? C.white : C.textMuted,
                  boxShadow:  isActive ? `0 2px 8px ${C.blue}30` : 'none',
                }}
              >
                {tab.label}
                <span style={{
                  fontSize: 9, fontWeight: 900, padding: '1px 6px', borderRadius: 999,
                  background: isActive ? 'rgba(255,255,255,0.25)' : C.borderLight,
                  color:      isActive ? C.white : C.textMuted,
                }}>
                  {tabCount}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Grid ── */}
        {paginated.length === 0 ? (
          <div style={{ background: C.surface, borderRadius: 20, border: `1.5px solid ${C.borderLight}`, padding: '64px 32px', textAlign: 'center' }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.12em' }}>No programs in this category</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 16 }}>
            {paginated.map((s) => {
              const isPastDeadline    = s.deadline ? new Date() > new Date(s.deadline) : false;
              const status            = s.status?.toLowerCase();
              const isClosedOrExpired = status === 'closed' || isPastDeadline;
              const badgeType         = getBadgeType(s);

              return (
                <div key={s.id}
                  style={{ background: C.white, border: `1.5px solid ${C.borderLight}`, borderRadius: 18, padding: '20px 18px 16px', display: 'flex', flexDirection: 'column', transition: 'border-color .15s, box-shadow .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.blueMid; e.currentTarget.style.boxShadow = `0 4px 16px ${C.blue}14`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderLight; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <StatusBadge type={badgeType} />

                  <h3 style={{ fontSize: 13.5, fontWeight: 800, color: C.textStrong, marginBottom: 7, letterSpacing: '-0.01em', lineHeight: 1.35, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {s.title}
                  </h3>
                  <p style={{ fontSize: 11.5, color: C.textBody, lineHeight: 1.65, flex: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', marginBottom: 16 }}>
                    {s.description}
                  </p>

                  {/* ── Button row ── */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, paddingTop: 12, borderTop: `1px solid ${C.borderLight}` }}>
                    {/* View — Blue */}
                    <button onClick={() => setViewModal(s)} title="View" style={{ ...ICON_BTN, ...btn.view }}>
                      <Eye size={15} />
                    </button>

                    {/* Draft: Edit (Blue) + Delete (Red) */}
                    {status === 'draft' && !isPastDeadline && (<>
                      <button onClick={() => setEditModal(s)} title="Edit" style={{ ...ICON_BTN, ...btn.edit }}>
                        <Edit3 size={15} />
                      </button>
                      <button onClick={() => setDeleteConfirm({ show: true, id: s.id })} title="Delete" style={{ ...ICON_BTN, ...btn.delete }}>
                        <Trash2 size={15} />
                      </button>
                    </>)}

                    {/* Open: Edit (Blue) */}
                    {status === 'open' && !isPastDeadline && (
                      <button onClick={() => setEditModal(s)} title="Edit" style={{ ...ICON_BTN, ...btn.edit }}>
                        <Edit3 size={15} />
                      </button>
                    )}

                    <div style={{ flex: 1 }} />

                    {/* Publish — Green */}
                    {status === 'draft' && !isPastDeadline && (
                      <button onClick={() => setPublishConfirm({ show: true, id: s.id })} style={{ ...WIDE_BTN, ...btn.publish }}>
                        <CheckCircle size={14} /> Publish
                      </button>
                    )}
                    {/* Close — Red */}
                    {status === 'open' && !isPastDeadline && (
                      <button onClick={() => setCloseConfirm({ show: true, id: s.id })} style={{ ...WIDE_BTN, ...btn.close }}>
                        <PowerOff size={14} /> Close
                      </button>
                    )}
                    {/* Archive — Red */}
                    {isClosedOrExpired && status !== 'draft' && (
                      <button onClick={() => handleArchive(s.id)} style={{ ...WIDE_BTN, ...btn.archive }}>
                        <Archive size={14} /> Archive
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Dot indicators ── */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 32 }}>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i} onClick={() => setCurrentPage(i)}
                style={{ borderRadius: 999, border: 'none', cursor: 'pointer', transition: 'all 0.2s', padding: 0, width: i === currentPage ? 24 : 8, height: 8, background: i === currentPage ? C.blue : C.blueMid }} />
            ))}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {viewModal && <ViewProgram scholarship={viewModal} onClose={() => setViewModal(null)} />}
      {editModal && (
        <EditProgram scholarship={editModal}
          onUpdateSuccess={() => { setEditModal(null); fetchScholarships(); }}
          onCancel={() => setEditModal(null)} />
      )}

      {/* ── Confirm dialogs ── */}
      {(publishConfirm.show || closeConfirm.show || deleteConfirm.show) && (() => {
        const isPublish = publishConfirm.show;
        const isDelete  = deleteConfirm.show;
        const iconBg    = isPublish ? C.green : C.red;
        const icon      = isPublish
          ? <CheckCircle size={26} color={C.white} />
          : isDelete ? <Trash2 size={26} color={C.white} /> : <PowerOff size={26} color={C.white} />;
        const title     = isPublish ? 'Publish this program?' : isDelete ? 'Delete this program?' : 'Close this program?';
        const desc      = isPublish ? 'It will become visible to all eligible students.'
          : isDelete ? 'This action is permanent and cannot be undone.' : 'Students will no longer be able to apply.';
        const confirmBg = isPublish ? C.green : C.red;
        const onConfirm = isPublish ? handlePublishAction : isDelete ? handleDeleteAction : handleCloseAction;

        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(9,63,180,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
            <div style={{ background: C.white, borderRadius: 20, padding: '32px 28px', maxWidth: 340, width: '100%', border: `1.5px solid ${C.borderLight}`, boxShadow: `0 20px 60px rgba(9,63,180,0.12)` }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', margin: '0 auto 18px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: iconBg }}>
                {icon}
              </div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: C.textStrong, textAlign: 'center', marginBottom: 8, letterSpacing: '-0.01em' }}>
                {title}
              </h2>
              <p style={{ fontSize: 11.5, color: C.textBody, textAlign: 'center', marginBottom: 24, lineHeight: 1.6 }}>
                {desc}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={cancelAll}
                  style={{ flex: 1, padding: '10px', borderRadius: 9, border: `1.5px solid ${C.border}`, background: C.surface, color: C.textBody, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={onConfirm}
                  style={{ flex: 1, padding: '10px', borderRadius: 9, border: 'none', background: confirmBg, color: C.white, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                  {isDelete ? 'Delete' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default ScholarshipManager;