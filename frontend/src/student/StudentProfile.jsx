import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useStudent } from './StudentContext';
import { Camera, User, FileText, GraduationCap, School, Award, Plus } from 'lucide-react';
import api from '../api';
import AddPortfolioModal from './AddPortfolioModal';
import StudentEditProfile from './StudentEditProfile';

const backendURL = "http://localhost:5000";

export default function StudentProfile() {
    const location = useLocation();
    const { student, loading, refreshProfile, updateStudent } = useStudent();

    const [justUpdated, setJustUpdated] = useState(false);
    const pulseTimeoutRef = useRef(null);

    const flashUpdated = () => {
        setJustUpdated(true);
        if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
        pulseTimeoutRef.current = setTimeout(() => setJustUpdated(false), 1200);
    };

    useEffect(() => () => { if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current); }, []);

    const handleProfileSaved = async (patch) => {
        if (patch) {
            updateStudent(patch);
            flashUpdated();
        }
        try {
            await refreshProfile();
        } catch (err) { }
    };

    const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
    const [showWelcomeModal, setShowWelcomeModal] = useState(location.state?.justOnboarded || false);

    const fileInputRef = useRef(null);
    const [avatarPreview, setAvatarPreview] = useState(null);

    const handleAvatarClick = () => fileInputRef.current?.click();

    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const localPreviewUrl = URL.createObjectURL(file);
        setAvatarPreview(localPreviewUrl);

        const formData = new FormData();
        formData.append('profile_image', file);
        try {
            await api.put(`/upload-profile/me`, formData);
            await refreshProfile();
            window.dispatchEvent(new Event('profilePicUpdated'));
        } catch (err) {
            setAvatarPreview(null);
        } finally {
            URL.revokeObjectURL(localPreviewUrl);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-12 h-12 border-4 border-[#093fb4] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!student) return (
        <div className="text-center py-12 text-black/40 font-black text-sm uppercase tracking-widest">
            Student record unverified or missing.
        </div>
    );

    let processedPortfolio = [];
    try {
        if (student.portfolio_data) {
            processedPortfolio = typeof student.portfolio_data === 'string'
                ? JSON.parse(student.portfolio_data)
                : student.portfolio_data;
        }
    } catch (e) { }

    const degreeName = student?.other_degree_program ? student.other_degree_program : (student?.course_name || "Course not set");

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 antialiased">

            {showWelcomeModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
                    <div className="bg-white/90 backdrop-blur-xl max-w-md w-full rounded-[2.5rem] border border-white/60 p-10 shadow-2xl transform scale-100 transition-all duration-300 animate-in fade-in zoom-in-95">
                        <div className="flex justify-center mb-6">
                            <div className="w-24 h-24 bg-blue-50/50 rounded-[2rem] border border-blue-100 flex items-center justify-center text-[#093fb4]">
                                <GraduationCap size={48} strokeWidth={2} />
                            </div>
                        </div>
                        <h3 className="text-center text-sm font-black uppercase tracking-[0.2em] text-black mb-4">
                            Account Setup
                        </h3>
                        <p className="text-black/60 text-sm font-medium text-center leading-relaxed px-2 mb-8">
                            Setting up your account for academic, professional, and scholarship criteria right now will significantly <span className="text-black font-black uppercase tracking-wider text-xs ml-1">increase your chances</span> of matching and receiving the perfect scholarship grant!
                        </p>
                        <button
                            onClick={() => setShowWelcomeModal(false)}
                            className="w-full bg-[#093fb4] text-white py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-[#073496] transition-all shadow-xl shadow-[#093fb4]/25 active:scale-[0.98]"
                        >
                            Let's Complete Profile
                        </button>
                    </div>
                </div>
            )}

            {/* ================= BALANCED TWO-COLUMN GRID LAYOUT ================= */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* LEFT COLUMN: Sticky Profile Summary & Portfolio (Span 5) with adjusted top offset */}
                <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
                    <div
                        className={`bg-white/70 backdrop-blur-xl border-2 rounded-[2.5rem] shadow-2xl p-6 md:p-8 space-y-6 relative overflow-hidden transition-all duration-700 ease-out ${justUpdated ? 'border-[#093fb4]/60 ring-4 ring-[#093fb4]/20' : 'border-white/80'
                            }`}
                    >
                        {/* Avatar & Names */}
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="relative group cursor-pointer shrink-0" onClick={handleAvatarClick}>
                                <div className="w-40 h-40 rounded-[2.25rem] bg-white/60 border-4 border-white/80 overflow-hidden flex items-center justify-center shadow-xl transition-transform group-hover:scale-[1.02]">
                                    {avatarPreview || student.sprofile_pic ? (
                                        <img src={avatarPreview || student.sprofile_pic} className="w-full h-full object-cover transition-opacity duration-300" alt="Profile" />
                                    ) : (
                                        <User size={68} className="text-black/20" strokeWidth={1.5} />
                                    )}
                                </div>
                                <div className="absolute inset-0 bg-black/40 rounded-[2.25rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                    <Camera size={30} className="text-white" strokeWidth={2.5} />
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
                            </div>

                            <div>
                                <h1 className="text-2xl font-black tracking-tight text-black uppercase">
                                    {student.sfirst_name} {student.slast_name}
                                </h1>
                                <p className="text-[#093fb4] text-xs font-black uppercase tracking-[0.15em] mt-1">
                                    {degreeName}
                                </p>
                            </div>

                            {student.bio && (
                                <p className="text-xs text-black/70 font-bold leading-relaxed bg-white/50 p-4 rounded-2xl border-2 border-white/80 italic shadow-sm w-full">
                                    "{student.bio}"
                                </p>
                            )}

                            <div className="grid grid-cols-3 gap-2 w-full pt-2">
                                <div className="flex flex-col items-center p-3 bg-white/60 border-2 border-white/80 rounded-xl text-[10px] font-black uppercase tracking-widest text-black/70 shadow-sm">
                                    <GraduationCap size={16} className="text-[#093fb4] mb-1" strokeWidth={2.5} />
                                    <span>ID</span>
                                    <strong className="text-black text-xs mt-0.5 truncate max-w-full">{student.student_id || '—'}</strong>
                                </div>
                                <div className="flex flex-col items-center p-3 bg-white/60 border-2 border-white/80 rounded-xl text-[10px] font-black uppercase tracking-widest text-black/70 shadow-sm">
                                    <School size={16} className="text-[#093fb4] mb-1" strokeWidth={2.5} />
                                    <span>Level</span>
                                    <strong className="text-black text-xs mt-0.5 truncate max-w-full">{student.year_level || '—'}</strong>
                                </div>
                                <div className="flex flex-col items-center p-3 bg-white/60 border-2 border-white/80 rounded-xl text-[10px] font-black uppercase tracking-widest text-black/70 shadow-sm">
                                    <Award size={16} className="text-[#093fb4] mb-1" strokeWidth={2.5} />
                                    <span>GWA</span>
                                    <strong className="text-black text-xs mt-0.5 truncate max-w-full">{student.gwa ? `${student.gwa}%` : '—'}</strong>
                                </div>
                            </div>
                        </div>

                        {/* PORTFOLIO & DOCUMENTS SECTION */}
                        <div className="space-y-3 pt-4 border-t-2 border-black/5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-[#093fb4]/10 flex items-center justify-center text-[#093fb4] shrink-0">
                                        <Award size={16} strokeWidth={2.5} />
                                    </div>
                                    <h3 className="text-xs font-black uppercase tracking-[0.15em] text-black">Portfolio & Files</h3>
                                </div>
                                <button
                                    onClick={() => setIsPortfolioModalOpen(true)}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[10px] font-black uppercase tracking-widest text-white bg-[#093fb4] rounded-xl hover:bg-[#073496] transition-all shadow-md shadow-[#093fb4]/20 active:scale-95"
                                >
                                    <Plus size={14} strokeWidth={3} /> Add
                                </button>
                            </div>

                            {Array.isArray(processedPortfolio) && processedPortfolio.length > 0 ? (
                                <div className="space-y-2.5 pt-1 max-h-[280px] overflow-y-auto pr-1">
                                    {processedPortfolio.map((item, idx) => {
                                        if (!item) return null;
                                        const itemTitle = typeof item === 'object' ? item.title : item;
                                        let rawLink = typeof item === 'object' ? (item.link || item.url || item.href) : null;

                                        if (rawLink && typeof rawLink === 'string') {
                                            rawLink = rawLink.trim().replace(/\\/g, '/');
                                            if (rawLink.startsWith('uploads/')) rawLink = `${backendURL}/${rawLink}`;
                                        }

                                        return (
                                            <a
                                                key={idx}
                                                href={rawLink || '#'}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-3 px-4 py-3 bg-white/60 border-2 border-white/80 hover:border-[#093fb4]/50 hover:bg-white rounded-xl shadow-sm transition-all group"
                                            >
                                                <div className="w-10 h-10 rounded-lg bg-blue-50/50 border-2 border-blue-100 flex items-center justify-center shrink-0">
                                                    <FileText size={18} className="text-[#093fb4]" strokeWidth={2.5} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-black text-black uppercase tracking-wider truncate group-hover:text-[#093fb4] transition-colors">
                                                        {itemTitle}
                                                    </p>
                                                    <p className="text-[9px] text-black/50 font-black tracking-widest uppercase">Digital Copy</p>
                                                </div>
                                            </a>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 bg-white/40 border-2 border-dashed border-white/80 rounded-2xl text-center px-4">
                                    <FileText size={28} className="text-black/30 mb-2" strokeWidth={1.5} />
                                    <p className="text-[10px] font-black text-black/50 uppercase tracking-widest">No extra portfolio files uploaded yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: StudentEditProfile Form (Span 7) - Scrollable */}
                <div className="lg:col-span-7">
                    <StudentEditProfile
                        studentData={student}
                        onRefresh={handleProfileSaved}
                    />
                </div>

            </div>

            {isPortfolioModalOpen && (
                <AddPortfolioModal onClose={() => { setIsPortfolioModalOpen(false); refreshProfile(); }} studentData={student} />
            )}
        </div>
    );
}
