export default function RegisterActions({ loading, acceptedTerms, onShowTerms, disabled }) {
    return (
        <div className="flex flex-col items-center py-4 space-y-4">
            <button 
                type="button" 
                onClick={onShowTerms} 
                className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
                    acceptedTerms ? 'text-green-500' : 'text-[#093FB4]'
                }`}
            >
                {acceptedTerms ? "✓ Terms Accepted" : "User Agreement"}
            </button>
                
            <button 
                type="submit" 
                disabled={disabled || !acceptedTerms} 
                style={{ backgroundColor: '#093FB4' }} // Using your specific Blue
                className="w-full py-5 hover:opacity-90 disabled:opacity-20 text-[#FFFCFB] rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/20"
            >
                {loading ? "Processing..." : "Create Account"}
            </button>

            {/* Example of using the Red hex for a cancel or secondary action if needed */}
            {!acceptedTerms && (
                <p className="text-[9px] font-bold text-[#FF1E1E] uppercase">
                    Please accept terms to proceed
                </p>
            )}
        </div>
    );
}