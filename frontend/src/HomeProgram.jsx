import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import api from './api';
import {
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    Building2,
    GraduationCap,
    Layers,
    Calendar,
    X,
    Bookmark,
    Accessibility,
    Flag,
    ShieldCheck,
    Wallet,
    Star,
    Ban,
    CheckCircle2,
} from 'lucide-react';

/* ── NOTE ──────────────────────────────────────────────────────
   Adjust these two endpoints to match your backend routes.
   - PROGRAMS_ENDPOINT should return active/published scholarships.
   - PARTNERS_ENDPOINT should return partner organizations, used
     as a fallback when there are no active programs to show.
   ─────────────────────────────────────────────────────────────── */
const PROGRAMS_ENDPOINT = '/scholarships/public';
const PARTNERS_ENDPOINT = '/organizations/partners';

/* Same criteria → icon mapping used in ApplicationForm.jsx, kept
   in sync so the eligibility summary looks consistent everywhere. */
const getCriteriaIcon = (label = '') => {
    const l = label.toLowerCase();
    if (l.includes('pwd') || l.includes('disab')) return Accessibility;
    if (l.includes('citizen') || l.includes('filipino')) return Flag;
    if (l.includes('resident')) return Bookmark;
    if (l.includes('enroll') || l.includes('college') || l.includes('student')) return GraduationCap;
    if (l.includes('moral') || l.includes('character')) return ShieldCheck;
    if (l.includes('financial') || l.includes('income') || l.includes('need')) return Wallet;
    if (l.includes('gwa') || l.includes('grade') || l.includes('average')) return Star;
    if (l.includes('no existing') || l.includes('without') || l.includes('not enjoying')) return Ban;
    return CheckCircle2;
};

/* Normalizes a raw scholarship record from the API into the shape
   this component renders. Falls back across a few likely field
   names so it keeps working even if the backend naming differs
   slightly — trim this once you know the exact response shape. */
const normalizeProgram = (raw) => {
    const rawCriteria = raw.criteria;
    const criteria = Array.isArray(rawCriteria)
        ? rawCriteria
        : typeof rawCriteria === 'string'
            ? rawCriteria.split(',').map(c => c.trim()).filter(Boolean)
            : [];

    return {
        id: raw.id ?? raw._id,
        title: raw.title || raw.program_name || 'Untitled Program',
        provider: raw.org_name || raw.provider || 'Unknown Provider',
        providerType: raw.provider_type || raw.org_type || 'Partner Organization',
        img: raw.org_pic || raw.logo || raw.image || null,
        tag: raw.tag || raw.category || 'Scholarship',
        fundType: raw.fund_type || raw.coverage || raw.amount_range || 'Coverage Varies',
        criteria,
        criteriaSummary: criteria.length ? criteria[0] : 'See full eligibility details',
        deadline: raw.deadline
            ? new Date(raw.deadline).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })
            : 'Ongoing Admission',
        description: raw.description || '',
    };
};

const normalizePartner = (raw) => ({
    id: raw.id ?? raw._id,
    name: raw.org_name || raw.name || 'Partner Organization',
    img: raw.org_pic || raw.logo || raw.image || null,
    type: raw.provider_type || raw.category || 'Partner Organization',
});

/* ── Loading skeleton ─────────────────────────────────────────── */
const CardSkeleton = () => (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-lg overflow-hidden animate-pulse">
        <div className="h-36 bg-slate-100" />
        <div className="p-6 space-y-3">
            <div className="h-3 w-24 bg-slate-100 rounded" />
            <div className="h-5 w-full bg-slate-100 rounded" />
            <div className="h-3 w-full bg-slate-100 rounded" />
            <div className="h-3 w-2/3 bg-slate-100 rounded" />
        </div>
        <div className="p-7 pt-0">
            <div className="h-10 w-full bg-slate-100 rounded-xl" />
        </div>
    </div>
);

/* ── Requirements / eligibility summary modal ────────────────────
   Read-only preview — no upload field. Real applications happen
   after the student logs in. */
const POP_STYLES = `
@keyframes kyPopIn {
    0%   { opacity: 0; transform: scale(0.82) translateY(12px); }
    60%  { opacity: 1; transform: scale(1.03) translateY(0); }
    100% { opacity: 1; transform: scale(1) translateY(0); }
}
.ky-pop { animation: kyPopIn 420ms cubic-bezier(0.16, 1, 0.3, 1) both; }
`;

