import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import NET from "vanta/src/vanta.net";
import * as THREE from "three";
import api from "./api";
import RegisterPassField from "./RegisterPassField";
import TermsModal from "./TermsModal"; 

export default function StudentRegister() {
    const navigate = useNavigate();
    const vantaRef = useRef(null);
    const [vantaEffect, setVantaEffect] = useState(null);
    const [reportCardFile, setReportCardFile] = useState(null);
    const [goodMoralFile, setGoodMoralFile] = useState(null);
    const [coeFile, setCoeFile] = useState(null);
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const [regform, setRegForm] = useState({
        firstName: '', middleName: '', lastName: '', suffix: '',
        birthDate: '', gender: 'Male', contactNumber: '', gwa: '',
        email: '', password: '', confirmPassword: '', academic_category: 'Tertiary'
    });

    const isHigherEd = ["Senior High", "Tertiary"].includes(regform.academic_category);
const isLowerEd = ["Elementary", "Junior High"].includes(regform.academic_category);

   // This allows 8 or more characters, requiring 1 Uppercase, 1 Lowercase, 1 Number, and 1 Special Char
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    const isPasswordValid = passwordRegex.test(regform.password || "");
    const passwordsMatch = regform.password === "" || regform.password === regform.confirmPassword;
    


    //file uploaded check id....
   const handleFileChange = (e, type) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // 1. Size Check
    if (selectedFile.size > 5 * 1024 * 1024) {
        alert("File too large. Max 5MB.");
        e.target.value = "";
        return;
    }

    // 2. Strict PDF Check
    if (selectedFile.type !== 'application/pdf') {
        alert("Please upload a PDF file only.");
        e.target.value = ""; 
        return;
    }

    // State assignment...
    if (type === 'grades') setFile(selectedFile);
    else if (type === 'report_card') setReportCardFile(selectedFile);
    else if (type === 'good_moral') setGoodMoralFile(selectedFile);
    else if (type === 'coe') setCoeFile(selectedFile);
};



    const handleChange = (e) => {
        const { name, value } = e.target;
        // Names: No numbers/specials
        if (["firstName", "middleName", "lastName"].includes(name)) {
            const lettersOnly = value.replace(/[^a-zA-Z\s-]/g, "");
            setRegForm(prev => ({ ...prev, [name]: lettersOnly }));
            return;
        }
        // Suffix: Roman Numerals/Titles only
        if (name === "suffix") {
            const romanOnly = value.replace(/[^ivxlcIVXLC\s.jrSR]/g, "");
            setRegForm(prev => ({ ...prev, [name]: romanOnly }));
            return;
        }
        // Contact: Force start with 9
        if (name === "contactNumber") {
            let val = value.replace(/\D/g, "");
            if (val.length > 0 && val[0] !== '9') return;
            if (val.length <= 10) setRegForm(prev => ({ ...prev, contactNumber: val }));
            return;
        }
        if (name === "gwa") {
        // Remove everything except numbers and a single decimal point
        let val = value.replace(/[^0-9.]/g, "");

        // Prevent more than one decimal point
        const dots = (val.match(/\./g) || []).length;
        if (dots > 1) return;

        // Regex: Allows empty (for backspace), or 1-5 with up to 2 decimals
        // Validates formats like "1", "1.", "1.2", "1.25"
        const isValidFormat = /^(|[1-5](\.\d{0,2})?)$/.test(val);

        if (isValidFormat) {
            // Block if the number is mathematically > 5.00 (like 5.1)
            if (val !== "" && val !== "." && parseFloat(val) > 5.00) return;

            setRegForm(prev => ({ ...prev, [name]: val }));
        }
        return; // Stop here for GWA
    }
       

    
        setRegForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isPasswordValid || !acceptedTerms || !passwordsMatch) return;
    setLoading(true);

   try {
        const formData = new FormData();
        
        Object.keys(regform).forEach(key => {
            if (key === 'gwa' && isLowerEd){
                return; // Skip GWA if not Senior High or Tertiary
            } 

            if (key === 'birthDate') {
                formData.append('sbirth_date', regform[key]);
                
            } else if (key === 'contactNumber') {
                formData.append(key, `+63${regform[key]}`);
            } else {
                formData.append(key, regform[key]);
            }
        });
        

        // Add Logic for new files
        if (coeFile) formData.append("coe", coeFile);
        
        if (isHigherEd) {
            if (file) formData.append("document", file); // Grade Slip
        } else {
            // You'll need to create new states for these two files (e.g., reportCardFile, goodMoralFile)
            if (reportCardFile) formData.append("reportCard", reportCardFile);
            if (goodMoralFile) formData.append("goodMoral", goodMoralFile);
        }

        await api.post('/register', formData);
       setShowSuccess(true);
        
    } catch (err) {
        alert(err.response?.data?.error || "Registration failed.");
    } finally { setLoading(false); }
};

    useEffect(() => {
        if (!vantaEffect && vantaRef.current) {
            setVantaEffect(NET({
                el: vantaRef.current, THREE, mouseControls: true, touchControls: true,
                minHeight: 200, color: 0x3b82f6, backgroundColor: 0x0f172a,
                points: 10, maxDistance: 20, spacing: 18
            }));
        }
        return () => vantaEffect?.destroy();
    }, [vantaEffect]);

    const Label = ({ text, required }) => (
        <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest ml-1">
            {text} {required && <span className="text-red-500">*</span>}
        </label>
    );
        console.log({
  loading,
  passwordsMatch,
  acceptedTerms,
  isPasswordValid
});
    return (
        <div ref={vantaRef} className="min-h-screen w-full flex items-center justify-center p-4">
            <div className="w-full max-w-4xl bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] shadow-2xl p-8 max-h-[95vh] overflow-y-auto custom-scrollbar">
                <button 
        type="button"
        onClick={() => navigate(-1)} 
        className="absolute top-8 right-8 p-2 text-slate-400 hover:text-white hover:bg-red-500/20 rounded-xl transition-all duration-300 border border-transparent hover:border-red-500/30"
    >
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round"
        >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
    </button>
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black text-white tracking-tight mb-2 italic">Kyus<span className="text-blue-500">ISKO</span></h1>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest text-center">Create KyusISKO Account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* ROW 1: Names */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-1"><Label text="First Name" required /><input type="text" name="firstName" value={regform.firstName} onChange={handleChange} required className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-blue-500" /></div>
                        <div className="space-y-1"><Label text="Middle Name" /><input type="text" name="middleName" value={regform.middleName} onChange={handleChange} placeholder="Optional" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none" /></div>
                        <div className="space-y-1"><Label text="Last Name" required /><input type="text" name="lastName" value={regform.lastName} onChange={handleChange} required className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-blue-500" /></div>
                        <div className="space-y-1"><Label text="Suffix" /><input type="text" name="suffix" value={regform.suffix} onChange={handleChange} placeholder="III / Jr" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none uppercase" /></div>
                    </div>

                    {/* ROW 2: Birth Date & Gender */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="space-y-1">
        <Label text="Birth Date" required />
        <input 
            type="date" 
            name="birthDate" 
            value={regform.birthDate} 
            onChange={handleChange} 
            required 
            className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-blue-500 [color-scheme:dark]" 
        />
    </div>
    <div className="space-y-1">
        <Label text="Gender at Birth" />
        <select 
            name="gender" 
            value={regform.gender} 
            onChange={handleChange} 
            className="w-full p-4 bg-slate-900 border border-white/10 rounded-2xl text-white outline-none appearance-none cursor-pointer"
        >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Prefer not to say</option>
        </select>
    </div>
</div>

                    {/* ROW 3: Contact Number */}
                    <div className="space-y-1">
                        <Label text="Contact Number" required />
                        <div className="relative flex items-center group">
                            <div className="absolute left-4 flex items-center pointer-events-none border-r border-white/10 pr-3">
                                <img src="/ph.svg" alt="PH" className="w-5 h-auto rounded-sm shadow-sm" />
                                <span className="ml-2 text-xs font-bold text-slate-400">+63</span>
                            </div>
                            <input type="text" name="contactNumber" value={regform.contactNumber} onChange={handleChange} required placeholder="9XXXXXXXXX" className="w-full p-4 pl-24 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                        </div>
                    </div>

                    {/* ROW 4: Academic Level Selection */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="space-y-1">
        <Label text="Academic Level" required />
        <select 
            name="academic_category" 
            value={regform.academic_category} 
            onChange={handleChange} 
            className="w-full p-4 bg-slate-900 border border-white/10 rounded-2xl text-white outline-none appearance-none cursor-pointer"
        >
            <option value="Elementary">Elementary</option>
            <option value="Junior High">Junior High</option>
            <option value="Senior High">Senior High</option>
            <option value="Tertiary">Tertiary</option>
        </select>
    </div>

    {/* SHOW GWA ONLY FOR SHS AND TERTIARY */}
    {isHigherEd && (
        <div className="space-y-1">
            <Label text="GWA (x.xx)" required />
            <input 
                type="text" 
                name="gwa" 
                value={regform.gwa} 
                onChange={handleChange} 
                required 
                placeholder="1.00" 
                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none" 
            />
        </div>
    )}
</div>

{/* ROW 5: Documents (Conditional) */}
<div className="grid grid-cols-1 gap-4">
    {/* HIGHER ED: Show TOR/Grade Slip */}
    {isHigherEd && (
        <div className="p-4 bg-white/5 rounded-2xl border border-dashed border-white/20">
            <Label text="Grade Slip / TOR (PDF)" required />
            <input 
                type="file" 
                accept="application/pdf" 
                onChange={(e) => handleFileChange(e, 'grades')} 
                className="block w-full text-[10px] text-slate-400 mt-2 file:bg-blue-600 file:text-white file:border-0 file:px-3 file:py-1 file:rounded-full" 
            />
        </div>
    )}

    {/* LOWER ED: Show Report Card and Good Moral */}
    {isLowerEd && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white/5 rounded-2xl border border-dashed border-white/20">
                <Label text="Report Card (PDF)" required />
                <input 
                    type="file" 
                    accept="application/pdf" 
                    onChange={(e) => handleFileChange(e, 'report_card')} 
                    className="block w-full text-[10px] text-slate-400 mt-2 file:bg-blue-600 file:text-white file:border-0 file:px-3 file:py-1 file:rounded-full" 
                />
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-dashed border-white/20">
                <Label text="Good Moral (PDF)" required />
                <input 
                    type="file" 
                    accept="application/pdf" 
                    onChange={(e) => handleFileChange(e, 'good_moral')} 
                    className="block w-full text-[10px] text-slate-400 mt-2 file:bg-blue-600 file:text-white file:border-0 file:px-3 file:py-1 file:rounded-full" 
                />
            </div>
        </div>
    )}
</div>

                    {/* ROW 5: COE */}
                    <div className="p-4 bg-white/5 rounded-2xl border border-dashed border-white/20">
                        <Label text="Certificate of Enrollment/COE (PDF)" required />
                        <input type="file" accept="application/pdf" onChange={(e) => handleFileChange(e, 'coe')} className="block w-full text-[10px] text-slate-400 mt-2 file:bg-blue-600 file:text-white file:border-0 file:px-3 file:py-1 file:rounded-full cursor-pointer" />
                    </div>

                    {/* ROW 6: Email & Password */}
                    <div className="space-y-4 pt-4 border-t border-white/10">
                        <div className="space-y-1"><Label text="Email Address" required /><input type="email" name="email" value={regform.email} onChange={handleChange} required className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500" /></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1"><Label text="Password" required /><RegisterPassField name="password" value={regform.password} onChange={handleChange} showStrength={true} /><p className="text-[9px] text-slate-500 mt-1">
    Min. 8 chars, must include Uppercase, Number, and Symbol (@$!%*?&)
</p></div>
                            
                            <div className="space-y-1"><Label text="Confirm Password" required /><RegisterPassField name="confirmPassword" value={regform.confirmPassword} onChange={handleChange} error={!passwordsMatch ? "Passwords do not match" : ""} /></div>
                        </div>  
                    </div>

                    {/* Footer Actions */}
                    <div className="flex flex-col items-center py-4 space-y-4">
                         <button type="button" onClick={() => setShowTerms(true)} className={`text-[10px] font-black uppercase tracking-widest transition-colors ${acceptedTerms ? 'text-green-400' : 'text-blue-400 hover:text-white'}`}>
                            {acceptedTerms ? "✓ Terms Accepted" : "Read Terms of Service"}
                        </button>
                        <button type="submit" disabled={loading || !passwordsMatch || !acceptedTerms || !isPasswordValid } className="w-full py-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-20 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20">
                            {loading ? "Processing..." : "Register Account"}
                        </button>
                    </div>
                </form>
            </div>

            <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} onAccept={() => { setAcceptedTerms(true); setShowTerms(false); }} />
                <SuccessModal 
            isOpen={showSuccess} 
            onConfirm={() => navigate("/student-login")} 
        />

        <TermsModal 
            isOpen={showTerms} 
            onClose={() => setShowTerms(false)} 
            onAccept={() => { setAcceptedTerms(true); setShowTerms(false); }} 
        />
        </div>
    );
}

function SuccessModal({ isOpen, onConfirm }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
            <div className="w-full max-w-md bg-white rounded-[2.5rem] p-8 text-center shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                </div>
                
                <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Registration Received!</h2>
                
                <div className="space-y-4 mb-8">
                    <p className="text-slate-500 font-medium leading-relaxed">
                        Your account is currently <span className="text-blue-600 font-bold underline decoration-2 underline-offset-4">Under Review</span>.
                    </p>
                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                        <p className="text-xs text-blue-700 font-bold leading-relaxed">
                            Our team will verify your documents shortly. Please check your email regularly for status updates.
                        </p>
                    </div>
                </div>

                <button 
                    onClick={onConfirm}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
                >
                    Proceed to Login
                </button>
            </div>
        </div>
    );
}