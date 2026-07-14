import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import {
    Camera, MapPin, Mail, Globe, Building2, Save, Phone,
    X, Edit2, Award, Plus, Trash2, ChevronDown, ChevronUp,
    CheckCircle, Clock, BookOpen, Layers, Users, Calendar, Info, ShieldCheck
} from 'lucide-react';

/* ─── STATUS METADATA ─── */
const STATUS_META = {
    Active:   { color: 'text-green-600 border-green-200 bg-green-50', icon: CheckCircle },
    Closed:   { color: 'text-red-600 border-red-200 bg-red-50', icon: X },
    Upcoming: { color: 'text-amber-600 border-amber-200 bg-amber-50', icon: Clock },
};
const TRACKS = ['STEM', 'Arts & Humanities', 'Business', 'Health Sciences', 'Law', 'Education', 'Vocational'];
const EMPTY_PROGRAM = { id: null, name: '', slots: '', status: 'Active', description: '', track: 'STEM', applicants: 0, deadline: '' };

/* ─── HELPERS ─── */
const Field = ({ label, children }) => (
    <div className="mb-4">
        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
            {label}
        </label>
        {children}
    </div>
);

const StaticVal = ({ val, placeholder = 'Not specified' }) => (
    <div className={`text-xs font-semibold border rounded-xl px-3.5 py-2.5 border-slate-200/60 bg-slate-50/50 ${val ? 'text-slate-800' : 'text-slate-400 italic'}`}>
        {val || placeholder}
    </div>
);

const EditInput = ({ value, onChange, placeholder, type = 'text' }) => (
    <input
        type={type}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#093fb4] focus:ring-2 focus:ring-[#093fb4]/10 transition-all"
    />
);

const SectionHeader = ({ icon: Icon, label, action }) => (
    <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
            <Icon size={16} className="text-[#093fb4]" />
            <span className="text-[11px] font-black text-slate-900 uppercase tracking-wider">{label}</span>
        </div>
        {action}
    </div>
);

