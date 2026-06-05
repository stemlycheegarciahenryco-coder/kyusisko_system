import React, { useState } from 'react';
import { Users, Phone, ShieldAlert, Briefcase, MapPin, Edit2 } from 'lucide-react';
import EditFamilyModal from './EditFamilyModal'; // We will build this in Step 2

export default function StudentParent({ student, onRefresh }) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const hasParents = student?.mother_name || student?.father_name;

  return (
    <div className="bg-white border border-[#093fb4]/10 rounded-2xl p-6 mb-5 shadow-sm relative overflow-hidden">
      {/* Component Title Header Line */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-5 h-5 bg-[#093fb4]/8 border border-[#093fb4]/15 rounded-md flex items-center justify-center text-[#093fb4]">
            <Users size={12} />
          </div>
          <span className="text-[10px] font-black text-[#093fb4] uppercase tracking-[0.2em]">Family Information</span>
          <div className="flex-1 h-px bg-[#093fb4]/8 mx-2" />
        </div>
        
        {/* Clean Minimalist Edit Button */}
        <button
          onClick={() => setIsEditModalOpen(true)}
          className="flex items-center gap-1.5 text-[9px] font-black uppercase text-[#093fb4] bg-[#093fb4]/6 border border-[#093fb4]/12 px-2.5 py-1.5 rounded-lg hover:bg-[#093fb4] hover:text-white transition-all active:scale-95"
        >
          <Edit2 size={10} /> Edit
        </button>
      </div>

      {hasParents ? (
        <div className="space-y-6">
          {/* Mother's Line Block */}
          {student.mother_name && (
            <div>
              <p className="text-[10px] font-black text-[#093fb4] uppercase tracking-wider mb-2">Mother's Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <ParentInfoItem icon={<Users />} label="Full Name" value={student.mother_name} />
                <ParentInfoItem icon={<Phone />} label="Contact Number" value={student.mother_contact} />
                <ParentInfoItem icon={<Briefcase />} label="Occupation" value={student.mother_occupation} />
              </div>
            </div>
          )}

          {/* Father's Line Block */}
          {student.father_name && (
            <div className={student.mother_name ? "pt-4 border-t border-slate-100" : ""}>
              <p className="text-[10px] font-black text-[#093fb4] uppercase tracking-wider mb-2">Father's Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <ParentInfoItem icon={<Users />} label="Full Name" value={student.father_name} />
                <ParentInfoItem icon={<Phone />} label="Contact Number" value={student.father_contact} />
                <ParentInfoItem icon={<Briefcase />} label="Occupation" value={student.father_occupation} />
              </div>
            </div>
          )}
        </div>
      ) : student?.guardian_name ? (
        /* Fallback Legal Guardian Profile View */
        <div>
          <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ShieldAlert size={12} /> Guardian Details (Fallback)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ParentInfoItem icon={<Users />} label="Guardian Name" value={student.guardian_name} />
            <ParentInfoItem icon={<Phone />} label="Contact Number" value={student.guardian_contact} />
            <ParentInfoItem icon={<Briefcase />} label="Occupation" value={student.guardian_occupation} />
          </div>
        </div>
      ) : (
        <p className="text-center text-slate-400 text-xs py-4 italic font-medium">
          No family information provided yet. Click Edit to fill.
        </p>
      )}

      {/* Shared Household Address Line Footer */}
      {student?.house_address && (
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-start gap-3">
          <div className="w-7 h-7 bg-[#093fb4]/6 border border-[#093fb4]/12 rounded-lg flex items-center justify-center flex-shrink-0 text-[#093fb4]">
            <MapPin size={13} />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Family House Address</p>
            <p className="text-sm font-bold text-black leading-snug mt-0.5">{student.house_address}</p>
          </div>
        </div>
      )}

      {/* Render the Edit Form Modal */}
      {isEditModalOpen && (
        <EditFamilyModal 
          onClose={() => setIsEditModalOpen(false)} 
          studentData={student}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}

function ParentInfoItem({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
      <div className="w-7 h-7 bg-[#093fb4]/6 border border-[#093fb4]/12 rounded-lg flex items-center justify-center flex-shrink-0 text-[#093fb4] mt-0.5">
        {React.cloneElement(icon, { size: 13 })}
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-black truncate mt-0.5">{value || "Not provided"}</p>
      </div>
    </div>
  );
}