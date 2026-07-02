import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { X, Mail } from "lucide-react";
import RegisterPassField from "../RegisterPassField";
import TermsModal from "../TermsModal"; 
import { SuccessModal, ErrorModal, OtpModal } from "../component/RegisterModals";
import RegisterActions from "../component/RegisterActions";
import StudentAddress from "../student/StudentAddress";

export default function StudentRegister() {
    const navigate = useNavigate();
    
    // UI States
    const [loading, setLoading] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // Verification States
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [verifying, setVerifying] = useState(false);

    const [regform, setRegForm] = useState({
        firstName: '', middleName: '', lastName: '', suffix: '',
        birthDate: '', gender: 'Male', contactNumber: '', 
        district: '', barangay: '', street: '', zipCode: '', 
        email: '', password: '', confirmPassword: ''
    });
    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    const isPasswordValid = passwordRegex.test(regform.password || "");
    const passwordsMatch = regform.password !== "" && regform.password === regform.confirmPassword;


    const showMismatch = regform.confirmPassword.length > 0 && !passwordsMatch;

  const isFormInvalid = (() => {
    const optionalFields = ["middleName", "suffix"];
    const requiredFilled = Object.entries(regform).every(([key, value]) => 
        optionalFields.includes(key) ? true : value.trim() !== ""
    );
    
    return !requiredFilled || !isPasswordValid || !passwordsMatch;
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

    // PHASE 1: User clicks Register. Validate fields then Send OTP.
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Front-end validations
        if (!isPasswordValid) {
            setErrorMessage("Password must be at least 8 characters with uppercase, lowercase, number, and symbol.");
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
            // Check if email/user exists and send OTP
            await api.post('/send-registration-otp', { email: regform.email });
            setShowOtpModal(true);
        } catch (err) {
            setErrorMessage(err.response?.data?.error || "Failed to send OTP. Please try again.");
            setShowError(true);
        } finally {
            setVerifying(false);
        }
    };

    // PHASE 2: User enters OTP in modal. Verify then finalize registration.
    const handleVerifyOtp = async (otp) => {
        setVerifying(true);
        try {
            // 1. Verify the code
            await api.post('/verify-registration-otp', { email: regform.email, otp });
            
            // 2. Code is correct, proceed to finalize registration
            setLoading(true);
            await api.post('/register', regform);
            
            setShowOtpModal(false);
            setShowSuccess(true);
        } catch (err) {
            // Usually invalid or expired OTP
            setErrorMessage(err.response?.data?.error || "Invalid OTP code.");
        setShowError(true);
        } finally {
            setVerifying(false);
            setLoading(false);
        }
    };

    const Label = ({ text, required }) => (
        <label className="text-[12px] font-bold text-black uppercase tracking-widest ml-1">
            {text} {required && <span className="text-[#FF1E1E]">*</span>}
        </label>
    );

    const inputClass = "w-full p-4 bg-white border border-slate-200 rounded-2xl text-black outline-none focus:border-[#093FB4] transition-all";

    return (
        <div 
            className="min-h-screen w-full flex items-center justify-center p-4 bg-[#FFFCFB] bg-no-repeat bg-contain bg-bottom"
            style={{ backgroundImage: `url('/bg2.png')` }}
        >
            <div className="w-full max-w-4xl bg-white/80 backdrop-blur-sm border border-slate-200 rounded-[2.5rem] shadow-2xl p-8 max-h-[95vh] overflow-y-auto relative">
                <button 
                    onClick={() => navigate("/")} 
                    className="absolute top-6 right-8 text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-slate-100 rounded-full"
                >
                    <X size={24} />
                </button>

                <div className="text-center mb-8">
                    <img src="/logo.png" alt="KyusISKO Logo" className="w-24 mx-auto mb-4" />
                    <h1 className="text-black text-[13px] font-bold uppercase tracking-widest">Student Account Registration</h1>
                </div>

                <p className="text-[14px] font-bold text-blue-900 uppercase tracking-widest mb-4">Personal Information</p>
                
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
                        <div className="space-y-1">
                            <Label text="Birth Date" required />
                            <input type="date" name="birthDate" value={regform.birthDate} onChange={handleChange} required className={inputClass} />
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
                            {/* Email */}
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
                                        className={`${inputClass} pl-12`} 
                                    />
                                </div>
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
            error={showMismatch} // This turns the field red
        />
        {showMismatch && (
            <span className="text-[10px] font-black text-red-500 uppercase tracking-tighter ml-2">
                Passwords do not match
            </span>
        )}
    </div>
</div>
                    </div>

                  <RegisterActions 
    loading={loading || verifying} 
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
    email={regform.email} // Pass the email to show the user where it was sent
    onClose={() => setShowOtpModal(false)} 
    onVerify={handleVerifyOtp} 
    loading={verifying}
/>
        </div>
    );
}