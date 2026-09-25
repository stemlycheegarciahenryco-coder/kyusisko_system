import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api";
import { Mail, Loader2, ArrowLeft } from "lucide-react"; // Removed X, added ArrowLeft
import RegisterPassField from "../RegisterPassField";
import TermsModal from "../TermsModal";
import { SuccessModal, ErrorModal, OtpModal } from "../component/RegisterModals";
import RegisterActions from "../component/RegisterActions";
import StudentAddress from "../student/StudentAddress";
import PasswordValidator from "password-validator";

// Same policy as RegisterPassField.jsx / the backend schema — 12-18 chars,
// upper, lower, digit, symbol, no spaces.
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

    // UI States
    const [loading, setLoading] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

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

    // BIRTHDATE CLAMPS (Sealed to 18 to 60 years old)
    const today = new Date();
    const minYear = today.getFullYear() - 60; // Max age 60
    const maxYear = today.getFullYear() - 18; // Min age 18 (Strictly 18+)
    const minDate = `${minYear}-01-01`;
    const maxDate = `${maxYear}-12-31`;

    // Verification States
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [verifying, setVerifying] = useState(false);

    const [regform, setRegForm] = useState({
        firstName: '', middleName: '', lastName: '', suffix: '',
        birthDate: '', gender: 'Male', contactNumber: '',
        district: '', barangay: '', street: '', zipCode: '',
        email: '', password: '', confirmPassword: ''
    });

    // EMAIL VALIDATION CHECK
    const isEmailValid = (() => {
        if (!regform.email) return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(regform.email);
    })();

    // PASSWORD VALIDATION
    const isPasswordValid = passwordSchema.validate(regform.password || "");
    const passwordsMatch = regform.password !== "" && regform.password === regform.confirmPassword;

    // PASSWORD STATUS HELPER
    const getPasswordStatus = () => {
        if (!regform.password) return FieldStatus.INCOMPLETE;
        return isPasswordValid ? FieldStatus.VALID : FieldStatus.INVALID;
    };

    // CONFIRM PASSWORD STATUS HELPER
    const getConfirmPasswordStatus = () => {
        if (!regform.confirmPassword) return FieldStatus.INCOMPLETE;
        return passwordsMatch ? FieldStatus.VALID : FieldStatus.INVALID;
    };

    // BIRTHDATE CLAMP CHECK
    const isBirthDateValid = (() => {
        if (!regform.birthDate) return false;
        const entered = new Date(regform.birthDate);
        if (Number.isNaN(entered.getTime())) return false;
        return entered >= new Date(minDate) && entered <= new Date(maxDate);
    })();

    // CONTACT NUMBER VALIDATION
    const isContactValid = (() => {
        if (!regform.contactNumber) return false;
        const cleaned = regform.contactNumber.replace(/[\s\-\(\)]/g, '');
        const phMobileRegex = /^9\d{9}$/;
        return phMobileRegex.test(cleaned);
    })();

    const isFormInvalid = (() => {
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
                setContactNumberStatus(
                    val.length === 10 ? FieldStatus.VALID : (val.length > 0 ? FieldStatus.INVALID : FieldStatus.INCOMPLETE)
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

    const handleSubmit = async (e) => {
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
        if (!acceptedTerms) {
            setErrorMessage("You must accept the terms and conditions.");
            setShowError(true);
            return;
        }

        setVerifying(true);
        try {
            await api.post('/send-registration-otp', { email: regform.email });
            setShowOtpModal(true);
        } catch (err) {
            setErrorMessage(err.response?.data?.error || "Failed to send OTP. Please try again.");
            setShowError(true);
        } finally {
            setVerifying(false);
        }
    };

    const handleVerifyOtp = async (otp) => {
        setVerifying(true);
        try {
            await api.post('/verify-registration-otp', { email: regform.email, otp });
            setLoading(true);
            await api.post('/register', regform);
            setShowOtpModal(false);
            setShowSuccess(true);
        } catch (err) {
            setErrorMessage(err.response?.data?.error || "Invalid OTP code.");
            setShowError(true);
        } finally {
            setVerifying(false);
            setLoading(false);
        }
    };

    const handleResendOtp = () => {
        return api.post('/send-registration-otp', { email: regform.email });
    };

    // Standardized Input Field styling
    const standardInputClass = "w-full px-4 py-3.5 bg-white/60 border-2 border-white/80 rounded-2xl outline-none focus:bg-white focus:border-[#093fb4] transition-all placeholder:text-black/30 font-bold text-slate-900 text-base shadow-sm";

    // UI HELPER COMPONENTS WITH ALWAYS-VISIBLE STATUS BADGE
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

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 sm:py-12 relative overflow-x-hidden overflow-y-auto bg-[#FFFCFB] font-sans">

            {/* Background Image */}
            <div
                className="fixed inset-0 bg-no-repeat bg-cover bg-center pointer-events-none"
                style={{ backgroundImage: `url('/bg2.png')` }}
            />

            {/* NEW FLOATING BACK BUTTON */}
            <button
                onClick={() => navigate('/')}
                className="fixed top-6 left-6 z-50 flex items-center gap-2 text-xs font-black text-slate-700 uppercase tracking-widest bg-white/80 backdrop-blur-md hover:bg-white px-5 py-3 rounded-2xl border border-white/60 transition-all shadow-lg active:scale-95 cursor-pointer"
            >
                <ArrowLeft size={18} strokeWidth={2.5} /> Back
            </button>

            {/* POPUP FULLSCREEN LOADING OVERLAY */}
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

            {/* MAIN FORM CARD */}
            <div className="w-full max-w-4xl bg-white/70 backdrop-blur-xl border border-white/40 rounded-[2.5rem] shadow-2xl p-8 sm:p-10 relative z-10 my-auto">

                <div className="text-center mb-8 mt-2">
                    <div className="inline-flex items-center justify-center mb-4">
                        <img src="/logo.png" alt="KyusISKO Logo" className="h-16 w-auto object-contain" />
                    </div>
                    <h1 className="mt-2 text-sm font-black text-slate-700 uppercase tracking-[0.3em]">
                        Student Account Registration
                    </h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8" autoComplete="off">

                    {/* PERSONAL INFORMATION SECTION */}
                    <div>
                        <p className="text-xs font-black text-[#093FB4] uppercase tracking-widest mb-4 border-b border-black/5 pb-2">
                            Personal Information
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <Label text="First Name" required status={firstNameStatus} />
                                <input
                                    type="text"
                                    name="firstName"
                                    placeholder="Juan"
                                    value={regform.firstName}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    required
                                    className={standardInputClass}
                                />
                            </div>
                            <div>
                                <Label text="Middle Name" />
                                <input
                                    type="text"
                                    name="middleName"
                                    placeholder="Optional"
                                    value={regform.middleName}
                                    onChange={handleChange}
                                    className={standardInputClass}
                                />
                            </div>
                            <div>
                                <Label text="Last Name" required status={lastNameStatus} />
                                <input
                                    type="text"
                                    name="lastName"
                                    placeholder="Dela Cruz"
                                    value={regform.lastName}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    required
                                    className={standardInputClass}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
                            <div>
                                <Label text="Suffix" />
                                <input
                                    type="text"
                                    name="suffix"
                                    placeholder="Jr, Sr (Optional)"
                                    value={regform.suffix}
                                    onChange={handleChange}
                                    className={`${standardInputClass} uppercase`}
                                />
                            </div>

                            {/* Birth Date Input */}
                            <div>
                                <Label text="Birth Date" required status={birthDateStatus} />
                                <input
                                    type="date"
                                    name="birthDate"
                                    value={regform.birthDate}
                                    min={minDate}
                                    max={maxDate}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    required
                                    className={`${standardInputClass} cursor-pointer`}
                                />
                                {birthDateStatus === FieldStatus.INVALID && (
                                    <span className="text-[10px] font-black text-[#FF1E1E] uppercase tracking-wider ml-2 mt-2 block">
                                        Must be 18 to 60 years old
                                    </span>
                                )}
                            </div>

                            <div>
                                <Label text="Gender" />
                                <select
                                    name="gender"
                                    value={regform.gender}
                                    onChange={handleChange}
                                    className={standardInputClass}
                                >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Transgender">Transgender</option>
                                    <option value="Others">Others</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* ADDRESS COMPONENT */}
                    <div>
                        <p className="text-xs font-black text-[#093FB4] uppercase tracking-widest mb-4 border-b border-black/5 pb-2">
                            Home Address
                        </p>
                        <StudentAddress
                            regform={regform}
                            setRegForm={setRegForm}
                            handleChange={handleChange}
                            isSubmitted={isSubmitted}
                        />
                    </div>

                    {/* CREDENTIALS SECTION */}
                    <div>
                        <p className="text-xs font-black text-[#093FB4] uppercase tracking-widest mb-4 border-b border-black/5 pb-2">
                            Account Credentials
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Email Field */}
                            <div>
                                <Label text="Email Address" required status={emailStatus} />
                                <div className="relative group">
                                    <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 group-focus-within:text-[#093fb4] transition-colors z-10" />
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="email@example.com"
                                        value={regform.email}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        required
                                        className={`${standardInputClass} pl-12`}
                                    />
                                </div>
                                {emailStatus === FieldStatus.INVALID && (
                                    <span className="text-[10px] font-black text-[#FF1E1E] uppercase tracking-wider ml-2 mt-2 block">
                                        Invalid email format
                                    </span>
                                )}
                            </div>

                            {/* Contact Field */}
                            <div>
                                <Label text="Contact Number" required status={contactNumberStatus} />
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none border-r border-slate-300 pr-3 z-10">
                                        <img src="/ph.svg" alt="PH" className="w-5 h-3.5 object-cover rounded-sm shadow-sm" />
                                        <span className="text-sm font-black text-slate-700">+63</span>
                                    </div>
                                    <input
                                        type="text"
                                        name="contactNumber"
                                        value={regform.contactNumber}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        required
                                        placeholder="9XXXXXXXXX"
                                        className={`${standardInputClass} pl-28`}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Passwords */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            <div>
                                <Label text="Password" required status={getPasswordStatus()} />
                                <RegisterPassField
                                    name="password"
                                    value={regform.password}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    showStrength={true}
                                />
                            </div>
                            <div>
                                <Label text="Confirm Password" required status={getConfirmPasswordStatus()} />
                                <RegisterPassField
                                    name="confirmPassword"
                                    value={regform.confirmPassword}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                />
                                {getConfirmPasswordStatus() === FieldStatus.INVALID && (
                                    <span className="text-[10px] font-black text-[#FF1E1E] uppercase tracking-wider ml-2 mt-2 block">
                                        Passwords do not match
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <RegisterActions
                        loading={false}
                        acceptedTerms={acceptedTerms}
                        onShowTerms={() => setShowTerms(true)}
                        disabled={isFormInvalid || !acceptedTerms}
                    />
                </form>
            </div>

            <TermsModal
                isOpen={showTerms}
                onClose={() => setShowTerms(false)}
                onAccept={() => { setAcceptedTerms(true); setShowTerms(false); }}
            />

            <SuccessModal
                isOpen={showSuccess}
                onConfirm={() => navigate("/login")}
            />

            <ErrorModal
                isOpen={showError}
                onClose={() => setShowError(false)}
                message={errorMessage}
            />

            <OtpModal 
                isOpen={showOtpModal} 
                email={regform.email} 
                onClose={() => setShowOtpModal(false)} 
                onVerify={handleVerifyOtp} 
                loading={verifying}
            />
        </div>
    );
}