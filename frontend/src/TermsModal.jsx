import React, { useRef, useState } from "react";

export default function TermsModal({ isOpen, onClose, onAccept }) {
    const scrollRef = useRef(null);
    const [hasReadToBottom, setHasReadToBottom] = useState(false);
    const [isCheck, setIsCheck] = useState(false);

    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            // Checks if user is within 10px of the bottom
            if (scrollTop + clientHeight >= scrollHeight - 10) setHasReadToBottom(true);
        }
    };

    if (!isOpen) return null;

    const canAccept = hasReadToBottom && isCheck;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <div className="bg-white border border-black/10 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl flex flex-col">
                <h3 className="text-2xl font-black text-[#093FB4] mb-2 uppercase tracking-tighter italic">
                    Terms of Service
                </h3>
                <p className="text-black/40 text-[10px] font-black uppercase tracking-widest mb-6">
                    {hasReadToBottom ? "Please check the box to continue" : "Scroll to the bottom to unlock"}
                </p>
                
                <div 
                    ref={scrollRef} 
                    onScroll={handleScroll} 
                    className="max-h-80 overflow-y-auto text-black text-sm space-y-4 pr-4 border-b border-black/5 pb-4 leading-relaxed whitespace-pre-line"
                >
                    <span className="font-black block text-center mb-4 uppercase tracking-wider underline">
                        KYUSISKO USER AGREEMENT{"\n"}(Terms and Conditions)
                    </span>

                    <p className="font-bold">1. Introduction</p>
                    Welcome to KyusISKO: Scholarship and Financial Aid Recommendation and Management System. By accessing and using this platform, you agree to comply with and be bound by the following Terms and Conditions.

                    <p className="font-bold">2. Purpose of the System</p>
                    KyusISKO provides a centralized platform for students to access scholarship information and receive recommendations based on qualifications.

                    <p className="font-bold">3. User Roles and Responsibilities</p>
                    3.1 Students: Provide accurate, updated personal and academic information.
                    3.2 Organizations: Ensure all posted opportunities are legitimate.
                    3.3 Administrators: Manage system data and monitor activity.

                    <p className="font-bold">4. Data Privacy and Protection</p>
                    KyusISKO protects user data in accordance with privacy principles. Personal info is used solely for scholarship matching and is not shared with unauthorized third parties.

                    <p className="font-bold">5. Document Verification</p>
                    The system uses automated tools (including Google Gemini API) to analyze documents. Final decisions are made by administrators or organizations.

                    <p className="font-bold">6. System Limitations</p>
                    The system does not guarantee approval or acceptance. Recommendations depend on user accuracy.

                    <p className="font-bold">7. Acceptable Use Policy</p>
                    Users must not provide false info or attempt unauthorized access. Violation results in termination.

                    <p className="font-bold">8. Intellectual Property</p>
                    Content is the property of the KyusISKO development team.

                    <p className="font-bold">9. Disclaimer</p>
                    KyusISKO is not liable for scholarship outcomes or technical downtime.

                    <p className="font-bold">10. Modifications</p>
                    Terms may be updated at any time.

                    <p className="font-bold">11. Acceptance</p>
                    By using KyusISKO, users confirm they have read and agreed to these Terms.
                </div>

                {/* Checkbox Section */}
                <div className="flex items-center gap-3 mt-6 p-4 bg-black/5 rounded-2xl border border-black/5">
                    <input 
                        type="checkbox" 
                        id="terms-check"
                        checked={isCheck}
                        onChange={(e) => setIsCheck(e.target.checked)}
                        className="w-5 h-5 rounded border-black/20 text-[#093FB4] focus:ring-[#093FB4] cursor-pointer"
                    />
                    <label htmlFor="terms-check" className="text-[11px] font-black text-black cursor-pointer uppercase tracking-tight">
                        I have read and understood the terms and conditions.
                    </label>
                </div>

                <div className="flex gap-4 mt-8">
                    <button 
                        onClick={onClose} 
                        className="flex-1 py-4 text-black/60 font-black hover:text-red-600 transition-colors uppercase text-xs tracking-widest"
                    >
                        Cancel
                    </button>
                    <button 
                        disabled={!canAccept} 
                        onClick={onAccept} 
                        className={`flex-[2] py-4 rounded-xl font-black uppercase tracking-widest transition-all text-xs ${
                            canAccept 
                            ? 'bg-[#093FB4] text-white shadow-lg scale-105 active:scale-95' 
                            : 'bg-black/5 text-black/20 cursor-not-allowed'
                        }`}
                    >
                        {!hasReadToBottom ? "Scroll Down" : !isCheck ? "Check Box" : "I Agree"}
                    </button>
                </div>
            </div>
        </div>
    );
}