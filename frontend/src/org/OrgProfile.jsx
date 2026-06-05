import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import {
    Camera, MapPin, Mail, Globe, Building2, Save, Phone,
    X, Edit2, Award, Plus, Trash2, ChevronDown, ChevronUp,
    CheckCircle, Clock, BookOpen, Layers, Users
} from 'lucide-react';

/* ─── STATUS METADATA ─── */
const STATUS_META = {
    Active:   { color: 'text-green-600 border-green-600 bg-green-50', icon: CheckCircle },
    Closed:   { color: 'text-red-600 border-red-600 bg-red-50', icon: X },
    Upcoming: { color: 'text-amber-600 border-amber-600 bg-amber-50', icon: Clock },
};
const TRACKS = ['STEM', 'Arts & Humanities', 'Business', 'Health Sciences', 'Law', 'Education', 'Vocational'];
const EMPTY_PROGRAM = { id: null, name: '', slots: '', status: 'Active', description: '', track: 'STEM' };

/* ─── HELPERS ─── */
const Field = ({ label, children }) => (
    <div className="mb-5">
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.14em] mb-1.5">
            {label}
        </label>
        {children}
    </div>
);

const StaticVal = ({ val, placeholder = 'Not specified' }) => (
    <div className={`text-sm font-medium border rounded-lg px-3.5 py-2.5 border-slate-200 bg-slate-50 ${val ? 'text-slate-900 not-italic' : 'text-slate-400 italic'}`}>
        {val || placeholder}
    </div>
);

const EditInput = ({ value, onChange, placeholder, type = 'text' }) => (
    <input
        type={type}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full text-sm font-medium text-slate-900 bg-white border-1.5 border-blue-600 rounded-lg px-3.5 py-2.5 outline-none box-border focus:ring-2 focus:ring-blue-600/20"
    />
);

const SectionHeader = ({ icon: Icon, label, action }) => (
    <div className="flex items-center justify-between mb-4.5">
        <div className="flex items-center gap-2.5">
            <div className="w-0.5 h-5 bg-blue-600 rounded" />
            <Icon size={16} className="text-blue-600" />
            <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-[0.18em]">{label}</span>
        </div>
        {action}
    </div>
);

