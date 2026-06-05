import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { backendURL } from '../api';
import { Users, ArrowRight, Calendar, Layers, ChevronLeft, ChevronRight } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────
   PALETTE  (derived entirely from #FFFCFB + #093fb4)
   ───────────────────────────────────────────────────────────────── */
const C = {
  white:       '#FFFCFB',
  brand:       '#093fb4',
  brandLight:  '#e8eef8',
  brandMid:    '#d0dcf2',
  brandStrong: '#072f87',
  textStrong:  '#0f1f3d',
  textBody:    '#3d5080',
  textMuted:   '#7a8fbb',
  border:      '#d0dcf2',
  borderLight: '#e8eef8',
  surface:     '#f4f6fc',
  danger:      '#7a2d3d',
  dangerLight: '#f4e8eb',
};

const CARDS_PER_PAGE = 6;

export default function OrgApplicantPrograms() {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const orgId = localStorage.getItem('orgId');

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const res = await api.get(`/organizations/dashboard-programs/${orgId}`);
        setPrograms(res.data.data || res.data);
      } catch (err) {
        console.error("Failed to fetch programs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPrograms();
  }, [orgId]);

  const totalPages     = Math.ceil(programs.length / CARDS_PER_PAGE);
  const paginatedProgs = programs.slice(currentPage * CARDS_PER_PAGE, (currentPage + 1) * CARDS_PER_PAGE);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: C.white }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 38, height: 38, border: `4px solid ${C.brand}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
        <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', color: C.textMuted }}>Loading Programs…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ padding: '32px 28px 60px', background: C.white, minHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: C.textStrong, letterSpacing: '-0.03em', lineHeight: 1.15, margin: 0 }}>
              Select a <span style={{ color: C.brand }}>Program</span>
            </h1>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Choose a scholarship card to view its tracking table
            </p>
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: '0.06em' }}>
                {currentPage + 1} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 0))}
                disabled={currentPage === 0}
                style={{ width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentPage === 0 ? 'not-allowed' : 'pointer', opacity: currentPage === 0 ? 0.35 : 1, color: C.textBody }}
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages - 1))}
                disabled={currentPage === totalPages - 1}
                style={{ width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentPage === totalPages - 1 ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages - 1 ? 0.35 : 1, color: C.textBody }}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>

        {/* ── Empty state ── */}
        {programs.length === 0 ? (
          <div style={{ background: C.surface, borderRadius: 20, border: `1.5px solid ${C.borderLight}`, padding: '64px 32px', textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: C.brandLight, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Users size={22} color={C.brandMid} />
            </div>
            <p style={{ fontSize: 12, fontWeight: 800, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.12em' }}>No programs found</p>
          </div>
        ) : (
          <>
            {/* ── Grid ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
              {paginatedProgs.map((program) => {
                const totalApplicants    = program.applicants?.length || 0;
                const truncatedApplicants = program.applicants?.slice(0, 4) || [];
                const extraCount         = totalApplicants - 4;
                const status             = program.status?.toLowerCase();

                /* status badge style */
                const badgeStyle = status === 'open' || status === 'active'
                  ? { background: C.brandLight,  color: C.brand,    border: `1px solid ${C.brandMid}` }
                  : status === 'closed'
                  ? { background: C.dangerLight, color: C.danger,   border: `1px solid ${C.danger}40` }
                  : { background: C.surface,     color: C.textBody, border: `1px solid ${C.border}` };

                return (
                  <div
                    key={program.id}
                    onClick={() => navigate(`/scholarship-applications/${program.id}/applicants`)}
                    style={{ background: C.white, border: `1.5px solid ${C.borderLight}`, borderRadius: 20, padding: '20px 18px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 220, cursor: 'pointer', transition: 'border-color .15s, box-shadow .15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = C.brandMid; e.currentTarget.style.boxShadow = `0 4px 20px ${C.brand}14`; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderLight; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <div>
                      {/* Icon + badge row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: C.brandLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Layers size={17} color={C.brand} />
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 999, ...badgeStyle }}>
                          {program.status}
                        </span>
                      </div>

                      {/* Title */}
                      <h2 style={{ fontSize: 13.5, fontWeight: 800, color: C.textStrong, letterSpacing: '-0.01em', lineHeight: 1.35, marginBottom: 12, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {program.title}
                      </h2>

                      {/* Applicant avatars */}
                      <div style={{ marginBottom: 4 }}>
                        <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.textBody, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Users size={10} /> Applicants ({totalApplicants})
                        </p>
                        {totalApplicants === 0 ? (
                          <p style={{ fontSize: 11, fontStyle: 'italic', color: C.textMuted }}>No submissions yet</p>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            {truncatedApplicants.map((applicant, index) => {
                              const firstName  = applicant.sfirst_name || '';
                              const lastName   = applicant.slast_name  || '';
                              const rawFileName = applicant.sprofile_pic || '';
                              const hasValidImg = rawFileName && rawFileName.trim() !== '';
                              const fullImgUrl  = hasValidImg
                                ? (rawFileName.startsWith('http') ? rawFileName : `${backendURL}/uploads/${rawFileName}`)
                                : null;
                              return (
                                <div
                                  key={applicant.id || index}
                                  title={`${firstName} ${lastName}`.trim() || 'Applicant'}
                                  style={{ width: 28, height: 28, borderRadius: '50%', border: `2px solid ${C.white}`, marginLeft: index === 0 ? 0 : -8, background: C.brandMid, overflow: 'hidden', flexShrink: 0, position: 'relative' }}
                                >
                                  {hasValidImg && (
                                    <img src={fullImgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                      onError={e => { e.target.style.display = 'none'; e.target.nextSibling?.removeAttribute('style'); }} />
                                  )}
                                  <div style={{ width: '100%', height: '100%', background: C.brand, color: C.white, fontSize: 10, fontWeight: 800, display: hasValidImg ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', textTransform: 'uppercase' }}>
                                    {firstName[0] || '?'}{lastName[0] || ''}
                                  </div>
                                </div>
                              );
                            })}
                            {extraCount > 0 && (
                              <div style={{ width: 28, height: 28, borderRadius: '50%', border: `2px solid ${C.white}`, marginLeft: -8, background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <span style={{ fontSize: 9, fontWeight: 800, color: C.textBody }}>+{extraCount}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer */}
                    <div style={{ paddingTop: 12, marginTop: 8, borderTop: `1px solid ${C.borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {program.deadline ? (
                        <span style={{ fontSize: 11, fontWeight: 700, color: C.textBody, display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Calendar size={11} color={C.textMuted} />
                          {new Date(program.deadline).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      ) : (
                        <span style={{ fontSize: 10, fontWeight: 600, color: C.textMuted }}>No deadline set</span>
                      )}
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textMuted, transition: 'background .15s, color .15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = C.brand; e.currentTarget.style.color = C.white; }}
                        onMouseLeave={e => { e.currentTarget.style.background = C.surface; e.currentTarget.style.color = C.textMuted; }}
                      >
                        <ArrowRight size={14} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Dot indicators ── */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 32 }}>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    style={{ borderRadius: 999, border: 'none', cursor: 'pointer', transition: 'all 0.2s', padding: 0, width: i === currentPage ? 24 : 8, height: 8, background: i === currentPage ? C.brand : C.brandMid }}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}