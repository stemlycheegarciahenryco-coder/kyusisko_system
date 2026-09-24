import React, { useState, useEffect } from 'react';
import {
    IconBuildingCommunity, IconMail, IconArrowLeft, IconWorld, IconMapPin, IconFileText, IconPhone, IconX
} from '@tabler/icons-react';
import { useOrganization } from './useOrganization';
import { OrgSuccessModal, OtpModal, ErrorModal } from './component/RegisterModals';
import { useNavigate } from 'react-router-dom';
import LoadingScreen from './component/LoadingScreen';
import { ProviderGuidelinesMain } from './ProviderGuidelines';

const FieldStatus = Object.freeze({
    INCOMPLETE: 'Incomplete',
    INVALID: 'Invalid',
    VALID: 'Valid'
});

const OrganizationRegisterPage = () => {
    const navigate = useNavigate();
    const {
        formData, setFormData, handleOnboard,
        handleRequestOtp, handleVerifyOtp,
        loading, verifying
    } = useOrganization();

    const [regions, setRegions] = useState([]);
    const [cities, setCities] = useState([]);
    const [barangays, setBarangays] = useState([]);
    const [activeRegionCode, setActiveRegionCode] = useState('');
    const [activeCityCode, setActiveCityCode] = useState('');
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [showError, setShowError] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showGuidelinesModal, setShowGuidelinesModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [guidelinesReadComplete, setGuidelinesReadComplete] = useState(false);

    // Track touched fields
    const [touched, setTouched] = useState({});

    // Field Status States (password status fields removed)
    const [status, setStatus] = useState({
        org_name: FieldStatus.INCOMPLETE,
        provider_type: FieldStatus.INCOMPLETE,
        sub_email: FieldStatus.INCOMPLETE,
        contact_number: FieldStatus.INCOMPLETE,
        tel_number: null,
        website: null,
        region: FieldStatus.INCOMPLETE,
        city: FieldStatus.INCOMPLETE,
        barangay: FieldStatus.INCOMPLETE,
        street_address: FieldStatus.INCOMPLETE,
    });

    const handleBlur = (e) => {
        const { name } = e.target;
        if (name) setTouched(prev => ({ ...prev, [name]: true }));
    };

    const handleFinishedReadingGuidelines = () => {
        setGuidelinesReadComplete(true);
        setShowGuidelinesModal(false);
    };

    // Fetch PSGC Regions
    useEffect(() => {
        fetch('https://psgc.gitlab.io/api/regions/')
            .then(res => res.json())
            .then(data => setRegions(data.sort((a, b) => a.name.localeCompare(b.name))))
            .catch(err => console.error("Error fetching regions:", err));
    }, []);

    // Fetch Cities based on Region
    useEffect(() => {
        if (activeRegionCode) {
            fetch(`https://psgc.gitlab.io/api/regions/${activeRegionCode}/cities-municipalities/`)
                .then(res => res.json())
                .then(data => setCities(data.sort((a, b) => a.name.localeCompare(b.name))))
                .catch(err => console.error("Error fetching cities:", err));
        } else {
            setCities([]);
        }
    }, [activeRegionCode]);

    // Fetch Barangays based on City
    useEffect(() => {
        if (activeCityCode) {
            fetch(`https://psgc.gitlab.io/api/cities-municipalities/${activeCityCode}/barangays/`)
                .then(res => res.json())
                .then(data => setBarangays(data.sort((a, b) => a.name.localeCompare(b.name))))
                .catch(err => console.error("Error fetching barangays:", err));
        } else {
            setBarangays([]);
        }
    }, [activeCityCode]);

    // Live Field Validation Effect
    useEffect(() => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const telephoneRegex = /^(?:\+?63|0)?(?:\d{2,3})?\d{7,8}$/;
        const websiteRegex = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
        
        const telVal = formData.tel_number || '';
        const cleanTel = telVal.replace(/[\s\-\(\)]/g, '');
        const trimmedWebsite = formData.website?.trim() || '';

        // Optional Fields logic
        let telStatus = null;
        if (cleanTel.length > 0) {
            telStatus = telephoneRegex.test(cleanTel) ? FieldStatus.VALID : FieldStatus.INVALID;
        }

        let websiteStatus = null;
        if (trimmedWebsite.length > 0) {
            websiteStatus = websiteRegex.test(trimmedWebsite) ? FieldStatus.VALID : FieldStatus.INVALID;
        }

        setStatus({
            org_name: formData.org_name?.trim() ? FieldStatus.VALID : FieldStatus.INCOMPLETE,
            provider_type: formData.provider_type ? FieldStatus.VALID : FieldStatus.INCOMPLETE,

            sub_email: !formData.sub_email?.trim()
                ? FieldStatus.INCOMPLETE
                : emailRegex.test(formData.sub_email.trim()) ? FieldStatus.VALID : FieldStatus.INVALID,

            contact_number: !formData.contact_number
                ? FieldStatus.INCOMPLETE
                : formData.contact_number.length === 10 ? FieldStatus.VALID : FieldStatus.INVALID,

            tel_number: telStatus,
            website: websiteStatus,

            region: formData.region ? FieldStatus.VALID : FieldStatus.INCOMPLETE,
            city: formData.city ? FieldStatus.VALID : FieldStatus.INCOMPLETE,
            barangay: formData.barangay ? FieldStatus.VALID : FieldStatus.INCOMPLETE,
            street_address: formData.street_address?.trim() ? FieldStatus.VALID : FieldStatus.INCOMPLETE,
        });
    }, [formData]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "contact_number") {
            const numbersOnly = value.replace(/[^0-9]/g, "");
            if (numbersOnly.length > 0 && numbersOnly[0] !== '9') return;
            if (numbersOnly.length > 10) return;
            setFormData(prev => ({ ...prev, [name]: numbersOnly }));
            return;
        }

        if (name === "tel_number") {
            const numbersOnly = value.replace(/[^0-9]/g, "");
            if (numbersOnly.length > 10) return;
            setFormData(prev => ({ ...prev, [name]: numbersOnly }));
            return;
        }

        if (name === "region") {
            const selected = regions.find(r => r.code === value);
            setActiveRegionCode(value);
            setFormData(prev => ({ ...prev, region: selected?.name || '', city: '', barangay: '' }));
            setCities([]);
            setBarangays([]);
            setActiveCityCode('');
            return;
        }

        if (name === "city") {
            const selected = cities.find(c => c.code === value);
            setActiveCityCode(value);
            setFormData(prev => ({ ...prev, city: selected?.name || '', barangay: '' }));
            setBarangays([]);
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleInitialSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitted(true);

        const res = await handleRequestOtp();
        if (res.success) setShowOtpModal(true);
        else { setErrorMessage(res.error); setShowError(true); }
    };

    const handleOtpVerified = async (otp) => {
        const res = await handleVerifyOtp(otp);
        if (res.success) {
            setShowOtpModal(false);
            const onboardRes = await handleOnboard();
            if (onboardRes.success) setShowSuccess(true);
            else { setErrorMessage(onboardRes.error); setShowError(true); }
        } else {
            setErrorMessage("Invalid OTP Code");
            setShowError(true);
        }
    };

    // Required fields check without password and confirm_password
    const requiredFields = [
        'org_name', 'provider_type', 'sub_email', 'contact_number',
        'region', 'city', 'barangay', 'street_address'
    ];

    const hasInvalidRequiredFields = requiredFields.some(key => status[key] !== FieldStatus.VALID);
    const hasInvalidOptionalFields = (status.tel_number === FieldStatus.INVALID) || (status.website === FieldStatus.INVALID);
    
    const isFormDisabled = hasInvalidRequiredFields || hasInvalidOptionalFields || !guidelinesReadComplete;

    const getBorderClass = (fieldName) => {
        const fieldStatus = status[fieldName];
        const isFieldTouched = touched[fieldName] || isSubmitted;
        const isError = isFieldTouched && (fieldStatus === FieldStatus.INCOMPLETE || fieldStatus === FieldStatus.INVALID);

        const borderStyle = isError
            ? "border-[#FF1E1E] focus:border-[#FF1E1E] bg-red-50/20 text-[#FF1E1E]"
            : "border-white/80 focus:border-[#093fb4]";

        return `w-full pr-4 py-3.5 bg-white/60 border-2 ${borderStyle} rounded-2xl focus:bg-white outline-none transition-all placeholder:text-black/30 font-bold text-slate-900 text-sm shadow-sm`;
    };

    const getLabelClass = (fieldName) => {
        const fieldStatus = status[fieldName];
        const isFieldTouched = touched[fieldName] || isSubmitted;
        const isError = isFieldTouched && (fieldStatus === FieldStatus.INCOMPLETE || fieldStatus === FieldStatus.INVALID);
        return isError ? "text-[#FF1E1E]" : "text-slate-800";
    };

    return (
        <div
            className="min-h-screen w-full flex items-start justify-center py-10 px-4 relative font-['Inter']"
            style={{
                backgroundImage: "url('/memorial.jpg')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
            }}
        >
            <div className="absolute inset-0 bg-black/15 pointer-events-none" />

            <LoadingScreen isLoading={loading || verifying} />

            <button
                onClick={() => navigate('/')}
                className="fixed top-6 left-6 z-50 flex items-center gap-2 text-xs font-black text-white uppercase tracking-widest bg-white/10 backdrop-blur-md hover:bg-white/20 px-5 py-3 rounded-2xl border border-white/20 transition-all shadow-lg active:scale-95"
            >
                <IconArrowLeft size={18} stroke={2.5} /> Back
            </button>

            <div className="relative z-10 w-full max-w-3xl bg-white/70 backdrop-blur-xl border border-white/40 rounded-[2.5rem] shadow-2xl px-8 py-10 md:px-12 md:py-12 mt-4">

                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center mb-4">
                        <img src="/logo.png" alt="Logo" className="h-20 w-auto object-contain drop-shadow-lg" />
                    </div>
                    <p className="mt-2 text-sm font-black text-slate-700 uppercase tracking-[0.3em]">
                        Provider Registration
                    </p>
                </div>

                <form onSubmit={handleInitialSubmit} className="space-y-6">

                    <SectionLabel label="Account Identity" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Field label="Organization / Institution Name" required status={status.org_name} labelClass={getLabelClass("org_name")}>
                            <div className="relative group">
                                <IconBuildingCommunity className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 group-focus-within:text-[#093fb4] transition-colors" size={20} />
                                <input
                                    required
                                    name="org_name"
                                    value={formData.org_name || ""}
                                    onChange={(e) => { handleChange(e); setTouched(prev => ({ ...prev, org_name: true })); }}
                                    onBlur={handleBlur}
                                    className={`${getBorderClass("org_name")} pl-12`}
                                    placeholder="e.g. KyusIsko Foundation"
                                />
                            </div>
                        </Field>

                        <Field label="Provider Type" required status={status.provider_type} labelClass={getLabelClass("provider_type")}>
                            <select
                                required
                                name="provider_type"
                                value={formData.provider_type || ""}
                                onChange={(e) => { handleChange(e); setTouched(prev => ({ ...prev, provider_type: true })); }}
                                onBlur={handleBlur}
                                className={`${getBorderClass("provider_type")} px-4`}
                            >
                                <option value="">Select Type</option>
                                <option value="Government">Government</option>
                                <option value="Private">Private</option>
                                <option value="Corporate">Corporate</option>
                                <option value="NGO">Non Government Organization</option>
                                <option value="Individual Provider">Individual Provider</option>
                                <option value="Institution">Institution</option>
                            </select>
                        </Field>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Field label="Organization / Coordinator Email" required status={status.sub_email} labelClass={getLabelClass("sub_email")}>
                            <div className="relative group">
                                <IconMail className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 group-focus-within:text-[#093fb4] transition-colors" size={20} />
                                <input
                                    required
                                    name="sub_email"
                                    type="email"
                                    value={formData.sub_email || ""}
                                    onChange={(e) => { handleChange(e); setTouched(prev => ({ ...prev, sub_email: true })); }}
                                    onBlur={handleBlur}
                                    className={`${getBorderClass("sub_email")} pl-12`}
                                    placeholder="org@domain.com"
                                />
                            </div>
                        </Field>

                        <Field label="Mobile Number" required status={status.contact_number} labelClass={getLabelClass("contact_number")}>
                            <div className="relative group flex items-center">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none border-r border-black/15 pr-3 h-6 z-10">
                                    <img src="/ph.svg" alt="PH" className="w-5 h-3 object-contain" />
                                    <span className="text-xs font-bold text-black/60 group-focus-within:text-[#093fb4] transition-colors">+63</span>
                                </div>
                                <input
                                    type="text"
                                    required
                                    name="contact_number"
                                    placeholder="9XXXXXXXXX"
                                    value={formData.contact_number || ""}
                                    onChange={(e) => { handleChange(e); setTouched(prev => ({ ...prev, contact_number: true })); }}
                                    onBlur={handleBlur}
                                    className={`${getBorderClass("contact_number")} pl-[6.5rem]`}
                                />
                            </div>
                            {touched.contact_number && status.contact_number === FieldStatus.INVALID && (
                                <span className="text-[10px] font-black text-[#FF1E1E] uppercase tracking-wider ml-1 mt-1 block">
                                    Mobile number must be 10 digits starting with 9.
                                </span>
                            )}
                        </Field>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Field label="Telephone Number (Landline)" status={status.tel_number} labelClass={getLabelClass("tel_number")}>
                            <div className="relative group">
                                <IconPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 group-focus-within:text-[#093fb4] transition-colors" size={20} />
                                <input
                                    type="text"
                                    name="tel_number"
                                    placeholder="e.g. 0281234567"
                                    value={formData.tel_number || ""}
                                    onChange={(e) => { handleChange(e); setTouched(prev => ({ ...prev, tel_number: true })); }}
                                    onBlur={handleBlur}
                                    className={`${getBorderClass("tel_number")} pl-12`}
                                />
                            </div>
                        </Field>

                        <Field label="Website / Social Media Page" status={status.website} labelClass={getLabelClass("website")}>
                            <div className="relative group">
                                <IconWorld className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 group-focus-within:text-[#093fb4] transition-colors" size={20} />
                                <input
                                    name="website"
                                    value={formData.website || ""}
                                    onChange={(e) => { handleChange(e); setTouched(prev => ({ ...prev, website: true })); }}
                                    onBlur={handleBlur}
                                    className={`${getBorderClass("website")} pl-12`}
                                    placeholder="https://your-institution.org or Facebook"
                                />
                            </div>
                        </Field>
                    </div>

                    <SectionLabel label="Provider Address" />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <Field label="Region" required status={status.region} labelClass={getLabelClass("region")}>
                            <select
                                required
                                name="region"
                                value={activeRegionCode}
                                onChange={(e) => { handleChange(e); setTouched(prev => ({ ...prev, region: true })); }}
                                onBlur={handleBlur}
                                className={`${getBorderClass("region")} px-4`}
                            >
                                <option value="">Select Region</option>
                                {regions.map(r => <option key={r.code} value={r.code}>{r.name}</option>)}
                            </select>
                        </Field>

                        <Field label="City / Municipality" required status={status.city} labelClass={getLabelClass("city")}>
                            <select
                                required
                                name="city"
                                value={activeCityCode}
                                onChange={(e) => { handleChange(e); setTouched(prev => ({ ...prev, city: true })); }}
                                onBlur={handleBlur}
                                disabled={!activeRegionCode}
                                className={`${getBorderClass("city")} px-4`}
                            >
                                <option value="">Select City</option>
                                {cities.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                            </select>
                        </Field>

                        <Field label="Barangay" required status={status.barangay} labelClass={getLabelClass("barangay")}>
                            <select
                                required
                                name="barangay"
                                value={formData.barangay || ""}
                                onChange={(e) => { handleChange(e); setTouched(prev => ({ ...prev, barangay: true })); }}
                                onBlur={handleBlur}
                                disabled={!activeCityCode}
                                className={`${getBorderClass("barangay")} px-4`}
                            >
                                <option value="">Select Barangay</option>
                                {barangays.map(b => <option key={b.code} value={b.name}>{b.name}</option>)}
                            </select>
                        </Field>
                    </div>

                    <Field label="Street Address / Building / Office No." required status={status.street_address} labelClass={getLabelClass("street_address")}>
                        <div className="relative group">
                            <IconMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 group-focus-within:text-[#093fb4] transition-colors" size={20} />
                            <input
                                required
                                name="street_address"
                                value={formData.street_address || ""}
                                onChange={(e) => { handleChange(e); setTouched(prev => ({ ...prev, street_address: true })); }}
                                onBlur={handleBlur}
                                className={`${getBorderClass("street_address")} pl-12`}
                                placeholder="Unit No., Street name, Building location"
                            />
                        </div>
                    </Field>

                    <div className="pt-4 flex flex-col items-center justify-center gap-1.5 bg-white/40 border-2 border-white/60 backdrop-blur-sm rounded-2xl p-5 text-center shadow-sm">
                        <div className="flex items-center gap-2 text-slate-800 font-black text-xs uppercase tracking-[0.2em]">
                            <IconFileText size={18} className="text-[#093fb4]" />
                            Registration Terms
                        </div>
                        <p className="text-xs font-bold text-slate-600 max-w-md my-1 leading-relaxed">
                            By submitting this application, you agree to comply with our platform policies.
                        </p>
                        <button
                            type="button"
                            onClick={() => setShowGuidelinesModal(true)}
                            className="text-xs font-black text-[#093fb4] hover:text-[#FF1E1E] transition-colors uppercase tracking-[0.1em] mt-1"
                        >
                            {guidelinesReadComplete ? "✓ Guidelines Read (Click to re-read)" : "Read Scholarship Provider Guidelines"}
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={isFormDisabled || loading || verifying}
                        className="w-full bg-[#093fb4] hover:bg-[#073496] disabled:bg-[#093fb4]/50 disabled:cursor-not-allowed text-[#ffffff] font-black py-4 rounded-2xl transition-all shadow-xl shadow-[#093fb4]/25 active:scale-[0.98] uppercase text-sm tracking-[0.2em] mt-8"
                    >
                        {loading || verifying ? "Processing Onboarding..." : "Submit Registration"}
                    </button>
                </form>
            </div>

            {/* Provider Guidelines Modal */}
            {showGuidelinesModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
                    <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col relative border border-white/20">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 backdrop-blur-sm sticky top-0 z-10">
                            <div className="flex items-center gap-2">
                                <IconFileText className="text-[#093fb4]" size={20} />
                                <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
                                    Scholarship Provider Guidelines
                                </h2>
                            </div>
                            <button
                                onClick={() => setShowGuidelinesModal(false)}
                                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-all active:scale-95"
                            >
                                <IconX size={20} />
                            </button>
                        </div>

                        <div className="p-6 md:p-8 overflow-y-auto flex-1">
                            <ProviderGuidelinesMain onClose={() => setShowGuidelinesModal(false)} handleFinishedReadingGuidelines={handleFinishedReadingGuidelines} />
                        </div>
                    </div>
                </div>
            )}

            <OtpModal isOpen={showOtpModal} email={formData.sub_email} onVerify={handleOtpVerified} onClose={() => setShowOtpModal(false)} />
            <ErrorModal isOpen={showError} onClose={() => setShowError(false)} message={errorMessage} />
            <OrgSuccessModal isOpen={showSuccess} message="Registration Submitted! Awaiting Admin verification." onConfirm={() => navigate('/')} />
        </div>
    );
};

function Field({ label, required, status, labelClass, children }) {
    const getBadge = () => {
        if (!status) return null;
        let style = "bg-amber-100 text-amber-700 border-amber-300";
        if (status === FieldStatus.VALID) style = "bg-emerald-100 text-emerald-700 border-emerald-300";
        if (status === FieldStatus.INVALID) style = "bg-red-100 text-[#FF1E1E] border-red-200";

        return (
            <span className={`text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md border ${style}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between mb-1">
                <label className={`text-xs font-black uppercase tracking-wider block ${labelClass || "text-slate-800"}`}>
                    {label}{required && <span className="text-[#FF1E1E] ml-0.5">*</span>}
                </label>
                {getBadge()}
            </div>
            {children}
        </div>
    );
}

function SectionLabel({ label }) {
    return (
        <div className="flex items-center gap-4 pt-6 pb-2">
            <div className="h-[2px] flex-1 bg-black/5 rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{label}</span>
            <div className="h-[2px] flex-1 bg-black/5 rounded-full" />
        </div>
    );
}

export default OrganizationRegisterPage;
