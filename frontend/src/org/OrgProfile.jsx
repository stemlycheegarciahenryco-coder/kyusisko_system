import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import OrgEditProfile from '../component/OrgEditProfile';
import FeatureProgram from '../component/FeatureProgram';
import {
    Camera, MapPin, Globe, Building2, Phone, Mail,
    Edit2, Award, CheckCircle, ShieldCheck, User, Sparkles, Clock
} from 'lucide-react';

/* ─── MAIN COMPONENT ─── */
const OrgProfile = () => {
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [profile, setProfile] = useState({
        org_name: '', provider_type: '', tel_number: '', contact_number: '', sub_email: '',
        website: '', about_us: '', region: '', city: '', barangay: '',
        street_address: '', org_pic: null, cover_pic: null, created_at: null
    });
    
    // States for FeatureProgram component
    const [programs, setPrograms] = useState([]);
    const [availableOptions, setAvailableOptions] = useState([]);
    
    const fileRef = useRef();
    const coverFileRef = useRef();

    useEffect(() => {
        loadWorkspaceData();
    }, []);

    const loadWorkspaceData = async () => {
        try {
            // ✅ Updated all endpoints to /me
            const [profileRes, dashboardProgsRes, profileProgsRes] = await Promise.all([
                api.get('/organizations/profile/me'),
                api.get('/organizations/dashboard-programs/me').catch(() => null),
                api.get('/organizations/profile-programs/me').catch(() => null)
            ]);

            if (profileRes.data?.data) setProfile(profileRes.data.data);
            if (dashboardProgsRes?.data?.data) setAvailableOptions(dashboardProgsRes.data.data);
            if (profileProgsRes?.data?.data) setPrograms(profileProgsRes.data.data);
        } catch (err) {
            console.error("Profile load error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
            alert('Please upload a valid image (PNG, JPG, JPEG, or WebP)');
            return;
        }

        try {
            const imgData = new FormData();
            imgData.append('org_pic', file);
            // ✅ Updated to secure /me endpoint
            const picRes = await api.patch('/organizations/profile-picture/me', imgData);
            if (picRes.data?.org_pic) {
                setProfile(prev => ({ ...prev, org_pic: picRes.data.org_pic }));
            }
        } catch (err) {
            console.error("Logo upload failed:", err);
            alert("Failed to upload image.");
        }
    };

    const handleCoverChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
            alert('Please upload a valid image (PNG, JPG, JPEG, or WebP)');
            return;
        }

        try {
            const imgData = new FormData();
            imgData.append('cover_pic', file);
            // ✅ Updated to secure /me endpoint
            const picRes = await api.patch('/organizations/cover-picture/me', imgData);
            if (picRes.data?.cover_pic) {
                setProfile(prev => ({ ...prev, cover_pic: picRes.data.cover_pic }));
            }
        } catch (err) {
            console.error("Cover upload failed:", err);
            alert("Failed to upload cover image.");
        }
    };

    const handleProfileUpdated = (updatedData) => {
        setProfile(prev => ({ ...prev, ...updatedData }));
        setIsEditModalOpen(false);
    };

    const logoSrc = profile.org_pic && typeof profile.org_pic === 'string'
        ? profile.org_pic.replace(/\\/g, '/')
        : null;

    const coverSrc = profile.cover_pic && typeof profile.cover_pic === 'string'
        ? profile.cover_pic.replace(/\\/g, '/')
        : null;

    const formattedCreatedAt = profile.created_at
        ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : 'Not Available';

    // Computed Stats for Metric Cards
    const totalProgramsCount = programs.length;
    const openProgramsCount = programs.filter(p => (p.status || '').toLowerCase() === 'active' || (p.status || '').toLowerCase() === 'open').length;
    const totalScholarsCount = programs.reduce((sum, p) => sum + (parseInt(p.active_scholars) || 0), 0);

    const orgIdDisplay = profile.id ? `ORG-${String(profile.id).padStart(4, '0')}` : 'ORG-MEMBER';
    const fullAddress = [profile.street_address, profile.barangay, profile.city, profile.region].filter(Boolean).join(', ') || 'Location not set';

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-slate-50">
            <Building2 size={32} className="text-[#093fb4] animate-pulse" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Workspace…</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50/60 font-['Inter'] text-slate-800 pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">

                {/* ── 1. UNIFIED HEADER HERO BANNER & OVERVIEW CARD ── */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden relative">
                    
                    {/* Background Cover Area */}
                    <div className="h-82 sm:h-94 md:h-98 lg:h-105 bg-slate-100 relative group overflow-hidden">
                        {coverSrc ? (
                            <img 
                                src={coverSrc} 
                                alt="Org Cover" 
                                className="absolute inset-0 w-full h-full object-cover object-center" 
                            />
                        ) : (
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#093fb4] to-indigo-800 opacity-90" />
                        )}
                        <button
                            onClick={() => coverFileRef.current.click()}
                            className="absolute top-4 right-4 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/30 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-sm cursor-pointer z-10"
                        >
                            <Camera size={14} /> <span className="hidden sm:inline">Upload Cover</span>
                        </button>
                        <input ref={coverFileRef} type="file" accept=".png,.jpg,.jpeg,.webp" className="hidden" onChange={handleCoverChange} />
                    </div>

                    {/* Profile Details & Overview Data (White readable area) */}
                    <div className="px-6 sm:px-10 pb-8 relative z-10 bg-white">
                        
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-6 -mt-12 sm:-mt-16">
                            
                            {/* Profile Pic & Title/About */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
                                {/* Profile Avatar */}
                                <div className="relative shrink-0 group">
                                    <div className="w-28 h-28 sm:w-42 sm:h-42 rounded-full bg-white shadow-lg overflow-hidden flex items-center justify-center border-4 border-white ring-1 ring-slate-200/60">
                                        {logoSrc ? (
                                            <img src={logoSrc} alt="Org Logo" className="w-full h-full object-cover rounded-full" />
                                        ) : (
                                            <div className="w-full h-full bg-blue-50 flex items-center justify-center text-[#093fb4] font-black text-3xl">
                                                {profile.org_name ? profile.org_name.charAt(0).toUpperCase() : 'O'}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => fileRef.current.click()}
                                        title="Change logo"
                                        className="absolute bottom-1 sm:bottom-2 right-1 sm:right-2 w-8 h-8 rounded-full bg-white border-2 border-slate-200 shadow-sm flex items-center justify-center cursor-pointer hover:bg-slate-100 transition"
                                    >
                                        <Camera size={13} className="text-slate-600" />
                                    </button>
                                    <input ref={fileRef} type="file" accept=".png,.jpg,.jpeg,.webp" className="hidden" onChange={handleFileChange} />
                                </div>

                                {/* Title & About */}
                                <div className="pt-2 sm:pb-2 space-y-1.5 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{profile.org_name || 'Unnamed Organization'}</h1>
                                        <ShieldCheck size={20} className="text-[#093fb4] shrink-0" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                                        {profile.provider_type || 'Educational Institution'}
                                    </p>
                                    <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-3xl pt-1">
                                        {profile.about_us || `Include your Mission or Vision as provider or about us.`}
                                    </p>
                                </div>
                            </div>

                            {/* Edit Profile Button */}
                            <div className="shrink-0 sm:pt-20">
                                <button
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                                >
                                    <Edit2 size={14} /> Edit Profile
                                </button>
                            </div>
                        </div>

                        {/* Integrated Organization Overview Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-y-5 gap-x-6 mt-8 pt-6 border-t border-slate-100">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Number</p>
                                <p className="font-semibold text-slate-800 mt-1 flex items-center gap-2 text-sm">
                                    <Phone size={14} className="text-[#093fb4]" /> {profile.tel_number || 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</p>
                                <p className="font-semibold text-slate-800 mt-1 flex items-center gap-2 text-sm truncate">
                                    <Mail size={14} className="text-[#093fb4]" /> {profile.sub_email || 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Website</p>
                                <div className="mt-1 flex items-center gap-2 text-sm truncate">
                                    <Globe size={14} className="text-[#093fb4]" /> 
                                    {profile.website ? (
                                        <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noreferrer" className="font-semibold text-slate-800 hover:text-[#093fb4] hover:underline">
                                            {profile.website}
                                        </a>
                                    ) : <span className="font-semibold text-slate-800">N/A</span>}
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Member Since</p>
                                <p className="font-semibold text-slate-800 mt-1 flex items-center gap-2 text-sm">
                                    <Clock size={14} className="text-[#093fb4]" /> {formattedCreatedAt}
                                </p>
                            </div>
                            <div className="md:col-span-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Office Location</p>
                                <p className="font-semibold text-slate-800 mt-1 flex items-center gap-2 text-sm truncate">
                                    <MapPin size={14} className="text-[#093fb4] shrink-0" /> {fullAddress}
                                </p>
                            </div>
                            <div className="md:col-span-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Member ID</p>
                                <p className="font-semibold text-slate-800 mt-1 flex items-center gap-2 text-sm">
                                    <Building2 size={14} className="text-[#093fb4]" /> {orgIdDisplay}
                                </p>
                            </div>
                        </div>

                    </div>
                </div>

                {/* ── 2. METRIC CARDS ROW ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-10 gap-4">
                    
                    {/* Stat Card 1: Total Programs */}
                    <div className="lg:col-span-2 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-[#093fb4] flex items-center justify-center mb-3">
                            <User size={18} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900 leading-none">{totalProgramsCount}</p>
                            <p className="text-xs font-bold text-slate-800 mt-1">Total Programs</p>
                            <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Overall posted</p>
                        </div>
                    </div>

                    {/* Stat Card 2: Open Programs */}
                    <div className="lg:col-span-2 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                            <CheckCircle size={18} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900 leading-none">{openProgramsCount}</p>
                            <p className="text-xs font-bold text-slate-800 mt-1">Open Programs</p>
                            <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Accepting applicants</p>
                        </div>
                    </div>

                    {/* Stat Card 3: Total Scholars */}
                    <div className="lg:col-span-2 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                        <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                            <Award size={18} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900 leading-none">{totalScholarsCount}</p>
                            <p className="text-xs font-bold text-slate-800 mt-1">Total Scholars</p>
                            <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Across all programs</p>
                        </div>
                    </div>

                    {/* Make an Impact Banner Card */}
                    <div className="lg:col-span-4 bg-gradient-to-r from-[#093fb4] to-blue-700 text-white p-6 rounded-3xl shadow-sm flex flex-col justify-between relative overflow-hidden">
                        <div className="relative z-10 space-y-1">
                            <h3 className="text-lg font-black tracking-tight">Make an Impact</h3>
                            <p className="text-xs text-blue-100 font-medium max-w-sm">Manage and feature the best scholarship programs to help students achieve their dreams.</p>
                        </div>
                        <Sparkles size={80} className="absolute -right-4 -bottom-4 text-white/10 pointer-events-none" />
                    </div>

                </div>

                {/* ── 3. FEATURED PROGRAMS ── */}
                <FeatureProgram 
                    programs={programs} 
                    setPrograms={setPrograms} 
                    availableOptions={availableOptions} 
                    loadWorkspaceData={loadWorkspaceData} 
                />

            </div>

            {/* ── EXTERNAL EDIT PROFILE MODAL ── */}
            <OrgEditProfile 
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                initialData={profile}
                onSaveSuccess={handleProfileUpdated}
            />
        </div>
    );
};

export default OrgProfile;