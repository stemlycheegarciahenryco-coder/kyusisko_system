import React, { useState, useEffect, useRef } from 'react';
import {
    IconBuildingCommunity, IconMail, IconArrowLeft, IconWorld, IconMapPin, IconFileText, IconPhone, IconX, IconShieldCheck, IconUserCheck, IconLoader2
} from '@tabler/icons-react';
import { useOrganization } from './useOrganization';
import { OrgSuccessModal, ErrorModal } from './component/RegisterModals';
import { useNavigate } from 'react-router-dom';
import LoadingScreen from './component/LoadingScreen';
import { ProviderGuidelinesMain } from './ProviderGuidelines';
import api from "./api"

const FieldStatus = Object.freeze({
    INCOMPLETE: 'Incomplete',
    INVALID: 'Invalid',
    VALID: 'Valid'
});

const OrganizationRegisterPage = () => {
    const navigate = useNavigate();
    const {
        formData, setFormData, handleOnboard,
        handleRequestOtp, handleVerifyOtp: verifyOtp,
        loading, verifying
    } = useOrganization();

    const [first_mount, setFirstMount] = useState(true);
    const smoothScrollToTop = (duration = 800) => {
        const startPosition = window.pageYOffset;
        const startTime = performance.now();
        const easeInOutCubic = (t) => {
            return t < 0.5
                ? 4 * t * t * t
                : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
        };
        const animation = (currentTime) => {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            const ease = easeInOutCubic(progress);
            window.scrollTo(0, startPosition * (1 - ease));
            if (progress < 1) {
                requestAnimationFrame(animation);
            }
        };
        requestAnimationFrame(animation);
    };

    useEffect(() => {
        if (first_mount === true && window.pageYOffset != 0) {
            smoothScrollToTop();
        }
        setFirstMount(false);
    }, [first_mount]);

    const [regions, setRegions] = useState([]);
    const [cities, setCities] = useState([]);
    const [barangays, setBarangays] = useState([]);
    const [activeRegionCode, setActiveRegionCode] = useState('');
    const [activeCityCode, setActiveCityCode] = useState('');

    // Phase Management: 1 = Fields, 2 = Terms & Guidelines, 3 = OTP Verification
    const [currentPhase, setCurrentPhase] = useState(1);

    // Terms & Guidelines Scroll States
    const termsScrollRef = useRef(null);
    const [hasReadToBottom, setHasReadToBottom] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    const handleTermsScroll = () => {
        if (termsScrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = termsScrollRef.current;
            if (scrollTop + clientHeight >= scrollHeight - 10) {
                setHasReadToBottom(true);
            }
        }
    };

    // OTP Flow States
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const otpInputRefs = useRef([]);

    const [showError, setShowError] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Track touched fields
    const [touched, setTouched] = useState({});

    // Field Status States
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
        const mobileRegex = /^09\d{9}$/;
        const telephoneRegex = /^(?:\+?63|0)?(?:\d{2,3})?\d{7,8}$/;
        const websiteRegex = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

        const telVal = formData.tel_number || '';
        const cleanTel = telVal.replace(/[\s\-\(\)]/g, '');
        const trimmedWebsite = formData.website?.trim() || '';

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
                : mobileRegex.test(formData.contact_number) ? FieldStatus.VALID : FieldStatus.INVALID,
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
            let numbersOnly = value.replace(/[^0-9]/g, "");
            if (numbersOnly.length === 10 && numbersOnly.startsWith('9')) {
                numbersOnly = '0' + numbersOnly;
            }
            numbersOnly = numbersOnly.slice(0, 11);
            setFormData(prev => ({ ...prev, [name]: numbersOnly }));
            return;
        }

        if (name === "tel_number") {
            const numbersOnly = value.replace(/[^0-9]/g, "").slice(0, 10);
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

    // Required fields list
    const requiredFields = [
        'org_name', 'provider_type', 'sub_email', 'contact_number',
        'region', 'city', 'barangay', 'street_address'
    ];

    const hasInvalidRequiredFields = requiredFields.some(key => status[key] !== FieldStatus.VALID);
    const hasInvalidOptionalFields = (status.tel_number === FieldStatus.INVALID) || (status.website === FieldStatus.INVALID);
    const isPhase1Invalid = hasInvalidRequiredFields || hasInvalidOptionalFields;

    // Transition from Phase 1 -> Phase 2 (Terms & Guidelines)
    const handleProceedToTerms = async (e) => {
        e.preventDefault();
        setIsSubmitted(true);

        const allFields = [
            'org_name', 'provider_type', 'sub_email', 'contact_number',
            'tel_number', 'website', 'region', 'city', 'barangay', 'street_address'
        ];
        const touchedAll = allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {});
        setTouched(touchedAll);

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const mobileRegex = /^09\d{9}$/;

        const isEmailInvalid = !formData.sub_email?.trim() || !emailRegex.test(formData.sub_email.trim());
        const isContactInvalid = !formData.contact_number || !mobileRegex.test(formData.contact_number);

        if (isEmailInvalid || isContactInvalid || hasInvalidRequiredFields || hasInvalidOptionalFields) {
            setErrorMessage("Please ensure all required fields are filled out correctly and formats are valid.");
            setShowError(true);
            return;
        }

        try {
            await api.post(`/post/check/email`, { email: formData.sub_email.trim() });
            setCurrentPhase(2);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        catch (error) {
            const message = error.response?.data?.message || error.response?.data?.error || "Server Error. Please try again later.";
            setErrorMessage(message); // <-- This updates the modal's text state
            setShowError(true);      // <-- This opens the modal
        }
    };

    // Transition from Phase 2 -> Phase 3 (Trigger OTP Request)
    const handleAcceptTermsAndSendOtp = async () => {
        if (!acceptedTerms) {
            setErrorMessage("You must accept the provider guidelines and terms.");
            setShowError(true);
            return;
        }

        const res = await handleRequestOtp();
        if (res.success) {
            setCurrentPhase(3);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            setErrorMessage(res.error);
            setShowError(true);
        }
    };

    // OTP Handlers with Copy-Paste Support
    const handleOtpChange = (value, index) => {
        const digit = value.replace(/\D/g, "").slice(-1);
        const newOtp = [...otp];
        newOtp[index] = digit;
        setOtp(newOtp);

        if (digit && index < 5) {
            otpInputRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (e, index) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            otpInputRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").trim();

        if (/^\d{1,6}$/.test(pastedData)) {
            const digits = pastedData.split("");
            const newOtp = [...otp];

            digits.forEach((digit, idx) => {
                if (idx < 6) {
                    newOtp[idx] = digit;
                }
            });

            setOtp(newOtp);
            const nextIndex = Math.min(digits.length, 5);
            otpInputRefs.current[nextIndex]?.focus();
        }
    };

    const handleVerifyOtpSubmit = async () => {
        const fullOtp = otp.join("");
        if (fullOtp.length < 6) {
            setErrorMessage("Please enter the complete 6-digit OTP code.");
            setShowError(true);
            return;
        }

        const res = await verifyOtp(fullOtp);
        if (res.success) {
            const onboardRes = await handleOnboard();
            if (onboardRes.success) setShowSuccess(true);
            else { setErrorMessage(onboardRes.error); setShowError(true); }
        } else {
            setErrorMessage("Invalid OTP Code");
            setShowError(true);
        }
    };

    const getBorderClass = (fieldName) => {
        const fieldStatus = status[fieldName];
        const isFieldTouched = touched[fieldName] || isSubmitted;
        const isError = isFieldTouched && (fieldStatus === FieldStatus.INCOMPLETE || fieldStatus === FieldStatus.INVALID);

        const borderStyle = isError
            ? "border-[#FF1E1E] focus:border-[#FF1E1E] bg-red-50/20 text-[#FF1E1E]"
            : "border-white/80 focus:border-[#093fb4]";

        return `w-full pr-4 py-3.5 bg-white/60 border-2 ${borderStyle} rounded-2xl focus:bg-white outline-none transition-all placeholder:text-black/30 font-bold text-slate-900 text-sm shadow-sm`;
    };

    const getLabelClass = () => "text-slate-800";

    return (
        <div
            className="min-h-screen w-full flex items-center justify-center py-10 px-4 relative font-sans"
            style={{
                backgroundImage: "url('/memorial.jpg')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
            }}
        >
            <style>
                {`
                .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; border: 2px solid #f1f5f9; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                `}
            </style>

            <div className="absolute inset-0 bg-black/15 pointer-events-none" />

            <LoadingScreen isLoading={loading || verifying} />

            <button
                onClick={() => {
                    if (currentPhase > 1) {
                        setCurrentPhase(currentPhase - 1);
                    } else {
                        navigate('/');
                    }
                }}
                className="fixed top-6 left-6 z-50 flex items-center gap-2 text-xs font-black text-white uppercase tracking-widest bg-white/10 backdrop-blur-md hover:bg-white/20 px-5 py-3 rounded-2xl border border-white/20 transition-all shadow-lg active:scale-95 cursor-pointer"
            >
                <IconArrowLeft size={18} stroke={2.5} /> {currentPhase > 1 ? "Previous Phase" : "Back"}
            </button>

            {/* Changed max-w-4xl to max-w-6xl for a wider layout */}
            <div className="relative z-10 w-full max-w-6xl bg-white/70 backdrop-blur-xl border border-white/40 rounded-[2.5rem] shadow-2xl px-8 py-10 md:px-12 md:py-12 mt-4">

                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center mb-3">
                        <img src="/logo.png" alt="Logo" className="h-16 w-auto object-contain drop-shadow-lg" />
                    </div>
                    <h1 className="text-sm font-black text-slate-700 uppercase tracking-[0.3em]">
                        Provider Account Registration
                    </h1>

                    {/* Phase Indicator Pills */}
                    <div className="flex items-center justify-center gap-2 mt-4">
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${currentPhase === 1 ? 'bg-[#093fb4] text-white shadow-md' : 'bg-slate-200/70 text-slate-600'}`}>
                            <IconUserCheck size={12} /> 1. Fields
                        </div>
                        <div className={`w-6 h-0.5 ${currentPhase > 1 ? 'bg-[#093fb4]' : 'bg-slate-200'}`} />
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${currentPhase === 2 ? 'bg-[#093fb4] text-white shadow-md' : 'bg-slate-200/70 text-slate-600'}`}>
                            <IconFileText size={12} /> 2. Guidelines
                        </div>
                        <div className={`w-6 h-0.5 ${currentPhase > 2 ? 'bg-[#093fb4]' : 'bg-slate-200'}`} />
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${currentPhase === 3 ? 'bg-[#093fb4] text-white shadow-md' : 'bg-slate-200/70 text-slate-600'}`}>
                            <IconShieldCheck size={12} /> 3. OTP
                        </div>
                    </div>
                </div>

                {/* PHASE 1: REGISTRATION FIELDS */}
                {currentPhase === 1 && (
                    <form onSubmit={handleProceedToTerms} className="space-y-6 animate-fadeIn">
                        <SectionLabel label="Account Identity" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <Field label="Organization / Institution Name" required status={status.org_name} labelClass={getLabelClass()}>
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

                            <Field label="Provider Type" required status={status.provider_type} labelClass={getLabelClass()}>
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
                            <Field label="Organization / Coordinator Email" required status={status.sub_email} labelClass={getLabelClass()}>
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
                                {touched.sub_email && status.sub_email === FieldStatus.INVALID && (
                                    <span className="text-[10px] font-black text-[#FF1E1E] uppercase tracking-wider ml-1 mt-1 block">
                                        Invalid email format (example@email.com).
                                    </span>
                                )}
                            </Field>

                            <Field label="Mobile Number" required status={status.contact_number} labelClass={getLabelClass()}>
                                <div className="relative group flex items-center">
                                    <IconPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 group-focus-within:text-[#093fb4] transition-colors z-10" size={20} />
                                    <input
                                        type="text"
                                        required
                                        name="contact_number"
                                        placeholder="09XXXXXXXXX"
                                        value={formData.contact_number || ""}
                                        onChange={(e) => { handleChange(e); setTouched(prev => ({ ...prev, contact_number: true })); }}
                                        onBlur={handleBlur}
                                        className={`${getBorderClass("contact_number")} pl-12`}
                                    />
                                </div>
                                {touched.contact_number && status.contact_number === FieldStatus.INVALID && (
                                    <span className="text-[10px] font-black text-[#FF1E1E] uppercase tracking-wider ml-1 mt-1 block">
                                        Mobile number must be 11 digits starting with 09 (e.g., 09660430534).
                                    </span>
                                )}
                            </Field>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <Field label="Telephone Number (Landline)" status={status.tel_number} labelClass={getLabelClass()}>
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
                                {touched.tel_number && status.tel_number === FieldStatus.INVALID && (
                                    <span className="text-[10px] font-black text-[#FF1E1E] uppercase tracking-wider ml-1 mt-1 block">
                                        Invalid telephone number format.
                                    </span>
                                )}
                            </Field>

                            <Field label="Website / Social Media Page" status={status.website} labelClass={getLabelClass()}>
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
                                {touched.website && status.website === FieldStatus.INVALID && (
                                    <span className="text-[10px] font-black text-[#FF1E1E] uppercase tracking-wider ml-1 mt-1 block">
                                        Invalid website/URL format.
                                    </span>
                                )}
                            </Field>
                        </div>

                        <SectionLabel label="Provider Address" />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <Field label="Region" required status={status.region} labelClass={getLabelClass()}>
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

                            <Field label="City / Municipality" required status={status.city} labelClass={getLabelClass()}>
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

                            <Field label="Barangay" required status={status.barangay} labelClass={getLabelClass()}>
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

                        <Field label="Street Address / Building / Office No." required status={status.street_address} labelClass={getLabelClass()}>
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

                        <button
                            type="submit"
                            disabled={isPhase1Invalid}
                            className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all text-xs flex items-center justify-center gap-2 mt-8 ${!isPhase1Invalid
                                ? 'bg-[#093fb4] hover:bg-[#073496] text-white shadow-xl shadow-[#093fb4]/25 active:scale-95 cursor-pointer'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                                }`}
                        >
                            {!isPhase1Invalid ? "Next: Review Guidelines" : "Please fill out all required fields"}
                        </button>
                    </form>
                )}

                {/* PHASE 2: GUIDELINES & TERMS (Scroll-to-unlock) */}
                {currentPhase === 2 && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="bg-slate-50/80 border border-slate-200 rounded-[2rem] p-6 shadow-inner">
                            <h3 className="text-lg font-black text-slate-900 mb-1 uppercase tracking-tight">Scholarship Provider Guidelines</h3>
                            <p className="text-[#093fb4] text-[10px] font-black uppercase tracking-[0.15em] mb-4">
                                {hasReadToBottom ? "Please check the box below to continue" : "Scroll to the bottom of the guidelines to unlock acceptance"}
                            </p>

                            <div
                                ref={termsScrollRef}
                                onScroll={handleTermsScroll}
                                className="max-h-[45vh] overflow-y-scroll pr-2 text-slate-600 text-sm leading-relaxed font-medium space-y-4 border-b border-slate-200 pb-6 custom-scrollbar bg-white p-6 rounded-2xl shadow-sm"
                            >
                                <ProviderGuidelinesMain onClose={() => { }} handleFinishedReadingGuidelines={() => { }} isModal={true} />
                            </div>

                            {/* Guidelines Checkbox */}
                            <div className={`flex items-center gap-3 mt-4 p-4 bg-white border border-slate-200 rounded-xl transition-opacity ${!hasReadToBottom ? "opacity-50 cursor-not-allowed" : ""}`}>
                                <input
                                    type="checkbox"
                                    id="guidelines-check"
                                    disabled={!hasReadToBottom}
                                    checked={acceptedTerms}
                                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                                    className="w-5 h-5 rounded border-slate-300 text-[#093fb4] focus:ring-[#093fb4] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <label htmlFor="guidelines-check" className={`text-xs font-black text-slate-800 uppercase tracking-wider select-none ${!hasReadToBottom ? "cursor-not-allowed text-slate-400" : "cursor-pointer"}`}>
                                    I have read, understood, and agreed to the Scholarship Provider Guidelines and platform policies.
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={handleAcceptTermsAndSendOtp}
                                disabled={!hasReadToBottom || !acceptedTerms || loading || verifying}
                                className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all text-xs flex items-center justify-center gap-2 ${hasReadToBottom && acceptedTerms
                                    ? 'bg-[#093fb4] hover:bg-[#073496] text-white shadow-xl shadow-[#093fb4]/25 active:scale-95 cursor-pointer'
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                                    }`}
                            >
                                {!hasReadToBottom ? "Scroll to Bottom of Guidelines" : !acceptedTerms ? "Check the Box to Continue" : loading || verifying ? "Sending OTP..." : "Next: Send OTP Verification"}
                            </button>
                        </div>
                    </div>
                )}

                {/* PHASE 3: OTP VERIFICATION */}
                {currentPhase === 3 && (
                    <div className="py-6 px-4 text-center space-y-6 animate-fadeIn">
                        <div className="w-16 h-16 bg-[#093fb4]/10 text-[#093fb4] rounded-2xl flex items-center justify-center mx-auto mb-2">
                            <IconShieldCheck size={36} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Verify Your Email Address</h2>
                            <p className="text-xs font-bold text-slate-500 mt-1">
                                We've sent a 6-digit verification code to <span className="text-[#093fb4] font-black">{formData.sub_email}</span>
                            </p>
                        </div>

                        <div className="flex justify-center gap-3 my-6">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => (otpInputRefs.current[index] = el)}
                                    type="text"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(e.target.value, index)}
                                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                                    onPaste={handleOtpPaste}
                                    className="w-12 h-14 text-center text-xl font-black text-slate-900 bg-white border-2 border-slate-200 rounded-2xl focus:border-[#093fb4] focus:ring-4 focus:ring-[#093fb4]/10 outline-none transition-all shadow-sm"
                                />
                            ))}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setCurrentPhase(2)}
                                className="flex-1 py-3.5 text-slate-700 font-black hover:bg-slate-100 transition-colors uppercase text-[11px] tracking-widest bg-white border border-slate-200 rounded-2xl cursor-pointer"
                            >
                                Back to Guidelines
                            </button>
                            <button
                                type="button"
                                onClick={handleVerifyOtpSubmit}
                                disabled={verifying || loading || otp.join("").length < 6}
                                className="flex-[2] py-3.5 rounded-2xl font-black uppercase tracking-widest transition-all text-[11px] bg-[#093fb4] hover:bg-[#073496] text-white shadow-lg shadow-[#093fb4]/25 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading || verifying ? "Verifying & Registering..." : "Verify & Submit Registration"}
                            </button>
                        </div>

                        <div className="text-center pt-2">
                            <button
                                type="button"
                                async
                                onClick={async () => {
                                    const res = await handleRequestOtp();
                                    if (res.success) {
                                        setErrorMessage("A new OTP code has been sent to your email.");
                                        setShowError(true);
                                    } else {
                                        setErrorMessage(res.error || "Failed to resend OTP.");
                                        setShowError(true);
                                    }
                                }}
                                className="text-xs font-black text-[#093fb4] hover:underline uppercase tracking-wider cursor-pointer"
                            >
                                Didn't receive code? Resend OTP
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <ErrorModal isOpen={showError} onClose={() => setShowError(false)} message={errorMessage} />
            <OrgSuccessModal isOpen={showSuccess} message="Registration Submitted! Awaiting Admin verification." onConfirm={() => navigate('/')} />
        </div>
    );
};

function Field({ label, required, status, labelClass, errorText, children }) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between mb-1">
                <label className={`text-xs font-black uppercase tracking-wider block ${labelClass || "text-slate-800"}`}>
                    {label}{required && <span className="text-[#FF1E1E] ml-0.5">*</span>}
                </label>
            </div>
            {children}
            {errorText && (
                <span className="text-[10px] font-black text-[#FF1E1E] uppercase tracking-wider ml-1 mt-1 block">
                    {errorText}
                </span>
            )}
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
