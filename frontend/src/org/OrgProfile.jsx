import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import OrgEditProfile from '../component/OrgEditProfile'; // <-- Imported New Component
import {
    Camera, MapPin, Globe, Building2, Phone,
    X, Edit2, Award, Plus, EyeOff, ChevronDown, ChevronUp,
    CheckCircle, Clock, BookOpen, Info, ShieldCheck, Check
} from 'lucide-react';

/* ─── STATUS METADATA ─── */
const STATUS_META = {
    Active:   { color: 'text-green-700 border-green-200 bg-green-50', icon: CheckCircle },
    Closed:   { color: 'text-red-700 border-red-200 bg-red-50', icon: X },
    Upcoming: { color: 'text-amber-700 border-amber-200 bg-amber-50', icon: Clock },
};

/* ─── HELPERS ─── */
const Field = ({ label, children }) => (
    <div className="mb-4">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
            {label}
        </label>
        {children}
    </div>
);

const StaticVal = ({ val, placeholder = 'Not specified' }) => (
    <div className={`text-sm font-semibold rounded-xl px-4 py-3 bg-slate-50/50 border border-slate-100 ${val ? 'text-slate-800' : 'text-slate-400 italic'}`}>
        {val || placeholder}
    </div>
);

const SectionHeader = ({ icon: Icon, label, action }) => (
    <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-50 rounded-lg">
                <Icon size={16} className="text-[#093fb4]" />
            </div>
            <span className="text-base font-black text-slate-900 uppercase tracking-wide">{label}</span>
        </div>
        {action}
    </div>
);

