import React, { useState, useEffect } from "react";
import { Eye, EyeOff, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";

export default function RegisterPassField({ label, name, value, onChange, placeholder, error, showStrength = false }) {
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState({ score: 0, label: "Empty", color: "bg-slate-700" });

  useEffect(() => {
    if (!showStrength) return;
    
    const calculateStrength = (pass) => {
      if (!pass) return { score: 0, label: "Empty", color: "bg-slate-700" };
      
      let score = 0;
      if (pass.length >= 8) score++; // Length 8+
      if (/[A-Z]/.test(pass)) score++; // Has Uppercase
      if (/[0-9]/.test(pass)) score++; // Has Number
      if (/[@$!%*?&]/.test(pass)) score++; // Has Special Char
      if (pass.length > 12) score = 0; // Penalize if over 12 (as per your specific rule)

      switch (score) {
        case 0: return { score: 10, label: "Invalid", color: "bg-red-500" };
        case 1: return { score: 25, label: "Weak", color: "bg-orange-500" };
        case 2: return { score: 50, label: "Fair", color: "bg-yellow-500" };
        case 3: return { score: 75, label: "Good", color: "bg-blue-400" };
        case 4: return { score: 100, label: "Strong", color: "bg-green-500" };
        default: return { score: 0, label: "Empty", color: "bg-slate-700" };
      }
    };

    setStrength(calculateStrength(value));
  }, [value, showStrength]);

  return (
    <div className="flex flex-col w-full space-y-1">
      <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest ml-1">
        {label}
      </label>
      
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder || "••••••••"}
          className={`block w-full p-4 pr-12 bg-white/5 border rounded-2xl text-white transition-all outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-600 ${
            error ? "border-red-500/50 bg-red-500/10" : "border-white/10 hover:border-white/20"
          }`}
        />

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-blue-400 transition-colors"
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      {/* Real-time Strength Meter */}
      {showStrength && value && (
        <div className="px-1 mt-2 space-y-1.5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              {strength.score >= 75 ? <ShieldCheck size={12} className="text-green-500" /> : <ShieldAlert size={12} className="text-slate-500" />}
              <span className="text-[9px] font-black uppercase tracking-tighter text-slate-400">Security: <span className={strength.label === "Strong" ? "text-green-500" : "text-white"}>{strength.label}</span></span>
            </div>
            <span className="text-[9px] font-bold text-slate-500">{value.length}/12</span>
          </div>
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ease-out ${strength.color}`} 
              style={{ width: `${strength.score}%` }}
            />
          </div>
        </div>
      )}

      {error && <p className="text-[10px] text-red-400 mt-1 ml-1 font-bold italic tracking-wide">{error}</p>}
    </div>
  );
}