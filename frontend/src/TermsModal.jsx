import React, { useRef, useState } from "react";

export default function TermsModal({ isOpen, onClose, onAccept }) {
    const scrollRef = useRef(null);
    const [hasReadToBottom, setHasReadToBottom] = useState(false);

    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            if (scrollTop + clientHeight >= scrollHeight - 10) setHasReadToBottom(true);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md">
            <div className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl flex flex-col">
                <h3 className="text-2xl font-black text-white mb-2 italic">Terms of Service</h3>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-6">Scroll to the bottom to unlock</p>
                
                <div ref={scrollRef} onScroll={handleScroll} className="max-h-80 overflow-y-auto text-slate-300 text-sm space-y-4 pr-4 custom-scrollbar leading-relaxed">
                    <p><strong>1. Privacy:</strong> Your data is used only for scholarship matching.</p>
                    <p><strong>2. Accuracy:</strong> You certify that all documents are 100% authentic.</p>
                    <p><strong>3. Security:</strong> Keep your credentials safe; do not share your KyusIsko access.</p>
                    <p><strong>4. Verification:</strong> We reserve the right to contact your school for grade validation.</p>
                    <p><strong>4. Verification:</strong> We reserve the right to contact your school for grade validation.</p>
                    <p><strong>4. Verification:</strong> We reserve the right to contact your school for grade validation.</p>
                    <div className="h-4 w-full"></div>
                </div>

                <div className="flex gap-4 mt-8">
                    <button onClick={onClose} className="flex-1 py-4 text-slate-400 font-bold hover:text-white transition-colors">Cancel</button>
                    <button 
                        disabled={!hasReadToBottom} 
                        onClick={onAccept} 
                        className={`flex-[2] py-4 rounded-xl font-black uppercase tracking-widest transition-all ${hasReadToBottom ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/5 text-slate-700 cursor-not-allowed'}`}
                    >
                        {hasReadToBottom ? "I Agree" : "Scroll Down"}
                    </button>
                </div>
            </div>
        </div>
    );
}