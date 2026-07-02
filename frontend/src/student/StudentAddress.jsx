import React, { useState, useEffect } from "react";

export default function StudentAddress({ regform, setRegForm, handleChange }) {
    const [allBarangays, setAllBarangays] = useState([]); // Store everything
    const [filteredBarangays, setFilteredBarangays] = useState([]); // Store filtered list
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
            // Note: PSGC API doesn't provide a 'district number' field directly in the barangay object.
            // If your backend needs specific mapping, you'd filter by 'districtCode' here.
            // For now, we show all QC barangays, but you can add custom filtering logic here.
            setFilteredBarangays(allBarangays);
        } else {
            setFilteredBarangays([]);
        }
    }, [regform.district, allBarangays]);

    const Label = ({ text, required }) => (
        <label className="text-[12px] font-bold text-black uppercase tracking-widest ml-1">
            {text} {required && <span className="text-[#FF1E1E]">*</span>}
        </label>
    );

    const inputClass = "w-full p-4 bg-white border border-slate-200 rounded-2xl text-black outline-none focus:border-[#093FB4] transition-all";

    return (
        <div className="pt-4 border-t border-slate-100">
            <p className="text-[14px] font-bold text-blue-900 uppercase tracking-widest mb-4">
                Permanent Address (Quezon City)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">


                {/* DISTRICT FIELD */}
                <div className="space-y-1">
                    <Label text="District" required />
                    <select 
                        name="district" 
                        value={regform.district} 
                        onChange={handleChange} 
                        required 
                        className={inputClass}
                    >
                        <option value="">Select District</option>
                        {[1, 2, 3, 4, 5, 6].map(d => (
                            <option key={d} value={d}>District {d}</option>
                        ))}
                    </select>
                </div>

                
                
                

                {/* BARANGAY FIELD */}
                <div className="space-y-1">
                    <Label text="Barangay" required />
                    <select 
                        name="barangay" 
                        value={regform.barangay} 
                        onChange={handleChange} 
                        required 
                        disabled={!regform.district}
                        className={inputClass}
                    >
                        <option value="">Select Barangay</option>
                        {filteredBarangays.map(b => (
                            <option key={b.code} value={b.name}>{b.name}</option>
                        ))}
                    </select>
                </div>


                                 {/* STREET / BLK / LOT */}
                <div className="space-y-1">
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
                <div className="space-y-1">
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