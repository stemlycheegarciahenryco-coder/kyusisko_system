import React, { useState, useEffect } from 'react';
import api from '../api';
import { Camera, MapPin, Mail, Globe, Sparkles, Building2, Save } from 'lucide-react';

const OrgProfile = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [originalData, setOriginalData] = useState({});
    const [profile, setProfile] = useState({
        org_name: '',
        sub_email: '',
        contact_number: '',
        website: '',
        city: '',
        barangay: '',
        street_address: '',
        ability_level: 'Local',
        org_pic: null // Track new file uploads
    });

    const [isEditing, setIsEditing] = useState(false);

    // FETCH DATA
    useEffect(() => {
        const fetchProfile = async () => {
            const id = localStorage.getItem('orgId');
            try {
                // Assuming your endpoint is /orgs/:id/profile
                const response = await api.get(`/orgs/${id}/profile`);
                const data = response.data.data;
                setProfile(data);
                setOriginalData(data); // Store a backup
            } catch (err) {
                console.error("Fetch Error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);


    const handleFileChange = (e) => {
    const file = e.target.files[0];
    // Use .type for frontend validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (file) {
        // Change file.mimetype to file.type
        if (!allowedTypes.includes(file.type)) {
            alert("Please upload a valid image (PNG, JPG, JPEG, or WebP)");
            return;
        }

        const previewUrl = URL.createObjectURL(file);
        setProfile({ 
            ...profile, 
            org_pic: file, 
            previewUrl: previewUrl 
        });
    }
};

    // SAVE DATA
    const handleSave = async () => {
    setSaving(true);
    const id = localStorage.getItem('orgId');

    try {
        // --- STEP 1: If user changed the picture, upload it first ---
        if (profile.org_pic instanceof File) {
            const imgData = new FormData();
            imgData.append('org_pic', profile.org_pic);
            await api.patch(`/orgs/${id}/profile-picture`, imgData);
        }

        // --- STEP 2: Update the rest of the text info ---
        // We exclude the image stuff so it doesn't break the SQL
        const { org_pic, previewUrl, ...textData } = profile;
        const response = await api.patch(`/orgs/${id}/profile`, textData);

        const updated = response.data.data;
        setProfile(updated);
        setOriginalData(updated);
        setIsEditing(false);
        alert("Profile and Picture updated!");
    } catch (err) {
        console.error("Error:", err);
        alert("Update failed.");
    } finally {
        setSaving(false);
    }
};

    if (loading) return <div className="p-20 text-center font-black animate-pulse text-blue-600 uppercase tracking-widest text-xs">Fetching your workspace...</div>;

    const dataChanged = JSON.stringify(profile) !== JSON.stringify(originalData);

    return (
        <div className="min-h-screen bg-[#F0F2F5] pb-20 font-sans">
            <div className="max-w-4xl mx-auto mt-10 p-4">

                {/* FB-STYLE COVER BANNER */}
                <div className="relative h-48 rounded-t-[2.5rem] bg-gradient-to-r from-blue-700 to-indigo-800 shadow-xl overflow-hidden">
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-3xl"></div>
                    <Building2 className="absolute text-white/10 scale-150 rotate-12 -right-10 -bottom-10" size={200} />
                    <Sparkles className="absolute text-blue-100 top-6 left-10 animate-pulse" size={24} />
                </div>

                {/* PROFILE HEADER CARD */}
                <div className="bg-white rounded-b-[2.5rem] rounded-t-lg -mt-10 p-10 shadow-sm border border-slate-200 relative">
                    <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between">
                        <div className="flex items-center gap-6">
                            {/* Profile Picture & Uploader */}
                            <div className="relative group flex-shrink-0">
                                <img
    src={
        profile.previewUrl // 1. Always show the preview first if it exists
            ? profile.previewUrl 
            : (profile.org_pic && typeof profile.org_pic === 'string')
                // 2. If it's a string, it's the DB path. Fix backslashes!
                ? `http://localhost:5000/${profile.org_pic.replace(/\\/g, '/')}`
                : "https://cdn-icons-png.flaticon.com/512/1000/1000344.png" // 3. Default
    }
    alt="Organization Logo"
    className="w-28 h-28 rounded-full object-cover border-8 border-white shadow-xl bg-white"
    onError={(e) => {
        // 4. Emergency fallback if the URL is 404
        console.error("Image failed to load, falling back to default.");
        e.target.src = "https://cdn-icons-png.flaticon.com/512/1000/1000344.png";
    }}
/>
                                {isEditing && (
                                    <label className="absolute inset-0 flex items-center justify-center bg-slate-900/60 rounded-full cursor-pointer text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera size={24} />
                                        <input
    type="file" 
    // restrict the file picker
    accept=".png, .jpg, .jpeg, .webp" 
    className="hidden"
    onChange={handleFileChange}
/>
                                    </label>
                                )}
                            </div>

                            <div className="flex-1">
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="text-3xl font-black text-slate-900 focus:outline-blue-500 border border-slate-100 p-2 rounded-xl mb-1 w-full"
                                        value={profile.org_name}
                                        onChange={(e) => setProfile({ ...profile, org_name: e.target.value })}
                                    />
                                ) : (
                                    <h1 className="text-3xl font-black text-slate-900 mb-1">{profile.org_name}</h1>
                                )}
                                <p className="text-slate-400 text-xs font-black uppercase tracking-tight flex items-center gap-1.5">
                                    <MapPin size={12} /> {profile.city}, Metro Manila
                                </p>
                            </div>
                        </div>

                        {/* FB-Style Edit Button */}
                        <div className="md:flex md:gap-3 md:items-center mt-4 md:mt-0">
                            {isEditing ? (
                                <>
                                    <button onClick={() => { setIsEditing(false); setProfile(originalData); }} className="px-6 py-2.5 rounded-xl font-bold text-sm bg-slate-100 text-slate-500">Cancel</button>
                                    <button onClick={handleSave} disabled={saving || !dataChanged} className="px-6 py-2.5 rounded-xl font-black text-sm bg-blue-600 text-white flex items-center gap-2 disabled:opacity-50">
                                        {saving ? '...' : <Save size={16} />} Save Changes
                                    </button>
                                </>
                            ) : (
                                <button onClick={() => setIsEditing(true)} className="px-6 py-2.5 rounded-xl font-black text-sm bg-blue-600 text-white flex items-center gap-2 shadow-lg shadow-blue-100">
                                    <Camera size={16} /> Edit Public Profile
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* PROFILE DETAILS GRID */}
                <div className="grid md:grid-cols-12 gap-6 mt-6">
                    {/* LEFT PANEL: CONTACT INFO */}
                    <div className="md:col-span-4 space-y-4">
                        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Organization Info</h3>
                            <div className="flex items-center gap-3 text-slate-600 text-sm">
                                <Mail size={16} className="text-blue-500" /> {profile.sub_email}
                            </div>
                            {profile.contact_number && (
                                <div className="flex items-center gap-3 text-slate-600 text-sm">
                                    <Building2 size={16} className="text-green-500" /> {profile.contact_number}
                                </div>
                            )}
                            {profile.website && (
                                <a href={profile.website} target="_blank" className="flex items-center gap-3 text-blue-600 text-sm font-bold">
                                    <Globe size={16} /> {profile.website}
                                </a>
                            )}
                        </div>
                    </div>

                    {/* RIGHT PANEL: DETAILS */}
                    <div className="md:col-span-8 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Location Address</h3>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Region */}
        <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Region</label>
            {isEditing ? (
                <input type="text" className="w-full bg-slate-50 border-2 border-slate-50 rounded-xl p-3 focus:border-blue-500 outline-none text-sm" value={profile.region || ''} onChange={e => setProfile({...profile, region: e.target.value})} />
            ) : (
                <p className="text-slate-800 text-sm bg-slate-50 p-3 rounded-xl">{profile.region || "N/A"}</p>
            )}
        </div>

        {/* City */}
        <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">City</label>
            {isEditing ? (
                <input type="text" className="w-full bg-slate-50 border-2 border-slate-50 rounded-xl p-3 focus:border-blue-500 outline-none text-sm" value={profile.city || ''} onChange={e => setProfile({...profile, city: e.target.value})} />
            ) : (
                <p className="text-slate-800 text-sm bg-slate-50 p-3 rounded-xl">{profile.city || "N/A"}</p>
            )}
        </div>

        {/* Barangay */}
        <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Barangay</label>
            {isEditing ? (
                <input type="text" className="w-full bg-slate-50 border-2 border-slate-50 rounded-xl p-3 focus:border-blue-500 outline-none text-sm" value={profile.barangay || ''} onChange={e => setProfile({...profile, barangay: e.target.value})} />
            ) : (
                <p className="text-slate-800 text-sm bg-slate-50 p-3 rounded-xl">{profile.barangay || "N/A"}</p>
            )}
        </div>

        {/* Street Address */}
        <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Street Address</label>
            {isEditing ? (
                <input type="text" className="w-full bg-slate-50 border-2 border-slate-50 rounded-xl p-3 focus:border-blue-500 outline-none text-sm" value={profile.street_address || ''} onChange={e => setProfile({...profile, street_address: e.target.value})} />
            ) : (
                <p className="text-slate-800 text-sm bg-slate-50 p-3 rounded-xl">{profile.street_address || "N/A"}</p>
            )}
        </div>
    </div>
</div>
                </div>
            </div>
        </div>
    );
};

export default OrgProfile;