/* ─── MAIN COMPONENT ─── */
const OrgProfile = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [profile, setProfile] = useState({ org_name: '', sub_email: '', contact_number: '', website: '', region: '', city: '', barangay: '', street_address: '', org_pic: null });
    const [originalData, setOriginalData] = useState({});
    const [programs, setPrograms] = useState([
        { id: 1, name: 'CHED Merit Scholarship', slots: 50, status: 'Active', description: 'Full scholarship for academically excellent students.', track: 'STEM' },
        { id: 2, name: 'Arts Excellence Grant', slots: 20, status: 'Upcoming', description: 'Support for creative arts undergraduates.', track: 'Arts & Humanities' },
        { id: 3, name: 'Health Sciences Subsidy', slots: 30, status: 'Closed', description: 'Nursing and medicine support fund.', track: 'Health Sciences' },
    ]);
    const [editingProg, setEditingProg] = useState(null);
    const [progDraft, setProgDraft] = useState(EMPTY_PROGRAM);
    const [expandedProg, setExpandedProg] = useState(null);
    const fileRef = useRef();

    useEffect(() => {
        const fetchProfile = async () => {
            const id = localStorage.getItem('orgId');
            try {
                const response = await api.get(`/organizations/profile/${id}`);
                const data = response.data.data;
                setProfile(data);
                setOriginalData(data);
            } catch {
                /* use default empty state */
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
        const id = localStorage.getItem('orgId');
        try {
            if (profile.org_pic instanceof File) {
                const imgData = new FormData();
                imgData.append('org_pic', profile.org_pic);
                await api.patch(`/orgs/${id}/profile-picture`, imgData);
            }
            const { org_pic, previewUrl, ...textData } = profile;
            const response = await api.patch(`/orgs/${id}/profile`, textData);
            const updated = response.data.data;
            setProfile(updated);
            setOriginalData(updated);
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
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 bg-slate-50">
            <Building2 size={32} className="text-blue-600" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.15em]">Loading Profile…</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-15">

            {/* ── BANNER ── */}
            <div className="bg-blue-600 h-45 relative overflow-hidden">
                <div className="absolute -right-15 -top-15 width-[320px] h-[320px] border-[60px] border-white/5 rounded-full" />
                <div className="absolute right-15 top-5 width-[160px] h-[160px] border-[30px] border-white/7 rounded-full" />
                <div className="absolute left-8 bottom-6 flex items-center gap-2.5">
                    <div className="w-1 h-7 bg-white/40 rounded" />
                    
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6">

                {/* ── PROFILE HEADER CARD ── */}
<div className="bg-[#FFFCFB] border border-slate-200 rounded-2xl -mt-16 p-6 md:p-8 shadow-md relative z-10">
    <div className="flex flex-col md:flex-row gap-6 items-start md:items-end justify-between">
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end flex-1 w-full">
            {/* Avatar */}
            <div className="relative shrink-0 pt-2">
                <div className="w-28 h-28 rounded-xl border-3 border-[#FFFCFB] shadow-[0_0_0_2px_#093fb4] overflow-hidden bg-blue-50 flex items-center justify-center">
                    {logoSrc ? (
                        <img src={logoSrc} alt="Org Logo" className="w-full h-full object-cover" />
                    ) : (
                        <Building2 size={42} className="text-blue-600" />
                    )}
                </div>
                {isEditing && (
                    <button onClick={() => fileRef.current.click()} title="Change logo" className="absolute -bottom-2 -right-2 w-7.5 h-7.5 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center cursor-pointer shadow-sm hover:bg-blue-700 transition">
                        <Camera size={14} className="text-white" />
                    </button>
                )}
                <input ref={fileRef} type="file" accept=".png,.jpg,.jpeg,.webp" className="hidden" onChange={handleFileChange} />
            </div>

            {/* Name & Location */}
            <div className="flex-1 min-w-0 w-full">
                {isEditing ? (
                    <input value={profile.org_name} onChange={e => setProfile({ ...profile, org_name: e.target.value })} className="text-xl font-extrabold text-slate-900 border-1.5 border-blue-600 rounded-lg px-3 py-1.5 outline-none w-full box-border mb-2" />
                ) : (
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1 break-words">{profile.org_name || '—'}</h1>
                )}
                <div className="flex items-center gap-1.5 mb-3">
                    <MapPin size={14} className="text-blue-600 shrink-0" />
                    <span className="text-xs text-slate-500 font-semibold truncate">
                        {[profile.city, 'Philippines'].filter(Boolean).join(', ') || 'Location unset'}
                    </span>
                </div>
                <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full tracking-wide uppercase">Registered Organization</span>
                    <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2.5 py-1 rounded-full tracking-wide uppercase">Active</span>
                </div>
            </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 w-full md:w-auto justify-end shrink-0 md:mb-1">
            {isEditing ? (
                <>
                    <button onClick={handleCancel} className="px-4 py-2 rounded-lg border border-slate-200 bg-[#FFFCFB] text-slate-500 font-bold text-sm cursor-pointer hover:bg-slate-50 transition">Cancel</button>
                    <button onClick={handleSave} disabled={saving || !dataChanged} className={`px-4 py-2 rounded-lg border-none font-bold text-sm flex items-center gap-1.5 shadow-sm transition ${dataChanged ? 'bg-blue-600 text-white cursor-pointer hover:bg-blue-700' : 'bg-slate-300 text-slate-500 cursor-not-allowed'} ${saving ? 'opacity-70' : ''}`}>
                        <Save size={14} /> {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                </>
            ) : (
                <button onClick={() => setIsEditing(true)} className="px-4 py-2 rounded-lg border-1.5 border-blue-600 bg-[#FFFCFB] text-blue-600 font-bold text-sm cursor-pointer flex items-center gap-1.5 hover:bg-blue-50/50 transition">
                    <Edit2 size={14} /> Edit Profile
                </button>
            )}
        </div>
    </div>
</div>

                {/* ── METADATA AND ADDRESS BLOCKS ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6 items-start">
                    
                    {/* Contact Information */}
                    <div className="md:col-span-1 bg-[#FFFCFB] border border-slate-200 rounded-2xl p-6 shadow-sm self-stretch">
                        <SectionHeader icon={Mail} label="Contact Info" />
                        <div className="flex flex-col gap-1">
                            <Field label="Email Address">
                                <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                                    <Mail size={14} className="text-blue-600 shrink-0" />
                                    <span className="text-xs font-medium text-slate-900 break-all truncate">{profile.sub_email || '—'}</span>
                                </div>
                            </Field>

                            <Field label="Contact Number">
                                {isEditing ? (
                                    <EditInput value={profile.contact_number} onChange={e => setProfile({ ...profile, contact_number: e.target.value })} placeholder="+63 9XX XXX XXXX" />
                                ) : (
                                    <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                                        <Phone size={14} className="text-green-600 shrink-0" />
                                        <span className={`text-xs font-medium ${profile.contact_number ? 'text-slate-900' : 'text-slate-400 italic'}`}>{profile.contact_number || 'Not provided'}</span>
                                    </div>
                                )}
                            </Field>

                            <Field label="Website">
                                {isEditing ? (
                                    <EditInput value={profile.website} onChange={e => setProfile({ ...profile, website: e.target.value })} placeholder="https://yourorg.gov.ph" />
                                ) : profile.website ? (
                                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 bg-blue-50/50 border border-blue-100 rounded-lg p-2.5 text-blue-600 font-semibold text-xs transition hover:bg-blue-50">
                                        <Globe size={14} className="shrink-0" />
                                        <span className="truncate">{profile.website.replace(/^https?:\/\//, '')}</span>
                                    </a>
                                ) : (
                                    <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                                        <Globe size={14} className="text-slate-400 shrink-0" />
                                        <span className="text-xs text-slate-400 italic">No website linked</span>
                                    </div>
                                )}
                            </Field>
                        </div>
                    </div>

                    {/* Address Details */}
                    <div className="md:col-span-2 bg-[#FFFCFB] border border-slate-200 rounded-2xl p-6 shadow-sm self-stretch">
                        <SectionHeader icon={MapPin} label="Address Details" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                            {[
                                { key: 'region', label: 'Region', placeholder: 'e.g. NCR' },
                                { key: 'city', label: 'City / Municipality', placeholder: 'e.g. Quezon City' },
                                { key: 'barangay', label: 'Barangay', placeholder: 'e.g. Batasan Hills' },
                                { key: 'street_address', label: 'Street Address', placeholder: 'e.g. 123 Rizal Ave.' },
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

                {/* ── SCHOLARSHIP PROGRAMS ── */}
                <div className="bg-[#FFFCFB] border border-slate-200 rounded-2xl p-6 md:p-8 mt-5 shadow-sm">
                    <SectionHeader
                        icon={Award}
                        label="Scholarship Programs"
                        action={
                            <button onClick={openAddProg} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border-1.5 border-blue-600 bg-blue-600 text-white font-bold text-xs cursor-pointer shadow-sm tracking-wide uppercase hover:bg-blue-700 transition">
                                <Plus size={13} /> Add Program
                            </button>
                        }
                    />

                    {/* Dashboard Metrics Rows */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                        {[
                            { label: 'Total Programs', val: programs.length, icon: Layers, color: 'text-blue-600 bg-blue-50 border-blue-100' },
                            { label: 'Active Programs', val: programs.filter(p => p.status === 'Active').length, icon: CheckCircle, color: 'text-green-600 bg-green-50 border-green-100' },
                            { label: 'Total Slots', val: programs.reduce((s, p) => s + Number(p.slots || 0), 0), icon: Users, color: 'text-purple-600 bg-purple-50 border-purple-100' },
                        ].map(({ label, val, icon: Icon, color }) => (
                            <div key={label} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3.5">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${color}`}>
                                    <Icon size={16} />
                                </div>
                                <div>
                                    <p className="text-xl font-extrabold text-slate-900 leading-none mb-0.5">{val}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Program List */}
                    <div className="flex flex-col gap-3">
                        {programs.map(prog => {
                            const sm = STATUS_META[prog.status] || STATUS_META.Active;
                            const Icon = sm.icon;
                            const expanded = expandedProg === prog.id;
                            return (
                                <div key={prog.id} className="border border-slate-200 rounded-xl overflow-hidden bg-[#FFFCFB] hover:border-slate-300 transition">
                                    <div className="p-4 flex items-center gap-3.5 cursor-pointer select-none" onClick={() => setExpandedProg(expanded ? null : prog.id)}>
                                        <div className={`w-2 h-2 rounded-full shrink-0 ${prog.status === 'Active' ? 'bg-green-500' : prog.status === 'Closed' ? 'bg-red-500' : 'bg-amber-500'}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm text-slate-900 truncate pr-2">{prog.name}</p>
                                            <div className="flex items-center flex-wrap gap-2 mt-1.5">
                                                <span className="text-[9px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase tracking-wider">{prog.track}</span>
                                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${sm.color}`}>
                                                    <Icon size={10} /> {prog.status}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-semibold">{prog.slots} slots</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button onClick={e => { e.stopPropagation(); openEditProg(prog); }} className="w-8 h-8 rounded-lg border border-slate-200 bg-[#FFFCFB] cursor-pointer flex items-center justify-center hover:bg-slate-50 transition">
                                                <Edit2 size={13} className="text-blue-600" />
                                            </button>
                                            <button onClick={e => { e.stopPropagation(); deleteProg(prog.id); }} className="w-8 h-8 rounded-lg border border-red-100 bg-red-50/50 cursor-pointer flex items-center justify-center hover:bg-red-50 transition">
                                                <Trash2 size={13} className="text-red-600" />
                                            </button>
                                            {expanded ? <ChevronUp size={15} className="text-slate-400 ml-1" /> : <ChevronDown size={15} className="text-slate-400 ml-1" />}
                                        </div>
                                    </div>
                                    {expanded && (
                                        <div className="px-4 pb-4 pt-3 border-t border-slate-100 bg-slate-50/30">
                                            <p className="text-xs text-slate-500 leading-relaxed">{prog.description || 'No description provided.'}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {programs.length === 0 && (
                            <div className="text-center py-10 px-4 text-slate-400">
                                <BookOpen size={32} className="mx-auto text-slate-300 mb-2.5" />
                                <p className="text-xs font-semibold">No scholarship programs added yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── PROGRAM MODAL ── */}
            {editingProg !== null && (
                <div className="fixed inset-0 bg-blue-900/15 backdrop-blur-xs flex items-center justify-center z-50 p-6">
                    <div className="bg-[#FFFCFB] rounded-2xl w-full max-w-md shadow-xl overflow-hidden animation-fade-in">
                        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">{editingProg === 'new' ? 'Add Program' : 'Edit Program'}</h2>
                            <button onClick={() => setEditingProg(null)} className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer flex items-center justify-center hover:bg-slate-100 transition">
                                <X size={15} className="text-slate-500" />
                            </button>
                        </div>
                        <div className="p-5">
                            <Field label="Program Name *">
                                <EditInput value={progDraft.name} onChange={e => setProgDraft({ ...progDraft, name: e.target.value })} placeholder="e.g. CHED Merit Scholarship" />
                            </Field>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Track">
                                    <select value={progDraft.track} onChange={e => setProgDraft({ ...progDraft, track: e.target.value })} className="w-full text-xs font-semibold text-slate-900 border-1.5 border-blue-600 rounded-lg px-3 py-2.5 outline-none bg-[#FFFCFB] box-border focus:ring-2 focus:ring-blue-600/20">
                                        {TRACKS.map(t => <option key={t}>{t}</option>)}
                                    </select>
                                </Field>
                                <Field label="Available Slots">
                                    <EditInput type="number" value={progDraft.slots} onChange={e => setProgDraft({ ...progDraft, slots: e.target.value })} placeholder="e.g. 50" />
                                </Field>
                            </div>
                            <Field label="Status">
                                <div className="flex gap-2">
                                    {Object.keys(STATUS_META).map(s => {
                                        const active = progDraft.status === s;
                                        return (
                                            <button key={s} onClick={() => setProgDraft({ ...progDraft, status: s })} className={`flex-1 py-2 rounded-lg border-1.5 text-xs font-bold cursor-pointer transition uppercase tracking-wide ${active ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-200 bg-white text-slate-400 hover:bg-slate-50'}`}>
                                                {s}
                                            </button>
                                        );
                                    })}
                                </div>
                            </Field>
                            <Field label="Description">
                                <textarea value={progDraft.description} onChange={e => setProgDraft({ ...progDraft, description: e.target.value })} rows={3} placeholder="Brief description of the program…" className="w-full text-xs font-medium text-slate-900 border-1.5 border-blue-600 rounded-lg p-3 outline-none resize-vertical box-border font-sans focus:ring-2 focus:ring-blue-600/20" />
                            </Field>
                        </div>
                        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50/50 flex justify-end gap-2.5">
                            <button onClick={() => setEditingProg(null)} className="px-4 py-2 rounded-lg border border-slate-200 bg-[#FFFCFB] text-slate-500 font-bold text-xs cursor-pointer hover:bg-slate-100 transition">Cancel</button>
                            <button onClick={saveProg} className="px-4 py-2 rounded-lg border-none bg-blue-600 text-white font-bold text-xs cursor-pointer shadow-sm hover:bg-blue-700 transition">
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