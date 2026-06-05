import React, { useState } from 'react';
import { FileText, ExternalLink, Clock, RefreshCw, History, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';

const backendURL = "http://localhost:5000";

// ─── tiny helpers ───────────────────────────────────────────────
function FileLink({ href, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 text-xs font-black text-black hover:text-[#093fb4] transition-colors"
    >
      <div className="w-8 h-8 rounded-lg bg-[#093fb4]/10 flex items-center justify-center shrink-0">
        <FileText size={13} className="text-[#093fb4]" />
      </div>
      {label} <ExternalLink size={11} />
    </a>
  );
}

function SectionHeader({ icon, label, color = 'text-black/40', border = 'border-black/8', bg = '' }) {
  return (
    <div className={`flex items-center gap-2 px-6 py-3 border-b ${border} ${bg}`}>
      <span className={`text-[11px] font-black uppercase tracking-widest ${color} flex items-center gap-2`}>
        {icon} {label}
      </span>
    </div>
  );
}

function EmptySlot({ message }) {
  return (
    <p className="text-[10px] font-black uppercase tracking-widest text-black/20 italic text-center py-2">
      {message}
    </p>
  );
}

// ─── Collapsible wrapper ─────────────────────────────────────────
function Collapsible({ title, badge, accent = '#093fb4', children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-black/8 overflow-hidden bg-[#FFFCFB]">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-black/[0.015] transition-colors"
      >
        <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-black/50">
          {title}
          {badge !== undefined && (
            <span
              className="text-[9px] font-black px-2 py-0.5 rounded-full"
              style={{ background: `${accent}15`, color: accent }}
            >
              {badge}
            </span>
          )}
        </span>
        {open ? <ChevronUp size={14} className="text-black/30" /> : <ChevronDown size={14} className="text-black/30" />}
      </button>
      {open && <div className="border-t border-black/5">{children}</div>}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────
export default function ApplicantDocs({
  responses,
  compliance_docs,
  compliance_history,
  renewal_docs,
  renewal_requirements,
  // Ideally your backend sends renewal_history: [{id, created_at, reason, required_docs, docs:[]}]
  // If not, we reconstruct from renewal_docs + renewal_requirements below
  renewal_history,
}) {

  // ── Build renewal cycles ────────────────────────────────────────
  // Prefer structured renewal_history from backend; fall back to flat list
  const renewalCycles = (() => {
    if (renewal_history?.length > 0) return renewal_history;

    // Fallback: one cycle built from renewal_requirements + renewal_docs
    if (renewal_requirements || renewal_docs?.length > 0) {
      return [{
        id: 'cycle-1',
        created_at: renewal_docs?.[0]?.created_at || new Date().toISOString(),
        reason: null,
        required_docs: renewal_requirements,
        docs: renewal_docs || [],
      }];
    }
    return [];
  })();

  return (
    <div className="space-y-5">

      {/* ════════════════════════════════════════════
          ROW 1 — Submitted Documents (full width)
      ════════════════════════════════════════════ */}
      <Collapsible
        title={<><FileText size={13} className="text-[#093fb4]" /> Submitted Documents</>}
        badge={responses?.length || 0}
      >
        {responses?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-6 py-5">
            {responses.map((ans, idx) => (
              <div key={idx} className="bg-black/[0.02] rounded-xl border border-black/5 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#093fb4] mb-2">{ans.field_label}</p>
                {ans.field_type === 'file' ? (
                  <FileLink
                    href={`${backendURL}/uploads/${(ans.file_path || '').replace(/^uploads[\\/]/, '')}`}
                    label="View Document"
                  />
                ) : (
                  <p className="text-sm font-bold text-black">{ans.text_value || '—'}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-5">
            <EmptySlot message="No documents submitted." />
          </div>
        )}
      </Collapsible>

      {/* ════════════════════════════════════════════
          ROW 2 — Compliance History (full width)
      ════════════════════════════════════════════ */}
      {compliance_history?.length > 0 && (
        <Collapsible
          title={<><History size={13} className="text-amber-500" /> Compliance History</>}
          badge={compliance_history.length}
          accent="#d97706"
        >
          <div className="px-6 py-5 space-y-4">
            {compliance_history.map((req, index) => {
              const nextReqTime = compliance_history[index + 1]?.created_at;
              const docsForReq = compliance_docs?.filter(doc => {
                const docTime = new Date(doc.created_at);
                const reqTime = new Date(req.created_at);
                return nextReqTime
                  ? docTime >= reqTime && docTime < new Date(nextReqTime)
                  : docTime >= reqTime;
              });

              return (
                <div key={req.id} className="rounded-xl border border-amber-200 overflow-hidden">
                  {/* Request header */}
                  <div className="bg-amber-50 px-5 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-amber-100">
                    <span className="text-[9px] font-black bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full uppercase tracking-widest">
                      Request #{index + 1}
                    </span>
                    <span className="text-[9px] font-bold text-black/30 uppercase tracking-wider">
                      {new Date(req.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Reason + Requirements — 2 col */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-amber-100 bg-white/50 px-0">
                    <div className="px-5 py-3">
                      <p className="text-[9px] font-black uppercase tracking-widest text-black/30 mb-1">Reason</p>
                      <p className="text-xs font-bold text-black leading-snug">{req.reason || '—'}</p>
                    </div>
                    <div className="px-5 py-3">
                      <p className="text-[9px] font-black uppercase tracking-widest text-black/30 mb-1">Requirements</p>
                      <p className="text-xs font-bold text-amber-700 leading-snug">{req.required_docs || '—'}</p>
                    </div>
                  </div>

                  {/* Submitted files — 2 col grid */}
                  <div className="px-5 py-4 bg-[#FFFCFB]">
                    <p className="text-[9px] font-black uppercase tracking-widest text-black/25 mb-3">Submitted Files</p>
                    {docsForReq?.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {docsForReq.map((doc, idx) => (
                          <div key={idx} className="bg-white rounded-xl border border-black/5 px-4 py-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-amber-100 shrink-0 flex items-center justify-center">
                                <FileText size={13} className="text-amber-600" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[9px] font-black text-black uppercase tracking-tighter">File {idx + 1}</p>
                                <a
                                  href={`${backendURL}/uploads/${doc.file_path}`}
                                  target="_blank" rel="noreferrer"
                                  className="text-[11px] font-bold text-[#093fb4] hover:underline flex items-center gap-1 truncate"
                                >
                                  View <ExternalLink size={9} />
                                </a>
                              </div>
                            </div>
                            <span className="text-[9px] font-bold text-black/20 uppercase shrink-0">
                              {new Date(doc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptySlot message="No files submitted for this request" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Collapsible>
      )}

      {/* ════════════════════════════════════════════
          ROW 3 — Renewal Cycles (each cycle segmented)
      ════════════════════════════════════════════ */}
      {renewalCycles.length > 0 && (
        <Collapsible
          title={<><RefreshCw size={13} className="text-[#093fb4]" /> Renewal History</>}
          badge={renewalCycles.length}
          accent="#093fb4"
        >
          <div className="px-6 py-5 space-y-4">
            {renewalCycles.map((cycle, index) => {
              const isLatest = index === renewalCycles.length - 1;
              return (
                <div key={cycle.id || index} className="rounded-xl border border-[#093fb4]/20 overflow-hidden">

                  {/* Cycle header */}
                  <div className="bg-[#093fb4]/5 px-5 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#093fb4]/10">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black bg-[#093fb4]/10 text-[#093fb4] px-2.5 py-1 rounded-full uppercase tracking-widest">
                        Renewal Cycle #{index + 1}
                      </span>
                      {isLatest && (
                        <span className="text-[9px] font-black bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1">
                          <CheckCircle2 size={9} /> Latest
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] font-bold text-black/30 uppercase tracking-wider">
                      {new Date(cycle.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Reason + Required docs — 2 col */}
                  {(cycle.reason || cycle.required_docs) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-[#093fb4]/10 bg-white/60">
                      {cycle.reason && (
                        <div className="px-5 py-3">
                          <p className="text-[9px] font-black uppercase tracking-widest text-[#093fb4]/40 mb-1">Reason</p>
                          <p className="text-xs font-bold text-black leading-snug">{cycle.reason}</p>
                        </div>
                      )}
                      {cycle.required_docs && (
                        <div className="px-5 py-3">
                          <p className="text-[9px] font-black uppercase tracking-widest text-[#093fb4]/40 mb-1">Documents Requested</p>
                          <p className="text-xs font-bold text-[#093fb4] leading-snug whitespace-pre-line">{cycle.required_docs}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Submitted renewal files — 2 col grid */}
                  <div className="px-5 py-4 bg-[#FFFCFB]">
                    <p className="text-[9px] font-black uppercase tracking-widest text-black/25 mb-3">Submitted Files</p>
                    {cycle.docs?.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {cycle.docs.map((doc, idx) => (
                          <div key={idx} className="bg-white rounded-xl border border-black/5 px-4 py-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-[#093fb4]/10 shrink-0 flex items-center justify-center">
                                <FileText size={13} className="text-[#093fb4]" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[9px] font-black text-black uppercase tracking-tighter">Renewal File {idx + 1}</p>
                                <a
                                  href={`${backendURL}/uploads/${doc.file_path}`}
                                  target="_blank" rel="noreferrer"
                                  className="text-[11px] font-bold text-[#093fb4] hover:underline flex items-center gap-1"
                                >
                                  View <ExternalLink size={9} />
                                </a>
                              </div>
                            </div>
                            <span className="text-[9px] font-bold text-black/20 uppercase shrink-0">
                              {new Date(doc.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-[#093fb4]/5 border border-[#093fb4]/10 rounded-xl px-4 py-3 text-center">
                        <Clock size={14} className="text-[#093fb4]/40 mx-auto mb-1" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#093fb4]/40">
                          Awaiting student submission
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Collapsible>
      )}

    </div>
  );
}