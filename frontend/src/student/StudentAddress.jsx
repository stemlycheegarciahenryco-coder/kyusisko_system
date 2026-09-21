import React, { useState, useEffect } from "react";

export default function StudentAddress({ regform, setRegForm, handleChange, isSubmitted = false }) {
    const [allBarangays, setAllBarangays] = useState([]); 
    const [filteredBarangays, setFilteredBarangays] = useState([]); 
    const QC_CITY_CODE = '137404000';

    const FieldStatus = Object.freeze({
        INCOMPLETE: 'Incomplete',
        INVALID: 'Invalid',
        VALID: 'Valid'
    });

    // Address Status States
    const [districtStatus, setDistrictStatus] = useState(FieldStatus.INCOMPLETE);
    const [barangayStatus, setBarangayStatus] = useState(FieldStatus.INCOMPLETE);
    const [streetStatus, setStreetStatus] = useState(FieldStatus.INCOMPLETE);
    const [postalCodeStatus, setPostalCodeStatus] = useState(FieldStatus.INCOMPLETE);

    // Track touched state to control border highlight triggers
    const [touched, setTouched] = useState({
        district: false,
        barangay: false,
        street: false,
        zipCode: false
    });

    const handleBlur = (e) => {
        const { name } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
    };

    // Helper to check if a value is selected and not a default placeholder
    const isInvalidDropdownValue = (val) => {
        return !val || val.trim() === "" || val === "Select District" || val === "Select Barangay";
    };

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

    // 2. Filter barangays & update District Status
    useEffect(() => {
        if (!isInvalidDropdownValue(regform.district)) {
            setFilteredBarangays(allBarangays);
            setDistrictStatus(FieldStatus.VALID);
        } else {
            setFilteredBarangays([]);
            setDistrictStatus(FieldStatus.INCOMPLETE);
        }
    }, [regform.district, allBarangays]);

    // 3. Dynamic Validation Effects for Barangay, Street, and Postal Code
    useEffect(() => {
        // Barangay Validation
        if (isInvalidDropdownValue(regform.barangay)) {
            setBarangayStatus(FieldStatus.INCOMPLETE);
        } else {
            setBarangayStatus(FieldStatus.VALID);
        }

        // Street Validation
        if (!regform.street || regform.street.trim() === "") {
            setStreetStatus(FieldStatus.INCOMPLETE);
        } else {
            setStreetStatus(FieldStatus.VALID);
        }

        // Postal Code Validation (Must be exactly 4 digits)
        if (!regform.zipCode || regform.zipCode.trim() === "") {
            setPostalCodeStatus(FieldStatus.INCOMPLETE);
        } else if (/^\d{4}$/.test(regform.zipCode)) {
            setPostalCodeStatus(FieldStatus.VALID);
        } else {
            setPostalCodeStatus(FieldStatus.INVALID);
        }
    }, [regform.barangay, regform.street, regform.zipCode]);

    // ALWAYS-VISIBLE STATUS BADGE LABEL
    const Label = ({ text, required, status, className = "" }) => {
        const getStatusBadge = () => {
            if (!status) return null;

            let colorClasses = "";
            if (status === FieldStatus.VALID) {
                colorClasses = "bg-emerald-100 text-emerald-700 border border-emerald-300";
            } else if (status === FieldStatus.INVALID) {
                colorClasses = "bg-red-100 text-[#FF1E1E] border border-red-200";
            } else {
                colorClasses = "bg-amber-100 text-amber-700 border border-amber-300";
            }

            return (
                <span className={`text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md ${colorClasses}`}>
                    {status}
                </span>
            );
        };

        return (
            <div className="flex items-center justify-between mb-2">
                <label className={`text-xs font-black uppercase tracking-wider ml-1 block ${className || "text-slate-800"}`}>
                    {text} {required && <span className="text-[#FF1E1E]">*</span>}
                </label>
                {getStatusBadge()}
            </div>
        );
    };

    // Dynamic Class Generator for Border Colors
    const getBorderClass = (fieldName, fieldStatus) => {
        const isFieldTouched = touched[fieldName] || isSubmitted;
        
        // Triggers RED if field is touched/submitted AND is either INCOMPLETE or INVALID
        const isError = isFieldTouched && (fieldStatus === FieldStatus.INCOMPLETE || fieldStatus === FieldStatus.INVALID);
        
        const borderStyle = isError 
            ? "border-[#FF1E1E] focus:border-[#FF1E1E] bg-red-50/20 text-[#FF1E1E]" 
            : "border-white/80 focus:border-[#093fb4]";

        return `w-full px-4 py-3.5 bg-white/60 border-2 ${borderStyle} rounded-2xl focus:bg-white outline-none transition-all placeholder:text-black/30 font-bold text-slate-900 text-base shadow-sm`;
    };

    const getLabelClass = (fieldName, fieldStatus) => {
        const isFieldTouched = touched[fieldName] || isSubmitted;
        const isError = isFieldTouched && (fieldStatus === FieldStatus.INCOMPLETE || fieldStatus === FieldStatus.INVALID);
        if (isError) {
            return "text-[#FF1E1E]";
        }
        return "text-slate-800";
    };

    return (
        <div className="pt-4 border-t border-slate-100">
            <p className="text-xs font-black text-[#093FB4] uppercase tracking-widest mb-5 border-b border-black/5 pb-2 mt-2">
                Permanent Address (Quezon City)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* DISTRICT FIELD */}
                <div>
                    <Label 
                        text="District" 
                        required 
                        status={districtStatus} 
                        className={getLabelClass("district", districtStatus)} 
                    />
                    <select 
                        name="district" 
                        value={regform.district || ""} 
                        onChange={(e) => {
                            handleChange(e);
                            setTouched(prev => ({ ...prev, district: true }));
                        }} 
                        onBlur={handleBlur}
                        required 
                        className={getBorderClass("district", districtStatus)}
                    >
                        <option value="" disabled>Select District</option>
                        {[1, 2, 3, 4, 5, 6].map(d => (
                            <option key={d} value={`District ${d}`}>District {d}</option>
                        ))}
                    </select>
                </div>

                {/* BARANGAY FIELD */}
                <div>
                    <Label 
                        text="Barangay" 
                        required 
                        status={barangayStatus} 
                        className={getLabelClass("barangay", barangayStatus)} 
                    />
                    <select 
                        name="barangay" 
                        value={regform.barangay || ""} 
                        onChange={(e) => {
                            handleChange(e);
                            setTouched(prev => ({ ...prev, barangay: true }));
                        }} 
                        onBlur={handleBlur}
                        required 
                        disabled={!regform.district || regform.district === "Select District"}
                        className={getBorderClass("barangay", barangayStatus)}
                    >
                        <option value="" disabled>Select Barangay</option>
                        {filteredBarangays.map(b => (
                            <option key={b.code} value={b.name}>{b.name}</option>
                        ))}
                    </select>
                </div>

                {/* STREET / BLK / LOT */}
                <div>
                    <Label 
                        text="Street / Blk / Lot" 
                        required 
                        status={streetStatus} 
                        className={getLabelClass("street", streetStatus)} 
                    />
                    <input 
                        type="text" 
                        name="street" 
                        value={regform.street || ""} 
                        onChange={(e) => {
                            handleChange(e);
                            setTouched(prev => ({ ...prev, street: true }));
                        }} 
                        onBlur={handleBlur}
                        placeholder="House No., Street name" 
                        required
                        className={getBorderClass("street", streetStatus)} 
                    />
                </div>

                {/* POSTAL CODE */}
                <div>
                    <Label 
                        text="Postal Code" 
                        required 
                        status={postalCodeStatus} 
                        className={getLabelClass("zipCode", postalCodeStatus)} 
                    />
                    <input 
                        type="text" 
                        name="zipCode" 
                        maxLength="4"
                        value={regform.zipCode || ""} 
                        onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, ""); // Strip non-digits
                            setRegForm(prev => ({ ...prev, zipCode: val }));
                            setTouched(prev => ({ ...prev, zipCode: true }));
                        }} 
                        onBlur={handleBlur}
                        placeholder="1100" 
                        required
                        className={getBorderClass("zipCode", postalCodeStatus)} 
                    />
                    {postalCodeStatus === FieldStatus.INVALID && (
                        <span className="text-[10px] font-black text-[#FF1E1E] uppercase tracking-wider ml-2 mt-2 block">
                            Postal code must be exactly 4 digits.
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