/* ─── MAIN COMPONENT ─── */
const OrgProfile = () => {
    const [loading, setLoading] = useState(true);
    
    // Modal states
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const [profile, setProfile] = useState({
        org_name: '', provider_type: '', tel_number: '', contact_number: '',
        website: '', about_us: '', region: '', city: '', barangay: '',
        street_address: '', org_pic: null, created_at: null
    });
    
    const [programs, setPrograms] = useState([]);
    const [availableOptions, setAvailableOptions] = useState([]);
    const [selectedProgramIds, setSelectedProgramIds] = useState([]);
    const [expandedProg, setExpandedProg] = useState(null);
    const fileRef = useRef();

    useEffect(() => {
        loadWorkspaceData();
    }, []);

    const loadWorkspaceData = async () => {
        const orgId = localStorage.getItem('orgId');
        if (!orgId) {
            setLoading(false);
            return;
        }

        try {
            const [profileRes, dashboardProgsRes, profileProgsRes] = await Promise.all([
                api.get(`/organizations/profile/${orgId}`),
                api.get(`/organizations/dashboard-programs/${orgId}`).catch(() => null),
                api.get(`/organizations/profile-programs/${orgId}`).catch(() => null)
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

        const id = localStorage.getItem('orgId');
        if (!id) return;

        try {
            const imgData = new FormData();
            imgData.append('org_pic', file);
            const picRes = await api.patch(`/organizations/profile-picture/${id}`, imgData);
            if (picRes.data?.org_pic) {
                setProfile(prev => ({ ...prev, org_pic: picRes.data.org_pic }));
            }
        } catch (err) {
            console.error("Logo upload failed:", err);
            alert("Failed to upload image.");
        }
    };

    // Callback when OrgEditProfile saves successfully
    const handleProfileUpdated = (updatedData) => {
        setProfile(prev => ({ ...prev, ...updatedData }));
        setIsEditModalOpen(false);
    };

    const toggleProgramSelection = (id) => {
        setSelectedProgramIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    };

    const handleSelectAll = () => {
        const selectableOptions = availableOptions
            .filter(opt => !programs.some(p => String(p.id) === String(opt.id)))
            .map(opt => opt.id);
        setSelectedProgramIds(selectedProgramIds.length === selectableOptions.length ? [] : selectableOptions);
    };

    const handleAddSelectedPrograms = async () => {
        if (selectedProgramIds.length === 0) return;
        try {
            await Promise.all(selectedProgramIds.map(id => api.patch(`/organizations/programs/${id}/visibility`, { show_on_profile: true })));
            await loadWorkspaceData();
            setIsAddModalOpen(false);
            setSelectedProgramIds([]);
        } catch (err) {
            alert("Could not update program visibility.");
        }
    };

    const hideProgramFromProfile = async (id) => { 
        if (confirm('Hide this program from profile display? (It will remain safe and active in your system database)')) {
            try {
                await api.patch(`/organizations/programs/${id}/visibility`, { show_on_profile: false });
                setPrograms(prev => prev.filter(p => p.id !== id));
            } catch (err) {
                alert("Failed to hide program. Please try again.");
            }
        }
    };

    const logoSrc = profile.org_pic && typeof profile.org_pic === 'string'
        ? profile.org_pic.replace(/\\/g, '/')
        : null;

    const formattedCreatedAt = profile.created_at
        ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : 'Not Available';

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-slate-50">
            <Building2 size={32} className="text-[#093fb4] animate-pulse" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Workspace…</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50/50 font-['Inter'] text-slate-800 pb-16">
            
            {/* ── PROFILE HEADER HERO ── */}
            <div className="bg-white border-b border-slate-200 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-2 bg-[#093fb4]" />
                <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

                        <div className="flex items-start sm:items-center gap-5 min-w-0">
                            <div className="relative shrink-0 group">
                                <div className="w-20 h-20 rounded-2xl bg-white shadow-sm overflow-hidden flex items-center justify-center border-2 border-slate-100">
                                    {logoSrc ? (
                                        <img src={logoSrc} alt="Org Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-slate-50 flex items-center justify-center text-[#093fb4] font-black text-2xl">
                                            {profile.org_name ? profile.org_name.charAt(0).toUpperCase() : 'O'}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => fileRef.current.click()}
                                    title="Change logo"
                                    className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#093fb4] border-4 border-white flex items-center justify-center cursor-pointer hover:bg-blue-800 transition shadow-md"
                                >
                                    <Camera size={12} className="text-white" />
                                </button>
                                <input ref={fileRef} type="file" accept=".png,.jpg,.jpeg,.webp" className="hidden" onChange={handleFileChange} />
                            </div>

                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-3 mb-1">
                                    <h1 className="text-2xl font-black text-slate-950 tracking-tight truncate">{profile.org_name || 'Unnamed Organization'}</h1>
                                    <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#093fb4] bg-blue-50/80 border border-blue-200 px-2.5 py-1 rounded-md shrink-0">
                                        <ShieldCheck size={12} /> Verified Partner
                                    </span>
                                </div>
                                <p className="text-sm font-semibold text-slate-500 flex items-center gap-1.5">
                                    <Building2 size={14} className="text-slate-400" /> {profile.provider_type || 'Unspecified Provider Type'}
                                </p>

                                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-500 mt-3">
                                    {profile.website && (
                                        <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-[#093fb4] transition-colors">
                                            <Globe size={14} className="text-slate-400" />
                                            <span>{profile.website}</span>
                                        </a>
                                    )}
                                    {/* Mobile Contact Number Removed from Display */}
                                    {profile.tel_number && (
                                        <div className="flex items-center gap-1.5" title="Telephone Number">
                                            <Phone size={14} className="text-slate-400" />
                                            <span>{profile.tel_number}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1.5">
                                        <MapPin size={14} className="text-slate-400" />
                                        <span>{[profile.street_address, profile.barangay, profile.city, profile.region].filter(Boolean).join(', ') || 'Location not set'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 shrink-0 md:pl-6">
                            <div className="flex items-center gap-6 pr-6 border-r border-slate-200">
                                <div className="text-center">
                                    <p className="text-xl font-black text-[#093fb4] leading-tight">{programs.length}</p>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Programs</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-black text-slate-800 leading-tight whitespace-nowrap mt-1">{formattedCreatedAt}</p>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Member Since</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsEditModalOpen(true)}
                                className="px-5 py-2.5 rounded-xl border-2 border-slate-200 bg-white hover:border-[#093fb4] hover:text-[#093fb4] text-slate-700 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer uppercase tracking-wider shadow-sm"
                            >
                                <Edit2 size={14} /> Edit Profile
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── CONTENT GRID ── */}
            <div className="max-w-7xl mx-auto px-6 mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                    {/* Left Column: Details & About */}
                    <div className="lg:col-span-1 space-y-8">
                        {/* About Us */}
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                            <SectionHeader icon={Info} label="About Us" />
                            <p className="text-sm text-slate-600 font-medium leading-relaxed whitespace-pre-line">
                                {profile.about_us || 'No organization description provided yet.'}
                            </p>
                        </div>

                        {/* Contact & Details */}
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                            <SectionHeader icon={Building2} label="Contact & Details" />
                            <div className="space-y-1">
                                <Field label="Provider Type">
                                    <StaticVal val={profile.provider_type} />
                                </Field>

                                <Field label="Telephone Number">
                                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                        <Phone size={16} className="text-[#093fb4] shrink-0" />
                                        <span className="text-sm font-bold text-slate-800">{profile.tel_number || '—'}</span>
                                    </div>
                                </Field>
                                
                                {/* NOTE: Mobile Contact Number purposely omitted from public layout */}

                                <Field label="Web Platform">
                                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                        <Globe size={16} className="text-[#093fb4] shrink-0" />
                                        <span className="text-sm font-bold text-slate-800 truncate">{profile.website || '—'}</span>
                                    </div>
                                </Field>

                                <div className="border-t border-slate-100 my-5 pt-4" />

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                                    {[
                                        { key: 'region', label: 'Region' },
                                        { key: 'city', label: 'City' },
                                        { key: 'barangay', label: 'Barangay' },
                                        { key: 'street_address', label: 'Street Address' },
                                    ].map(({ key, label }) => (
                                        <Field key={key} label={label}>
                                            <StaticVal val={profile[key]} />
                                        </Field>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Scholarship Programs Showcase */}
                    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                        <SectionHeader
                            icon={Award}
                            label="Scholarship Programs"
                            action={
                                <button 
                                    onClick={() => setIsAddModalOpen(true)} 
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#093fb4] hover:bg-blue-800 text-white font-bold text-xs cursor-pointer transition-all shadow-md shadow-blue-900/20 uppercase tracking-wider"
                                >
                                    <Plus size={14} strokeWidth={3} /> Add / Feature
                                </button>
                            }
                        />

                        <div className="relative mt-6">
                            {programs.length > 0 && (
                                <div className="absolute left-[9px] top-4 bottom-4 w-0.5 bg-slate-100 rounded-full" />
                            )}
                            <div className="flex flex-col gap-5">
                                {programs.map(prog => {
                                    const sm = STATUS_META[prog.status] || STATUS_META.Active;
                                    const Icon = sm.icon;
                                    const expanded = expandedProg === prog.id;
                                    const dotColor = prog.status === 'Active' ? 'bg-green-500 ring-green-100' : prog.status === 'Closed' ? 'bg-red-500 ring-red-100' : 'bg-amber-500 ring-amber-100';
                                    
                                    return (
                                        <div key={prog.id} className="relative pl-8">
                                            <div className={`absolute left-0 top-3 w-5 h-5 rounded-full border-4 border-white shadow-sm ring-2 ${dotColor} z-10`} />

                                            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white hover:shadow-md hover:border-[#093fb4]/30 transition-all duration-200">
                                                <div className="p-5 cursor-pointer select-none" onClick={() => setExpandedProg(expanded ? null : prog.id)}>
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <p className="font-black text-base text-slate-900 truncate">{prog.title || prog.name}</p>
                                                            <div className="flex items-center flex-wrap gap-2 mt-2">
                                                                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md flex items-center gap-1.5 border ${sm.color}`}>
                                                                    <Icon size={12} strokeWidth={3} /> {prog.status || 'Active'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <button 
                                                                onClick={e => { e.stopPropagation(); hideProgramFromProfile(prog.id); }} 
                                                                title="Hide from profile display" 
                                                                className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer flex items-center justify-center hover:bg-slate-200 hover:text-slate-800 text-slate-500 transition-all"
                                                            >
                                                                <EyeOff size={15} />
                                                            </button>
                                                            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-100">
                                                                {expanded ? <ChevronUp size={16} strokeWidth={3} /> : <ChevronDown size={16} strokeWidth={3} />}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-slate-100">
                                                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Active Scholars</p>
                                                            <p className="text-sm font-black text-[#093fb4]">{prog.active_scholars ?? 0}</p>
                                                        </div>
                                                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Max Slots</p>
                                                            <p className="text-sm font-black text-slate-800">{prog.slots ?? 0}</p>
                                                        </div>
                                                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Application Deadline</p>
                                                            <p className="text-[11px] font-bold text-slate-800 whitespace-nowrap pt-0.5">{prog.deadline || 'TBD'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                {expanded && (
                                                    <div className="px-5 pb-5 pt-3 border-t border-slate-100 bg-slate-50/50">
                                                        <p className="text-sm text-slate-600 font-medium leading-relaxed">{prog.description || 'No description set for this program.'}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {programs.length === 0 && (
                                <div className="text-center py-12 px-6 text-slate-400 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-3xl mt-2">
                                    <BookOpen size={32} className="mx-auto text-slate-300 mb-3" />
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">No profile programs displayed</p>
                                    <p className="text-xs font-medium text-slate-400 mt-2">Click "Add / Feature" above to select existing programs.</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* ── EXTERNAL EDIT MODAL ── */}
            <OrgEditProfile 
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                initialData={profile}
                onSaveSuccess={handleProfileUpdated}
            />

            {/* ── PROGRAM OPTIONS SELECTOR MODAL ── */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                            <div>
                                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Feature Programs</h2>
                                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Select programs to make visible on your public profile.</p>
                            </div>
                            <button onClick={() => { setIsAddModalOpen(false); setSelectedProgramIds([]); }} className="w-8 h-8 rounded-xl border border-slate-200 bg-white cursor-pointer flex items-center justify-center hover:bg-slate-100 transition-all">
                                <X size={14} className="text-slate-600" strokeWidth={2.5} />
                            </button>
                        </div>

                        <div className="px-6 py-3 bg-white border-b border-slate-100 flex justify-between items-center text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                            <span>Selected: <span className="text-[#093fb4]">{selectedProgramIds.length}</span></span>
                            <button type="button" onClick={handleSelectAll} className="text-[#093fb4] hover:text-blue-800 cursor-pointer transition-colors">
                                {selectedProgramIds.length > 0 ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>

                        <div className="p-6 max-h-[400px] overflow-y-auto space-y-3 bg-slate-50/30 scrollbar-thin">
                            {availableOptions.map(option => {
                                const isAlreadyAdded = programs.some(p => String(p.id) === String(option.id));
                                const isSelected = selectedProgramIds.includes(option.id);

                                return (
                                    <div
                                        key={option.id}
                                        onClick={() => !isAlreadyAdded && toggleProgramSelection(option.id)}
                                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start justify-between gap-4 ${
                                            isAlreadyAdded 
                                                ? 'opacity-50 bg-slate-50 border-slate-200 cursor-not-allowed' 
                                                : isSelected 
                                                    ? 'border-[#093fb4] bg-blue-50/30 shadow-sm' 
                                                    : 'border-slate-100 hover:border-slate-300 bg-white shadow-sm'
                                        }`}
                                    >
                                        <div className="space-y-1.5 min-w-0">
                                            <div className="flex items-center gap-2.5">
                                                <p className="text-sm font-black text-slate-900 truncate">{option.title || option.name}</p>
                                                {isAlreadyAdded && (
                                                    <span className="text-[9px] font-black bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md uppercase tracking-wider">Featured</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">{option.description || 'No description available'}</p>
                                        </div>

                                        <div className="shrink-0 pt-1">
                                            <div className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all ${
                                                isSelected ? 'bg-[#093fb4] border-[#093fb4] text-white' : 'border-slate-200 bg-white'
                                            }`}>
                                                {isSelected && <Check size={14} strokeWidth={3} />}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-end gap-3">
                            <button 
                                type="button" 
                                onClick={() => { setIsAddModalOpen(false); setSelectedProgramIds([]); }} 
                                className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs cursor-pointer hover:bg-slate-50 transition-all uppercase tracking-wider"
                            >
                                Cancel
                            </button>
                            <button 
                                type="button" 
                                onClick={handleAddSelectedPrograms} 
                                disabled={selectedProgramIds.length === 0}
                                className={`px-6 py-2.5 rounded-xl border-none font-bold text-xs transition-all uppercase tracking-wider flex items-center gap-2 ${
                                    selectedProgramIds.length > 0 
                                    ? 'bg-[#093fb4] text-white hover:bg-blue-800 shadow-lg cursor-pointer' 
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                                }`}
                            >
                                Feature ({selectedProgramIds.length})
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrgProfile;