import React, { useState, useEffect, useRef } from 'react';
import { Camera, User, MapPin, Phone, Plus, Award, FileText, GraduationCap, BookOpen, Shield, Edit2 } from 'lucide-react';
import api from '../api';
import EditProfileModal from './EditProfileModal'; 
import AddPortfolioModal from './AddPortfolioModal'; 
import StudentParent from './StudentParent';

export default function StudentProfile() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [bio, setBio] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const id = localStorage.getItem('studentId');
        if (!id) return;
        const res = await api.get(`/students/profile-full/${id}`);
        setStudent(res.data);
        setBio(res.data?.bio || '');
      } catch (err) {
        console.error("Profile Load Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('profile_image', file);
    try {
      const id = localStorage.getItem('studentId');
      const res = await api.put(`/update-profile/${id}`, formData);
      if (res.data.success) window.location.reload();
    } catch (err) {
      alert("Failed to upload image");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#FFFCFB] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-[#093fb4]/20 border-t-[#093fb4] rounded-full animate-spin shadow-sm" />
        <p className="text-xs font-black text-[#093fb4] uppercase tracking-[0.2em]">Loading Profile</p>
      </div>
    </div>
  );

  const schoolName = student?.other_school ? student.other_school : (student?.college_name || "School not set");
  const degreeName = student?.other_degree_program ? student.other_degree_program : (student?.course_name || "Course not set");

  const displaySports = () => {
    if (student?.other_sport) return student.other_sport;
    if (Array.isArray(student?.sports_interests)) {
      return student.sports_interests.length > 0 ? student.sports_interests.join(', ') : "Not provided";
    }
    try {
      if (typeof student?.sports_interests === 'string') {
        const parsed = JSON.parse(student.sports_interests);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed.join(', ') : student.sports_interests;
      }
    } catch (e) {
      return student?.sports_interests || "Not provided";
    }
    return "Not provided";
  };

  return (
    <div className="min-h-screen bg-[#FFFCFB] pt-20 pb-16 font-sans">
      <div className="max-w-4xl mx-auto px-5 lg:px-8">

        {/* ── ACCENT BAR ── */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-1.5 h-6 bg-[#093fb4] rounded-full shadow-sm" />
          <span className="text-xs font-black text-[#093fb4] uppercase tracking-[0.25em]">Academic Profile</span>
          <div className="flex-1 h-px bg-gradient-to-r from-[#093fb4]/20 to-transparent" />
        </div>

        {/* ── 1. PROFILE HEADER ── */}
        <div className="bg-white rounded-3xl mb-6 overflow-hidden shadow-[0_2px_20px_rgb(9,63,180,0.04)] border border-[#093fb4]/10 transition-all">
          {/* Banner */}
          <div className="h-28 bg-gradient-to-r from-[#093fb4] to-[#0a4ddb] relative">
            <div className="absolute inset-0 bg-white/5 mix-blend-overlay" />
          </div>

          <div className="px-6 sm:px-10 pb-8 pt-0 flex flex-col sm:flex-row gap-6 items-center sm:items-start relative -mt-12">
            {/* Photo */}
            <div className="relative group flex-shrink-0 z-10">
              <button
                onClick={() => fileInputRef.current.click()}
                className="w-28 h-28 rounded-2xl bg-white border-4 border-white shadow-lg overflow-hidden flex items-center justify-center transition-transform active:scale-95 relative"
              >
                {student?.sprofile_pic ? (
                  <img src={student.sprofile_pic} className="w-full h-full object-cover" alt="Profile" />
                ) : <User size={40} className="text-[#093fb4]/30" />}
                <div className="absolute inset-0 bg-[#093fb4]/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-sm">
                  <Camera className="text-white mb-1" size={24} />
                  <span className="text-[9px] text-white font-bold uppercase tracking-widest">Update</span>
                </div>
              </button>
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleImageUpload} accept="image/*" />
            </div>

            {/* Name + Details */}
            <div className="flex-1 text-center sm:text-left pt-14 sm:pt-12">
              <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none mb-2">
                {student?.sfirst_name} {student?.slast_name}
              </h1>
              <p className="text-[#093fb4] text-sm font-bold tracking-widest mb-5">
                {student?.student_email}
              </p>
              
              {/* Degree + School Badges */}
              <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                <span className="flex items-center gap-2 text-xs font-bold text-[#093fb4] bg-[#093fb4]/10 border border-[#093fb4]/20 px-4 py-2 rounded-xl">
                  <GraduationCap size={14} />
                  {degreeName}
                </span>
                <span className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl">
                  <BookOpen size={14} />
                  {schoolName}
                </span>
              </div>
            </div>

            {/* Edit Profile Action */}
            <div className="flex-shrink-0 pt-4 sm:pt-14 w-full sm:w-auto">
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs font-black uppercase bg-[#093fb4] text-white px-6 py-3 rounded-xl hover:bg-[#083596] hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95"
              >
                <Edit2 size={14} /> Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* ── 2. BIO SECTION ── */}
        <div className="bg-white rounded-3xl p-8 mb-6 shadow-[0_2px_20px_rgb(9,63,180,0.04)] border border-[#093fb4]/10">
          <SectionLabel icon={<User size={14} />} title="About Yourself" />
          {bio ? (
            <div className="mt-6 bg-[#093fb4]/5 rounded-2xl p-6 border border-[#093fb4]/10 relative">
              <div className="absolute top-4 left-4 text-[#093fb4]/20 text-4xl font-serif">"</div>
              <p className="text-sm text-slate-700 leading-relaxed relative z-10 pl-6 pr-2 font-medium">
                {bio}
              </p>
            </div>
          ) : (
            <EmptyState text="Your bio is empty. Click Edit Profile to write something about yourself." />
          )}
        </div>

        {/* ── 3. PERSONAL INFORMATION ── */}
        <div className="bg-white rounded-3xl p-8 mb-6 shadow-[0_2px_20px_rgb(9,63,180,0.04)] border border-[#093fb4]/10">
          <SectionLabel icon={<Shield size={14} />} title="Personal Information" />
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-6">
            <InfoItem icon={<Phone />} label="Contact Number" value={student?.scontact_number} />
            <InfoItem icon={<MapPin />} label="Home Address" value={[student?.sstreet, student?.sbarangay].filter(Boolean).join(', ') || "Not provided"} />
            <InfoItem icon={<User />} label="Gender" value={student?.sgender} />
            <InfoItem icon={<Award />} label="Religion" value={student?.religion === "Others" ? student?.other_religion : student?.religion} />
            <InfoItem icon={<Award />} label="Sports Interest" value={displaySports()} />
          </div>  
        </div>

        <div className="mb-6">
           <StudentParent student={student} onRefresh={() => window.location.reload()} />
        </div>

        {/* ── 4. STUDENT PORTFOLIO ── */}
        <div className="bg-white rounded-3xl p-8 shadow-[0_2px_20px_rgb(9,63,180,0.04)] border border-[#093fb4]/10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex-1 w-full sm:w-auto">
              <SectionLabel icon={<FileText size={14} />} title="Student Portfolio" />
            </div>
            <button
              onClick={() => setIsPortfolioModalOpen(true)}
              className="flex items-center justify-center gap-2 text-xs font-black uppercase bg-[#093fb4]/10 text-[#093fb4] px-5 py-2.5 rounded-xl hover:bg-[#093fb4] hover:text-white transition-colors active:scale-95 w-full sm:w-auto"
            >
              <Plus size={14} /> Add Document
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {student?.portfolio_data?.length > 0 ? (
              student.portfolio_data.map((item, idx) => (
                <a
                  key={idx}
                  href={`http://localhost:5000/${item.url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-5 p-5 rounded-2xl border border-[#093fb4]/10 bg-white hover:bg-[#093fb4]/5 hover:border-[#093fb4]/30 hover:shadow-md transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#093fb4]/10 border border-[#093fb4]/20 flex items-center justify-center flex-shrink-0 group-hover:bg-[#093fb4] group-hover:scale-105 transition-all">
                    <FileText size={20} className="text-[#093fb4] group-hover:text-white transition-colors" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black uppercase text-[#093fb4] tracking-[0.15em] mb-1">{item.type}</p>
                    <p className="text-sm font-bold text-slate-800 truncate group-hover:text-[#093fb4] transition-colors">{item.title}</p>
                  </div>
                </a>
              ))
            ) : (
              <div className="col-span-1 md:col-span-2">
                <EmptyState text="No portfolio credentials yet. Click 'Add Document' to upload your CV, certificates, or achievements." />
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Profile Info Modal */}
      {isProfileModalOpen && (
        <EditProfileModal
          onClose={() => setIsProfileModalOpen(false)}
          studentData={student}
          setBioState={setBio}
        />
      )}

      {/* Portfolio Documents Modal */}
      {isPortfolioModalOpen && (
        <AddPortfolioModal
          onClose={() => setIsPortfolioModalOpen(false)}
          studentData={student}
        />
      )}
    </div>
  );
}

// Subcomponents

function SectionLabel({ icon, title }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-7 h-7 bg-[#093fb4]/10 border border-[#093fb4]/20 rounded-lg flex items-center justify-center text-[#093fb4] shadow-sm">
        {icon}
      </div>
      <span className="text-xs font-black text-[#093fb4] uppercase tracking-[0.2em]">{title}</span>
      <div className="flex-1 h-px bg-gradient-to-r from-[#093fb4]/10 to-transparent" />
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl mt-4">
      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 text-slate-300">
        <FileText size={18} />
      </div>
      <p className="text-slate-500 text-sm font-medium max-w-sm">{text}</p>
    </div>
  );
}

function InfoItem({ icon, label, value }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 bg-[#093fb4]/5 border border-[#093fb4]/15 rounded-xl flex items-center justify-center flex-shrink-0 text-[#093fb4] shadow-sm">
        {React.cloneElement(icon, { size: 18 })}
      </div>
      <div className="pt-0.5">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-sm font-bold text-slate-800 leading-snug">{value || "Not provided"}</p>
      </div>
    </div>
  );
}