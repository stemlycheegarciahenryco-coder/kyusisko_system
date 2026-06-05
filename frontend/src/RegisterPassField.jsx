import React, { useState, useEffect } from "react";
import { Eye, EyeOff, ShieldCheck, ShieldAlert, Check, X } from "lucide-react";

export default function RegisterPassField({ name, value = "", onChange, placeholder, error, showStrength = false }) {
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState({ score: 0, label: "Empty", color: "bg-slate-200" });

  const requirements = [
    { label: "8+ Characters", met: value.length >= 8 },
    { label: "One Uppercase", met: /[A-Z]/.test(value) },
    { label: "One Number", met: /[0-9]/.test(value) },
    { label: "One Special Char", met: /[@$!%*?&]/.test(value) },
  ];

  useEffect(() => {
    if (!showStrength) return;
    
    const calculateStrength = (pass) => {
      if (!pass) return { score: 0, label: "Empty", color: "bg-slate-200" };
      let score = requirements.filter(req => req.met).length;

      switch (score) {
        case 0: return { score: 10, label: "Invalid", color: "bg-red-500" };
        case 1: return { score: 25, label: "Weak", color: "bg-orange-500" };
        case 2: return { score: 50, label: "Fair", color: "bg-yellow-500" };
        case 3: return { score: 75, label: "Good", color: "bg-blue-400" };
        case 4: return { score: 100, label: "Strong", color: "bg-green-500" };
        default: return { score: 0, label: "Empty", color: "bg-slate-200" };
      }
    };

    setStrength(calculateStrength(value));
  }, [value, showStrength]);

  return (
    <div className="flex flex-col w-full">
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder || "••••••••"}
          className={`w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-black outline-none focus:border-[#093FB4] focus:bg-white transition-all text-sm pr-12 ${error ? "border-red-500 bg-red-50" : ""}`}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-[#093FB4] transition-colors"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {showStrength && value.length > 0 && (
        <div className="px-1 mt-3 space-y-2">
          {/* Requirement Checklist */}
          <div className="grid grid-cols-2 gap-y-1">
            {requirements.map((req, i) => (
              <div key={i} className="flex items-center gap-1.5">
                {req.met ? <Check size={10} className="text-green-500" /> : <X size={10} className="text-black-300" />}
                <span className={`text-[8px] font-bold uppercase tracking-tight ${req.met ? "text-green-600" : "text-black-400"}`}>
                  {req.label}
                </span>
              </div>
            ))}
          </div>

          {/* Strength Bar */}
          <div className="flex justify-between items-center pt-1">
            <span className="text-[8px] font-black uppercase text-slate-500">
              Security: <span className={strength.score === 100 ? "text-green-600" : "text-black"}>{strength.label}</span>
            </span>
            <span className="text-[8px] font-black text-slate-400">{value.length} chars</span>
          </div>
          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
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