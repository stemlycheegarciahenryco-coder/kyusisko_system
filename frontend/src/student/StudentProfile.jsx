import React, { useState, useEffect, useRef } from "react";
import {
  Camera,
  User,
  MapPin,
  Phone,
  Plus,
  X,
  Award,
  FileText,
  GraduationCap,
  BookOpen,
  Shield,
  Edit2,
} from "lucide-react";
import api from "../api";
import EditProfileModal from "./EditProfileModal";
import AddPortfolioModal from "./AddPortfolioModal";
import StudentParent from "./StudentParent";

export default function StudentProfile() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [bio, setBio] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const id = localStorage.getItem("studentId");
        if (!id) return;
        const res = await api.get(`/students/profile-full/${id}`);
        setStudent(res.data);
        setBio(res.data?.bio || "");
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
    formData.append("profile_image", file);
    try {
      const id = localStorage.getItem("studentId");
      const res = await api.put(`/update-profile/${id}`, formData);
      if (res.data.success) window.location.reload();
    } catch (err) {
      alert("Failed to upload image");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#FFFCFB] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-[3px] border-[#093fb4]/20 border-t-[#093fb4] rounded-full animate-spin" />
          <p className="text-[12px] font-black text-[#093fb4] uppercase tracking-widest">
            Loading Profile
          </p>
        </div>
      </div>
    );

  const schoolName = student?.other_school
    ? student.other_school
    : student?.college_name || "School not set";
  const degreeName = student?.other_degree_program
    ? student.other_degree_program
    : student?.course_name || "Course not set";

  const displaySports = () => {
    if (student?.other_sport) return student.other_sport;
    if (Array.isArray(student?.sports_interests)) {
      return student.sports_interests.length > 0
        ? student.sports_interests.join(", ")
        : "Not provided";
    }
    try {
      if (typeof student?.sports_interests === "string") {
        const parsed = JSON.parse(student.sports_interests);
        return Array.isArray(parsed) && parsed.length > 0
          ? parsed.join(", ")
          : student.sports_interests;
      }
    } catch (e) {
      return student?.sports_interests || "Not provided";
    }
    return "Not provided";
  };

  return (
    <div className="min-h-screen bg-[#FFFCFB] pt-20 pb-16">
      {/* jek: full width, responsive padding for all devices */}
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* ── ACCENT BAR ── */}
        <div className="flex items-center gap-3 mb-7">
          <div className="w-1 h-6 bg-[#093fb4] rounded-full" />
          <span className="text-[11px] font-black text-[#093fb4] uppercase tracking-[0.3em]">
            Academic Profile
          </span>
          <div className="flex-1 h-px bg-[#093fb4]/10" />
        </div>

        {/* ── 1. PROFILE HEADER ── */}
        <div className="bg-white border border-[#093fb4]/10 rounded-2xl mb-5 overflow-hidden shadow-sm">
          <div className="h-1.5 bg-[#093fb4]" />

          <div className="p-7 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
            {/* Photo */}
            <div className="relative group flex-shrink-0">
              <button
                onClick={() => fileInputRef.current.click()}
                className="w-24 h-24 rounded-xl bg-[#093fb4]/5 border-2 border-[#093fb4]/15 overflow-hidden flex items-center justify-center transition-all active:scale-95 relative"
              >
                {student?.sprofile_pic ? (
                  <img
                    src={`http://localhost:5000/uploads/${student.sprofile_pic}`}
                    className="w-full h-full object-cover"
                    alt="Profile"
                  />
                ) : (
                  <User size={40} className="text-[#093fb4]/30" />
                )}
                <div className="absolute inset-0 bg-[#093fb4]/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="text-white" size={20} />
                </div>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleImageUpload}
                accept="image/*"
              />
              <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 bg-[#093fb4] rounded-full border-2 border-white flex items-center justify-center">
                <Camera size={9} className="text-white" />
              </div>
            </div>

            {/* Name + email */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-black text-black uppercase tracking-tight leading-none mb-1">
                {student?.sfirst_name} {student?.slast_name}
              </h1>
              <p className="text-[#093fb4] text-sm font-bold tracking-widest mb-4">
                {student?.student_email}
              </p>
              {/* Degree + School row */}
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <span className="flex items-center gap-1.5 text-[12px] font-bold text-[#093fb4] bg-[#093fb4]/8 border border-[#093fb4]/15 px-3 py-1.5 rounded-full">
                  <GraduationCap size={12} />
                  {degreeName}
                </span>
                <span className="flex items-center gap-1.5 text-[12px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full">
                  <BookOpen size={12} />
                  {schoolName}
                </span>
              </div>
            </div>

            {/* Edit Profile Action */}
            <div className="flex-shrink-0">
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-2 text-[12px] font-black uppercase bg-[#093fb4] text-white px-4 py-2.5 rounded-xl hover:bg-[#093fb4]/90 transition-all shadow-md active:scale-95"
              >
                <Edit2 size={12} /> Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* ── 2. BIO SECTION ── */}
        <div className="bg-white border border-[#093fb4]/10 rounded-2xl p-6 mb-5 shadow-sm">
          <SectionLabel icon={<User size={12} />} title="About Yourself" />
          {bio ? (
            <blockquote className="border-l-4 border-[#093fb4] pl-4 mt-4">
              <p className="text-sm text-slate-700 leading-relaxed italic">
                "{bio}"
              </p>
            </blockquote>
          ) : (
            <EmptyState text="Your bio is empty. Click Edit Profile to write something about yourself." />
          )}
        </div>

        {/* ── 3. PERSONAL INFORMATION ── */}
        <div className="bg-white border border-[#093fb4]/10 rounded-2xl p-6 mb-5 shadow-sm">
          {/* Header */}
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center flex-1">
              <div className="w-5 h-5 bg-[#093fb4]/8 border border-[#093fb4]/15 rounded-md flex items-center justify-center text-[#093fb4]">
                <Shield size={12} />
              </div>

              <span className="ml-2 text-[11px] font-black text-[#093fb4] uppercase tracking-[0.2em]">
                Personal Information
              </span>

              <div className="flex-1 h-px bg-[#093fb4]/8 ml-3" />
            </div>

            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-1.5 text-[11px] font-black uppercase bg-[#093fb4]/10 text-[#093fb4] px-3 py-2 rounded-xl hover:bg-[#093fb4] hover:text-white transition-all shadow-sm active:scale-95"
            >
              <Edit2 size={12} />
              Edit
            </button>
          </div>

          {/* Information Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <InfoItem
              icon={<Phone />}
              label="Contact"
              value={student?.scontact_number}
            />

            <InfoItem
              icon={<MapPin />}
              label="Address"
              value={
                [student?.sstreet, student?.sbarangay]
                  .filter(Boolean)
                  .join(", ") || "Not provided"
              }
            />

            <InfoItem icon={<User />} label="Gender" value={student?.sgender} />

            <InfoItem
              icon={<Award />}
              label="Religion"
              value={
                student?.religion === "Others"
                  ? student?.other_religion
                  : student?.religion
              }
            />

            <InfoItem
              icon={<Award />}
              label="Sports Interest"
              value={displaySports()}
            />
          </div>
        </div>

        <StudentParent
          student={student}
          onRefresh={() => window.location.reload()}
        />

        {/* ── 4. STUDENT PORTFOLIO ── */}
        <div className="bg-white border border-[#093fb4]/10 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <div className="flex-1">
              <SectionLabel
                icon={<FileText size={12} />}
                title="Student Portfolio"
              />
            </div>
            <button
              onClick={() => setIsPortfolioModalOpen(true)}
              className="flex items-center gap-1.5 text-[11px] font-black uppercase bg-[#093fb4]/10 text-[#093fb4] px-3 py-2 rounded-xl hover:bg-[#093fb4] hover:text-white transition-all shadow-sm active:scale-95"
            >
              <Plus size={12} /> Add Document
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {student?.portfolio_data?.length > 0 ? (
              student.portfolio_data.map((item, idx) => (
                <a
                  key={idx}
                  href={`http://localhost:5000/${item.url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:border-[#093fb4]/30 hover:bg-[#093fb4]/3 transition-all"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#093fb4]/8 border border-[#093fb4]/15 flex items-center justify-center flex-shrink-0 group-hover:bg-[#093fb4] transition-colors">
                    <Award
                      size={15}
                      className="text-[#093fb4] group-hover:text-white transition-colors"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase text-[#093fb4] tracking-widest mb-0.5">
                      {item.type}
                    </p>
                    <p className="text-sm font-bold text-black truncate">
                      {item.title}
                    </p>
                  </div>
                </a>
              ))
            ) : (
              <div className="col-span-2">
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

function SectionLabel({ icon, title }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-5 h-5 bg-[#093fb4]/8 border border-[#093fb4]/15 rounded-md flex items-center justify-center text-[#093fb4]">
        {icon}
      </div>
      <span className="text-[11px] font-black text-[#093fb4] uppercase tracking-[0.2em]">
        {title}
      </span>
      <div className="flex-1 h-px bg-[#093fb4]/8" />
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <p className="text-center text-slate-400 text-xs py-6 italic font-medium">
      {text}
    </p>
  );
}

function InfoItem({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 bg-[#093fb4]/6 border border-[#093fb4]/12 rounded-lg flex items-center justify-center flex-shrink-0 text-[#093fb4] mt-0.5">
        {React.cloneElement(icon, { size: 13 })}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {label}
        </p>
        <p className="text-sm font-bold text-black leading-snug mt-0.5">
          {value || "Not provided"}
        </p>
      </div>
    </div>
  );
}
