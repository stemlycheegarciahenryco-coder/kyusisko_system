import React, { useEffect, useState } from 'react';
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
        img: raw.org_pic || raw.logo || raw.image || null,
        tag: raw.tag || raw.provider_type || raw.category || 'Scholarship',
        coverage: raw.amount_range || raw.coverage || 'Coverage Varies',
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
        <div className="p-6 pt-0">
            <div className="h-10 w-full bg-slate-100 rounded-xl" />
        </div>
    </div>
);

/* ── Requirements / eligibility summary modal ────────────────────
   Read-only preview — no upload field. Real applications happen
   after the student logs in. */
const RequirementsModal = ({ program, onClose, onApply }) => (
    <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
        onClick={onClose}
    >
        <div
            className="w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
            onClick={e => e.stopPropagation()}
        >
            <div className="bg-[#093FB4] px-8 py-7 relative shrink-0">
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
                >
                    <X size={18} strokeWidth={3} />
                </button>
                <p className="text-white/80 text-[11px] font-black uppercase tracking-[0.2em] mb-1.5">
                    {program.provider}
                </p>
                <h3 className="text-white text-2xl font-black leading-tight tracking-tight pr-10">
                    {program.title}
                </h3>
                <div className="flex flex-wrap gap-2 mt-4">
                    <span className="bg-white/10 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full backdrop-blur-md">
                        Coverage: {program.coverage}
                    </span>
                    <span className="bg-[#FF1E1E] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                        Deadline: {program.deadline}
                    </span>
                </div>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto">
                {program.description && (
                    <div>
                        <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-2">
                            Program Overview
                        </p>
                        <p className="text-[15px] text-slate-700 leading-relaxed font-medium">
                            {program.description}
                        </p>
                    </div>
                )}

                <div>
                    <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-3">
                        Eligibility &amp; Requirements
                    </p>
                    {program.criteria.length > 0 ? (
                        <div className="flex flex-wrap gap-2.5">
                            {program.criteria.map((c, i) => {
                                const Icon = getCriteriaIcon(c);
                                return (
                                    <div
                                        key={i}
                                        className="flex items-center gap-2.5 px-4 py-2.5 bg-blue-50/40 border border-blue-100 rounded-xl"
                                    >
                                        <Icon size={17} className="text-[#093FB4] shrink-0" />
                                        <span className="text-[14px] font-bold text-slate-800">{c}</span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 font-semibold">
                            Full eligibility details and required documents will be shown once you log in.
                        </p>
                    )}
                </div>
            </div>

            <div className="p-8 pt-0 shrink-0">
                <button
                    onClick={onApply}
                    className="w-full py-4 bg-[#093FB4] hover:bg-[#FF1E1E] text-white rounded-2xl font-black uppercase tracking-[0.15em] text-[13px] transition-all flex items-center justify-center gap-2.5 shadow-lg"
                >
                    Apply Now <ArrowRight size={16} strokeWidth={3} />
                </button>
            </div>
        </div>
    </div>
);

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
                            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-blue-50 flex items-center justify-center border border-blue-100">
                                {org.img ? (
                                    <img
                                        src={org.img}
                                        alt={org.name}
                                        onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                        className="w-full h-full object-cover"
                                    />
                                ) : null}
                                <div className={`${org.img ? 'hidden' : 'flex'} w-full h-full items-center justify-center`}>
                                    <Building2 size={26} className="text-[#093FB4]/40" strokeWidth={1.5} />
                                </div>
                            </div>
                            <div>
                                <p className="text-[15px] font-black text-slate-900 leading-snug">{org.name}</p>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
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
                        className="bg-white rounded-2xl border border-slate-100 shadow-lg flex flex-col justify-between overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                    >
                        <button type="button" onClick={() => setActiveProgram(program)} className="text-left">
                            <div className="h-36 bg-slate-50 flex items-center justify-center overflow-hidden relative border-b border-slate-50">
                                {program.img ? (
                                    <img
                                        src={program.img}
                                        alt={program.provider}
                                        onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                                    />
                                ) : null}
                                <div className={`${program.img ? 'hidden' : 'flex'} w-full h-full absolute inset-0 items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100`}>
                                    <Building2 size={44} className="text-[#093FB4]/30" strokeWidth={1.5} />
                                </div>
                                <div className="absolute top-4 left-4">
                                    <span className="text-[11px] font-black uppercase tracking-widest text-white bg-[#093FB4] shadow-md px-2.5 py-1 rounded-md">
                                        {program.tag}
                                    </span>
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <p className="text-[13px] font-black text-slate-400 uppercase tracking-wide truncate mb-0.5">
                                        {program.provider}
                                    </p>
                                    <h4 className="text-lg font-black text-slate-900 leading-snug line-clamp-2 group-hover:text-[#093FB4] transition-colors h-12">
                                        {program.title}
                                    </h4>
                                </div>

                                <hr className="border-slate-100" />

                                <div className="space-y-2.5 text-sm font-medium text-slate-600">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-5 h-5 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                                            <GraduationCap size={14} strokeWidth={2.5} />
                                        </div>
                                        <span className="truncate"><strong>Coverage:</strong> {program.coverage}</span>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-5 h-5 rounded bg-blue-50 text-[#093FB4] flex items-center justify-center flex-shrink-0">
                                            <Layers size={14} strokeWidth={2.5} />
                                        </div>
                                        <span className="truncate"><strong>Criteria:</strong> {program.criteriaSummary}</span>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-5 h-5 rounded bg-red-50 text-[#FF1E1E] flex items-center justify-center flex-shrink-0">
                                            <Calendar size={14} strokeWidth={2.5} />
                                        </div>
                                        <span><strong>Deadline:</strong> <span className="text-red-600 font-bold">{program.deadline}</span></span>
                                    </div>
                                </div>
                            </div>
                        </button>

                        <div className="p-6 pt-0 space-y-2">
                            <button
                                onClick={() => setActiveProgram(program)}
                                className="w-full py-2 text-[12px] font-black uppercase tracking-widest text-[#093FB4] hover:underline"
                            >
                                View Requirements
                            </button>
                            <button
                                onClick={goToLogin}
                                className="w-full py-2.5 bg-slate-50 border border-slate-100 group-hover:bg-[#093FB4] group-hover:text-white group-hover:border-[#093FB4] rounded-xl text-[13px] font-black uppercase tracking-widest text-slate-700 transition-all flex items-center justify-center gap-2"
                            >
                                Apply Now <ArrowRight size={15} strokeWidth={3} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {total > visible && (
                <div className="flex items-center justify-center gap-4 mt-10">
                    <button
                        onClick={prev}
                        className="p-2.5 rounded-full bg-white border border-slate-200 hover:bg-[#093FB4] hover:text-white hover:border-[#093FB4] transition-all shadow"
                    >
                        <ChevronLeft size={20} strokeWidth={2.5} />
                    </button>
                    <div className="flex gap-2">
                        {programs.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrent(i)}
                                className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'w-7 bg-[#093FB4]' : 'w-1.5 bg-slate-300'}`}
                            />
                        ))}
                    </div>
                    <button
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