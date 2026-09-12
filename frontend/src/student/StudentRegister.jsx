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

    // UI HELPER COMPONENTS - ALIGNED WITH LOGIN.JSX
    const Label = ({ text, required }) => (
        <label className="text-xs font-black text-slate-800 uppercase tracking-wider ml-1 block mb-2">
            {text} {required && <span className="text-[#FF1E1E]">*</span>}
        </label>
    );

    const inputClass = "w-full pl-4 pr-4 py-3.5 bg-white/60 border-2 border-white/80 rounded-2xl focus:bg-white focus:border-[#093fb4] outline-none transition-all placeholder:text-black/30 font-bold text-slate-900 text-base shadow-sm";

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-[#FFFCFB] font-sans">
            
            {/* Background Image (Identical to LogIn.jsx) */}
            <div 
              className="absolute inset-0 bg-no-repeat bg-cover bg-center pointer-events-none"
              style={{ backgroundImage: `url('/bg2.png')` }}
            />

            {/* POPUP FULLSCREEN LOADING OVERLAY */}
            {(loading || verifying) && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-xs z-50 flex flex-col items-center justify-center">
                    <div className="bg-white px-8 py-6 rounded-[2rem] shadow-2xl flex items-center gap-4 border border-white">
                        <Loader2 className="animate-spin text-[#093FB4]" size={36} />
                        <div>
                            <p className="text-slate-900 font-black text-sm uppercase tracking-wide">Processing Request...</p>
                            <p className="text-slate-500 font-bold text-xs mt-0.5">Please wait a moment.</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="w-full max-w-4xl bg-white/70 backdrop-blur-xl border border-white/40 rounded-[2.5rem] shadow-2xl p-8 sm:p-10 max-h-[95vh] overflow-y-auto relative z-10 custom-scrollbar">
                
                <button 
    type="button" 
    onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = '/';
    }} 
    className="absolute top-7 right-7 text-black/30 hover:text-[#FF1E1E] transition-colors p-1 cursor-pointer z-50"
>
    <X size={24} strokeWidth={2.5} />
</button>

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
                                <Label text="First Name" required />
                                <input type="text" name="firstName" placeholder="Juan" value={regform.firstName} onChange={handleChange} required className={inputClass} />
                            </div>
                            <div>
                                <Label text="Middle Name" />
                                <input type="text" name="middleName" placeholder="Optional" value={regform.middleName} onChange={handleChange} className={inputClass} />
                            </div>
                            <div>
                                <Label text="Last Name" required />
                                <input type="text" name="lastName" placeholder="Dela Cruz" value={regform.lastName} onChange={handleChange} required className={inputClass} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
                            <div>
                                <Label text="Suffix" />
                                <input type="text" name="suffix" placeholder="Jr, Sr (Optional)" value={regform.suffix} onChange={handleChange} className={`${inputClass} uppercase`} />
                            </div>
                            
                            {/* Birthdate Dropdowns */}
                            <div>
                                <Label text="Birth Date" required />
                                <div className="grid grid-cols-3 gap-2">
                                    <select name="birthMonth" value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)} required className={`${inputClass} px-2`}>
                                        <option value="" disabled>MM</option>
                                        {monthNames.map((m, i) => <option key={m} value={i + 1}>{m.substring(0,3)}</option>)}
                                    </select>
                                    <select name="birthDay" value={birthDay} onChange={(e) => setBirthDay(e.target.value)} required className={`${inputClass} px-2`}>
                                        <option value="" disabled>DD</option>
                                        {Array.from({ length: daysInMonth(birthMonth, birthYear) }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                    <select name="birthYear" value={birthYear} onChange={(e) => setBirthYear(e.target.value)} required className={`${inputClass} px-2`}>
                                        <option value="" disabled>YYYY</option>
                                        {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                            </div>
                            
                            <div>
                                <Label text="Gender" />
                                <select name="gender" value={regform.gender} onChange={handleChange} className={inputClass}>
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
                        {/* StudentAddress handles its own grid, but we pass the updated regform */}
                        <StudentAddress 
                            regform={regform} 
                            setRegForm={setRegForm} 
                            handleChange={handleChange} 
                        />
                    </div>

                    {/* CREDENTIALS SECTION */}
                    <div>
                        <p className="text-xs font-black text-[#093FB4] uppercase tracking-widest mb-4 border-b border-black/5 pb-2">
                            Account Credentials
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* Email Field - Styled exactly like LogIn.jsx */}
                            <div>
                                <Label text="Email Address" required />
                                <div className="relative group">
                                    <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 group-focus-within:text-[#093fb4] transition-colors" />
                                    <input 
                                        type="email" 
                                        name="email" 
                                        placeholder="email@example.com"
                                        value={regform.email} 
                                        onChange={handleChange} 
                                        required 
                                        className={`${inputClass} pl-12 ${showEmailError ? 'border-[#FF1E1E] focus:border-[#FF1E1E]' : ''}`} 
                                    />
                                </div>
                                {showEmailError && (
                                    <span className="text-[10px] font-black text-[#FF1E1E] uppercase tracking-wider ml-2 mt-2 block">
                                        Invalid email format
                                    </span>
                                )}
                            </div>

                            {/* Contact Field */}
                            <div>
                                <Label text="Contact Number" required />
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
                                        required 
                                        placeholder="9XXXXXXXXX" 
                                        className={`${inputClass} pl-28`} 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Passwords */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            <div>
                                <Label text="Password" required />
                                <RegisterPassField 
                                    name="password" 
                                    value={regform.password} 
                                    onChange={handleChange} 
                                    showStrength={true} 
                                />
                            </div>
                            <div>
                                <Label text="Confirm Password" required />
                                <RegisterPassField 
                                    name="confirmPassword" 
                                    value={regform.confirmPassword} 
                                    onChange={handleChange} 
                                    error={showMismatch} 
                                />
                                {showMismatch && (
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
                onAccept={() => {setAcceptedTerms(true); setShowTerms(false);}} 
            />

            <SuccessModal 
                isOpen={showSuccess} 
                onConfirm={() => {setShowSuccess(false); navigate("/login");}} 
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