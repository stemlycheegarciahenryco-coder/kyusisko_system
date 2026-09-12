import React, { useState, useEffect } from "react";

export default function StudentAddress({ regform, setRegForm, handleChange }) {
    const [allBarangays, setAllBarangays] = useState([]); 
    const [filteredBarangays, setFilteredBarangays] = useState([]); 
    const QC_CITY_CODE = '137404000';

    // 1. Fetch ALL QC Barangays once when component loads
    useEffect(() => {
        fetch(`https://psgc.gitlab.io/api/cities-municipalities/${QC_CITY_CODE}/barangays/`)
            .then(res => res.json())
            .then(data => {
                const sorted = data.sort((a, b) => a.name.localeCompare(b.name));
                setAllBarangays(sorted);
            })
            .catch(err => console.error("Error fetching barangays:", err));
    }, []);

    // 2. Filter barangays whenever the selected District changes
    useEffect(() => {
        if (regform.district) {
            setFilteredBarangays(allBarangays);
        } else {
            setFilteredBarangays([]);
        }
    }, [regform.district, allBarangays]);

    // UI HELPER - Aligned with StudentRegister.jsx and LogIn.jsx
    const Label = ({ text, required }) => (
        <label className="text-xs font-black text-slate-800 uppercase tracking-wider ml-1 block mb-2">
            {text} {required && <span className="text-[#FF1E1E]">*</span>}
        </label>
    );

    // INPUT CLASS - Glassmorphism aligned
    const inputClass = "w-full px-4 py-3.5 bg-white/60 border-2 border-white/80 rounded-2xl focus:bg-white focus:border-[#093fb4] outline-none transition-all placeholder:text-black/30 font-bold text-slate-900 text-base shadow-sm";

    return (
        <div className="pt-4 border-t border-slate-100">
            <p className="text-xs font-black text-[#093FB4] uppercase tracking-widest mb-5 border-b border-black/5 pb-2 mt-2">
                Permanent Address (Quezon City)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* DISTRICT FIELD */}
                <div>
                    <Label text="District" required />
                    <select 
                        name="district" 
                        value={regform.district} 
                        onChange={handleChange} 
                        required 
                        className={inputClass}
                    >
                        <option value="" disabled>Select District</option>
                        {[1, 2, 3, 4, 5, 6].map(d => (
                            <option key={d} value={`District ${d}`}>District {d}</option>
                        ))}
                    </select>
                </div>

                {/* BARANGAY FIELD */}
                <div>
                    <Label text="Barangay" required />
                    <select 
                        name="barangay" 
                        value={regform.barangay} 
                        onChange={handleChange} 
                        required 
                        disabled={!regform.district}
                        className={inputClass}
                    >
                        <option value="" disabled>Select Barangay</option>
                        {filteredBarangays.map(b => (
                            <option key={b.code} value={b.name}>{b.name}</option>
                        ))}
                    </select>
                </div>

                {/* STREET / BLK / LOT */}
                <div>
                    <Label text="Street / Blk / Lot" required />
                    <input 
                        type="text" 
                        name="street" 
                        value={regform.street} 
                        onChange={handleChange} 
                        placeholder="House No., Street name" 
                        required
                        className={inputClass} 
                    />
                </div>

                {/* ZIP CODE */}
                <div>
                    <Label text="Postal Code" required />
                    <input 
                        type="text" 
                        name="zipCode" 
                        maxLength="4"
                        value={regform.zipCode} 
                        onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            setRegForm(prev => ({ ...prev, zipCode: val }));
                        }} 
                        placeholder="1100" 
                        required
                        className={inputClass} 
                    />
                </div>
            </div>
        </div>
    );
}