/* ─── MAIN COMPONENT ─── */
const OrgProfile = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    
    const [profile, setProfile] = useState({
        org_name: 'OSDS-CHED',
        org_subtitle: 'Office of Student Development Services - CHED',
        sub_email: 'valerlychee.garciahenryco@gmail.com',
        contact_number: '9129038129',
        website: 'ched.gov.ph',
        office_hours: 'Monday - Friday 8:00 AM - 5:00 PM',
        about_us: 'The Office of Student Development Services (OSDS) is dedicated to promoting the holistic development of Filipino students by implementing inclusive programs and services that support academic excellence, leadership, and community engagement.',
        dist_mission: 'To empower students through quality programs and services.',
        dist_vision: 'A premier student development service office committed to excellence and inclusivity.',
        core_values: 'Integrity, Excellence, Service, Inclusivity, Innovation',
        region: 'NCR',
        city: 'City of Malabon',
        barangay: 'Concepcion',
        street_address: 'Diamond Corner Street Corner Square',
        org_pic: null
    });
    
    const [originalData, setOriginalData] = useState({});
    const [programs, setPrograms] = useState([
        { id: 1, name: 'CHED Merit Scholarship', slots: 50, status: 'Active', description: 'Full scholarship for academically excellent students.', track: 'STEM', applicants: 85, deadline: 'Dec 31, 2026' },
        { id: 2, name: 'Arta Excellence Grant', slots: 20, status: 'Upcoming', description: 'Support for creative arts undergraduates.', track: 'Arts & Humanities', applicants: 32, deadline: 'Mar 15, 2027' },
        { id: 3, name: 'Health Sciences Subsidy', slots: 30, status: 'Closed', description: 'Nursing and medicine support fund.', track: 'Health Sciences', applicants: 35, deadline: 'Jun 30, 2026' },
    ]);
    const [editingProg, setEditingProg] = useState(null);
    const [progDraft, setProgDraft] = useState(EMPTY_PROGRAM);
    const [expandedProg, setExpandedProg] = useState(null);
    const fileRef = useRef();

    useEffect(() => {
        const fetchProfile = async () => {
            const id = localStorage.getItem('orgId');
            if (!id) {
                setOriginalData({ ...profile });
                setLoading(false);
                return;
            }
            try {
                const response = await api.get(`/organizations/profile/${id}`);
                const data = response.data.data;
                const mergedData = { ...profile, ...data };
                setProfile(mergedData);
                setOriginalData(mergedData);
            } catch {
                setOriginalData({ ...profile });
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
            alert('Please upload a valid image (PNG, JPG, JPEG, or WebP)');
            return;
        }
        setProfile({ ...profile, org_pic: file, previewUrl: URL.createObjectURL(file) });
    };

    const handleSave = async () => {
        setSaving(true);
        const id = localStorage.getItem('orgId') || 'mock';
        try {
            if (profile.org_pic instanceof File && id !== 'mock') {
                const imgData = new FormData();
                imgData.append('org_pic', profile.org_pic);
                await api.patch(`/orgs/${id}/profile-picture`, imgData);
            }
            if (id !== 'mock') {
                const { org_pic, previewUrl, ...textData } = profile;
                const response = await api.patch(`/orgs/${id}/profile`, textData);
                const updated = response.data.data;
                setProfile(prev => ({ ...prev, ...updated }));
                setOriginalData({ ...profile, ...updated });
            } else {
                setOriginalData({ ...profile });
            }
            setIsEditing(false);
        } catch {
            alert('Update failed. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => { setProfile(originalData); setIsEditing(false); };
    const dataChanged = JSON.stringify(profile) !== JSON.stringify(originalData);

    const openAddProg = () => { setProgDraft({ ...EMPTY_PROGRAM, id: Date.now() }); setEditingProg('new'); };
    const openEditProg = (p) => { setProgDraft({ ...p }); setEditingProg(p.id); };
    const saveProg = () => {
        if (!progDraft.name.trim()) return alert('Program name is required.');
        if (editingProg === 'new') setPrograms([...programs, progDraft]);
        else setPrograms(programs.map(p => p.id === editingProg ? progDraft : p));
        setEditingProg(null);
    };
    const deleteProg = (id) => { if (confirm('Remove this program?')) setPrograms(programs.filter(p => p.id !== id)); };

    const logoSrc = profile.previewUrl
        ? profile.previewUrl
        : profile.org_pic && typeof profile.org_pic === 'string'
            ? `http://localhost:5000/${profile.org_pic.replace(/\\/g, '/')}`
            : null;

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-[#f8fafc]">
            <Building2 size={32} className="text-[#093fb4] animate-pulse" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Loading Profile Workspace…</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8fafc] font-['Inter'] text-slate-800 pb-16">
            
            {/* ── HIGH PROFILE MAIN CONTAINER HEADER BANNER ── */}
            <div className="bg-[#093fb4] text-white relative pt-8 pb-6 px-8 shadow-inner overflow-hidden">
                <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                
                <div className="max-w-7xl mx-auto">
                    {/* Top Action Row */}
                    <div className="flex justify-between items-start gap-4 mb-6">
                        <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                            {/* Avatar Display Frame */}
                            <div className="relative shrink-0 group">
                                <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-xl overflow-hidden flex items-center justify-center border border-white/20">
                                    {logoSrc ? (
                                        <img src={logoSrc} alt="Org Logo" className="w-full h-full object-cover rounded-xl" />
                                    ) : (
                                        <div className="w-full h-full bg-blue-50 rounded-xl flex items-center justify-center text-[#093fb4] font-black text-2xl">
                                            {profile.org_name?.charAt(0) || 'O'}
                                        </div>
                                    )}
                                </div>
                                {isEditing && (
                                    <button onClick={() => fileRef.current.click()} title="Change logo" className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-[#093fb4] border-2 border-white flex items-center justify-center cursor-pointer shadow-md hover:bg-blue-800 transition">
                                        <Camera size={12} className="text-white" />
                                    </button>
                                )}
                                <input ref={fileRef} type="file" accept=".png,.jpg,.jpeg,.webp" className="hidden" onChange={handleFileChange} />
                            </div>

                            {/* Title Metadata Identification Blocks */}
                            <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    {isEditing ? (
                                        <input value={profile.org_name} onChange={e => setProfile({ ...profile, org_name: e.target.value })} className="text-xl font-black text-slate-900 bg-white border border-transparent rounded-lg px-2 py-0.5 outline-none w-64" />
                                    ) : (
                                        <h1 className="text-xl font-black tracking-tight">{profile.org_name || '—'}</h1>
                                    )}
                                    <span className="flex items-center gap-1 text-[9px] font-bold bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-md uppercase tracking-wide">
                                        <ShieldCheck size={10} className="text-blue-200" /> Verified Organization
                                    </span>
                                </div>

                                {isEditing ? (
                                    <input value={profile.org_subtitle} onChange={e => setProfile({ ...profile, org_subtitle: e.target.value })} className="text-xs text-slate-900 bg-white border border-transparent rounded px-2 py-0.5 outline-none w-full block mt-1" />
                                ) : (
                                    <p className="text-xs text-blue-100 font-medium">{profile.org_subtitle || '—'}</p>
                                )}

                                <div className="flex items-center gap-1 text-[11px] text-blue-100/80 pt-1">
                                    <MapPin size={12} className="text-blue-200" />
                                    <span>{[profile.city, 'Philippines'].filter(Boolean).join(', ')}</span>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <span className="text-[9px] font-black bg-white/10 text-white px-2.5 py-0.5 rounded-md tracking-wider uppercase">Registered Organization</span>
                                    <span className="text-[9px] font-black bg-emerald-500 text-white px-2.5 py-0.5 rounded-md tracking-wider uppercase">Active</span>
                                </div>
                            </div>
                        </div>

                        {/* Top Context Control Actions Bar */}
                        <div className="shrink-0">
                            {isEditing ? (
                                <div className="flex gap-2">
                                    <button onClick={handleCancel} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold text-xs transition uppercase tracking-wider">Cancel</button>
                                    <button onClick={handleSave} disabled={saving || !dataChanged} className={`px-4 py-2 rounded-xl border-none font-black text-xs flex items-center gap-1.5 shadow-md transition uppercase tracking-wider ${dataChanged ? 'bg-white text-[#093fb4] hover:bg-blue-50' : 'bg-white/40 text-white/70 cursor-not-allowed'}`}>
                                        <Save size={13} /> {saving ? 'Saving…' : 'Save Changes'}
                                    </button>
                                </div>
                            ) : (
                                <button onClick={() => setIsEditing(true)} className="px-4 py-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white font-black text-xs flex items-center gap-1.5 transition uppercase tracking-wider shadow-xs">
                                    <Edit2 size={13} /> Edit Profile
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Integrated Embedded High Density Banner Metrics Rows */}
                    <div className="border-t border-white/10 pt-5 mt-5 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Programs', val: programs.length, icon: Layers },
                            { label: 'Total Applicants', val: programs.reduce((s, p) => s + (p.applicants || 0), 0), icon: Users },
                            { label: 'Slots Available', val: programs.reduce((s, p) => s + Number(p.slots || 0), 0), icon: Award },
                            { label: 'Member Since', val: 'March 15, 2024', desc: '1 year, 3 months', icon: Calendar },
                        ].map(({ label, val, desc, icon: Icon }) => (
                            <div key={label} className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-2xl p-3 backdrop-blur-xs">
                                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-blue-200 shrink-0">
                                    <Icon size={16} />
                                </div>
                                <div>
                                    <p className="text-xs text-blue-200 font-bold uppercase tracking-wider text-[9px] leading-tight">{label}</p>
                                    <p className="text-base font-black leading-tight mt-0.5">{val}</p>
                                    {desc && <p className="text-[9px] text-blue-200/60 font-medium">{desc}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 mt-6">
                
                {/* ── UPDATED CONTENT ROW WORKSPACE ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    
                    {/* Columns 1 & 2: Scholarship Programs Panel (Now taking up the primary space) */}
                    <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-xs">
                        <SectionHeader
                            icon={Award}
                            label="Scholarship Programs"
                            action={
                                <button onClick={openAddProg} className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-[#093fb4] hover:bg-blue-800 text-white font-black text-xs cursor-pointer shadow-md tracking-wider uppercase transition-all">
                                    <Plus size={14} strokeWidth={2.5} /> Add New Program
                                </button>
                            }
                        />

                        {/* Program List Feed Column Table */}
                        <div className="flex flex-col gap-3.5 mt-4">
                            {programs.map(prog => {
                                const sm = STATUS_META[prog.status] || STATUS_META.Active;
                                const Icon = sm.icon;
                                const expanded = expandedProg === prog.id;
                                return (
                                    <div key={prog.id} className="border border-slate-200/70 rounded-2xl overflow-hidden bg-white hover:border-slate-300/90 transition-all duration-150">
                                        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none" onClick={() => setExpandedProg(expanded ? null : prog.id)}>
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${prog.status === 'Active' ? 'bg-emerald-500' : prog.status === 'Closed' ? 'bg-red-500' : 'bg-amber-500'}`} />
                                                <div className="min-w-0">
                                                    <p className="font-bold text-sm text-slate-900 truncate pr-2">{prog.name}</p>
                                                    <div className="flex items-center flex-wrap gap-2 mt-1.5">
                                                        <span className="text-[9px] font-black bg-blue-50 text-[#093fb4] px-2 py-0.5 rounded-md uppercase tracking-wider">{prog.track}</span>
                                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 border ${sm.color} uppercase tracking-wider`}>
                                                            <Icon size={10} strokeWidth={2.5} /> {prog.status}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{prog.slots} slots</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Data Counter Points */}
                                            <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-10 shrink-0 text-left border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                                                <div className="w-16">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none">Applicants</p>
                                                    <p className="text-sm font-black text-slate-800 mt-1">{prog.applicants || 0}</p>
                                                </div>
                                                <div className="w-20">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none">Slots Available</p>
                                                    <p className="text-sm font-black text-slate-800 mt-1">{prog.slots}</p>
                                                </div>
                                                <div className="w-24">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none">Deadline</p>
                                                    <p className="text-xs font-bold text-slate-700 mt-1 whitespace-nowrap">{prog.deadline || 'Undetermined'}</p>
                                                </div>
                                                
                                                {/* Action Controls */}
                                                <div className="flex items-center gap-1.5 pl-2">
                                                    <button onClick={e => { e.stopPropagation(); openEditProg(prog); }} className="w-8 h-8 rounded-xl border border-slate-200 bg-white cursor-pointer flex items-center justify-center hover:bg-slate-50 text-[#093fb4] transition-all">
                                                        <Edit2 size={13} />
                                                    </button>
                                                    <button onClick={e => { e.stopPropagation(); deleteProg(prog.id); }} className="w-8 h-8 rounded-xl border border-red-100 bg-red-50/40 cursor-pointer flex items-center justify-center hover:bg-red-50 text-red-600 transition-all">
                                                        <Trash2 size={13} />
                                                    </button>
                                                    <div className="text-slate-400 ml-1">
                                                        {expanded ? <ChevronUp size={15} strokeWidth={2.5} /> : <ChevronDown size={15} strokeWidth={2.5} />}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {expanded && (
                                            <div className="px-4 pb-4 pt-3 border-t border-slate-100 bg-slate-50/40">
                                                <p className="text-xs text-slate-500 font-medium leading-relaxed">{prog.description || 'No description summary set for this configuration.'}</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {programs.length === 0 && (
                                <div className="text-center py-10 px-4 text-slate-400 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl">
                                    <BookOpen size={28} className="mx-auto text-slate-300 mb-2" />
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">No active programs deployed</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Column 3: Stacked Context Information Panel (About, Contact, & Address combined) */}
                    <div className="lg:col-span-1 flex flex-col gap-6 w-full">
                        
                        {/* About Us Card */}
                        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
                            <SectionHeader icon={Info} label="About Us" />
                            {isEditing ? (
                                <div className="space-y-3">
                                    <Field label="Organization Description">
                                        <textarea value={profile.about_us} onChange={e => setProfile({ ...profile, about_us: e.target.value })} rows={3} className="w-full text-xs font-semibold text-slate-800 border border-slate-200 rounded-xl p-2.5 outline-none resize-none focus:border-[#093fb4]" />
                                    </Field>
                                    <Field label="Mission">
                                        <input type="text" value={profile.dist_mission} onChange={e => setProfile({ ...profile, dist_mission: e.target.value })} className="w-full text-xs font-semibold text-slate-800 border border-slate-200 rounded-xl p-2 outline-none focus:border-[#093fb4]" />
                                    </Field>
                                    <Field label="Vision">
                                        <input type="text" value={profile.dist_vision} onChange={e => setProfile({ ...profile, dist_vision: e.target.value })} className="w-full text-xs font-semibold text-slate-800 border border-slate-200 rounded-xl p-2 outline-none focus:border-[#093fb4]" />
                                    </Field>
                                </div>
                            ) : (
                                <div className="space-y-3.5">
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{profile.about_us}</p>
                                    <div className="bg-slate-50/60 border border-slate-100 p-3 rounded-xl">
                                        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-wider">Mission</h4>
                                        <p className="text-xs text-slate-500 font-medium mt-0.5 leading-normal">{profile.dist_mission}</p>
                                    </div>
                                    <div className="bg-slate-50/60 border border-slate-100 p-3 rounded-xl">
                                        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-wider">Vision</h4>
                                        <p className="text-xs text-slate-500 font-medium mt-0.5 leading-normal">{profile.dist_vision}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Contact & Address Details Workspace Card */}
                        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
                            <SectionHeader icon={Mail} label="Contact & Address" />
                            <div className="space-y-0.5">
                                <Field label="Email Address">
                                    {isEditing ? (
                                        <EditInput value={profile.sub_email} onChange={e => setProfile({ ...profile, sub_email: e.target.value })} placeholder="email@domain.com" />
                                    ) : (
                                        <div className="flex items-center gap-2.5 bg-slate-50/60 border border-slate-150 rounded-xl p-2.5">
                                            <Mail size={14} className="text-[#093fb4] shrink-0" />
                                            <span className="text-xs font-semibold text-slate-800 break-all truncate">{profile.sub_email || '—'}</span>
                                        </div>
                                    )}
                                </Field>

                                <Field label="Contact Number">
                                    {isEditing ? (
                                        <EditInput value={profile.contact_number} onChange={e => setProfile({ ...profile, contact_number: e.target.value })} placeholder="9XXXXXXXXX" />
                                    ) : (
                                        <div className="flex items-center gap-2.5 bg-slate-50/60 border border-slate-150 rounded-xl p-2.5">
                                            <Phone size={14} className="text-[#093fb4] shrink-0" />
                                            <span className="text-xs font-semibold text-slate-800">{profile.contact_number || '—'}</span>
                                        </div>
                                    )}
                                </Field>

                                <Field label="Website">
                                    {isEditing ? (
                                        <EditInput value={profile.website} onChange={e => setProfile({ ...profile, website: e.target.value })} placeholder="domain.gov.ph" />
                                    ) : (
                                        <div className="flex items-center gap-2.5 bg-slate-50/60 border border-slate-150 rounded-xl p-2.5">
                                            <Globe size={14} className="text-[#093fb4] shrink-0" />
                                            <span className="text-xs font-semibold text-slate-800 truncate">{profile.website || '—'}</span>
                                        </div>
                                    )}
                                </Field>

                                <div className="border-t border-slate-100 my-4 pt-3" />
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5">
                                    {[
                                        { key: 'region', label: 'Region', placeholder: 'e.g. NCR' },
                                        { key: 'city', label: 'City / Municipality', placeholder: 'e.g. City' },
                                        { key: 'barangay', label: 'Barangay', placeholder: 'e.g. Concepcion' },
                                        { key: 'street_address', label: 'Street Address', placeholder: 'e.g. 123 Street' },
                                    ].map(({ key, label, placeholder }) => (
                                        <Field key={key} label={label}>
                                            {isEditing ? (
                                                <EditInput value={profile[key]} onChange={e => setProfile({ ...profile, [key]: e.target.value })} placeholder={placeholder} />
                                            ) : (
                                                <StaticVal val={profile[key]} />
                                            )}
                                        </Field>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </div>

            {/* ── PROGRAM INLINE MODAL COMPONENT ── */}
            {editingProg !== null && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-6">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-150">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">{editingProg === 'new' ? 'Create New Program' : 'Edit Scholarship Details'}</h2>
                            <button onClick={() => setEditingProg(null)} className="w-8 h-8 rounded-xl border border-slate-200 bg-white cursor-pointer flex items-center justify-center hover:bg-slate-50 transition-all">
                                <X size={14} className="text-slate-500" strokeWidth={2.5} />
                            </button>
                        </div>
                        <div className="p-5 space-y-1">
                            <Field label="Program Name *">
                                <EditInput value={progDraft.name} onChange={e => setProgDraft({ ...progDraft, name: e.target.value })} placeholder="e.g. CHED Merit Scholarship" />
                            </Field>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Track">
                                    <select value={progDraft.track} onChange={e => setProgDraft({ ...progDraft, track: e.target.value })} className="w-full text-xs font-semibold text-slate-800 border border-slate-200 rounded-xl px-3 py-2.5 bg-white outline-none focus:border-[#093fb4]">
                                        {TRACKS.map(t => <option key={t}>{t}</option>)}
                                    </select>
                                </Field>
                                <Field label="Available Slots">
                                    <EditInput type="number" value={progDraft.slots} onChange={e => setProgDraft({ ...progDraft, slots: e.target.value })} placeholder="e.g. 50" />
                                </Field>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Applicants">
                                    <EditInput type="number" value={progDraft.applicants} onChange={e => setProgDraft({ ...progDraft, applicants: Number(e.target.value) })} placeholder="0" />
                                </Field>
                                <Field label="Deadline Date">
                                    <EditInput value={progDraft.deadline} onChange={e => setProgDraft({ ...progDraft, deadline: e.target.value })} placeholder="e.g. Dec 31, 2026" />
                                </Field>
                            </div>
                            <Field label="Status">
                                <div className="flex gap-2">
                                    {Object.keys(STATUS_META).map(s => {
                                        const active = progDraft.status === s;
                                        return (
                                            <button key={s} type="button" onClick={() => setProgDraft({ ...progDraft, status: s })} className={`flex-1 py-2.5 rounded-xl border text-xs font-black cursor-pointer transition-all uppercase tracking-wider ${active ? 'border-[#093fb4] bg-blue-50/50 text-[#093fb4]' : 'border-slate-200 bg-white text-slate-400 hover:bg-slate-50'}`}>
                                                {s}
                                            </button>
                                        );
                                    })}
                                </div>
                            </Field>
                            <Field label="Description Summary">
                                <textarea value={progDraft.description} onChange={e => setProgDraft({ ...progDraft, description: e.target.value })} rows={3} placeholder="Brief description details..." className="w-full text-xs font-semibold text-slate-800 border border-slate-200 rounded-xl p-3 outline-none resize-none focus:border-[#093fb4] font-sans" />
                            </Field>
                        </div>
                        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2.5">
                            <button type="button" onClick={() => setEditingProg(null)} className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 font-bold text-xs cursor-pointer hover:bg-slate-100 transition-all uppercase tracking-wider">Cancel</button>
                            <button type="button" onClick={saveProg} className="px-5 py-2.5 rounded-xl border-none bg-[#093fb4] text-white font-black text-xs cursor-pointer shadow-md hover:bg-blue-800 transition-all uppercase tracking-wider">
                                {editingProg === 'new' ? 'Add Program' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrgProfile;