import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { X, Mail, Loader2 } from "lucide-react";
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
    .has().symbols(1)
    .has().not().spaces();

export default function StudentRegister() {
    const navigate = useNavigate();
    
    // UI States
    const [loading, setLoading] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

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

    const [birthMonth, setBirthMonth] = useState("");
    const [birthDay, setBirthDay] = useState("");
    const [birthYear, setBirthYear] = useState("");

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    // Dynamically generate year options strictly bound to the 18 to 60 age restriction display
    const yearOptions = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i); // newest valid 18yo year down to max age

    const daysInMonth = (month, year) => {
        if (!month) return 31;
        const m = Number(month);
        if (m === 2) {
            const y = year ? Number(year) : 2000;
            return new Date(y, 2, 0).getDate();
        }
        return new Date(2000, m, 0).getDate();
    };

    // Keep the selected day valid if the month/year changes
    useEffect(() => {
        if (birthDay && Number(birthDay) > daysInMonth(birthMonth, birthYear)) {
            setBirthDay("");
        }
    }, [birthMonth, birthYear]);

    // Combine the three selects into regform.birthDate
    useEffect(() => {
        if (birthMonth && birthDay && birthYear) {
            const mm = String(birthMonth).padStart(2, "0");
            const dd = String(birthDay).padStart(2, "0");
            setRegForm(prev => ({ ...prev, birthDate: `${birthYear}-${mm}-${dd}` }));
        } else {
            setRegForm(prev => ({ ...prev, birthDate: "" }));
        }
    }, [birthMonth, birthDay, birthYear]);

    // EMAIL VALIDATION CHECK
    const isEmailValid = (() => {
        if (!regform.email) return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(regform.email);
    })();
    const showEmailError = regform.email.length > 0 && !isEmailValid;

    // PASSWORD VALIDATION
    const isPasswordValid = passwordSchema.validate(regform.password || "");
    const passwordsMatch = regform.password !== "" && regform.password === regform.confirmPassword;
    const showMismatch = regform.confirmPassword.length > 0 && !passwordsMatch;

    // BIRTHDATE CLAMP CHECK
    const isBirthDateValid = (() => {
        if (!regform.birthDate) return false;
        const entered = new Date(regform.birthDate);
        if (Number.isNaN(entered.getTime())) return false;
        return entered >= new Date(minDate) && entered <= new Date(maxDate);
    })();

    const isFormInvalid = (() => {
        const optionalFields = ["middleName", "suffix"];
        const requiredFilled = Object.entries(regform).every(([key, value]) => 
            optionalFields.includes(key) ? true : value.trim() !== ""
        );
        
        return !requiredFilled || !isPasswordValid || !passwordsMatch || !isBirthDateValid || !isEmailValid;
    })();

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (["firstName", "middleName", "lastName"].includes(name)) {
            setRegForm(prev => ({ ...prev, [name]: value.replace(/[^a-zA-Z\s-]/g, "") }));
            return;
        }
        if (name === "suffix") {
            setRegForm(prev => ({ ...prev, [name]: value.replace(/[^a-zA-Z\s.]/g, "") }));
            return;
        }
        if (name === "contactNumber") {
            let val = value.replace(/\D/g, "");
            if (val.length > 0 && val[0] !== '9') return;
            if (val.length <= 10) setRegForm(prev => ({ ...prev, contactNumber: val }));
            return;
        }
        setRegForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
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

    const Label = ({ text, required }) => (
        <label className="text-[11px] font-bold text-black uppercase tracking-widest ml-1">
            {text} {required && <span className="text-[#FF1E1E]">*</span>}
        </label>
    );

    const inputClass = "w-full p-4 bg-white border border-slate-200 rounded-2xl text-black outline-none focus:border-[#093FB4] transition-all";

    return (
        <div 
            className="min-h-screen w-full flex items-center justify-center p-4 bg-[#FFFCFB] bg-no-repeat bg-contain bg-bottom relative"
            style={{ backgroundImage: `url('/bg2.png')` }}
        >
            {/* POPUP FULLSCREEN LOADING OVERLAY */}
            {(loading || verifying) && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-xs z-50 flex flex-col items-center justify-center">
                    <div className="bg-white px-8 py-6 rounded-3xl shadow-2xl flex items-center gap-4 border border-slate-100">
                        <Loader2 className="animate-spin text-[#093FB4]" size={36} />
                        <div>
                            <p className="text-black font-bold text-sm">Processing Request...</p>
                            <p className="text-slate-500 text-xs">Please wait a moment.</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="w-full max-w-4xl bg-white/80 backdrop-blur-sm border border-slate-200 rounded-[2.5rem] shadow-2xl p-8 max-h-[95vh] overflow-y-auto relative">
                <button 
                    onClick={() => navigate("/")} 
                    className="absolute top-6 right-8 text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-slate-100 rounded-full"
                >
                    <X size={24} />
                </button>

                <div className="text-center mb-8">
                    <img src="/logo.png" alt="KyusISKO Logo" className="w-24 mx-auto mb-4" />
                    <h1 className="text-black text-[12px] font-bold uppercase tracking-widest">Student Account Registration</h1>
                </div>

                <p className="text-[13px] font-bold text-blue-900 uppercase tracking-widest mb-4">Personal Information</p>
                
                <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
                    
                    {/* Names Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <Label text="First Name" required />
                            <input type="text" name="firstName" value={regform.firstName} onChange={handleChange} required className={inputClass} />
                        </div>
                        <div className="space-y-1">
                            <Label text="Middle Name" />
                            <input type="text" name="middleName" value={regform.middleName} onChange={handleChange} placeholder="Optional" className={inputClass} />
                        </div>
                        <div className="space-y-1">
                            <Label text="Last Name" required />
                            <input type="text" name="lastName" value={regform.lastName} onChange={handleChange} required className={inputClass} />
                        </div>
                    </div>

                    {/* Personal Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <Label text="Suffix" />
                            <input type="text" name="suffix" value={regform.suffix} onChange={handleChange} placeholder="Jr" className={`${inputClass} uppercase`} />
                        </div>
                        {/* Birthdate Dropdowns */}
                        <div className="space-y-1">
                            <Label text="Birth Date" required />
                            <div className="grid grid-cols-3 gap-2">
                                <select
                                    name="birthMonth"
                                    value={birthMonth}
                                    onChange={(e) => setBirthMonth(e.target.value)}
                                    required
                                    className={inputClass}
                                >
                                    <option value="" disabled>Month</option>
                                    {monthNames.map((m, i) => (
                                        <option key={m} value={i + 1}>{m}</option>
                                    ))}
                                </select>
                                <select
                                    name="birthDay"
                                    value={birthDay}
                                    onChange={(e) => setBirthDay(e.target.value)}
                                    required
                                    className={inputClass}
                                >
                                    <option value="" disabled>Day</option>
                                    {Array.from({ length: daysInMonth(birthMonth, birthYear) }, (_, i) => i + 1).map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                                <select
                                    name="birthYear"
                                    value={birthYear}
                                    onChange={(e) => setBirthYear(e.target.value)}
                                    required
                                    className={inputClass}
                                >
                                    <option value="" disabled>Year</option>
                                    {yearOptions.map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label text="Gender" />
                            <select name="gender" value={regform.gender} onChange={handleChange} className={inputClass}>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Transgender">Transgender</option>
                                <option value="Others">Others</option>
                            </select>
                        </div>
                    </div>

                    <StudentAddress 
                        regform={regform} 
                        setRegForm={setRegForm} 
                        handleChange={handleChange} 
                    />

                    <div className="space-y-6 pt-4 border-t border-slate-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Email with Inline Validation Error UI */}
                            <div className="space-y-1">
                                <Label text="Email Address" required />
                                <div className="relative flex items-center">
                                    <div className="absolute left-4 text-slate-400 pointer-events-none">
                                        <Mail size={18} />
                                    </div>
                                    <input 
                                        type="email" 
                                        name="email" 
                                        value={regform.email} 
                                        onChange={handleChange} 
                                        required 
                                        className={`${inputClass} pl-12 ${showEmailError ? 'border-red-500 focus:border-red-500' : ''}`} 
                                    />
                                </div>
                                {showEmailError && (
                                    <span className="text-[9px] font-black text-red-500 uppercase tracking-tighter ml-2">
                                        Please enter a valid email format (e.g., name@domain.com)
                                    </span>
                                )}
                            </div>

                            {/* Contact */}
                            <div className="space-y-1">
                                <Label text="Contact Number" required />
                                <div className="relative flex items-center">
                                    <div className="absolute left-4 flex items-center gap-2 pointer-events-none border-r border-slate-200 pr-3">
                                        <img src="/ph.svg" alt="PH" className="w-6 h-4 object-contain" />
                                        <span className="text-xs font-bold text-slate-500">+63</span>
                                    </div>
                                    <input 
                                        type="text" 
                                        name="contactNumber" 
                                        value={regform.contactNumber} 
                                        onChange={handleChange} 
                                        required 
                                        placeholder="9XXXXXXXXX" 
                                        className={`${inputClass} pl-28`} 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Passwords */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label text="Password" required />
                                <RegisterPassField 
                                    name="password" 
                                    value={regform.password} 
                                    onChange={handleChange} 
                                    showStrength={true} 
                                />
                            </div>
                            <div className="space-y-1">
                                <Label text="Confirm Password" required />
                                <RegisterPassField 
                                    name="confirmPassword" 
                                    value={regform.confirmPassword} 
                                    onChange={handleChange} 
                                    error={showMismatch} 
                                />
                                {showMismatch && (
                                    <span className="text-[9px] font-black text-red-500 uppercase tracking-tighter ml-2">
                                        Passwords do not match
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <RegisterActions 
                        loading={false} // Handled by custom loader overlay popup above
                        acceptedTerms={acceptedTerms} 
                        onShowTerms={() => setShowTerms(true)} 
                        disabled={isFormInvalid || !acceptedTerms} 
                    />
                </form>
            </div>

            <TermsModal 
                isOpen={showTerms} 
                onClose={() => setShowTerms(false)} 
                onAccept={() => {setAcceptedTerms(true); setShowTerms(false);}} 
            />

            <SuccessModal 
                isOpen={showSuccess} 
                onConfirm={() => {setShowSuccess(false); navigate("/student-login");}} 
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