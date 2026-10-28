import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useStudent } from './StudentContext';
import { Camera, User, FileText, GraduationCap, School, Award, Plus, Compass } from 'lucide-react';
import api from '../api';
import AddPortfolioModal from './AddPortfolioModal';
import StudentEditProfile from './StudentEditProfile';

const backendURL = "http://localhost:5000";

export default function StudentProfile() {
    const location = useLocation();
    const { student, loading, refreshProfile, updateStudent } = useStudent();

    const [justUpdated, setJustUpdated] = useState(false);
    const pulseTimeoutRef = useRef(null);

    // Refs for targeting elements during the tour
    const topRef = useRef(null);
    const profilePicRef = useRef(null);
    const documentsRef = useRef(null);

    const [isTourRunning, setIsTourRunning] = useState(false);
    const [activeTourSection, setActiveTourSection] = useState(null); // 'profilePic' | 'documents'

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

    // Emulated tour targeting Profile Picture and Documents
    const runProfileTour = async () => {
        const steps = ['profilePic', 'documents'];
        setIsTourRunning(true);

        for (let i = 0; i < steps.length; i++) {
            const currentStep = steps[i];
            setActiveTourSection(currentStep);

            // Pause to let the user focus on the highlighted section
            await new Promise(resolve => setTimeout(resolve, 2500));
        }

        // Clear highlight and reset
        setActiveTourSection(null);
        setIsTourRunning(false);
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
        <div ref={topRef} className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 antialiased relative">
            {/* Overlay to disable mouse interaction during tour */}
            {isTourRunning && (
                <div className="absolute inset-0 z-50 cursor-not-allowed bg-transparent" />
            )}

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

                {/* LEFT COLUMN: Sticky Profile Summary & Portfolio (Span 5) */}
                <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
                    <div
                        className={`bg-white/80 backdrop-blur-2xl border-2 rounded-[2.5rem] shadow-2xl overflow-hidden transition-all duration-700 ease-out ${justUpdated
                            ? 'border-[#093fb4]/60 ring-4 ring-[#093fb4]/20 shadow-[#093fb4]/10'
                            : 'border-white/80 shadow-black/5'
                            }`}
                    >
                        {/* ================= BLUE HERO SECTION ================= */}
                        <div className="bg-gradient-to-r from-[#093fb4] to-[#07308a] rounded-t-[calc(2.5rem-2px)] p-6 md:p-8 text-white flex flex-col items-center text-center space-y-4 shadow-xl relative overflow-hidden">
                            {/* Subtle decorative glow overlays */}
                            <div className="absolute -top-12 -right-12 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                            <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-black/10 rounded-full blur-2xl pointer-events-none" />

                            <div
                                ref={profilePicRef}
                                className={`relative group cursor-pointer shrink-0 rounded-[2.25rem] transition-all duration-300 z-10 ${activeTourSection === 'profilePic'
                                    ? 'border-4 border-white ring-4 ring-white/30 bg-blue-50/25 shadow-2xl scale-105'
                                    : ''
                                    }`}
                                onClick={handleAvatarClick}
                            >
                                {activeTourSection === 'profilePic' && (
                                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-20 bg-white text-[#093fb4] px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg whitespace-nowrap animate-bounce">
                                        Upload Profile Picture here...
                                    </div>
                                )}

                                <div className="w-36 h-36 rounded-[2rem] bg-white/20 border-4 border-white/40 overflow-hidden flex items-center justify-center shadow-2xl transition-transform duration-300 group-hover:scale-[1.03] backdrop-blur-md">
                                    {avatarPreview || student.sprofile_pic ? (
                                        <img
                                            src={avatarPreview || student.sprofile_pic}
                                            className="w-full h-full object-cover transition-opacity duration-300"
                                            alt="Student Profile"
                                        />
                                    ) : (
                                        <User size={60} className="text-white/80" strokeWidth={1.5} />
                                    )}
                                </div>

                                <div className="absolute inset-0 bg-black/40 rounded-[2rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm">
                                    <div className="flex flex-col items-center gap-1 text-white">
                                        <Camera size={26} strokeWidth={2.5} />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Change</span>
                                    </div>
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
                            </div>

                            <div className="z-10 space-y-1">
                                <h1 className="text-2xl font-black tracking-tight text-white uppercase drop-shadow-sm">
                                    {student.sfirst_name} {student.slast_name}
                                </h1>
                                <p className="text-blue-100/90 text-xs font-black uppercase tracking-[0.15em] bg-white/10 py-1 px-3 rounded-full inline-block backdrop-blur-sm border border-white/10">
                                    {degreeName}
                                </p>
                            </div>
                        </div>

                        {/* ==================================================== */}

                        {/* REST OF CONTENT (Wrapped with padding since parent wrapper padding was removed) */}
                        <div className="p-6 md:p-8 space-y-6">
                            {student.bio && (
                                <div className="relative bg-gradient-to-br from-blue-50/50 to-indigo-50/30 p-4 rounded-2xl border-2 border-white/80 shadow-sm">
                                    <p className="text-xs text-black/70 font-bold leading-relaxed italic text-center">
                                        "{student.bio}"
                                    </p>
                                </div>
                            )}

                            {/* STATS GRID */}
                            <div className="grid grid-cols-3 gap-2.5 w-full">
                                <div className="flex flex-col items-center p-3.5 bg-white/70 hover:bg-white border-2 border-white/90 rounded-2xl text-[10px] font-black uppercase tracking-widest text-black/60 shadow-sm transition-all group">
                                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-[#093fb4] mb-1.5 group-hover:scale-110 transition-transform">
                                        <GraduationCap size={15} strokeWidth={2.5} />
                                    </div>
                                    <span>ID</span>
                                    <strong className="text-black text-xs mt-0.5 truncate max-w-full font-black tracking-normal">
                                        {student.student_id || '—'}
                                    </strong>
                                </div>

                                <div className="flex flex-col items-center p-3.5 bg-white/70 hover:bg-white border-2 border-white/90 rounded-2xl text-[10px] font-black uppercase tracking-widest text-black/60 shadow-sm transition-all group">
                                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-[#093fb4] mb-1.5 group-hover:scale-110 transition-transform">
                                        <School size={15} strokeWidth={2.5} />
                                    </div>
                                    <span>Level</span>
                                    <strong className="text-black text-xs mt-0.5 truncate max-w-full font-black tracking-normal">
                                        {student.year_level || '—'}
                                    </strong>
                                </div>

                                <div className="flex flex-col items-center p-3.5 bg-white/70 hover:bg-white border-2 border-white/90 rounded-2xl text-[10px] font-black uppercase tracking-widest text-black/60 shadow-sm transition-all group">
                                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-[#093fb4] mb-1.5 group-hover:scale-110 transition-transform">
                                        <Award size={15} strokeWidth={2.5} />
                                    </div>
                                    <span>GWA</span>
                                    <strong className="text-black text-xs mt-0.5 truncate max-w-full font-black tracking-normal">
                                        {student.gwa ? `${student.gwa}%` : '—'}
                                    </strong>
                                </div>
                            </div>

                            {/* PORTFOLIO & DOCUMENTS SECTION */}
                            <div
                                ref={documentsRef}
                                className={`space-y-3.5 pt-4 border-t-2 border-black/5 transition-all duration-300 rounded-3xl p-3 relative ${activeTourSection === 'documents'
                                    ? 'border-2 border-[#093fb4] ring-4 ring-[#093fb4]/20 bg-blue-50/30 shadow-xl'
                                    : ''
                                    }`}
                            >
                                {activeTourSection === 'documents' && (
                                    <div className="absolute -top-6 left-4 z-20 bg-[#093fb4] text-white px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg animate-bounce">
                                        Upload Documents & Portfolio here...
                                    </div>
                                )}

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-[#093fb4]/10 flex items-center justify-center text-[#093fb4] shrink-0 shadow-inner">
                                            <Award size={16} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-black uppercase tracking-[0.15em] text-black">Portfolio & Files</h3>
                                            <p className="text-[9px] font-bold text-black/40 uppercase tracking-wider">Credentials & Docs</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setIsPortfolioModalOpen(true)}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white bg-[#093fb4] rounded-xl hover:bg-[#073496] transition-all shadow-md shadow-[#093fb4]/25 active:scale-95"
                                    >
                                        <Plus size={14} strokeWidth={3} /> Add File
                                    </button>
                                </div>

                                {Array.isArray(processedPortfolio) && processedPortfolio.length > 0 ? (
                                    <div className="space-y-2.5 pt-1 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
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
                                                    className="flex items-center gap-3.5 px-4 py-3 bg-white/70 hover:bg-white border-2 border-white/90 hover:border-[#093fb4]/40 rounded-2xl shadow-sm transition-all group"
                                                >
                                                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                                        <FileText size={18} className="text-[#093fb4]" strokeWidth={2.5} />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-black text-black uppercase tracking-wider truncate group-hover:text-[#093fb4] transition-colors">
                                                            {itemTitle}
                                                        </p>
                                                        <p className="text-[9px] text-black/40 font-black tracking-widest uppercase mt-0.5">Digital Copy</p>
                                                    </div>
                                                </a>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 bg-white/40 border-2 border-dashed border-black/10 rounded-2xl text-center px-4">
                                        <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center text-black/30 mb-2.5">
                                            <FileText size={20} strokeWidth={2} />
                                        </div>
                                        <p className="text-[10px] font-black text-black/50 uppercase tracking-widest">No extra portfolio files uploaded yet.</p>
                                        <p className="text-[9px] text-black/30 font-bold mt-1">Upload certificates, resumes, or documents.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: StudentEditProfile Form (Span 7) */}
                <div className="lg:col-span-7">
                    <StudentEditProfile
                        studentData={student}
                        onRefresh={handleProfileSaved}
                        onStudentProfileTour={runProfileTour}
                    />
                </div>

            </div>

            {isPortfolioModalOpen && (
                <AddPortfolioModal onClose={() => { setIsPortfolioModalOpen(false); refreshProfile(); }} studentData={student} />
            )}
        </div>
    );
}
