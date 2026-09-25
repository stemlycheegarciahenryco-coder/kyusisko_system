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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md">
            
            {/* Embedded CSS to guarantee a styled, thick scrollbar appears */}
            <style>
                {`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 12px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f5f9; 
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1; 
                    border-radius: 10px;
                    border: 3px solid #f1f5f9;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8; 
                }
                `}
            </style>

            <div className="bg-white border-2 border-slate-100 w-full max-w-2xl rounded-[2.5rem] p-8 md:p-10 shadow-2xl flex flex-col">
                <h3 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">
                    Terms of Service
                </h3>
                <p className="text-[#093FB4] text-xs font-black uppercase tracking-[0.2em] mb-6">
                    {hasReadToBottom ? "Please check the box below to continue" : "Scroll to the bottom to unlock"}
                </p>
                
                {/* Changed to overflow-y-scroll so the track is always visible */}
                <div 
                    ref={scrollRef} 
                    onScroll={handleScroll} 
                    className="max-h-[50vh] overflow-y-scroll pr-6 text-slate-600 text-base leading-relaxed font-medium space-y-6 border-b-2 border-slate-100 pb-8 custom-scrollbar"
                >
                    <h4 className="font-black text-center text-slate-900 text-lg uppercase tracking-widest border-b-2 border-slate-100 pb-4 mb-6">
                        KyusISKO User Agreement<br/>
                        <span className="text-sm text-[#093fb4] mt-2 block">Terms and Conditions</span>
                    </h4>

                    <div>
                        <p className="font-black text-slate-900 text-[17px] mb-2">1. Introduction</p>
                        <p>Welcome to KyusISKO: Scholarship and Financial Aid Recommendation and Management System. By accessing and using this platform, you agree to comply with and be bound by the following Terms and Conditions.</p>
                    </div>

                    <div>
                        <p className="font-black text-slate-900 text-[17px] mb-2">2. Purpose of the System</p>
                        <p>KyusISKO provides a centralized platform for students to access scholarship information and receive recommendations based on qualifications.</p>
                    </div>

                    <div>
                        <p className="font-black text-slate-900 text-[17px] mb-2">3. User Roles and Responsibilities</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong className="text-slate-800">Students:</strong> Provide accurate, updated personal and academic information.</li>
                            <li><strong className="text-slate-800">Organizations:</strong> Ensure all posted opportunities are legitimate.</li>
                            <li><strong className="text-slate-800">Administrators:</strong> Manage system data and monitor activity.</li>
                        </ul>
                    </div>

                    <div>
                        <p className="font-black text-slate-900 text-[17px] mb-2">4. Data Privacy and Protection</p>
                        <p>KyusISKO protects user data in accordance with privacy principles. Personal info is used solely for scholarship matching and is not shared with unauthorized third parties.</p>
                    </div>

                    <div>
                        <p className="font-black text-slate-900 text-[17px] mb-2">5. Document Verification</p>
                        <p>The system uses automated tools (including Google Gemini API) to analyze documents. Final decisions are made by administrators or organizations.</p>
                    </div>

                    <div>
                        <p className="font-black text-slate-900 text-[17px] mb-2">6. System Limitations</p>
                        <p>The system does not guarantee approval or acceptance. Recommendations depend on user accuracy.</p>
                    </div>

                    <div>
                        <p className="font-black text-slate-900 text-[17px] mb-2">7. Acceptable Use Policy</p>
                        <p>Users must not provide false info or attempt unauthorized access. Violation results in termination.</p>
                    </div>

                    <div>
                        <p className="font-black text-slate-900 text-[17px] mb-2">8. Intellectual Property</p>
                        <p>Content is the property of the KyusISKO development team.</p>
                    </div>

                    <div>
                        <p className="font-black text-slate-900 text-[17px] mb-2">9. Disclaimer</p>
                        <p>KyusISKO is not liable for scholarship outcomes or technical downtime.</p>
                    </div>

                    <div>
                        <p className="font-black text-slate-900 text-[17px] mb-2">10. Modifications</p>
                        <p>Terms may be updated at any time.</p>
                    </div>

                    <div>
                        <p className="font-black text-slate-900 text-[17px] mb-2">11. Acceptance</p>
                        <p>By using KyusISKO, users confirm they have read and agreed to these Terms.</p>
                    </div>
                </div>

                {/* Checkbox Section */}
                <div className="flex items-center gap-4 mt-8 p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl">
                    <input 
                        type="checkbox" 
                        id="terms-check"
                        checked={isCheck}
                        onChange={(e) => setIsCheck(e.target.checked)}
                        className="w-6 h-6 rounded-lg border-slate-300 text-[#093FB4] focus:ring-[#093FB4] cursor-pointer"
                    />
                    <label htmlFor="terms-check" className="text-sm font-black text-slate-800 cursor-pointer uppercase tracking-wider select-none">
                        I have read and understood the terms and conditions.
                    </label>
                </div>

                <div className="flex gap-4 mt-8">
                    <button 
                        onClick={onClose} 
                        className="flex-1 py-4 text-slate-500 font-black hover:text-[#FF1E1E] transition-colors uppercase text-sm tracking-widest bg-slate-50 hover:bg-red-50 rounded-2xl"
                    >
                        Cancel
                    </button>
                    <button 
                        disabled={!canAccept} 
                        onClick={onAccept} 
                        className={`flex-[2] py-4 rounded-2xl font-black uppercase tracking-widest transition-all text-sm flex items-center justify-center gap-2 ${
                            canAccept 
                            ? 'bg-[#093FB4] hover:bg-[#073496] text-white shadow-xl shadow-[#093FB4]/25 active:scale-95 cursor-pointer' 
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed border-2 border-transparent'
                        }`}
                    >
                        {!hasReadToBottom ? "Scroll to Bottom" : !isCheck ? "Check the Box" : "I Agree & Continue"}
                    </button>
                </div>
            </div>
        </div>
    );
}