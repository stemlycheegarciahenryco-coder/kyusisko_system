import React from 'react';
import { Users, Phone, ShieldAlert, Briefcase, MapPin } from 'lucide-react';

export default function StudentParent({ student }) {
  const hasMother = !!student?.mother_name;
  const hasFather = !!student?.father_name;
  const hasGuardian = !!student?.guardian_name;
  const hasAnyFamily = hasMother || hasFather || hasGuardian;

  return (
    <div className="bg-white rounded-xl border border-slate-300 shadow-sm p-6 space-y-5">
      {/* Header aligned with Academic & Personal Info cards */}
      <div className="flex items-center gap-2 pb-3 border-b border-slate-200 text-slate-600 font-bold text-sm uppercase tracking-wider">
        <Users size={18} className="text-[#093fb4]" />
        <span>Family Information</span>
      </div>

      {hasAnyFamily ? (
        <div className="space-y-6 pt-2">
          {/* Mother's Line Block */}
          {hasMother && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Mother's Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <ParentInfoItem icon={<Users />} label="Full Name" value={student.mother_name} />
                <ParentInfoItem icon={<Phone />} label="Contact Number" value={student.mother_contact} />
                <ParentInfoItem icon={<Briefcase />} label="Occupation" value={student.mother_occupation} />
              </div>
            </div>
          )}

          {/* Father's Line Block */}
          {hasFather && (
            <div className={hasMother ? "pt-6 border-t border-slate-200" : ""}>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Father's Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <ParentInfoItem icon={<Users />} label="Full Name" value={student.father_name} />
                <ParentInfoItem icon={<Phone />} label="Contact Number" value={student.father_contact} />
                <ParentInfoItem icon={<Briefcase />} label="Occupation" value={student.father_occupation} />
              </div>
            </div>
          )}

          {/* Guardian Line Block */}
          {hasGuardian && (
            <div className={(hasMother || hasFather) ? "pt-6 border-t border-slate-200" : ""}>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <ShieldAlert size={16} /> Guardian Details
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
        <p className="text-center text-slate-500 text-sm py-6 italic font-medium border-2 border-dashed border-slate-200 rounded-xl">
          No family information provided yet.
        </p>
      )}

      {/* Shared Household Address Line Footer */}
      {student?.house_address && (
        <div className="pt-6 border-t border-slate-200 flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 text-[#093fb4]">
            <MapPin size={20} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Family House Address</p>
            <p className="text-base font-bold text-slate-900 leading-relaxed mt-1">{student.house_address}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ParentInfoItem({ icon, label, value }) {
  return (
    <div className="flex items-start gap-4 bg-white p-4 rounded-xl border border-slate-300 shadow-sm">
      <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 text-[#093fb4]">
        {React.cloneElement(icon, { size: 18 })}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{label}</p>
        <p className="text-base font-bold text-slate-900 truncate mt-1">{value || "Not provided"}</p>
      </div>
    </div>
  );
}