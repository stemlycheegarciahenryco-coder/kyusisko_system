import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import api from '../api';

export default function OrgEditProfile({ isOpen, onClose, initialData, onSaveSuccess }) {
    const [editFormData, setEditFormData] = useState({});
    const [telNumbers, setTelNumbers] = useState(['']); // State for multiple telephone numbers
    const [websites, setWebsites] = useState(['']);     // State for multiple website/social links
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (initialData) {
            setEditFormData({ ...initialData });

            // Parse comma-separated telephone numbers if present
            if (initialData.tel_number) {
                const parsedTels = initialData.tel_number.split(',').map(n => n.trim()).filter(Boolean);
                setTelNumbers(parsedTels.length > 0 ? parsedTels : ['']);
            } else {
                setTelNumbers(['']);
            }

            // Parse comma-separated website/social URLs if present
            if (initialData.website) {
                const parsedWebsites = initialData.website.split(',').map(w => w.trim()).filter(Boolean);
                setWebsites(parsedWebsites.length > 0 ? parsedWebsites : ['']);
            } else {
                setWebsites(['']);
            }
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    // --- Dynamic Telephone Handlers ---
    const handleTelChange = (index, value) => {
        const newTels = [...telNumbers];
        newTels[index] = value;
        setTelNumbers(newTels);
    };

    const addTelField = () => setTelNumbers([...telNumbers, '']);

    const removeTelField = (index) => {
        const newTels = telNumbers.filter((_, i) => i !== index);
        setTelNumbers(newTels.length > 0 ? newTels : ['']);
    };

    // --- Dynamic Website / Social Handlers ---
    const handleWebsiteChange = (index, value) => {
        const newWebsites = [...websites];
        newWebsites[index] = value;
        setWebsites(newWebsites);
    };

    const addWebsiteField = () => setWebsites([...websites, '']);

    const removeWebsiteField = (index) => {
        const newWebsites = websites.filter((_, i) => i !== index);
        setWebsites(newWebsites.length > 0 ? newWebsites : ['']);
    };

    const handleSaveProfileModal = async (e) => {
        e.preventDefault();
        setSaving(true);
        const id = localStorage.getItem('orgId');

        try {
            if (id) {
                // Omit provider_type, org_pic, previewUrl, created_at, contact_number from payload
                const { org_pic, previewUrl, created_at, contact_number, provider_type, ...textData } = editFormData;
                
                // Join valid entries back into comma-separated strings for backend storage
                textData.tel_number = telNumbers.filter(n => n.trim() !== '').join(', ');
                textData.website = websites.filter(w => w.trim() !== '').join(', ');

                const response = await api.patch(`/organizations/profile/${id}`, textData);
                
                const updated = response.data?.data || textData;
                onSaveSuccess(updated);
            }
        } catch (err) {
            console.error("Save error:", err);
            alert('Update failed. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                    <div>
                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Edit Organization Profile</h2>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">Update contact info, address details, and organization overview.</p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="w-8 h-8 rounded-xl border border-slate-200 bg-white cursor-pointer flex items-center justify-center hover:bg-slate-100 transition-all"
                    >
                        <X size={14} className="text-slate-600" strokeWidth={2.5} />
                    </button>
                </div>

                <form onSubmit={handleSaveProfileModal} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto scrollbar-thin">
                    {/* Organization Name (Full Width) */}
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Organization Name</label>
                        <input 
                            type="text"
                            value={editFormData.org_name || ''} 
                            onChange={e => setEditFormData({ ...editFormData, org_name: e.target.value })} 
                            className="w-full text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 outline-none focus:bg-white focus:border-[#093fb4] transition-colors"
                        />
                    </div>

                    {/* Dynamic Contacts Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                        {/* Dynamic Telephone Fields */}
                        <div>
                            <label className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                <span>Telephone Number(s)</span>
                                <button 
                                    type="button" 
                                    onClick={addTelField}
                                    className="flex items-center gap-1 bg-blue-50 text-[#093fb4] hover:bg-blue-100 px-2 py-0.5 rounded-md transition-colors text-[10px] font-black"
                                >
                                    <Plus size={10} strokeWidth={3} /> ADD
                                </button>
                            </label>
                            <div className="space-y-2">
                                {telNumbers.map((tel, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <input 
                                            type="text"
                                            value={tel} 
                                            onChange={(e) => handleTelChange(index, e.target.value)} 
                                            placeholder="(02) 8123-4567"
                                            className="w-full text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:bg-white focus:border-[#093fb4] transition-colors"
                                        />
                                        {telNumbers.length > 1 && (
                                            <button 
                                                type="button" 
                                                onClick={() => removeTelField(index)}
                                                className="shrink-0 w-9 h-9 rounded-xl border border-red-200 bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Dynamic Website / Social Links Fields */}
                        <div>
                            <label className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                <span>Website / Social Link(s)</span>
                                <button 
                                    type="button" 
                                    onClick={addWebsiteField}
                                    className="flex items-center gap-1 bg-blue-50 text-[#093fb4] hover:bg-blue-100 px-2 py-0.5 rounded-md transition-colors text-[10px] font-black"
                                >
                                    <Plus size={10} strokeWidth={3} /> ADD
                                </button>
                            </label>
                            <div className="space-y-2">
                                {websites.map((web, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <input 
                                            type="text"
                                            value={web} 
                                            onChange={(e) => handleWebsiteChange(index, e.target.value)} 
                                            placeholder="https://..."
                                            className="w-full text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:bg-white focus:border-[#093fb4] transition-colors"
                                        />
                                        {websites.length > 1 && (
                                            <button 
                                                type="button" 
                                                onClick={() => removeWebsiteField(index)}
                                                className="shrink-0 w-9 h-9 rounded-xl border border-red-200 bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Address Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Region</label>
                            <input 
                                type="text"
                                value={editFormData.region || ''} 
                                onChange={e => setEditFormData({ ...editFormData, region: e.target.value })} 
                                placeholder="e.g. NCR"
                                className="w-full text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 outline-none focus:bg-white focus:border-[#093fb4] transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">City / Municipality</label>
                            <input 
                                type="text"
                                value={editFormData.city || ''} 
                                onChange={e => setEditFormData({ ...editFormData, city: e.target.value })} 
                                placeholder="e.g. Quezon City"
                                className="w-full text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 outline-none focus:bg-white focus:border-[#093fb4] transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Barangay</label>
                            <input 
                                type="text"
                                value={editFormData.barangay || ''} 
                                onChange={e => setEditFormData({ ...editFormData, barangay: e.target.value })} 
                                placeholder="e.g. Central"
                                className="w-full text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 outline-none focus:bg-white focus:border-[#093fb4] transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Street Address</label>
                            <input 
                                type="text"
                                value={editFormData.street_address || ''} 
                                onChange={e => setEditFormData({ ...editFormData, street_address: e.target.value })} 
                                placeholder="e.g. 123 Main Street"
                                className="w-full text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 outline-none focus:bg-white focus:border-[#093fb4] transition-colors"
                            />
                        </div>
                    </div>

                    {/* About Us Field */}
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">About Us Description</label>
                        <textarea 
                            value={editFormData.about_us || ''} 
                            onChange={e => setEditFormData({ ...editFormData, about_us: e.target.value })} 
                            rows={4} 
                            className="w-full text-sm font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-3.5 outline-none resize-none focus:bg-white focus:border-[#093fb4] transition-colors"
                        />
                    </div>

                    {/* Form Controls */}
                    <div className="pt-4 mt-2 border-t border-slate-100 flex justify-end gap-3">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs cursor-pointer hover:bg-slate-50 transition-all uppercase tracking-wider"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={saving}
                            className="px-6 py-2.5 rounded-xl bg-[#093fb4] hover:bg-blue-800 text-white font-bold text-xs cursor-pointer transition-all flex items-center gap-2 uppercase tracking-wider shadow-lg shadow-blue-900/20"
                        >
                            <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}