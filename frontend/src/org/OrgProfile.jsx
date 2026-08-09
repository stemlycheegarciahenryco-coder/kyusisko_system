import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import {
    Camera, MapPin, Globe, Building2, Save, Phone, Smartphone,
    X, Edit2, Award, Plus, EyeOff, ChevronDown, ChevronUp,
    CheckCircle, Clock, BookOpen, Info, ShieldCheck, Check
} from 'lucide-react';

/* ─── STATUS METADATA ─── */
const STATUS_META = {
    Active:   { color: 'text-green-600 border-green-200 bg-green-50', icon: CheckCircle },
    Closed:   { color: 'text-red-600 border-red-200 bg-red-50', icon: X },
    Upcoming: { color: 'text-amber-600 border-amber-200 bg-amber-50', icon: Clock },
};

/* ─── HELPERS ─── */
const Field = ({ label, children }) => (
    <div className="mb-4">
        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
            {label}
        </label>
        {children}
    </div>
);

const StaticVal = ({ val, placeholder = 'Not specified' }) => (
    <div className={`text-sm font-medium border rounded-lg px-3.5 py-2.5 border-slate-200 bg-slate-50 ${val ? 'text-slate-700' : 'text-slate-400 italic'}`}>
        {val || placeholder}
    </div>
);

const SectionHeader = ({ icon: Icon, label, action }) => (
    <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
            <Icon size={16} className="text-[#093fb4]" />
            <span className="text-sm font-semibold text-slate-800">{label}</span>
        </div>
        {action}
    </div>
);

