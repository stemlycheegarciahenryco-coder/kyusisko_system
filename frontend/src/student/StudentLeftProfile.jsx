import React, { useState, useEffect } from 'react';
import { User2Icon, MapPin, Mail, Phone, GraduationCap } from 'lucide-react';
import api from '../api';

export default function StudentLeftProfile() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const studentId = localStorage.getItem('studentId');
        if (!studentId) return;
        const res = await api.get(`/students/profile-full/${studentId}`);
        setStudent(res.data);
      } catch (err) {
        console.error("Profile Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return <div className="w-full h-[420px] bg-white rounded-2xl animate-pulse shadow-sm border border-slate-200" />;
  }

  if (!student) return null;

  // Syncing variables to perfectly read values from your full profile JOIN query
  const displayCourse = student.course_name === 'Others' || !student.course_name
    ? student.other_degree_program || 'Information Systems'
    : student.course_name;

  const displaySchool = student.college_name === 'Others' || !student.college_name
    ? student.other_school || 'Quezon City University'
    : student.college_name;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Header Banner Background */}
      <div className="h-20 bg-[#093fb4]" />

      <div className="px-5 pb-6">
        {/* Avatar Area */}
        <div
          className="rounded-2xl bg-white border-4 border-white shadow-md mx-auto -mt-9 overflow-hidden mb-3 flex items-center justify-center bg-slate-50"
          style={{ width: 72, height: 72 }}
        >
          {student.sprofile_pic ? (
            <img
              src={student.sprofile_pic}
              className="w-full h-full object-cover"
              alt="Profile"
            />
          ) : (
            <User2Icon size={34} className="text-[#093fb4]" />
          )}
        </div>

        {/* Name, Course, and School */}
        <div className="text-center mb-5 space-y-1">
          <h2 className="text-sm font-black text-black uppercase leading-tight">
            {student.sfirst_name} {student.slast_name}
          </h2>
          
          {/* Degree/Course matching 'course_name' or 'other_degree_program' */}
          <p className="text-[#093fb4] text-[9px] font-black uppercase tracking-widest leading-normal">
            {displayCourse}
          </p>

          {/* School/University matching 'college_name' or 'other_school' */}
          <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 leading-normal max-w-[180px] mx-auto break-words">
            <GraduationCap size={11} className="shrink-0" /> {displaySchool}
          </p>
        </div>

        {/* Profile Details List Stack */}
        <div className="space-y-3 pt-4 border-t border-slate-100">

          {/* Address Data Row */}
          <div className="flex items-start gap-2.5">
            <MapPin size={14} className="text-black/30 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[10px] font-black text-black/50 uppercase mb-0.5">Address</p>
              <p className="text-[12px] font-bold text-black uppercase leading-snug break-words">
                {student.sstreet}, {student.sbarangay}, {student.sdistrict}
              </p>
            </div>
          </div>

          {/* Phone Data Row */}
          <div className="flex items-start gap-2.5">
            <Phone size={14} className="text-black/30 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-black text-black/50 uppercase mb-0.5">Contact Number</p>
              <p className="text-[12px] font-bold text-black uppercase">{student.scontact_number || 'N/A'}</p>
            </div>
          </div>

          {/* Email Data Row */}
          <div className="flex items-start gap-2.5">
            <Mail size={14} className="text-black/30 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[10px] font-black text-black/50 uppercase mb-0.5">Email</p>
              <p className="text-[12px] font-bold text-black truncate lowercase">{student.student_email}</p>
            </div>
          </div>

          {/* Bio Section Row */}
          {student.bio && (
            <div className="pt-3 border-t border-slate-100">
              <p className="text-[10px] font-black text-black/50 uppercase mb-1.5">Bio</p>
              <p className="text-[11px] font-medium text-black/70 leading-relaxed break-words">
                {student.bio}
              </p>
            </div>
          )}

          {/* Portfolio Rendering Section */}
          {student.portfolio_data && (
            <div className="pt-3 border-t border-slate-100">
              <p className="text-[10px] font-black text-black/50 uppercase mb-2 tracking-tight">Portfolio</p>
              <div className="flex flex-wrap gap-1.5">

                {typeof student.portfolio_data === 'object' && !Array.isArray(student.portfolio_data) && (student.portfolio_data.title || student.portfolio_data.url) && (
                  <span className="inline-flex items-center text-[9px] font-black uppercase tracking-wider bg-blue-50 text-[#093fb4] border border-blue-100 px-2.5 py-1 rounded-md">
                    {student.portfolio_data.title || student.portfolio_data.type || 'Portfolio'}
                  </span>
                )}

                {Array.isArray(student.portfolio_data) &&
                  student.portfolio_data.map((item, idx) => (
                    (item.title || item.url || item.type) && (
                      <span key={idx} className="inline-flex items-center text-[9px] font-black uppercase tracking-wider bg-blue-50 text-[#093fb4] border border-blue-100 px-2.5 py-1 rounded-md">
                         {item.title || item.type || 'Link'}
                      </span>
                    )
                  ))}

                {typeof student.portfolio_data === 'string' && student.portfolio_data.trim() !== '' && (
                  <span className="inline-flex items-center text-[9px] font-black uppercase tracking-wider bg-blue-50 text-[#093fb4] border border-blue-100 px-2.5 py-1 rounded-md">
                    Link
                  </span>
                )}

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}