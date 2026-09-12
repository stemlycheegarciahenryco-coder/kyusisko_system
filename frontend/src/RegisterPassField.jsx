import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Check, X, Key } from "lucide-react";
import PasswordValidator from "password-validator";

const passwordSchema = new PasswordValidator();
passwordSchema
    .is().min(12)                
    .is().max(18)                
    .has().uppercase()           
    .has().lowercase()           
    .has().digits(1)             
    .has().symbols(1)            
    .has().not().spaces();       

const REQUIREMENT_DEFS = [
    { rules: ["min", "max"], label: "12-18 Characters" },
    { rules: ["uppercase"], label: "One Uppercase" },
    { rules: ["digits"], label: "One Number" },
    { rules: ["symbols"], label: "One Special Char" },
];

export default function RegisterPassField({ name, value = "", onChange, placeholder, error, showStrength = false }) {
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState({ score: 0, label: "Empty", color: "bg-slate-200" });

  const failedRules = value ? passwordSchema.validate(value, { list: true }) : ["min", "max", "uppercase", "lowercase", "digits", "symbols"];
  const requirements = REQUIREMENT_DEFS.map(({ rules, label }) => ({
      label,
      met: rules.every(rule => !failedRules.includes(rule)),
  }));

  useEffect(() => {
    if (!showStrength) return;
    
    const calculateStrength = (pass) => {
      if (!pass) return { score: 0, label: "Empty", color: "bg-slate-200" };
      let score = requirements.filter(req => req.met).length;

      switch (score) {
        case 0: return { score: 10, label: "Invalid", color: "bg-red-500" };
        case 1: return { score: 25, label: "Weak", color: "bg-orange-500" };
        case 2: return { score: 50, label: "Fair", color: "bg-yellow-500" };
        case 3: return { score: 75, label: "Good", color: "bg-[#093fb4]" };
        case 4: return { score: 100, label: "Strong", color: "bg-emerald-500" };
        default: return { score: 0, label: "Empty", color: "bg-slate-200" };
      }
    };

    setStrength(calculateStrength(value));
  }, [value, showStrength, requirements]);

  return (
    <div className="flex flex-col w-full">
      <div className="relative group">
        <Key size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 group-focus-within:text-[#093fb4] transition-colors z-10" />
        
        <input
          type={showPassword ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          maxLength={18}
          placeholder={placeholder || "••••••••"}
          className={`w-full pl-12 pr-12 py-3.5 bg-white/60 border-2 border-white/80 rounded-2xl focus:bg-white focus:border-[#093fb4] outline-none transition-all placeholder:text-black/30 font-bold text-slate-900 text-base shadow-sm ${error ? "border-[#FF1E1E] focus:border-[#FF1E1E]" : ""}`}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-black/30 hover:text-[#093fb4] transition-colors"
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      {showStrength && value.length > 0 && (
        <div className="px-1 mt-4 space-y-2.5">
          {/* Requirement Checklist (High contrast text) */}
          <div className="grid grid-cols-2 gap-y-1.5">
            {requirements.map((req, i) => (
              <div key={i} className="flex items-center gap-2">
                {req.met ? (
                  <Check size={14} strokeWidth={3} className="text-emerald-600" />
                ) : (
                  <X size={14} strokeWidth={3} className="text-slate-500" />
                )}
                <span className={`text-[10px] font-black uppercase tracking-wide ${req.met ? "text-emerald-700" : "text-slate-700"}`}>
                  {req.label}
                </span>
              </div>
            ))}
          </div>

          {/* Strength Bar & Meta (High contrast text) */}
          <div className="flex justify-between items-center pt-2 border-t border-black/10">
            <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider">
              Security: <span className={strength.score === 100 ? "text-emerald-600 font-black" : "text-slate-900 font-black ml-1"}>{strength.label}</span>
            </span>
            <span className="text-[10px] font-black text-slate-700">{value.length} chars</span>
          </div>
          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden shadow-inner">
            <div 
              className={`h-full transition-all duration-500 ease-out ${strength.color}`} 
              style={{ width: `${strength.score}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );  
}