/* ─── MAIN COMPONENT ─── */
const OrgProfile = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Modal state for overall profile edit
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [profile, setProfile] = useState({
        org_name: '',
        provider_type: '',
        tel_number: '',
        contact_number: '',
        website: '',
        about_us: '',
        region: '',
        city: '',
        barangay: '',
        street_address: '',
        org_pic: null,
        created_at: null
    });
    
    const [editFormData, setEditFormData] = useState({});
    const [programs, setPrograms] = useState([]);
    const [availableOptions, setAvailableOptions] = useState([]);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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

            if (profileRes.data?.data) {
                setProfile(profileRes.data.data);
                setEditFormData(profileRes.data.data);
            }

            if (dashboardProgsRes?.data?.data) {
                setAvailableOptions(dashboardProgsRes.data.data);
            }

            if (profileProgsRes?.data?.data) {
                setPrograms(profileProgsRes.data.data);
            }
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

    const handleOpenEditModal = () => {
        setEditFormData({ ...profile });
        setIsEditModalOpen(true);
    };

    const handleSaveProfileModal = async (e) => {
        e.preventDefault();
        setSaving(true);
        const id = localStorage.getItem('orgId');

        try {
            if (id) {
                const { org_pic, previewUrl, created_at, ...textData } = editFormData;
                const response = await api.patch(`/organizations/profile/${id}`, textData);
                
                const updated = response.data?.data || textData;
                setProfile(prev => ({ ...prev, ...updated }));
            }
            setIsEditModalOpen(false);
        } catch (err) {
            console.error("Save error:", err);
            alert('Update failed. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const toggleProgramSelection = (id) => {
        setSelectedProgramIds(prev => 
            prev.includes(id) 
                ? prev.filter(item => item !== id) 
                : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        const selectableOptions = availableOptions
            .filter(opt => !programs.some(p => String(p.id) === String(opt.id)))
            .map(opt => opt.id);

        if (selectedProgramIds.length === selectableOptions.length) {
            setSelectedProgramIds([]);
        } else {
            setSelectedProgramIds(selectableOptions);
        }
    };

    const handleAddSelectedPrograms = async () => {
        if (selectedProgramIds.length === 0) return;

        try {
            // Unhide selected programs in DB
            await Promise.all(
                selectedProgramIds.map(id => 
                    api.patch(`/organizations/programs/${id}/visibility`, { show_on_profile: true })
                )
            );

            // Refresh displayed programs
            await loadWorkspaceData();
            setIsAddModalOpen(false);
            setSelectedProgramIds([]);
        } catch (err) {
            console.error("Failed to add programs:", err);
            alert("Could not update program visibility.");
        }
    };

    // Soft-hide program from profile (without deleting or modifying taken_down)
    const hideProgramFromProfile = async (id) => { 
        if (confirm('Hide this program from profile display? (It will remain safe and active in your system database)')) {
            try {
                await api.patch(`/organizations/programs/${id}/visibility`, { show_on_profile: false });
                setPrograms(prev => prev.filter(p => p.id !== id));
            } catch (err) {
                console.error("Failed to hide program:", err);
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
        <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-[#f8fafc]">
            <Building2 size={32} className="text-[#093fb4] animate-pulse" />
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Loading Workspace…</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 font-['Inter'] text-slate-800 pb-16">
            {/* ── PROFILE HEADER ── */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-6xl mx-auto px-6 py-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">

                        <div className="flex items-start sm:items-center gap-4 min-w-0">
                            <div className="relative shrink-0 group">
                                <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200">
                                    {logoSrc ? (
                                        <img src={logoSrc} alt="Org Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-blue-50 flex items-center justify-center text-[#093fb4] font-bold text-lg">
                                            {profile.org_name ? profile.org_name.charAt(0).toUpperCase() : 'O'}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => fileRef.current.click()}
                                    title="Change logo"
                                    className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-lg bg-[#093fb4] border-2 border-white flex items-center justify-center cursor-pointer hover:bg-blue-800 transition"
                                >
                                    <Camera size={11} className="text-white" />
                                </button>
                                <input ref={fileRef} type="file" accept=".png,.jpg,.jpeg,.webp" className="hidden" onChange={handleFileChange} />
                            </div>

                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-lg font-bold text-slate-900 tracking-tight truncate">{profile.org_name || 'Unnamed Organization'}</h1>
                                    <span className="flex items-center gap-1 text-[11px] font-semibold text-[#093fb4] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md shrink-0">
                                        <ShieldCheck size={11} /> Verified
                                    </span>
                                </div>
                                <p className="text-xs font-medium text-slate-500 mt-0.5 flex items-center gap-1.5">
                                    <Building2 size={12} className="text-slate-400" /> {profile.provider_type || 'Unspecified Type'}
                                </p>

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-2">
                                    {profile.website && (
                                        <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-[#093fb4] transition-colors">
                                            <Globe size={12} className="text-slate-400" />
                                            <span>{profile.website}</span>
                                        </a>
                                    )}
                                    {profile.tel_number && (
                                        <div className="flex items-center gap-1.5" title="Telephone Number">
                                            <Phone size={12} className="text-slate-400" />
                                            <span>{profile.tel_number}</span>
                                        </div>
                                    )}
                                    {profile.contact_number && (
                                        <div className="flex items-center gap-1.5" title="Mobile Contact Number">
                                            <Smartphone size={12} className="text-slate-400" />
                                            <span>{profile.contact_number}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1.5">
                                        <MapPin size={12} className="text-slate-400" />
                                        <span>{[profile.street_address, profile.barangay, profile.city, profile.region, 'Philippines'].filter(Boolean).join(', ') || 'Address not set'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-5 shrink-0 lg:pl-5">
                            <div className="flex items-center gap-5 pr-5 border-r border-slate-200">
                                <div>
                                    <p className="text-base font-bold text-slate-900 leading-tight">{programs.length}</p>
                                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Programs</p>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900 leading-tight whitespace-nowrap">{formattedCreatedAt}</p>
                                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Member Since</p>
                                </div>
                            </div>
                            <button
                                onClick={handleOpenEditModal}
                                className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
                            >
                                <Edit2 size={13} /> Edit Profile
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── CONTENT GRID ── */}
            <div className="max-w-6xl mx-auto px-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">

                    {/* Column 1: Scholarship Programs Showcase */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5">
                        <SectionHeader
                            icon={Award}
                            label="Scholarship Programs"
                            action={
                                <button 
                                    onClick={() => setIsAddModalOpen(true)} 
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#093fb4] hover:bg-blue-800 text-white font-semibold text-xs cursor-pointer transition-all"
                                >
                                    <Plus size={13} strokeWidth={2.5} /> Add / Feature
                                </button>
                            }
                        />

                        <div className="relative mt-4">
                            {programs.length > 0 && (
                                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-200" />
                            )}
                            <div className="flex flex-col gap-4">
                                {programs.map(prog => {
                                    const sm = STATUS_META[prog.status] || STATUS_META.Active;
                                    const Icon = sm.icon;
                                    const expanded = expandedProg === prog.id;
                                    const dotColor = prog.status === 'Active' ? 'bg-emerald-500' : prog.status === 'Closed' ? 'bg-red-500' : 'bg-amber-500';
                                    const applicantCount = prog.active_scholars ?? 0;

                                    return (
                                        <div key={prog.id} className="relative pl-6">
                                            <div className={`absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow ring-1 ring-slate-200 ${dotColor}`} />

                                            <div className="border border-slate-200/70 rounded-2xl overflow-hidden bg-white hover:border-slate-300/90 transition-all duration-150">
                                                <div className="p-3.5 cursor-pointer select-none" onClick={() => setExpandedProg(expanded ? null : prog.id)}>
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-sm text-slate-900 truncate pr-2">{prog.title || prog.name}</p>
                                                            <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
                                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 border ${sm.color}`}>
                                                                    <Icon size={11} strokeWidth={2.5} /> {prog.status || 'Active'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <button 
                                                                onClick={e => { e.stopPropagation(); hideProgramFromProfile(prog.id); }} 
                                                                title="Hide from profile display" 
                                                                className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer flex items-center justify-center hover:bg-slate-100 text-slate-500 transition-all"
                                                            >
                                                                <EyeOff size={13} />
                                                            </button>
                                                            <div className="text-slate-400">
                                                                {expanded ? <ChevronUp size={14} strokeWidth={2.5} /> : <ChevronDown size={14} strokeWidth={2.5} />}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100">
                                                        <div>
                                                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide leading-none">Scholars</p>
                                                            <p className="text-xs font-semibold text-slate-800 mt-1">{applicantCount}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide leading-none">Slots</p>
                                                            <p className="text-xs font-semibold text-slate-800 mt-1">{prog.slots ?? 0}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide leading-none">Deadline</p>
                                                            <p className="text-[11px] font-semibold text-slate-700 mt-1 whitespace-nowrap">{prog.deadline || 'TBD'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                {expanded && (
                                                    <div className="px-3.5 pb-3.5 pt-3 border-t border-slate-100 bg-slate-50/40">
                                                        <p className="text-xs text-slate-500 font-medium leading-relaxed">{prog.description || 'No description set for this program.'}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {programs.length === 0 && (
                                <div className="text-center py-10 px-4 text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                                    <BookOpen size={28} className="mx-auto text-slate-300 mb-2" />
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">No profile programs displayed</p>
                                    <p className="text-[11px] text-slate-400 mt-1">Click "Add / Feature" above to select existing programs.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Column 2: About Us */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5">
                        <SectionHeader icon={Info} label="About Us" />
                        <p className="text-sm text-slate-600 font-normal leading-relaxed whitespace-pre-line">{profile.about_us || 'No description provided yet.'}</p>
                    </div>

                    {/* Column 3: Contact & Details */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5">
                        <SectionHeader icon={Building2} label="Contact & Details" />
                        <div className="space-y-0.5">
                            <Field label="Provider Type">
                                <StaticVal val={profile.provider_type} />
                            </Field>

                            <Field label="Telephone Number">
                                <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                                    <Phone size={14} className="text-[#093fb4] shrink-0" />
                                    <span className="text-sm font-medium text-slate-700">{profile.tel_number || '—'}</span>
                                </div>
                            </Field>

                            <Field label="Contact Number (Mobile)">
                                <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                                    <Smartphone size={14} className="text-[#093fb4] shrink-0" />
                                    <span className="text-sm font-medium text-slate-700">{profile.contact_number || '—'}</span>
                                </div>
                            </Field>

                            <Field label="Website / Social Platform">
                                <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                                    <Globe size={14} className="text-[#093fb4] shrink-0" />
                                    <span className="text-sm font-medium text-slate-700 truncate">{profile.website || '—'}</span>
                                </div>
                            </Field>

                            <div className="border-t border-slate-100 my-4 pt-3" />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5">
                                {[
                                    { key: 'region', label: 'Region' },
                                    { key: 'city', label: 'City / Municipality' },
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
            </div>

            {/* ── CONSOLIDATED EDIT PROFILE MODAL ── */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl border border-slate-200 overflow-hidden my-8 animate-in zoom-in-95 duration-150">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h2 className="text-sm font-semibold text-slate-900">Edit Organization Profile</h2>
                                <p className="text-[11px] text-slate-500 font-medium">Update contact info, address details, and organization overview.</p>
                            </div>
                            <button onClick={() => setIsEditModalOpen(false)} className="w-8 h-8 rounded-xl border border-slate-200 bg-white cursor-pointer flex items-center justify-center hover:bg-slate-50 transition-all">
                                <X size={14} className="text-slate-500" strokeWidth={2.5} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveProfileModal} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Organization Name</label>
                                    <input 
                                        type="text"
                                        value={editFormData.org_name || ''} 
                                        onChange={e => setEditFormData({ ...editFormData, org_name: e.target.value })} 
                                        className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#093fb4]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Provider Type</label>
                                    <input 
                                        type="text"
                                        value={editFormData.provider_type || ''} 
                                        onChange={e => setEditFormData({ ...editFormData, provider_type: e.target.value })} 
                                        placeholder="e.g. NGO, Corporate Foundation"
                                        className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#093fb4]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Telephone Number</label>
                                    <input 
                                        type="text"
                                        value={editFormData.tel_number || ''} 
                                        onChange={e => setEditFormData({ ...editFormData, tel_number: e.target.value })} 
                                        placeholder="(02) 8123-4567"
                                        className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#093fb4]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Mobile Contact Number</label>
                                    <input 
                                        type="text"
                                        value={editFormData.contact_number || ''} 
                                        onChange={e => setEditFormData({ ...editFormData, contact_number: e.target.value })} 
                                        placeholder="09171234567"
                                        className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#093fb4]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Website / Social Platform</label>
                                    <input 
                                        type="text"
                                        value={editFormData.website || ''} 
                                        onChange={e => setEditFormData({ ...editFormData, website: e.target.value })} 
                                        placeholder="https://facebook.com/org"
                                        className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#093fb4]"
                                    />
                                </div>
                            </div>

                            <hr className="border-slate-100 my-2" />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Region</label>
                                    <input 
                                        type="text"
                                        value={editFormData.region || ''} 
                                        onChange={e => setEditFormData({ ...editFormData, region: e.target.value })} 
                                        placeholder="e.g. NCR"
                                        className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#093fb4]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">City / Municipality</label>
                                    <input 
                                        type="text"
                                        value={editFormData.city || ''} 
                                        onChange={e => setEditFormData({ ...editFormData, city: e.target.value })} 
                                        placeholder="e.g. Quezon City"
                                        className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#093fb4]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Barangay</label>
                                    <input 
                                        type="text"
                                        value={editFormData.barangay || ''} 
                                        onChange={e => setEditFormData({ ...editFormData, barangay: e.target.value })} 
                                        placeholder="e.g. Central"
                                        className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#093fb4]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Street Address</label>
                                    <input 
                                        type="text"
                                        value={editFormData.street_address || ''} 
                                        onChange={e => setEditFormData({ ...editFormData, street_address: e.target.value })} 
                                        placeholder="e.g. 123 Main Street"
                                        className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#093fb4]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">About Us Description</label>
                                <textarea 
                                    value={editFormData.about_us || ''} 
                                    onChange={e => setEditFormData({ ...editFormData, about_us: e.target.value })} 
                                    rows={4} 
                                    className="w-full text-xs font-semibold text-slate-800 border border-slate-200 rounded-xl p-3 outline-none resize-none focus:border-[#093fb4]"
                                />
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                                <button 
                                    type="button" 
                                    onClick={() => setIsEditModalOpen(false)} 
                                    className="px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-semibold text-xs cursor-pointer hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={saving}
                                    className="px-5 py-2.5 rounded-lg bg-[#093fb4] hover:bg-blue-800 text-white font-semibold text-xs cursor-pointer transition-all flex items-center gap-1.5"
                                >
                                    <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── PROGRAM OPTIONS SELECTOR MODAL ── */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-6">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h2 className="text-sm font-semibold text-slate-900">Select Programs to Showcase</h2>
                                <p className="text-[10px] text-slate-500 font-medium">Select programs to make visible on your organization profile.</p>
                            </div>
                            <button onClick={() => { setIsAddModalOpen(false); setSelectedProgramIds([]); }} className="w-8 h-8 rounded-xl border border-slate-200 bg-white cursor-pointer flex items-center justify-center hover:bg-slate-50 transition-all">
                                <X size={14} className="text-slate-500" strokeWidth={2.5} />
                            </button>
                        </div>

                        <div className="px-5 py-2 bg-slate-100/50 border-b border-slate-100 flex justify-between items-center text-[11px] font-bold text-slate-600">
                            <span>Selected: <b>{selectedProgramIds.length}</b> program(s)</span>
                            <button 
                                type="button" 
                                onClick={handleSelectAll} 
                                className="text-[#093fb4] hover:underline font-semibold text-[11px] cursor-pointer"
                            >
                                {selectedProgramIds.length > 0 ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>

                        <div className="p-5 max-h-[350px] overflow-y-auto space-y-2.5">
                            {availableOptions.map(option => {
                                const isAlreadyAdded = programs.some(p => String(p.id) === String(option.id));
                                const isSelected = selectedProgramIds.includes(option.id);

                                return (
                                    <div
                                        key={option.id}
                                        onClick={() => !isAlreadyAdded && toggleProgramSelection(option.id)}
                                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                                            isAlreadyAdded 
                                                ? 'opacity-50 bg-slate-50 border-slate-200 cursor-not-allowed' 
                                                : isSelected 
                                                    ? 'border-[#093fb4] bg-blue-50/40 shadow-xs ring-1 ring-[#093fb4]' 
                                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                                        }`}
                                    >
                                        <div className="space-y-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs font-bold text-slate-900 truncate">{option.title || option.name}</p>
                                                {isAlreadyAdded && (
                                                    <span className="text-[8px] font-bold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded uppercase">Currently Featured</span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-slate-500 line-clamp-1">{option.description || 'No description available'}</p>
                                        </div>

                                        <div className="shrink-0 pt-0.5">
                                            <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                                                isSelected ? 'bg-[#093fb4] border-[#093fb4] text-white' : 'border-slate-300 bg-white'
                                            }`}>
                                                {isSelected && <Check size={12} strokeWidth={3} />}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2.5">
                            <button 
                                type="button" 
                                onClick={() => { setIsAddModalOpen(false); setSelectedProgramIds([]); }} 
                                className="px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-semibold text-xs cursor-pointer hover:bg-slate-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                type="button" 
                                onClick={handleAddSelectedPrograms} 
                                disabled={selectedProgramIds.length === 0}
                                className={`px-5 py-2.5 rounded-xl border-none font-semibold text-xs cursor-pointer transition-all ${
                                    selectedProgramIds.length > 0 ? 'bg-[#093fb4] text-white hover:bg-blue-800' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                }`}
                            >
                                Feature Selected ({selectedProgramIds.length})
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrgProfile;