import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api";
import { Mail, Loader2, ArrowLeft, ShieldCheck, CheckCircle2, FileText, UserCheck } from "lucide-react";
import RegisterPassField from "../RegisterPassField";
import { SuccessModal, ErrorModal } from "../component/RegisterModals";
import StudentAddress from "../student/StudentAddress";
import PasswordValidator from "password-validator";

const passwordSchema = new PasswordValidator();
passwordSchema
    .is().min(12)
    .is().max(18)
    .has().uppercase()
    .has().lowercase()
    .has().digits(1)
    .has().symbols(1);

export default function StudentRegister() {
    const navigate = useNavigate();
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
        if (first_mount === true && window.pageYOffset !== 0) {
            smoothScrollToTop();
        }
        setFirstMount(false);
    }, [first_mount]);

    // UI States
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // Microsoft-style Phase Management: 1 = Registration Fields, 2 = Terms & Conditions, 3 = OTP Verification
    const [currentPhase, setCurrentPhase] = useState(1);

    // Terms and Conditions States
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
    const [verifying, setVerifying] = useState(false);

    // FieldStatus
    const FieldStatus = Object.freeze({
        INCOMPLETE: 'Incomplete',
        INVALID: 'Invalid',
        VALID: 'Valid',
        NEGLIGIBLE: 'Negligible'
    });

    const [firstNameStatus, setFirstNameStatus] = useState(FieldStatus.INCOMPLETE);
    const [lastNameStatus, setLastNameStatus] = useState(FieldStatus.INCOMPLETE);
    const [birthDateStatus, setBirthDateStatus] = useState(FieldStatus.INCOMPLETE);
    const [emailStatus, setEmailStatus] = useState(FieldStatus.INCOMPLETE);
    const [contactNumberStatus, setContactNumberStatus] = useState(FieldStatus.INCOMPLETE);
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Track touched fields
    const [touched, setTouched] = useState({
        firstName: false,
        lastName: false,
        birthDate: false,
        email: false,
        contactNumber: false,
        password: false,
        confirmPassword: false
    });

    const handleBlur = (e) => {
        const { name } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
    };

    // BIRTHDATE CLAMPS (18 to 60 years old)
    const today = new Date();
    const minYear = today.getFullYear() - 60;
    const maxYear = today.getFullYear() - 18;
    const minDate = `${minYear}-01-01`;
    const maxDate = `${maxYear}-12-31`;

    const [regform, setRegForm] = useState({
        firstName: '', middleName: '', lastName: '', suffix: '',
        birthDate: '', gender: '', contactNumber: '',
        district: '', barangay: '', street: '', zipCode: '',
        email: '', password: '', confirmPassword: ''
    });

    // Validations
    const isEmailValid = (() => {
        if (!regform.email) return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(regform.email);
    })();

    const isPasswordValid = passwordSchema.validate(regform.password || "");
    const passwordsMatch = regform.password !== "" && regform.password === regform.confirmPassword;

    const getPasswordStatus = () => {
        if (!regform.password) return FieldStatus.INCOMPLETE;
        return isPasswordValid ? FieldStatus.VALID : FieldStatus.INVALID;
    };

    const getConfirmPasswordStatus = () => {
        if (!regform.confirmPassword) return FieldStatus.INCOMPLETE;
        return passwordsMatch ? FieldStatus.VALID : FieldStatus.INVALID;
    };

    const isBirthDateValid = (() => {
        if (!regform.birthDate) return false;
        const entered = new Date(regform.birthDate);
        if (Number.isNaN(entered.getTime())) return false;
        return entered >= new Date(minDate) && entered <= new Date(maxDate);
    })();

    const isContactValid = (() => {
        if (!regform.contactNumber) return false;
        const cleaned = regform.contactNumber.replace(/[\s\-\(\)]/g, '');
        const phMobileRegex = /^9\d{9}$/;
        return phMobileRegex.test(cleaned);
    })();

    const isPhase1Invalid = (() => {
        const optionalFields = ["middleName", "suffix"];
        const requiredFilled = Object.entries(regform).every(([key, value]) =>
            optionalFields.includes(key) ? true : value.trim() !== ""
        );
        return !requiredFilled || !isPasswordValid || !passwordsMatch || !isBirthDateValid || !isEmailValid || !isContactValid;
    })();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));

        if (["firstName", "middleName", "lastName"].includes(name)) {
            const cleanVal = value.replace(/[^a-zA-Z\s-]/g, "");
            setRegForm(prev => ({ ...prev, [name]: cleanVal }));
            if (name === "firstName") {
                setFirstNameStatus(cleanVal.trim() ? FieldStatus.VALID : FieldStatus.INCOMPLETE);
            } else if (name === "lastName") {
                setLastNameStatus(cleanVal.trim() ? FieldStatus.VALID : FieldStatus.INCOMPLETE);
            }
            return;
        }

        if (name === "suffix") {
            setRegForm(prev => ({ ...prev, [name]: value.replace(/[^a-zA-Z\s.]/g, "") }));
            return;
        }

        if (name === "contactNumber") {
            let val = value.replace(/\D/g, "");
            if (val.length > 0 && val[0] !== '9') return;
            if (val.length <= 10) {
                setRegForm(prev => ({ ...prev, contactNumber: val }));
                const phMobileRegex = /^9\d{9}$/;
                setContactNumberStatus(
                    phMobileRegex.test(val) ? FieldStatus.VALID : (val.length > 0 ? FieldStatus.INVALID : FieldStatus.INCOMPLETE)
                );
            }
            return;
        }

        if (name === "birthDate") {
            setRegForm(prev => ({ ...prev, birthDate: value }));
            if (!value) {
                setBirthDateStatus(FieldStatus.INCOMPLETE);
            } else {
                const entered = new Date(value);
                const isValid = !Number.isNaN(entered.getTime()) && entered >= new Date(minDate) && entered <= new Date(maxDate);
                setBirthDateStatus(isValid ? FieldStatus.VALID : FieldStatus.INVALID);
            }
            return;
        }

        if (name === "email") {
            setRegForm(prev => ({ ...prev, email: value }));
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!value) {
                setEmailStatus(FieldStatus.INCOMPLETE);
            } else if (emailRegex.test(value)) {
                setEmailStatus(FieldStatus.VALID);
            } else {
                setEmailStatus(FieldStatus.INVALID);
            }
            return;
        }

        setRegForm(prev => ({ ...prev, [name]: value }));
    };

    // Transition from Phase 1 -> Phase 2 (Terms)
    const handleProceedToTerms = async (e) => {
        e.preventDefault();
        setIsSubmitted(true);

        if (!isEmailValid) {
            setErrorMessage("Please enter a valid email address format.");
            setShowError(true);
            return;
        }
        if (!isBirthDateValid) {
            setErrorMessage("You must be at least 18 years old to register.");
            setShowError(true);
            return;
        }
        if (!isPasswordValid) {
            setErrorMessage("Password must be 12-18 characters with uppercase, lowercase, number, and symbol.");
            setShowError(true);
            return;
        }
        if (!passwordsMatch) {
            setErrorMessage("Passwords do not match.");
            setShowError(true);
            return;
        }
        if (!isContactValid) {
            setErrorMessage("Contact number must be 10 digits starting with 9 (e.g., 9660430534).");
            setShowError(true);
            return;
        }
        try {
            await api.post(`/post/check/email`, { email: regform.email });
            setCurrentPhase(2);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        catch (error) {
            const message = error.response?.data?.message || error.response?.data?.error || "Server Error. Please try again later.";
            setErrorMessage(message); // <-- This updates the modal's text state
            setShowError(true);      // <-- This opens the modal
        }
    };

    // Transition from Phase 2 -> Phase 3 (Trigger OTP & Send)
    const handleAcceptTermsAndSendOtp = async () => {
        if (!acceptedTerms) {
            setErrorMessage("You must accept the terms and conditions.");
            setShowError(true);
            return;
        }

        setVerifying(true);
        try {
            await api.post('/send-registration-otp', { email: regform.email });
            setCurrentPhase(3);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            setErrorMessage(err.response?.data?.error || "Failed to send OTP. Please try again.");
            setShowError(true);
        } finally {
            setVerifying(false);
        }
    };

    // OTP Box Handlers with Copy-Paste Support
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

    const handleVerifyOtp = async () => {
        const fullOtp = otp.join("");
        if (fullOtp.length < 6) {
            setErrorMessage("Please enter the complete 6-digit OTP code.");
            setShowError(true);
            return;
        }

        setVerifying(true);
        try {
            await api.post('/verify-registration-otp', { email: regform.email, otp: fullOtp });
            setLoading(true);
            await api.post('/register', regform);
            setShowSuccess(true);
        } catch (err) {
            setErrorMessage(err.response?.data?.error || "Invalid OTP code.");
            setShowError(true);
        } finally {
            setVerifying(false);
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        try {
            setVerifying(true);
            await api.post('/send-registration-otp', { email: regform.email });
            setErrorMessage("A new OTP code has been sent to your email.");
            setShowError(true);
        } catch (err) {
            setErrorMessage("Failed to resend OTP.");
            setShowError(true);
        } finally {
            setVerifying(false);
        }
    };

    const getBorderClass = (fieldName, fieldStatus) => {
        const isFieldTouched = touched[fieldName] || isSubmitted;
        const isError = isFieldTouched && (fieldStatus === FieldStatus.INCOMPLETE || fieldStatus === FieldStatus.INVALID);
        const borderStyle = isError
            ? "border-red-500 focus:border-red-500 bg-red-50/20"
            : "border-white/80 focus:border-[#093fb4]";
        return `w-full px-4 py-3.5 bg-white/60 border-2 ${borderStyle} rounded-2xl outline-none focus:bg-white transition-all placeholder:text-black/30 font-bold text-slate-900 text-base shadow-sm`;
    };

    const Label = ({ text, required, className = "" }) => {
        return (
            <div className="flex items-center justify-between mb-2">
                <label className={`text-xs font-black uppercase tracking-wider ml-1 block ${className || "text-slate-800"}`}>
                    {text} {required && <span className="text-[#FF1E1E]">*</span>}
                </label>
            </div>
        );
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 sm:py-12 relative overflow-x-hidden overflow-y-auto bg-[#FFFCFB] font-sans">
            <style>
                {`
                .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; border: 2px solid #f1f5f9; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                `}
            </style>

            <div
                className="fixed inset-0 bg-no-repeat bg-cover bg-center pointer-events-none"
                style={{ backgroundImage: `url('/bg2.png')` }}
            />

            <button
                onClick={() => {
                    if (currentPhase > 1) {
                        setCurrentPhase(currentPhase - 1);
                    } else {
                        navigate('/');
                    }
                }}
                className="fixed top-6 left-6 z-50 flex items-center gap-2 text-xs font-black text-slate-700 uppercase tracking-widest bg-white/85 backdrop-blur-md hover:bg-white px-5 py-3 rounded-2xl border border-white/60 transition-all shadow-lg active:scale-95 cursor-pointer"
            >
                <ArrowLeft size={18} strokeWidth={2.5} /> {currentPhase > 1 ? "Previous Phase" : "Back"}
            </button>

            {(loading || verifying) && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex flex-col items-center justify-center">
                    <div className="bg-white px-8 py-6 rounded-[2rem] shadow-2xl flex items-center gap-4 border border-white">
                        <Loader2 className="animate-spin text-[#093FB4]" size={36} />
                        <div>
                            <p className="text-slate-900 font-black text-sm uppercase tracking-wide">Processing Request...</p>
                            <p className="text-slate-500 font-bold text-xs mt-0.5">Please wait a moment.</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="w-full max-w-4xl bg-white/70 backdrop-blur-xl border border-white/40 rounded-[2.5rem] shadow-2xl p-8 sm:p-10 relative z-10 my-auto">
                <div className="text-center mb-6 mt-2">
                    <div className="inline-flex items-center justify-center mb-3">
                        <img src="/logo.png" alt="KyusISKO Logo" className="h-14 w-auto object-contain" />
                    </div>
                    <h1 className="text-sm font-black text-slate-700 uppercase tracking-[0.3em]">
                        Student Account Registration
                    </h1>

                    {/* Microsoft-style Phase Indicator Pills */}
                    <div className="flex items-center justify-center gap-2 mt-4">
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${currentPhase === 1 ? 'bg-[#093FB4] text-white shadow-md' : 'bg-slate-200/70 text-slate-600'}`}>
                            <UserCheck size={12} /> 1. Fields
                        </div>
                        <div className={`w-6 h-0.5 ${currentPhase > 1 ? 'bg-[#093FB4]' : 'bg-slate-200'}`} />
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${currentPhase === 2 ? 'bg-[#093FB4] text-white shadow-md' : 'bg-slate-200/70 text-slate-600'}`}>
                            <FileText size={12} /> 2. Terms
                        </div>
                        <div className={`w-6 h-0.5 ${currentPhase > 2 ? 'bg-[#093FB4]' : 'bg-slate-200'}`} />
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${currentPhase === 3 ? 'bg-[#093FB4] text-white shadow-md' : 'bg-slate-200/70 text-slate-600'}`}>
                            <ShieldCheck size={12} /> 3. OTP
                        </div>
                    </div>
                </div>

                {/* PHASE 1: REGISTRATION FIELDS */}
                {currentPhase === 1 && (
                    <form onSubmit={handleProceedToTerms} className="space-y-8 animate-fadeIn" autoComplete="off">
                        <div>
                            <p className="text-xs font-black text-[#093FB4] uppercase tracking-widest mb-4 border-b border-black/5 pb-2">
                                Personal Information
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div>
                                    <Label text="First Name" required />
                                    <input type="text" name="firstName" placeholder="Juan" value={regform.firstName} onChange={handleChange} onBlur={handleBlur} required className={getBorderClass("firstName", firstNameStatus)} />
                                </div>
                                <div>
                                    <Label text="Middle Name" />
                                    <input type="text" name="middleName" placeholder="Optional" value={regform.middleName} onChange={handleChange} className={getBorderClass("middleName", FieldStatus.VALID)} />
                                </div>
                                <div>
                                    <Label text="Last Name" required />
                                    <input type="text" name="lastName" placeholder="Dela Cruz" value={regform.lastName} onChange={handleChange} onBlur={handleBlur} required className={getBorderClass("lastName", lastNameStatus)} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
                                <div>
                                    <Label text="Suffix" />
                                    <input type="text" name="suffix" placeholder="Jr, Sr (Optional)" value={regform.suffix} onChange={handleChange} className={`${getBorderClass("suffix", FieldStatus.VALID)} uppercase`} />
                                </div>
                                <div>
                                    <Label text="Birth Date" required />
                                    <input type="date" name="birthDate" value={regform.birthDate} min={minDate} max={maxDate} onChange={handleChange} onBlur={handleBlur} required className={`${getBorderClass("birthDate", birthDateStatus)} cursor-pointer`} />
                                    {birthDateStatus === FieldStatus.INVALID && (
                                        <span className="text-[10px] font-black text-[#FF1E1E] uppercase tracking-wider ml-2 mt-2 block">Must be 18 to 60 years old</span>
                                    )}
                                </div>
                                <div>
                                    <Label text="Gender" />
                                    <select name="gender" value={regform.gender} onChange={handleChange} className={getBorderClass("gender", FieldStatus.VALID)}>
                                        <option value="" disabled>Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Prefer not to Say">Prefer not to Say</option>
                                        <option value="Others">Others</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div>
                            <StudentAddress regform={regform} setRegForm={setRegForm} handleChange={handleChange} isSubmitted={isSubmitted} />
                        </div>

                        <div>
                            <p className="text-xs font-black text-[#093FB4] uppercase tracking-widest mb-4 border-b border-black/5 pb-2">
                                Account Credentials
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label text="Email Address" required />
                                    <div className="relative group">
                                        <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 group-focus-within:text-[#093fb4] transition-colors z-10" />
                                        <input type="email" name="email" placeholder="email@example.com" value={regform.email} onChange={handleChange} onBlur={handleBlur} required className={`${getBorderClass("email", emailStatus)} pl-12`} />
                                    </div>
                                    {emailStatus === FieldStatus.INVALID && (
                                        <span className="text-[10px] font-black text-[#FF1E1E] uppercase tracking-wider ml-2 mt-2 block">Invalid email format</span>
                                    )}
                                </div>
                                <div>
                                    <Label text="Contact Number" required />
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none border-r border-slate-300 pr-3 z-10">
                                            <img src="/ph.svg" alt="PH" className="w-5 h-3.5 object-cover rounded-sm shadow-sm" />
                                            <span className="text-sm font-black text-slate-700">+63</span>
                                        </div>
                                        <input type="text" name="contactNumber" value={regform.contactNumber} onChange={handleChange} onBlur={handleBlur} required placeholder="9XXXXXXXXX" className={`${getBorderClass("contactNumber", contactNumberStatus)} pl-28`} />
                                    </div>
                                    {touched.contactNumber && contactNumberStatus === FieldStatus.INVALID && (
                                        <span className="text-[10px] font-black text-[#FF1E1E] uppercase tracking-wider ml-2 mt-2 block">Must start with 9 and be 10 digits</span>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                <div>
                                    <Label text="Password" required />
                                    <RegisterPassField name="password" value={regform.password} onChange={handleChange} onBlur={handleBlur} showStrength={true} />
                                </div>
                                <div>
                                    <Label text="Confirm Password" required />
                                    <RegisterPassField name="confirmPassword" value={regform.confirmPassword} onChange={handleChange} onBlur={handleBlur} />
                                    {getConfirmPasswordStatus() === FieldStatus.INVALID && (
                                        <span className="text-[10px] font-black text-[#FF1E1E] uppercase tracking-wider ml-2 mt-2 block">Passwords do not match</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isPhase1Invalid}
                                className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all text-xs flex items-center justify-center gap-2 ${!isPhase1Invalid
                                    ? 'bg-[#093FB4] hover:bg-[#073496] text-white shadow-xl shadow-[#093FB4]/25 active:scale-95 cursor-pointer'
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                                    }`}
                            >
                                {!isPhase1Invalid ? "Next: Terms and Conditions" : "Please fill out all required fields"}
                            </button>
                        </div>
                    </form>
                )}

                {/* PHASE 2: TERMS AND CONDITIONS */}
                {currentPhase === 2 && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="bg-slate-50/80 border border-slate-200 rounded-[2rem] p-6 shadow-inner">
                            <h3 className="text-lg font-black text-slate-900 mb-1 uppercase tracking-tight">Terms of Service</h3>
                            <p className="text-[#093FB4] text-[10px] font-black uppercase tracking-[0.15em] mb-4">
                                {hasReadToBottom ? "Please check the box below to continue" : "Scroll to the bottom of the agreement to unlock acceptance"}
                            </p>

                            <div
                                ref={termsScrollRef}
                                onScroll={handleTermsScroll}
                                className="max-h-[40vh] overflow-y-scroll pr-4 text-slate-600 text-sm leading-relaxed font-medium space-y-4 border-b border-slate-200 pb-6 custom-scrollbar bg-white p-4 rounded-2xl shadow-sm"
                            >
                                <h4 className="font-black text-center text-slate-900 text-base uppercase tracking-widest border-b border-slate-100 pb-3 mb-4">
                                    KyusISKO User Agreement<br />
                                    <span className="text-xs text-[#093fb4] mt-1 block">Terms and Conditions</span>
                                </h4>
                                <div>
                                    <p className="font-black text-slate-900 text-[15px] mb-1">1. Introduction</p>
                                    <p>Welcome to KyusISKO: Scholarship and Financial Aid Recommendation and Management System. By accessing and using this platform, you agree to comply with and be bound by the following Terms and Conditions.</p>
                                </div>
                                <div>
                                    <p className="font-black text-slate-900 text-[15px] mb-1">2. Purpose of the System</p>
                                    <p>KyusISKO provides a centralized platform for students to access scholarship information and receive recommendations based on qualifications.</p>
                                </div>
                                <div>
                                    <p className="font-black text-slate-900 text-[15px] mb-1">3. User Roles and Responsibilities</p>
                                    <ul className="list-disc pl-4 space-y-1.5">
                                        <li><strong className="text-slate-800">Students:</strong> Provide accurate, updated personal and academic information.</li>
                                        <li><strong className="text-slate-800">Organizations:</strong> Ensure all posted opportunities are legitimate.</li>
                                        <li><strong className="text-slate-800">Administrators:</strong> Manage system data and monitor activity.</li>
                                    </ul>
                                </div>
                                <div>
                                    <p className="font-black text-slate-900 text-[15px] mb-1">4. Data Privacy and Protection</p>
                                    <p>KyusISKO protects user data in accordance with privacy principles. Personal info is used solely for scholarship matching and is not shared with unauthorized third parties.</p>
                                </div>
                                <div>
                                    <p className="font-black text-slate-900 text-[15px] mb-1">5. Document Verification</p>
                                    <p>The system uses automated tools (including Google Gemini API) to analyze documents. Final decisions are made by administrators or organizations.</p>
                                </div>
                                <div>
                                    <p className="font-black text-slate-900 text-[15px] mb-1">6. System Limitations</p>
                                    <p>The system does not guarantee approval or acceptance. Recommendations depend on user accuracy.</p>
                                </div>
                                <div>
                                    <p className="font-black text-slate-900 text-[15px] mb-1">7. Acceptable Use Policy</p>
                                    <p>Users must not provide false info or attempt unauthorized access. Violation results in termination.</p>
                                </div>
                                <div>
                                    <p className="font-black text-slate-900 text-[15px] mb-1">8. Intellectual Property</p>
                                    <p>Content is the property of the KyusISKO development team.</p>
                                </div>
                                <div>
                                    <p className="font-black text-slate-900 text-[15px] mb-1">9. Disclaimer</p>
                                    <p>KyusISKO is not liable for scholarship outcomes or technical downtime.</p>
                                </div>
                                <div>
                                    <p className="font-black text-slate-900 text-[15px] mb-1">10. Modifications</p>
                                    <p>Terms may be updated at any time.</p>
                                </div>
                                <div>
                                    <p className="font-black text-slate-900 text-[15px] mb-1">11. Acceptance</p>
                                    <p>By using KyusISKO, users confirm they have read and agreed to these Terms.</p>
                                </div>
                            </div>

                            {/* Terms Checkbox */}
                            <div className={`flex items-center gap-3 mt-4 p-4 bg-white border border-slate-200 rounded-xl transition-opacity ${!hasReadToBottom ? "opacity-50 cursor-not-allowed" : ""}`}>
                                <input
                                    type="checkbox"
                                    id="terms-check"
                                    disabled={!hasReadToBottom}
                                    checked={acceptedTerms}
                                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                                    className="w-5 h-5 rounded border-slate-300 text-[#093FB4] focus:ring-[#093FB4] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <label htmlFor="terms-check" className={`text-xs font-black text-slate-800 uppercase tracking-wider select-none ${!hasReadToBottom ? "cursor-not-allowed text-slate-400" : "cursor-pointer"}`}>
                                    I have read and understood the terms.
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            {/**<button
                                type="button"
                                onClick={() => setCurrentPhase(1)}
                                className="flex-1 py-4 text-slate-700 font-black hover:bg-slate-100 transition-colors uppercase text-xs tracking-widest bg-white border border-slate-200 rounded-2xl"
                            >
                                Back to Fields
                            </button>**/}
                            <button
                                type="button"
                                onClick={handleAcceptTermsAndSendOtp}
                                disabled={!hasReadToBottom || !acceptedTerms}
                                className={`flex-[2] py-4 rounded-2xl font-black uppercase tracking-widest transition-all text-xs flex items-center justify-center gap-2 ${hasReadToBottom && acceptedTerms
                                    ? 'bg-[#093FB4] hover:bg-[#073496] text-white shadow-xl shadow-[#093FB4]/25 active:scale-95 cursor-pointer'
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                                    }`}
                            >
                                {!hasReadToBottom ? "Scroll to Bottom" : !acceptedTerms ? "Check the Box" : "Next: Send OTP Verification"}
                            </button>
                        </div>
                    </div>
                )}

                {/* PHASE 3: OTP VERIFICATION */}
                {currentPhase === 3 && (
                    <div className="py-6 px-4 text-center space-y-6 animate-fadeIn">
                        <div className="w-16 h-16 bg-[#093FB4]/10 text-[#093FB4] rounded-2xl flex items-center justify-center mx-auto mb-2">
                            <ShieldCheck size={36} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Verify Your Email Address</h2>
                            <p className="text-xs font-bold text-slate-500 mt-1">
                                We've sent a 6-digit verification code to <span className="text-[#093FB4] font-black">{regform.email}</span>
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
                                    className="w-12 h-14 text-center text-xl font-black text-slate-900 bg-white border-2 border-slate-200 rounded-2xl focus:border-[#093FB4] focus:ring-4 focus:ring-[#093FB4]/10 outline-none transition-all shadow-sm"
                                />
                            ))}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setCurrentPhase(2)}
                                className="flex-1 py-3.5 text-slate-700 font-black hover:bg-slate-100 transition-colors uppercase text-[11px] tracking-widest bg-white border border-slate-200 rounded-2xl"
                            >
                                Back to Terms
                            </button>
                            <button
                                type="button"
                                onClick={handleVerifyOtp}
                                disabled={verifying || otp.join("").length < 6}
                                className="flex-[2] py-3.5 rounded-2xl font-black uppercase tracking-widest transition-all text-[11px] bg-[#093FB4] hover:bg-[#073496] text-white shadow-lg shadow-[#093FB4]/25 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Verify & Create Account
                            </button>
                        </div>

                        <div className="text-center pt-2">
                            <button
                                type="button"
                                onClick={handleResendOtp}
                                className="text-xs font-black text-[#093FB4] hover:underline uppercase tracking-wider"
                            >
                                Didn't receive code? Resend OTP
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <SuccessModal
                isOpen={showSuccess}
                onConfirm={() => navigate("/login")}
            />

            <ErrorModal
                isOpen={showError}
                onClose={() => setShowError(false)}
                message={errorMessage}
            />
        </div>
    );
}
