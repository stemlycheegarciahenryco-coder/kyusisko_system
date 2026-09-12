import React from 'react';
import { Users, Phone, ShieldAlert, Briefcase, MapPin } from 'lucide-react';

export default function StudentParent({ student }) {
  const hasMother = !!student?.mother_name;
  const hasFather = !!student?.father_name;
  const hasGuardian = !!student?.guardian_name;
  const hasAnyFamily = hasMother || hasFather || hasGuardian;

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white/40 shadow-2xl p-8 md:p-10 space-y-6 font-['Inter']">
      <div className="flex items-center gap-3 pb-4 border-b border-black/5 text-slate-800 font-black text-sm uppercase tracking-widest">
        <Users size={22} className="text-[#093fb4]" stroke={2.5} />
        <span>Family Information</span>
      </div>

      {hasAnyFamily ? (
        <div className="space-y-8 pt-2">
          {/* Mother's Line Block */}
          {hasMother && (
            <div>
              <p className="text-[10px] font-black text-[#093fb4] uppercase tracking-[0.2em] mb-4">Mother's Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <ParentInfoItem icon={<Users />} label="Full Name" value={student.mother_name} />
                <ParentInfoItem icon={<Phone />} label="Contact Number" value={student.mother_contact} />
                <ParentInfoItem icon={<Briefcase />} label="Occupation" value={student.mother_occupation} />
              </div>
            </div>
          )}

          {/* Father's Line Block */}
          {hasFather && (
            <div className={hasMother ? "pt-8 border-t border-black/5" : ""}>
              <p className="text-[10px] font-black text-[#093fb4] uppercase tracking-[0.2em] mb-4">Father's Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <ParentInfoItem icon={<Users />} label="Full Name" value={student.father_name} />
                <ParentInfoItem icon={<Phone />} label="Contact Number" value={student.father_contact} />
                <ParentInfoItem icon={<Briefcase />} label="Occupation" value={student.father_occupation} />
              </div>
            </div>
          )}

          {/* Guardian Line Block */}
          {hasGuardian && (
            <div className={(hasMother || hasFather) ? "pt-8 border-t border-black/5" : ""}>
              <p className="text-[10px] font-black text-[#093fb4] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <ShieldAlert size={16} stroke={2.5}/> Guardian Details
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <ParentInfoItem icon={<Users />} label="Guardian Name" value={student.guardian_name} />
                <ParentInfoItem icon={<Phone />} label="Contact Number" value={student.guardian_contact} />
                <ParentInfoItem icon={<Briefcase />} label="Occupation" value={student.guardian_occupation} />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 bg-white/40 border-2 border-dashed border-white/80 rounded-[2rem] text-center">
          <Users size={32} className="text-slate-400 mb-3" stroke={1.5}/>
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest">No family information provided yet.</p>
        </div>
      )}

      {/* Shared Household Address Line Footer */}
      {student?.house_address && (
        <div className="pt-8 border-t border-black/5 flex items-start gap-5">
          <div className="w-12 h-12 bg-white/60 border-2 border-white/80 rounded-2xl flex items-center justify-center flex-shrink-0 text-[#093fb4] shadow-sm">
            <MapPin size={22} stroke={2.5}/>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Family House Address</p>
            <p className="text-sm font-bold text-slate-900 leading-relaxed mt-1.5">{student.house_address}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ParentInfoItem({ icon, label, value }) {
  return (
    <div className="flex items-start gap-4 bg-white/60 p-5 rounded-2xl border-2 border-white/80 shadow-sm transition-all hover:bg-white/80">
      <div className="w-12 h-12 bg-blue-50/50 border border-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 text-[#093fb4]">
        {React.cloneElement(icon, { size: 20, stroke: 2.5 })}
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</p>
        <p className="text-sm font-bold text-slate-900 truncate mt-1">{value || "Not provided"}</p>
      </div>
    </div>
  );
}