const RequirementsModal = ({ program, onClose, onApply }) => {
    /* Lock the page behind the modal so Home never scrolls while it's open */
    useEffect(() => {
        const scrollbarW = window.innerWidth - document.documentElement.clientWidth;
        const prevOverflow = document.body.style.overflow;
        const prevPadding = document.body.style.paddingRight;
        document.body.style.overflow = 'hidden';
        if (scrollbarW > 0) document.body.style.paddingRight = `${scrollbarW}px`;
        return () => {
            document.body.style.overflow = prevOverflow;
            document.body.style.paddingRight = prevPadding;
        };
    }, []);

    return createPortal(
    <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 overscroll-contain"
        onClick={onClose}
        onWheel={e => e.stopPropagation()}
    >
        <style>{POP_STYLES}</style>
        <div
            className="ky-pop w-full max-w-lg bg-white rounded-[28px] overflow-hidden max-h-[calc(100dvh-2rem)] flex flex-col
                       shadow-[0_30px_80px_-10px_rgba(9,63,180,0.45)] ring-1 ring-slate-200"
            onClick={e => e.stopPropagation()}
        >
            {/* ── Header (Fixed, No Shrink) ── */}
            <div className="relative flex-shrink-0 px-6 pt-6 pb-5 bg-[#093FB4]">
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="absolute top-5 right-5 z-10 w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-all"
                >
                    <X size={18} strokeWidth={3} />
                </button>

                <div className="flex items-center gap-4 mb-4 pr-10">
                    {/* Embossed provider avatar */}
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-white shadow-[0_8px_20px_-4px_rgba(0,0,0,0.4)] ring-4 ring-white/40 flex items-center justify-center flex-shrink-0">
                        {program.img ? (
                            <img
                                src={program.img}
                                alt={program.provider}
                                onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                className="w-full h-full object-cover rounded-full"
                            />
                        ) : null}
                        <div className={`${program.img ? 'hidden' : 'flex'} w-full h-full items-center justify-center`}>
                            <Building2 size={40} className="text-[#093FB4]" strokeWidth={1.75} />
                        </div>
                    </div>
                    <p className="text-white/90 text-lg font-black uppercase tracking-[0.1em] leading-tight">
                        {program.provider}
                    </p>
                </div>

                <h3 className="text-white text-[28px] font-black leading-tight tracking-tight break-words">
                    {program.title}
                </h3>

                <div className="flex flex-wrap gap-2 mt-4">
                    <span className="flex items-center gap-1.5 bg-white/15 text-white text-sm font-black uppercase tracking-wide pl-3 pr-4 py-2.5 rounded-xl">
                        <Wallet size={17} strokeWidth={2.75} className="text-white/90" />
                        {program.fundType}
                    </span>
                    <span className="flex items-center gap-1.5 bg-[#FF1E1E] text-white text-sm font-black uppercase tracking-wide pl-3 pr-4 py-2.5 rounded-xl shadow-[0_6px_16px_-4px_rgba(255,30,30,0.6)]">
                        <Calendar size={17} strokeWidth={2.75} />
                        {program.deadline}
                    </span>
                </div>
            </div>

            {/* ── Body (Scrollable inside, limited height) ── */}
            <div className="flex-1 min-h-0 p-6 space-y-6 overflow-y-auto overscroll-contain scrollbar-thin">
                {program.description && (
                    <div>
                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2.5">
                            Program Overview
                        </p>
                        <p className="text-[19px] text-slate-700 leading-relaxed font-medium break-words whitespace-pre-wrap">
                            {program.description}
                        </p>
                    </div>
                )}

                <div>
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3.5">
                        Eligibility &amp; Requirements
                    </p>
                    {program.criteria.length > 0 ? (
                        <div className="grid grid-cols-1 gap-2.5">
                            {program.criteria.map((c, i) => {
                                const Icon = getCriteriaIcon(c);
                                return (
                                    <div
                                        key={i}
                                        className="flex items-center gap-4 px-5 py-4 bg-white rounded-2xl border border-slate-100
                                                   shadow-[0_4px_14px_-6px_rgba(15,23,42,0.15)]"
                                    >
                                        <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#093FB4] flex items-center justify-center flex-shrink-0">
                                            <Icon size={21} strokeWidth={2.5} />
                                        </div>
                                        <span className="text-[17px] font-bold text-slate-800 leading-snug break-words">{c}</span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-base text-slate-500 font-semibold">
                            Full eligibility details and required documents will be shown once you log in.
                        </p>
                    )}
                </div>
            </div>

            {/* ── Footer (Fixed, No Shrink) ── */}
            <div className="p-6 pt-4 flex-shrink-0 border-t border-slate-100 bg-white">
                <button
                    type="button"
                    onClick={onApply}
                    className="w-full py-[18px] bg-[#093FB4] hover:bg-[#0c4fd6] text-white rounded-2xl font-black uppercase tracking-[0.15em] text-base
                               transition-all flex items-center justify-center gap-2.5 shadow-[0_14px_28px_-10px_rgba(9,63,180,0.55)]
                               hover:shadow-[0_18px_34px_-10px_rgba(9,63,180,0.65)] hover:-translate-y-0.5 active:translate-y-0"
                >
                    Apply Now <ArrowRight size={20} strokeWidth={3} />
                </button>
                <p className="text-center text-[13px] font-bold text-slate-400 mt-3">
                    You'll be asked to log in to complete your application.
                </p>
            </div>
        </div>
    </div>,
    document.body
    );
};

/* ── Main component ─────────────────────────────────────────────── */
export default function HomeProgram() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState('programs'); // 'programs' | 'partners' | 'empty'
    const [programs, setPrograms] = useState([]);
    const [partners, setPartners] = useState([]);
    const [current, setCurrent] = useState(0);
    const [activeProgram, setActiveProgram] = useState(null);

    useEffect(() => {
        let cancelled = false;

        const loadPartners = async () => {
            try {
                const res = await api.get(PARTNERS_ENDPOINT);
                const list = (res.data?.data || res.data || []).map(normalizePartner);
                if (cancelled) return;
                setPartners(list);
                setMode(list.length > 0 ? 'partners' : 'empty');
            } catch (err) {
                console.error('Failed to load partner organizations:', err);
                if (!cancelled) setMode('empty');
            }
        };

        const loadPrograms = async () => {
            try {
                const res = await api.get(PROGRAMS_ENDPOINT);
                const list = (res.data?.data || res.data || []).map(normalizeProgram);
                if (cancelled) return;
                if (list.length > 0) {
                    setPrograms(list);
                    setMode('programs');
                } else {
                    await loadPartners();
                }
            } catch (err) {
                console.error('Failed to load featured scholarships:', err);
                await loadPartners();
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadPrograms();
        return () => { cancelled = true; };
    }, []);

    const total = programs.length;
    const visible = Math.min(3, total);

    useEffect(() => {
        if (mode !== 'programs' || total <= visible) return;
        const t = setInterval(() => setCurrent(p => (p + 1) % total), 5000);
        return () => clearInterval(t);
    }, [mode, total, visible]);

    const next = () => setCurrent(p => (p + 1) % total);
    const prev = () => setCurrent(p => (p - 1 + total) % total);

    const getSlice = () => {
        const items = [];
        for (let i = 0; i < visible; i++) items.push(programs[(current + i) % total]);
        return items;
    };

    const goToLogin = () => navigate('/login');

    /* ── Loading state ── */
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[0, 1, 2].map(i => <CardSkeleton key={i} />)}
            </div>
        );
    }

    /* ── Nothing at all to show ── */
    if (mode === 'empty') {
        return (
            <div className="text-center py-16 bg-slate-50 border border-slate-100 rounded-3xl">
                <Building2 size={40} className="mx-auto text-slate-300 mb-4" strokeWidth={1.5} />
                <p className="text-slate-500 font-bold">
                    No scholarships or partner organizations to show right now.
                </p>
            </div>
        );
    }

    /* ── Fallback: no active programs, show partnered orgs instead ── */
    if (mode === 'partners') {
        return (
            <div>
                <div className="text-center mb-10">
                    <p className="text-[13px] font-black text-[#FF1E1E] uppercase tracking-widest">
                        No Active Openings Right Now
                    </p>
                    <p className="text-slate-500 font-semibold text-sm mt-1 max-w-md mx-auto">
                        Here are the organizations partnered with KyusISKO — check back soon for new scholarship programs.
                    </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {partners.map(org => (
                        <div
                            key={org.id}
                            className="bg-white rounded-2xl border border-slate-100 shadow-md p-6 flex flex-col items-center text-center gap-3 hover:shadow-xl hover:-translate-y-1 transition-all"
                        >
                            <div className="w-24 h-24 rounded-full overflow-hidden bg-blue-50 flex items-center justify-center border-2 border-blue-100">
                                {org.img ? (
                                    <img
                                        src={org.img}
                                        alt={org.name}
                                        onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                        className="w-full h-full object-cover"
                                    />
                                ) : null}
                                <div className={`${org.img ? 'hidden' : 'flex'} w-full h-full items-center justify-center`}>
                                    <Building2 size={40} className="text-[#093FB4]/40" strokeWidth={1.5} />
                                </div>
                            </div>
                            <div>
                                <p className="text-lg font-black text-slate-900 leading-snug">{org.name}</p>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    {org.type}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    /* ── Normal state: active programs ── */
    return (
        <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getSlice().map((program, i) => (
                    <div
                        key={program.id + '-' + i}
                        className="bg-white rounded-2xl border border-slate-100 shadow-lg flex flex-col justify-between overflow-hidden group hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.03] transition-all duration-300 ease-out"
                    >
                        <button type="button" onClick={() => setActiveProgram(program)} className="text-left">
                            <div className="p-7 pb-6">
                                <div className="flex items-start justify-between gap-3 mb-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-20 h-20 rounded-full overflow-hidden bg-blue-50 border-2 border-blue-100 flex items-center justify-center flex-shrink-0">
                                            {program.img ? (
                                                <img
                                                    src={program.img}
                                                    alt={program.provider}
                                                    onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : null}
                                            <div className={`${program.img ? 'hidden' : 'flex'} w-full h-full items-center justify-center`}>
                                                <Building2 size={34} className="text-[#093FB4]/40" strokeWidth={1.5} />
                                            </div>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-base font-black text-slate-800 uppercase tracking-wide truncate">
                                                {program.provider}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-widest text-white bg-[#093FB4] shadow-md px-3 py-1.5 rounded-md shrink-0 whitespace-nowrap">
                                        {program.providerType}
                                    </span>
                                </div>

                                <h4 className="text-2xl font-black text-slate-900 leading-snug line-clamp-2 group-hover:text-[#093FB4] transition-colors mb-2">
                                    {program.title}
                                </h4>

                                <p className="text-base text-slate-500 leading-relaxed line-clamp-2 min-h-[2.5em] font-medium">
                                    {program.description || 'Tap this card to view full eligibility details and requirements.'}
                                </p>
                            </div>

                            <hr className="border-slate-100 mx-7" />

                            <div className="p-7 pt-5 space-y-3 text-base font-medium text-slate-600">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                                        <Wallet size={17} strokeWidth={2.5} />
                                    </div>
                                    <span className="truncate"><strong>Fund Type:</strong> {program.fundType}</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-md bg-blue-50 text-[#093FB4] flex items-center justify-center flex-shrink-0">
                                        <Layers size={17} strokeWidth={2.5} />
                                    </div>
                                    <span className="truncate"><strong>Criteria:</strong> {program.criteriaSummary}</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-md bg-red-50 text-[#FF1E1E] flex items-center justify-center flex-shrink-0">
                                        <Calendar size={17} strokeWidth={2.5} />
                                    </div>
                                    <span><strong>Deadline:</strong> <span className="text-red-600 font-bold">{program.deadline}</span></span>
                                </div>
                            </div>
                        </button>

                        <div className="p-6 pt-0">
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); goToLogin(); }}
                                className="w-full py-3.5 bg-slate-50 border border-slate-100 group-hover:bg-[#093FB4] group-hover:text-white group-hover:border-[#093FB4] rounded-xl text-sm font-black uppercase tracking-widest text-slate-700 transition-all flex items-center justify-center gap-2"
                            >
                                Apply Now <ArrowRight size={18} strokeWidth={3} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {total > visible && (
                <div className="flex items-center justify-center gap-4 mt-10">
                    <button
                        type="button"
                        onClick={prev}
                        className="p-2.5 rounded-full bg-white border border-slate-200 hover:bg-[#093FB4] hover:text-white hover:border-[#093FB4] transition-all shadow"
                    >
                        <ChevronLeft size={20} strokeWidth={2.5} />
                    </button>
                    <div className="flex gap-2">
                        {programs.map((_, i) => (
                            <button
                                type="button"
                                key={i}
                                onClick={() => setCurrent(i)}
                                className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'w-7 bg-[#093FB4]' : 'w-1.5 bg-slate-300'}`}
                            />
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={next}
                        className="p-2.5 rounded-full bg-white border border-slate-200 hover:bg-[#093FB4] hover:text-white hover:border-[#093FB4] transition-all shadow"
                    >
                        <ChevronRight size={20} strokeWidth={2.5} />
                    </button>
                </div>
            )}

            {activeProgram && (
                <RequirementsModal
                    program={activeProgram}
                    onClose={() => setActiveProgram(null)}
                    onApply={goToLogin}
                />
            )}
        </div>
    );
}